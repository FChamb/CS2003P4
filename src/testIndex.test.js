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

beforeEach(() => {
    global.console = require("console");
});

afterEach(() => {
    global.console = jestConsole;
})

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
    app.listen(port,async () => {
        await console.log(`Server app listening on port ${port}`)
    });
    it("should return all media in store", async () => {
        const res = await request(app).get(
            "/media"
        );
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    });

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