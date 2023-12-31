"use strict";

/**
 * Global variables for the functions to use. Creates an instance of the media store.
 * Require express, body-parser, and node-fetch. Sets global port number to 23750.
 * @type {MediaStore} instance of the MediaStore file
 */
const MediaStore = require("../src/store.js").MediaStore;
const store = new MediaStore(false);
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const app = express();
app.use(bodyParser.json());
const port = 23750;


/**
 * Check valid takes three parameters: name, type, and desc. These are the individual
 * attributes of a media and are checked using conditional statements. Two checks per
 * argument, first to ensure that the length is not greater than it should be, and second
 * checks the ASCII by calling another function.
 * @param name of the media
 * @param type of the media
 * @param desc of the media
 * @returns {boolean} true if the media is valid for the store
 */
function checkValid(name, type, desc) {
    if (name.length > 40) {
        console.error("Error, " + name + " is too long!");
        return false;
    } else if (!checkASCII(name)) {
        console.error("Error, " + name + " does not contain ASCII characters!");
        return false;
    } else if (!(type === "TAPE" || type === "CD" || type === "DVD")) {
        console.error("Error, " + type + " is not valid!");
        return false;
    } else if (desc.length > 200) {
        console.error("Error, " + desc + " is too long!");
        return false;
    } else if (!checkASCII(desc)) {
        console.error("Error, " + desc + " does not contain ASCII characters!");
        return false;
    } else {
        return true;
    }
}

/**
 * Check ASCII takes a string variable and determines if any of the characters
 * in its content are not ASCII. This is done through a simple conditional statement.
 * ASCII characters are greater than code type 127, so if the value is less false is returned.
 * @param string
 * @returns {boolean}
 */
function checkASCII(string) {
    for (let i = 0; i < string.length; i++) {
        if (string.charCodeAt(i) > 127) {
            return false;
        }
    }
    return true;
}

/**
 * Load data is the main function loading function of this file. It starts by creating
 * the server with a call to the app.js function, returnServe. This call also provides
 * the server with the proper store which has loaded data.
 * It looks at the command line arguments and determines if a file path has been
 * provided. If the file path has not been provided, a console error is printed
 * and the program exits. Otherwise, a fs read file sync call is attempted with
 * the provided path. The data is attempted to be parsed from json. Should the file
 * not exist or not contain json, a console error is provided. Lastly,
 * for every json object in the file, it is checked against valid using
 * the above methods and if valid it is added to the media store.
 * @returns {Promise<void>}
 */
async function loadData() {
    let pathToExample = null;
    // const args = process.argv;
    // if (args.length === 3) {
    //     pathToExample = args[2];
    // } else {
    //     console.error("Expected \"path/to/directory\" of example data!");
    //     process.exit(1);
    // }
    pathToExample = "../data/deadmedia.json";

    let file = null;
    let info = null;
    try {
        file = fs.readFileSync(pathToExample, "utf-8");
    } catch (error) {
        console.error("File: " + pathToExample + " does not exist!");
        process.exit(1);
    }
    try {
        info = JSON.parse(file);
    } catch (error) {
        console.error("File: " + pathToExample + " does not follow valid .json format!");
        process.exit(1);
    }
    if (info != null) {
        info.forEach(function (data){
            let name = data.name;
            let type = data.type;
            let desc = data.desc;
            let valid = checkValid(name, type, desc);
            if (!valid) {
                process.exit(1);
            }
            try {
                store.create(name, type, desc);
            } catch (error) {
                console.error("Error in push data: " + name + ", " + type + ", " + desc + " to store!");
                process.exit(1);
            }
        });
    }
}

/**
 * app.get("/media... Is an api request GET, which has two possible outputs.
 * Should the request have a limit, offset, name, type, or desc property the response sent
 * is called with an await async function, getBasicQuery(). Otherwise, the response
 * sent is with an await async function get(). This function just returns all the media.
 */
app.get("/media", async (req, res) => {
    if (req.query.hasOwnProperty("limit") && req.query.hasOwnProperty("offset") || (req.query.hasOwnProperty("name") || req.query.hasOwnProperty("type") || req.query.hasOwnProperty("desc"))) {
        res.send(await getBasicQuery(req, res));
    } else {
        res.send(await get(res, req));
    }
});

/**
 * Get attempts to grab all the data from the store. This data
 * is cloned via a call to JSON.stringify and then JSON.parse. This
 * seems like unnecessary steps, but it enables creating a clone of the data
 * which can change the 'id' to be specification accurate when sent to the user.
 * A for each function is called and changes every media id to start with /media/.
 * If the data is empty the response status is set to 204, otherwise it is set to 200.
 * Should any error occur, the response status is set to 500, and a console error is
 * printed.
 * @param res is the response to be sent
 * @param req is the client request, ignored in this method
 * @returns {Promise<null>}
 */
async function get(res, req) {
    let data = null;
    try {
        data = JSON.parse(JSON.stringify(await store.retrieveAll()));
        data.forEach(function (movie) {
            movie["id"] = "/media/" + movie["id"];
        });
        if (data.length === 0) {
            res.status(204);
        } else {
            res.status(200);
        }
    } catch (error) {
        res.status(500);
        console.error("Error, entry data not found!");
    }
    return data;
}

/**
 * Check remove takes three parameters and determines what media
 * should be removed from the output based on the provided inputs.
 * A for loop cycles through everything in results and if the paramType
 * matches: name, type, or desc then it is checked. If the results current
 * index to lowercase does not equal or include the given parameter, it is
 * removed from the array and index goes down one.
 * @param results a list of all the media in the store
 * @param paramType a string value containing which parameter is being checked
 * @param parameter the provided client side parameter for a specific paramType
 */
function checkRemove(results, paramType, parameter) {
    for (let i = 0; i < results.length; i++) {
        if (paramType === "name" && parameter !== null && results[i].name.toLowerCase() !== parameter) {
            results.splice(i, 1);
            i--;
        } else if (paramType === "type" && parameter !== null && results[i].type.toLowerCase() !== parameter) {
            results.splice(i, 1);
            i--;
        } else if (paramType === "desc" && parameter !== null && !results[i].desc.toLowerCase().includes(parameter)) {
            results.splice(i, 1);
            i--;
        }
    }
}

/**
 * Get basic query is part one of the GET request function. This method
 * sets local variables for name, type, desc, limit and offset if they are
 * contained in the request query. Then get() is called which returns all
 * the data in the store. A for each method pushes this data into a remove
 * array. Then is name or type or desc is not null checkRemove is called three
 * times, once for each type. This provides the remove array with an output of
 * only media that matches the name, type, and desc parameters. Next count is
 * calculated from the length. Next and previous url are set to null. If limit
 * and offset are not null, a conditional statement is matched. In this statement,
 * checks, ensure that the limit and query are valid. Errors are produced if not.
 * Next and previous are set to the correct url if they are not out of scope of the
 * available data. Then a for loop starts at the starting index and pushes every item
 * from that index to end index into a results array. After this statement, a json object
 * is created for the output. The results array is pushed into this object. A last check
 * determines if the results are equal to zero, in which case a status of 204 is sent and
 * an empty body is passed.
 * @param req is the response to be sent
 * @param res is the client request
 * @returns {Promise<{next: null, previous: null, count: number, results: *[]}>}
 */
async function getBasicQuery(req, res) {
    const body = req.query;
    let name = null;
    let type = null;
    let desc = null;
    let limit = null;
    let offset = null;
    if (body.hasOwnProperty("limit")) {
        limit = parseInt(body.limit);
    }
    if (body.hasOwnProperty("offset")) {
        offset = parseInt(body.offset);
    }
    if (body.hasOwnProperty("name")) {
        name = body.name.toLowerCase();
    }
    if (body.hasOwnProperty("type")) {
        type = body.type.toLowerCase();
    }
    if (body.hasOwnProperty("desc")) {
        desc = body.desc.toLowerCase();
    }
    let results = [];
    /** remove is the array that has all the media and removes non-valid input
     * should it not match.
     */
    let remove = [];
    let data = await get(res, req);
    data.forEach(function (movie) {
        remove.push(movie);
    });
    if (name !== null || type !== null || desc !== null) {
        checkRemove(remove, "name", name);
        checkRemove(remove, "type", type);
        checkRemove(remove, "desc", desc);
    }
    let count = remove.length;
    let next = null;
    let previous = null;
    if (limit !== null && offset !== null) {
        let length = (await store.retrieveAll()).length;
        if (limit + offset > length) {
            res.status(204);
            return;
        }
        if (limit < 0) {
            limit = 0;
        }
        if (offset < 0) {
            offset = 0;
        }
        const startIndex = offset;
        const endIndex = (offset + limit);
        count = endIndex - startIndex;
        /**
         * Looks at the offset and the limit to determine if the next and previous url
         * will be in scope.
         */
        if (offset + limit >= length) {
            next = null;
        } else {
            next = 'http://127.0.0.1:23750/media?limit=' + limit + '&offset=' + (offset + limit);
        }
        let previousNum = offset - limit;
        if (previousNum < 0) {
            previous = null
        } else if (previousNum === 0) {
            previous = 'http://127.0.0.1:23750/media?limit=' + limit + '&offset=' + previousNum;
        } else {
            previous = 'http://127.0.0.1:23750/media?limit=' + limit + '&offset=' + (offset - limit);
        }
        for (let i = startIndex; i < endIndex; i++) {
            results.push(remove[i]);
        }
    } else {
        results = remove;
    }
    let outputJSON = {
        "count": count,
        "next": next,
        "previous": previous,
        "results": []
    };
    outputJSON.results = results;
    if (outputJSON.count === 0) {
        res.status(204);
    }
    return outputJSON;
}

/**
 * app.get("/media/:id... is an API GET request. In this function, an id is provided in the
 * client request. A try catch statement attempts to grab the id provided by the request.params.id.
 * Then the data is set by cloning a store.retrieve() request using JSON.stringify and JSON.parse.
 * The id of the data grabbed is changed to match the specification: /media/id. Should the id not retrieve
 * anything from the store or any other error, the catch statement sets the response status to the proper code.
 * This data is then sent to the client, it will be null if an error of some type happened.
 */
app.get("/media/:id", async (req, res) => {
    let id = null;
    let data = null;
    try {
        id = req.params.id;
        data = JSON.parse(JSON.stringify(await store.retrieve(parseInt(id))));
        data["id"] = "/media/" + data["id"];
        res.status(200);
    } catch (error) {
        if (error === ("Error: cannot find media with ID: " + id)) {
            res.status(404);
        } else {
            res.status(500);
        }
        console.error("Error, entry ID: " + id + " not found!");
    }
    res.send(data);
});

/**
 * app.post("/media/... is an API POST request. In this function, a request is made to add
 * a media to the store. A conditional statement checks to see if the request body contains
 * name and type and desc. If these data types are included in the request, local variables
 * are set. Then a try statement checks
 */
app.post("/media", async (req, res) => {
    let output = null;
    const movie = await req.body;
    if (movie.hasOwnProperty("name") && movie.hasOwnProperty("type") && movie.hasOwnProperty("desc")) {
        const name = movie["name"];
        const type = movie["type"];
        const desc = movie["desc"];
        try {
            let valid = checkValid(name, type, desc);
            if (!valid) {
                res.status(400);
            } else {
                res.status(201);
            }
            await store.create(name, type, desc);
            output = JSON.parse(JSON.stringify(await store.retrieve((await store.retrieveAll()).length - 1)));
            output["id"] = "/media/" + output["id"];
            console.log("Created new entry: \"" + name + ", " + type + ", " + desc + "\".");
        } catch (error) {
            res.status(500);
            console.error("Error in push data: \"" + name + ", " + type + ", " + desc + "\" to store!");
        }
    } else {
        res.status(400);
        console.error("Error: entry format invalid!");
    }
    res.send(output);
});

/**
 * app.put("/media/:id... is an API PUT request. In this function, a request is made to update
 * a media in the store at the provided ID. A conditional statement checks to see if the text
 * provided in the body of the request contains name type and desc. If not an error is printed
 * and status code updated. If these values are included, they are parsed into local variables
 * and a try catch lops attempts to check the validity of the input. Should this pass, the status
 * code is set and the store updates the media at the provided ID. If the update is successful a json
 * object is passed to the client to confirm the result.
 * @param req is the response to be sent
 * @param res is the client request
 * @returns {Promise<{next: null, previous: null, count: number, results: *[]}>}
 */
app.put("/media/:id", async (req, res) => {
    let id = null;
    let data = null;
    const movie = req.body;
    if (movie.hasOwnProperty("name") && movie.hasOwnProperty("type") && movie.hasOwnProperty("desc")) {
        const name = movie["name"];
        const type = movie["type"];
        const desc = movie["desc"];
        try {
            let valid = checkValid(name, type, desc);
            if (!valid) {
                res.status(400);
            } else {
                res.status(200);
            }
            id = req.params.id;
            await store.update(id, name, type, desc);
            data = JSON.parse(JSON.stringify(await store.retrieve((parseInt(id)))));
            data["id"] = "/media/" + data["id"];
            console.log("Updated entry: " + id + " to \"" + name + ", " + type + ", " + desc + "\".");
        } catch (error) {
            if (error === ("Error: cannot find media with ID: " + id)) {
                res.status(404);
            } else {
                res.status(500);
            }
            console.error("Error, entry ID: " + id + " not found!");
        }
    } else {
        res.status(400);
        console.error("Error: entry format invalid!");
    }
    res.send(data);
});

/**
 * app.delete("/media/:id... is an API DELETE request. In this function, a request is made to
 * remove a media in the store at the provided ID. A try catch loop grabs the client provided
 * ID number and attempts to delete the entry from the store. Should this be successful the status
 * is set to 204 and a message is printed. The proper errors are caught and provided to the client
 * should an issue arise.
 * @param req is the response to be sent
 * @param res is the client request
 * @returns {Promise<{next: null, previous: null, count: number, results: *[]}>}
 */
app.delete("/media/:id", async (req, res) => {
    let id = null;
    try {
        id = req.params.id;
        await store.delete(id);
        res.status(204);
        console.log("Deleted entry ID:" + id + ".")
    } catch (error) {
        if (error === ("Error: cannot find media with ID: " + id)) {
            res.status(404);
        } else {
            res.status(500);
        }
        console.error("Error, entry ID: " + id + " not found!");
    }
    res.send();
});

/**
 * app.post("/transfer... is an API POST request. In this function, a request is made to
 * trasnfer a media in the store from the provided source ID to the provided target URL.
 * The information provided is grabbed from the request body and a conditional statement
 * checks to see if the body contains a source and target. Should the request contain this
 * information, local attributes are set and a try catch loops attempts to retrieve the data.
 * Once the data is grabbed, it is deleted from the store and formatted according to the
 * specification to be sent. The output is put into JSON format, and a fetch request sends the
 * data to the target. Should any error arise, the information is printed to the console and
 * the response status code is updated.
 * @param req is the response to be sent
 * @param res is the client request
 * @returns {Promise<{next: null, previous: null, count: number, results: *[]}>}
 */
app.post("/transfer", async (req, res) => {
    let id = null;
    let print = null;
    let movie = req.body;
    if (movie.hasOwnProperty("source") && movie.hasOwnProperty("target")) {
        const source = movie["source"];
        const target = movie["target"];
        try {
            id = source.substring(7);
            let transfer = await store.retrieve(parseInt(id));
            await store.delete(id);
            res.status(200);
            id = target + "/" + id;
            print = {
                "id": id,
                "name": transfer.name,
                "type": transfer.type,
                "desc": transfer.desc
            };
            const sendData = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "name": transfer.name,
                    "type": transfer.type,
                    "desc": transfer.desc
                })
            };
            await fetch(target,sendData).then(res => res.json());
        } catch (error) {
            if (error === ("Error: cannot find media with ID: " + id)) {
                res.status(404);
                console.error("Error, entry ID: " + id + " not found!");
                print = null;
            } else {
                res.status(421);
                console.error("Transfer request is invalid!")
                print = null;
            }
        }
    } else {
        res.status(500);
        console.error("Error invalid entry format!")
    }
    res.send(print);
});

app.listen(port, async () => {
    console.log(`Server app listening on port ${port}`)
});

/**
 * This call begins the index class by loading the
 * data into the file. And calling app.js, the server.
 */
loadData().then();

module.exports = {
    app,
    checkASCII,
    checkValid
};