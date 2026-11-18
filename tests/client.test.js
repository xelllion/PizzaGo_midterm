const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const { readFileSync } = require("node:fs");

function createContext(hostname = "localhost") {
    const values = new Map();
    const context = vm.createContext({
        console,
        URL,
        URLSearchParams,
        Math,
        Date,
        setInterval,
        clearInterval,
        location: { hostname },
        localStorage: {
            getItem: key => values.has(key) ? values.get(key) : null,
            setItem: (key, value) => values.set(key, String(value)),
            removeItem: key => values.delete(key)
        },
        document: {
            addEventListener() {},
            getElementById() { return null; }
        },
        window: {
            addEventListener() {}
        },
        crypto: {
            randomUUID: () => "00000000-0000-4000-8000-000000000000"
        }
    });
    const script = readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
    vm.runInContext(script, context);
    return context;
}

test("search, category, maximum price and sorting work together", () => {
    const context = createContext();
    const result = vm.runInContext('filterAndSortProducts("e", "pizza", "3500", "price-desc").map(product => product.id)', context);
    assert.deepEqual(Array.from(result), ["pepperoni", "veggie", "margherita"]);
});

test("price sorting uses the default displayed pizza size", () => {
    const context = createContext();
    const result = vm.runInContext('filterAndSortProducts("", "all", "900", "price-asc").map(product => product.id)', context);
    assert.deepEqual(Array.from(result), ["cola", "lemonade"]);
});

test("products use OOP and favorites work with other filters", () => {
    const context = createContext();
    const result = vm.runInContext('({ usesClass: products.every(product => product instanceof Product), ids: filterAndSortProducts("", "all", "", "name-asc", new Set(["pepperoni", "cola"]), true).map(product => product.id) })', context);
    assert.equal(result.usesClass, true);
    assert.deepEqual(Array.from(result.ids), ["cola", "pepperoni"]);
});

test("review validation checks every advanced form field", () => {
    const context = createContext();
    const invalid = vm.runInContext('validateReviewData({ name: "A", dishId: "pepperoni", size: 40, rating: 0, text: "short" })', context);
    assert.deepEqual(Object.keys(invalid).sort(), ["name", "rating", "size", "text"]);
    const valid = vm.runInContext('validateReviewData({ name: "Arai", dishId: "pepperoni", size: 30, rating: 5, text: "A clear and useful review." })', context);
    assert.deepEqual(Object.keys(valid), []);
    const snack = vm.runInContext('validateReviewData({ name: "Arai", dishId: "wings", size: null, rating: 4, text: "Crispy wings with good spice." })', context);
    assert.deepEqual(Object.keys(snack), []);
});

test("localStorage JSON parsing falls back safely", () => {
    const context = createContext();
    vm.runInContext('localStorage.setItem("sample", JSON.stringify({ count: 2 }))', context);
    assert.equal(vm.runInContext('readStorage("sample", {}).count', context), 2);
    vm.runInContext('localStorage.setItem("sample", "not-json")', context);
    assert.equal(vm.runInContext('readStorage("sample", { count: 0 }).count', context), 0);
});

test("GitHub Pages reviews use localStorage CRUD", async () => {
    const context = createContext("xelllion.github.io");
    const result = await vm.runInContext(`(async () => {
        const data = { name: "Arai", dishId: "pepperoni", size: 30, rating: 5, text: "A useful Pages review." };
        const created = (await reviewRequest("", { method: "POST", body: JSON.stringify(data) })).review;
        const listed = (await reviewRequest()).reviews;
        const updated = (await reviewRequest("/" + created.id, { method: "PATCH", body: JSON.stringify({ ...data, rating: 4, text: "Updated Pages review text." }) })).review;
        await reviewRequest("/" + created.id, { method: "DELETE" });
        return { localMode: reviewsUseLocalStorage, createdCount: listed.length, canEdit: listed[0].canEdit, rating: updated.rating, remaining: (await reviewRequest()).reviews.length };
    })()`, context);
    assert.deepEqual({ ...result }, { localMode: true, createdCount: 1, canEdit: true, rating: 4, remaining: 0 });
});
