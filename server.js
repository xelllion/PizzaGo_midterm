const http = require("node:http");
const path = require("node:path");
const { promises: fs } = require("node:fs");
const { randomUUID } = require("node:crypto");

const rootDirectory = __dirname;
const pizzaIds = new Set(["pepperoni", "margherita", "bbq", "cheese", "veggie", "diavola", "mushroom", "meat"]);
const productIds = new Set([...pizzaIds, "garlic", "wings", "cola", "lemonade", "cheesecake", "brownie"]);
const pizzaSizes = new Set([25, 30, 35]);
const staticFiles = new Map([
    ["/", "index.html"],
    ["/index.html", "index.html"],
    ["/menu.html", "menu.html"],
    ["/deals.html", "deals.html"],
    ["/cart.html", "cart.html"],
    ["/tracking.html", "tracking.html"],
    ["/contact.html", "contact.html"],
    ["/styles.css", "styles.css"],
    ["/script.js", "script.js"]
]);
const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml"
};

function httpError(status, message, errors) {
    const error = new Error(message);
    error.status = status;
    error.errors = errors;
    return error;
}

function sendJson(response, status, body) {
    const data = JSON.stringify(body);
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(data),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    });
    response.end(data);
}

function sendEmpty(response, status) {
    response.writeHead(status, { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end();
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        let tooLarge = false;
        request.setEncoding("utf8");
        request.on("data", chunk => {
            if (tooLarge) return;
            body += chunk;
            if (Buffer.byteLength(body) > 10_000) {
                tooLarge = true;
                body = "";
            }
        });
        request.on("end", () => {
            if (tooLarge) {
                reject(httpError(413, "Request body is too large."));
                return;
            }
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(httpError(400, "Request body must be valid JSON."));
            }
        });
        request.on("error", reject);
    });
}

function validateClientId(value) {
    return typeof value === "string" && value.length >= 8 && value.length <= 100 && /^[a-zA-Z0-9-]+$/.test(value);
}

function requireClientId(request) {
    const value = request.headers["x-client-id"];
    if (!validateClientId(value)) throw httpError(400, "A valid X-Client-Id header is required.");
    return value;
}

function validateReview(input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const dishId = typeof input.dishId === "string" ? input.dishId : "";
    const rating = Number(input.rating);
    const text = typeof input.text === "string" ? input.text.trim() : "";
    const size = pizzaIds.has(dishId) ? Number(input.size) : null;
    const errors = {};
    if (name.length < 2 || name.length > 50) errors.name = "Enter a name from 2 to 50 characters.";
    if (!productIds.has(dishId)) errors.dishId = "Choose a PizzaGo dish.";
    if (pizzaIds.has(dishId) && !pizzaSizes.has(size)) errors.size = "Choose 25, 30 or 35 cm.";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Choose a rating from 1 to 5.";
    if (text.length < 10 || text.length > 300) errors.text = "Write from 10 to 300 characters.";
    return { errors, value: { name, dishId, size, rating, text } };
}

function publicReview(review, clientId) {
    return {
        id: review.id,
        name: review.name,
        dishId: review.dishId,
        size: review.size,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        canEdit: review.ownerId === clientId
    };
}

function createReviewStore(dataFile) {
    let queue = Promise.resolve();

    async function readFile() {
        try {
            const data = JSON.parse(await fs.readFile(dataFile, "utf8"));
            return Array.isArray(data) ? data : [];
        } catch (error) {
            if (error.code === "ENOENT") return [];
            if (error instanceof SyntaxError) throw httpError(500, "Review storage contains invalid JSON.");
            throw error;
        }
    }

    async function writeFile(reviews) {
        await fs.mkdir(path.dirname(dataFile), { recursive: true });
        const temporaryFile = `${dataFile}.${process.pid}.${Date.now()}.tmp`;
        await fs.writeFile(temporaryFile, JSON.stringify(reviews, null, 2) + "\n", "utf8");
        await fs.rename(temporaryFile, dataFile);
    }

    async function list() {
        await queue;
        return readFile();
    }

    function change(mutator) {
        const operation = queue.then(async () => {
            const reviews = await readFile();
            const result = mutator(reviews);
            await writeFile(reviews);
            return result;
        });
        queue = operation.catch(() => undefined);
        return operation;
    }

    return { list, change };
}

async function handleReviews(request, response, url, store) {
    const match = url.pathname.match(/^\/api\/reviews\/([a-zA-Z0-9-]+)$/);
    const clientId = validateClientId(request.headers["x-client-id"]) ? request.headers["x-client-id"] : "";

    if (request.method === "GET" && url.pathname === "/api/reviews") {
        const reviews = await store.list();
        reviews.sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
        sendJson(response, 200, { reviews: reviews.map(review => publicReview(review, clientId)) });
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/reviews") {
        const ownerId = requireClientId(request);
        const input = await readBody(request);
        const { errors, value } = validateReview(input);
        if (Object.keys(errors).length) throw httpError(400, "Review validation failed.", errors);
        const now = new Date().toISOString();
        const review = { id: randomUUID(), ...value, ownerId, createdAt: now, updatedAt: now };
        await store.change(items => items.push(review));
        sendJson(response, 201, { review: publicReview(review, ownerId) });
        return;
    }

    if (request.method === "PATCH" && match) {
        const ownerId = requireClientId(request);
        const input = await readBody(request);
        const review = await store.change(items => {
            const index = items.findIndex(item => item.id === match[1]);
            if (index === -1) throw httpError(404, "Review not found.");
            if (items[index].ownerId !== ownerId) throw httpError(403, "You can edit only reviews created in this browser.");
            const { errors, value } = validateReview({ ...items[index], ...input });
            if (Object.keys(errors).length) throw httpError(400, "Review validation failed.", errors);
            items[index] = { ...items[index], ...value, updatedAt: new Date().toISOString() };
            return items[index];
        });
        sendJson(response, 200, { review: publicReview(review, ownerId) });
        return;
    }

    if (request.method === "DELETE" && match) {
        const ownerId = requireClientId(request);
        await store.change(items => {
            const index = items.findIndex(item => item.id === match[1]);
            if (index === -1) throw httpError(404, "Review not found.");
            if (items[index].ownerId !== ownerId) throw httpError(403, "You can delete only reviews created in this browser.");
            items.splice(index, 1);
        });
        sendEmpty(response, 204);
        return;
    }

    throw httpError(404, "API route not found.");
}

async function serveStatic(request, response, url) {
    let relativePath = staticFiles.get(url.pathname);
    if (!relativePath && /^\/images\/[a-z0-9-]+\.svg$/.test(url.pathname)) relativePath = url.pathname.slice(1);
    if (!relativePath || !["GET", "HEAD"].includes(request.method)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
        response.end("Page not found");
        return;
    }
    try {
        const data = await fs.readFile(path.join(rootDirectory, relativePath));
        response.writeHead(200, {
            "Content-Type": contentTypes[path.extname(relativePath)] || "application/octet-stream",
            "Content-Length": data.length,
            "Cache-Control": relativePath.endsWith(".svg") ? "public, max-age=86400" : "no-cache",
            "X-Content-Type-Options": "nosniff"
        });
        response.end(request.method === "HEAD" ? undefined : data);
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Page not found");
    }
}

function createPizzaGoServer(options = {}) {
    const dataFile = options.dataFile || process.env.REVIEWS_FILE || path.join(rootDirectory, "data", "reviews.json");
    const store = createReviewStore(dataFile);
    return http.createServer(async (request, response) => {
        try {
            const url = new URL(request.url, "http://localhost");
            if (url.pathname.startsWith("/api/")) await handleReviews(request, response, url, store);
            else await serveStatic(request, response, url);
        } catch (error) {
            const status = Number.isInteger(error.status) ? error.status : 500;
            const body = { message: status === 500 ? "Internal server error." : error.message };
            if (error.errors) body.errors = error.errors;
            if (!response.headersSent) sendJson(response, status, body);
            else response.end();
        }
    });
}

if (require.main === module) {
    const port = Number(process.env.PORT) || 3000;
    createPizzaGoServer().listen(port, () => {
        console.log(`PizzaGo is running at http://localhost:${port}`);
    });
}

module.exports = { createPizzaGoServer, validateReview };
