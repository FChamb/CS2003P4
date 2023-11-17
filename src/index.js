"use strict";

const MediaStore = require("./store.js").MediaStore;
const store = new MediaStore(false);
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const app = express();
app.use(bodyParser.json());
const port = 23751;

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

function checkASCII(string) {
    for (let i = 0; i < string.length; i++) {
        if (string.charCodeAt(i) > 127) {
            return false;
        }
    }
    return true;
}

async function loadData() {
    let pathToExample = null;
    const args = process.argv;
    if (args.length === 3) {
        pathToExample = args[2];
    } else {
        console.error("Expected \"path/to/directory\" of example data!");
        process.exit(1);
    }

    let file = null;
    let info = null;
    try {
        file = fs.readFileSync(pathToExample, "utf-8");
    } catch (error) {
        console.error("File: " + pathToExample + " does not exist!");
    }
    try {
        info = JSON.parse(file);
    } catch (error) {
        console.error("File: " + pathToExample + " does not follow valid .json format!")
    }
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

app.get("/media", async (req, res) => {
    if (req.query.hasOwnProperty("limit") && req.query.hasOwnProperty("offset") || (req.query.hasOwnProperty("name") || req.query.hasOwnProperty("type") || req.query.hasOwnProperty("desc"))) {
        res.send(await getBasicQuery(req, res));
    } else {
        res.send(await get(res, req));
    }

});

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
         * This needs work on. Not grabbing proper next and previous.
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

app.post("/media", async (req, res) => {
    let output = null;
    const movie = await req.body;
    console.log(movie);
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
                header: {
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
            } else {
                console.log(error);
                res.status(421);
                console.error("Transfer request is invalid!")
            }
        }
    } else {
        res.status(404);
        console.error("Error invalid entry format!")
    }
    res.send(print);
});

app.listen(port,  () => {
    console.log(`Server app listening on port ${port}`)
});

loadData();

module.exports = app;
