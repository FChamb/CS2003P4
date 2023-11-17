"use strict";

const app = require("./app");
const request = require("supertest");
const bodyParser = require("body-parser");
const express = require("express");
const jestConsole = console;
let {
    checkASCII, checkValid, loadData, server
} = require("./index");

beforeEach(() => {
    global.console = require("console");
});

afterEach(() => {
    global.console = jestConsole;
})

describe("Test function calls in index.js", () => {
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
    it("should return all media in store", async () => {
        const res = request(app).get("/media");
        expect(res.statusCode).toBe(200);
        console.log(res.body);
    })
});