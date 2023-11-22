"use strict";

let server = require("./server");
const request = require("supertest");
const bodyParser = require("body-parser");
const jestConsole = console;
let {
    checkASCII, checkValid
} = require("./server");
const {MediaStore} = require("./store");
const fs = require("fs");
let app;

/**
 * I have added a before and after each method to this testing class to
 * streamline the output printed to the terminal by the web API. By changing
 * the console to a default one, the output can be printed without JEST comments.
 * At the end of each test, the jest console is reset.
 */
beforeEach(() => {
    global.console = require("console");
});

afterEach(async () => {
    global.console = jestConsole;
});


describe("Test function calls in server.js", () => {
    test("Check true ASCII for: 'test'", () => {
       const valid = checkASCII("test");
       expect(valid).toBeTruthy();
    });

    test("Check false ASCII for: '§'", () => {
        const valid = checkASCII("§");
        expect(valid).toBeFalsy();
    });

    test("Check true for: The Hobbit, DVD, The original journey of Bilbo.", () => {
        const valid = checkValid("The Hobbit", "DVD", "The original journey of Biblo");
        expect(valid).toBeTruthy();
    });

    test("Check false for: The Hobb§t, DVD, The original journey of Bilbo.", () => {
        const valid = checkValid("The Hobb§t", "DVD", "The original journey of Biblo");
        expect(valid).toBeFalsy();
    });

    test("Check false for: The Hobbit, thisIsNotAMediaType, The original journey of Bilbo.", () => {
        const valid = checkValid("The Hobbit", "thisIsNotAMediaType", "The original journey of Biblo");
        expect(valid).toBeFalsy();
    });

    test("Check false for: The Hobbit, DVD, The §§§§§§§§ journey of Bilbo.", () => {
        const valid = checkValid("The Hobbit", "DVD", "The §§§§§§§§ journey of Biblo");
        expect(valid).toBeFalsy();
    });

    test("Check false for: This is over 40 characters long ttttttttt, DVD, The original journey of Bilbo.", () => {
        const valid = checkValid("This is over 40 characters long ttttttttt", "DVD", "The original journey of Biblo");
        expect(valid).toBeFalsy();
    });

    test("Check false for: The Hobbit, DVD, This is over 200 characters long. ttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt", () => {
        const valid = checkValid("The Hobbit", "DVD", "This is over 200 characters long. ttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt");
        expect(valid).toBeFalsy();
    });
});

describe("GET /media", () => {
    const store = new MediaStore(false);
    loadDataForTest("../data/deadmedia.json", store);
    let app = require("./app").returnServer(store);
    app.use(bodyParser.json());
    const port = 3000;
    let serv = app.listen(port,async () => {
        await console.log(`Server app listening on port ${port}`)
    });
    it("should return all media in store", async () => {
        const res = await request(app).get("/media");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return ID number 7 in store", async () => {
        const res = await request(app).get("/media/7");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return error for ID number 25 in store", async () => {
        const res = await request(app).get("/media/25");
        expect(res.statusCode).toBe(404);
        console.log(res.body);
    });
    it("should return three media starting at two following limit = 3 and offset = 2 in store", async () => {
        const res = await request(app).get("/media?limit=3&offset=2");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return nothing with status node 204 at limit = 20 and offset = 20", async () => {
        const res = await request(app).get("/media?limit=29&offset=20");
        expect(res.statusCode).toBe(204);
        console.log(res.body);
    });
    it("should return nothing with status node 500 at limit = 5 and offset = 25", async () => {
        const res = await request(app).get("/media?limit=29&offset=20");
        expect(res.statusCode).toBe(204);
        console.log(res.body);
    });
    it("should return one media with name = Pulp Fiction and type = DVD in store", async () => {
        const res = await request(app).get("/media?name=Pulp%20Fiction&type=dvd");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return nine media with type = DVD in store", async () => {
        const res = await request(app).get("/media?type=dvd");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return one media with desc = stunning sci-fi", async () => {
        const res = await request(app).get("/media?desc=stunning%20sci-fi");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return nine media with desc = album", async () => {
        const res = await request(app).get("/media?desc=album");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return no media with name = test and type = CD in store", async () => {
        const res = await request(app).get("/media?name=test&type=cd");
        expect(res.statusCode).toBe(204);
        console.log(res.body);
    });
    serv.close();
});

describe("POST /media", () => {
    const store = new MediaStore(false);
    loadDataForTest("../data/deadmedia.json", store);
    let app = require("./app").returnServer(store);
    app.use(bodyParser.json());
    const port = 3001;
    let serv = app.listen(port,async () => {
        await console.log(`Server app listening on port ${port}`)
    });
    it("should return status code of 201 when creating a valid media in store", async () => {
       const res = await request(app).post("/media").send({"name": "The Hobbit", "type": "DVD", "desc": "The original journey of Bilbo."});
       expect(res.statusCode).toBe(201);
       console.log(res.body);
    });
    it("should return status code of 400 when creating a non valid media in store", async () => {
        const res = await request(app).post("/media").send({"name": "The Hobbit", "type": "thisIsNotValid", "desc": "The original journey of Bilbo."});
        expect(res.statusCode).toBe(400);
        console.log(res.body);
    });
    serv.close();
});

describe("PUT /media/:id", () => {
    const store = new MediaStore(false);
    loadDataForTest("../data/deadmedia.json", store);
    let app = require("./app").returnServer(store);
    app.use(bodyParser.json());
    const port = 3001;
    let serv = app.listen(port,async () => {
        await console.log(`Server app listening on port ${port}`)
    });
    it("should return status code of 200 when updating a valid media in store", async () => {
        await request(app).post("/media").send({"name": "The Hobbit", "type": "DVD", "desc": "The original journey of Bilbo."});
        const res = await request(app).put("/media/20").send({"name": "The Hobbit", "type": "DVD", "desc": "The original journey of Bilbo and his dwarf friends."});
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });
    it("should return status code of 400 when updating with invalid type in store", async () => {
        await request(app).post("/media").send({"name": "The Hobbit", "type": "thisIsNotValid", "desc": "The original journey of Bilbo."});
        const res = await request(app).put("/media/20").send({"name": "The Hobbit", "type": "thisIsNotValid", "desc": "The original journey of Bilbo."});
        expect(res.statusCode).toBe(400);
        console.log(res.body);
    });
    it("should return status code of 404 when updating a non-existent media in store", async () => {
        await request(app).post("/media").send({"name": "The Hobbit", "type": "DVD", "desc": "The original journey of Bilbo."});
        const res = await request(app).put("/media/25").send({"name": "The Hobbit", "type": "DVD", "desc": "The original journey of Bilbo and his dwarf friends."});
        expect(res.statusCode).toBe(404);
        console.log(res.body);
    });
    serv.close();
});

describe("DELETE /media.:id", () => {
    const store = new MediaStore(false);
    loadDataForTest("../data/deadmedia.json", store);
    let app = require("./app").returnServer(store);
    app.use(bodyParser.json());
    const port = 3002;
    let serv = app.listen(port,async () => {
        await console.log(`Server app listening on port ${port}`)
    });
    it("should return a status code of 204 when DELETING a valid media in store", async () => {
       const res = await request(app).delete("/media/19");
       expect(res.statusCode).toBe(204);
       console.log(res.body);
    });
    it("should return a status code of 404 when DELETING a non-existent media in store", async () => {
       const res = await request(app).delete("/media/25");
       expect(res.statusCode).toBe(404);
       console.log(res.body);
    });
    it("should return a status code of 404 when calling DELETE with no ID number", async () => {
       const res = await request(app).delete("/media/");
       expect(res.statusCode).toBe(404);
       console.log(res.body);
    });
    serv.close();
});

function loadDataForTest(path, store) {
    let file = fs.readFileSync(path, "utf-8");
    let info = JSON.parse(file);
    info.forEach(function (data){
        let name = data.name;
        let type = data.type;
        let desc = data.desc;
        store.create(name, type, desc);
    });
}