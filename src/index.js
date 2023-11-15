"use strict";

const MediaStore = require("./store.js").MediaStore;
const store = new MediaStore(false);
const fs = require("fs");
const express = require("express");
const e = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
const port = 23750;

function loadData() {
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
        if (name.length > 40) {
            console.error("In file: " + pathToExample + ", the name: " + name + " is too long!");
            process.exit(1);
        } else if (!checkASCII(name)) {
            console.error("In file: " + pathToExample + ", the name: " + name + " does not contain ASCII characters!");
            process.exit(1);
        } else if (!(type === "TAPE" || type === "CD" || type === "DVD")) {
            console.error("In file: " + pathToExample + ", the type: " + type + " is not valid!");
            process.exit(1);
        } else if (desc.length > 200) {
            console.error("In file: " + pathToExample + ", the desc: " + desc + " is too long!");
            process.exit(1);
        } else if (!checkASCII(desc)) {
            console.error("In file: " + pathToExample + ", the desc: " + desc + " does not contain ASCII characters!");
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

function checkASCII(string) {
    for (var i = 0; i < string.length; i++) {
        if (string.charCodeAt(i) > 127) {
            return false;
        }
    }
    return true;
}

app.get("/media/", async (req, res) => {
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
    res.send(data);
});

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
    const movie = req.body;
    if (movie.hasOwnProperty("name") && movie.hasOwnProperty("type") && movie.hasOwnProperty("desc")) {
        const name = movie["name"];
        const type = movie["type"];
        const desc = movie["desc"];
        try {
            if (name.length > 40) {
                console.error("Error, " + name + " is too long!");
                res.status(400);
            } else if (!checkASCII(name)) {
                console.error("Error, " + name + " does not contain ASCII characters!");
                res.status(400);
            } else if (!(type === "TAPE" || type === "CD" || type === "DVD")) {
                console.error("Error, " + type + " is not valid!");
                res.status(400);
            } else if (desc.length > 200) {
                console.error("Error, " + desc + " is too long!");
                res.status(400);
            } else if (!checkASCII(desc)) {
                console.error("Error, " + desc + " does not contain ASCII characters!");
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
            if (name.length > 40) {
                console.error("Error, " + name + " is too long!");
                res.status(400);
            } else if (!checkASCII(name)) {
                console.error("Error, " + name + " does not contain ASCII characters!");
                res.status(400);
            } else if (!(type === "TAPE" || type === "CD" || type === "DVD")) {
                console.error("Error, " + type + " is not valid!");
                res.status(400);
            } else if (desc.length > 200) {
                console.error("Error, " + desc + " is too long!");
                res.status(400);
            } else if (!checkASCII(desc)) {
                console.error("Error, " + desc + " does not contain ASCII characters!");
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

app.listen(port,  () => {
    console.log(`Server app listening on port ${port}`)
});

loadData();

// Test command in terminal
// curl -i -X POST -H "Content-Type: application/json" -d '{"name": "The Hobbit", "type": "DVD", "desc": "The original journey of bilbo."}' http://localhost:23750/media