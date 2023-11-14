"use strict";

const MediaStore = require("./store.js").MediaStore;
const store = new MediaStore(false);
const fs = require("fs");
const express = require("express");
const e = require("express");
const app = express();
const port = 23750;
let idSet = false;

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
        if (name.length > 40) {
            console.error("In file: " + pathToExample + ", the name: " + name + " is too long!");
            process.exit(1);
        } else if (!checkASCII(name)) {
            console.error("In file: " + pathToExample + ", the name: " + name + " does not contain ASCII characters!");
            process.exit(1);
        }
        let type = data.type;
        if (!(type === "TAPE" || type === "CD" || type === "DVD")) {
            console.error("In file: " + pathToExample + ", the type: " + type + " is not valid!");
            process.exit(1);
        }
        let desc = data.desc;
        if (name.length > 200) {
            console.error("In file: " + pathToExample + ", the desc: " + desc + " is too long!");
            process.exit(1);
        } else if (!checkASCII(name)) {
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
    if (!idSet) {
        const data = await store.retrieveAll();
        data.forEach(function (movie) {
            let id = movie["id"];
            movie["id"] = "/media/" + id;
        });
        idSet = true;
    }
    res.send(await store.retrieveAll());
});

app.get("/media/:id", async (req, res) => {
    if (!idSet) {
        const data = await store.retrieveAll();
        data.forEach(function (movie) {
            let id = movie["id"];
            movie["id"] = "/media/" + id;
        });
        idSet = true;
    }
    try {
        const id = req.params.id;
        if (id.length == 0) {
            res.sendStatus(204);
        }
        const data = await store.retrieve("/media/" + id);
        res.sendStatus(200);
        // res.send(data);
    } catch (error) {
        res.sendStatus(500);
        console.error("Error, movie ID not found!");
    }
});

app.listen(port, () => {
    console.log(`Server app listening on port ${port}`)
});

loadData();