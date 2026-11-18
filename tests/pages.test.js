const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { promises: fs } = require("node:fs");

const root = path.join(__dirname, "..");
const pages = ["index.html", "menu.html", "deals.html", "cart.html", "tracking.html", "contact.html"];

test("all pages have unique IDs and valid local links and assets", async () => {
    for (const page of pages) {
        const html = await fs.readFile(path.join(root, page), "utf8");
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(new Set(ids).size, ids.length, `${page} contains a duplicate ID`);
        const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
        for (const reference of references) {
            if (/^(?:https?:|mailto:|tel:|#)/.test(reference)) continue;
            const localPath = reference.split(/[?#]/)[0];
            await assert.doesNotReject(fs.access(path.join(root, localPath)), `${page} references missing ${localPath}`);
        }
        for (const requiredPage of pages) {
            assert.match(html, new RegExp(`href="${requiredPage.replace(".", "\\.")}"`), `${page} is missing navigation to ${requiredPage}`);
        }
    }
});

test("every static button has an explicit type and accessible name", async () => {
    for (const page of pages) {
        const html = await fs.readFile(path.join(root, page), "utf8");
        const buttons = html.match(/<button\b[\s\S]*?<\/button>/g) || [];
        for (const button of buttons) {
            assert.match(button, /\btype="(?:button|submit)"/, `${page} contains a button without an explicit type`);
            const visibleText = button.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            assert.ok(visibleText || /\baria-label="[^"]+"/.test(button), `${page} contains a button without an accessible name`);
        }
    }
});

test("the menu keeps all 14 original PizzaGo products", async () => {
    const script = await fs.readFile(path.join(root, "script.js"), "utf8");
    const productBlock = script.slice(script.indexOf("const products"), script.indexOf("const sizes"));
    assert.equal((productBlock.match(/new Product\(/g) || []).length, 14);
    assert.match(script, /class Product/);
});
