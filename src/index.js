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
            console.error("Error in push data: " + name + ", " + type + ", " + desc + " to movie store!");
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
        console.error("Error, movie data not found!");
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
        console.error("Error, movie ID: " + id + " not found!");
    }
    res.send(data);
});

app.post("/media", async (req, res) => {
    let output = null;
    const movie = req.body;
    const name = movie["name"];
    const type = movie["type"];
    const desc = movie["desc"];
    console.log(req.body);
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
    try {
        await store.create(name, type, desc);
        output = JSON.parse(JSON.stringify(await store.retrieve((await store.retrieveAll()).length)));
        output["id"] = "/media/" + output["id"];
        console.log("Created new entry: " + name + ", " + type + ", " + desc + ".")
    } catch (error) {
        res.status(500);
        console.error("Error in push data: " + name + ", " + type + ", " + desc + " to movie store!");
    }
    res.send(output);
});

app.put("/media/:id", async (req, res) => {
    let id = null;
    let data = null;
    try {
        const name = req.query.name;
        const type = req.query.type;
        const desc = req.query.desc;
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
            id = req.params.id;
            await store.update(id, name, type, desc);
            data = await store.retrieve(parseInt(id));
            data["id"] = "/media/" + data["id"];
            res.status(200);
        }
    } catch (error) {
        res.status(500);
        console.error("Error, movie ID: " + id + " not found!");
    }
    res.send(data);
});

app.delete("/media/:id", async (req, res) => {

});

app.listen(port,  () => {
    console.log(`Server app listening on port ${port}`)
});

loadData();