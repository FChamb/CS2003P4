"use strict";

const app = require("./index.js").index;
const request = require("supertest");
const bodyParser = require("body-parser");
const express = require("express");
app.use(bodyParser.json());
app.use(express);

describe('Index', () => {
    let index;

    beforeEach(() => {
        index = new index();
    });

    afterEach(() => {
        index = null;
    });

    test("Check valid for: The Hobbit, DVD, The original journey of Bilbo.", () => {
        expect(checkValid("The Hobbit", "DVD", "The original journey of Biblo")).toBe(true);
    });

});