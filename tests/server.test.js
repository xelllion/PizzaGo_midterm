const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { promises: fs } = require("node:fs");
const { createPizzaGoServer } = require("../server");

async function startServer(dataFile) {
    const server = createPizzaGoServer({ dataFile });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    };
}

async function withServer(run) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pizzago-test-"));
    const dataFile = path.join(directory, "reviews.json");
    const server = await startServer(dataFile);
    try {
        await run(server.baseUrl, dataFile);
    } finally {
        await server.close();
        await fs.rm(directory, { recursive: true, force: true });
    }
}

function request(baseUrl, pathname, options = {}, clientId = "browser-test-owner-123") {
    const headers = { Accept: "application/json", ...(options.headers || {}) };
    if (clientId) headers["X-Client-Id"] = clientId;
    if (options.body) headers["Content-Type"] = "application/json";
    return fetch(baseUrl + pathname, { ...options, headers });
}

const validReview = {
    name: "Arai",
    dishId: "pepperoni",
    size: 30,
    rating: 5,
    text: "Fresh pizza and a very clear ordering flow."
};

test("serves the website and protects non-public files", async () => {
    await withServer(async baseUrl => {
        const home = await fetch(baseUrl + "/");
        assert.equal(home.status, 200);
        assert.match(await home.text(), /Good pizza/);
        const serverFile = await fetch(baseUrl + "/server.js");
        assert.equal(serverFile.status, 404);
    });
});

test("supports GET, POST, PATCH and DELETE with browser ownership", async () => {
    await withServer(async (baseUrl, dataFile) => {
        let response = await request(baseUrl, "/api/reviews");
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).reviews, []);

        response = await request(baseUrl, "/api/reviews", { method: "POST", body: JSON.stringify(validReview) });
        assert.equal(response.status, 201);
        const created = (await response.json()).review;
        assert.equal(created.canEdit, true);
        assert.equal(created.size, 30);

        response = await request(baseUrl, "/api/reviews");
        let listed = (await response.json()).reviews;
        assert.equal(listed.length, 1);
        assert.equal(listed[0].canEdit, true);

        response = await request(baseUrl, "/api/reviews", {}, "browser-other-person-456");
        listed = (await response.json()).reviews;
        assert.equal(listed[0].canEdit, false);

        response = await request(baseUrl, `/api/reviews/${created.id}`, {
            method: "PATCH",
            body: JSON.stringify({ rating: 4, text: "Updated after trying the pizza one more time." })
        }, "browser-other-person-456");
        assert.equal(response.status, 403);

        response = await request(baseUrl, `/api/reviews/${created.id}`, {
            method: "PATCH",
            body: JSON.stringify({ rating: 4, text: "Updated after trying the pizza one more time." })
        });
        assert.equal(response.status, 200);
        const updated = (await response.json()).review;
        assert.equal(updated.rating, 4);
        assert.match(updated.text, /Updated/);

        const saved = JSON.parse(await fs.readFile(dataFile, "utf8"));
        assert.equal(saved[0].rating, 4);

        response = await request(baseUrl, `/api/reviews/${created.id}`, { method: "DELETE" });
        assert.equal(response.status, 204);
        response = await request(baseUrl, "/api/reviews");
        assert.deepEqual((await response.json()).reviews, []);
    });
});

test("returns clear server validation errors", async () => {
    await withServer(async baseUrl => {
        const response = await request(baseUrl, "/api/reviews", {
            method: "POST",
            body: JSON.stringify({ name: "A", dishId: "pepperoni", size: 99, rating: 8, text: "short" })
        });
        assert.equal(response.status, 400);
        const body = await response.json();
        assert.equal(body.message, "Review validation failed.");
        assert.deepEqual(Object.keys(body.errors).sort(), ["name", "rating", "size", "text"]);
    });
});

test("keeps reviews after the server restarts", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pizzago-persistence-"));
    const dataFile = path.join(directory, "reviews.json");
    let server = await startServer(dataFile);
    try {
        const created = await request(server.baseUrl, "/api/reviews", { method: "POST", body: JSON.stringify(validReview) });
        assert.equal(created.status, 201);
        await server.close();
        server = await startServer(dataFile);
        const response = await request(server.baseUrl, "/api/reviews");
        const body = await response.json();
        assert.equal(body.reviews.length, 1);
        assert.equal(body.reviews[0].text, validReview.text);
    } finally {
        await server.close().catch(() => undefined);
        await fs.rm(directory, { recursive: true, force: true });
    }
});
