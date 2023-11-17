"use strict";

/**
 * Global variables for the functions to use. Creates an instance of the media store.
 * Require express, body-parser, and node-fetch. Sets global port number to 23750.
 * @type {MediaStore} instance of the MediaStore file
 */
const MediaStore = require("./store.js").MediaStore;
const store = new MediaStore(false);
const fs = require("fs");
const bodyParser = require("body-parser");
let app = require("./app");
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
 * Load data is the main function loading function of this file.
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

// /**
//  * Creates an app listening port on the provided server port and prints out
//  * output to the console.
//  * @type {http.Server}
//  */
// const server = app.listen(port,async () => {
//     await console.log(`Server app listening on port ${port}`)
// });

// function returnServer(store) {
//     app = require("./app");
//     app.use(bodyParser.json());
// }

app.returnServer(store);

module.exports = {
    checkValid,
    checkASCII,
    loadData,
};