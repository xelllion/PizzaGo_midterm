class Product {
    constructor(id, name, category, image, prices) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.image = image;
        this.prices = prices;
    }

    get displayPrice() {
        return this.prices[this.category === "pizza" ? 1 : 0];
    }

    matchesFilters(query, category, maximumPrice) {
        const matchesName = this.name.toLowerCase().includes(query);
        const matchesCategory = category === "all" || this.category === category;
        return matchesName && matchesCategory && this.displayPrice <= maximumPrice;
    }
}

const products = [
    new Product("pepperoni", "Pepperoni", "pizza", "pizza", [2790, 3490, 4390]),
    new Product("margherita", "Margherita", "pizza", "pizza", [2490, 2990, 3790]),
    new Product("bbq", "BBQ Chicken", "pizza", "pizza", [3090, 3790, 4690]),
    new Product("cheese", "Four Cheese", "pizza", "pizza", [3090, 3590, 4490]),
    new Product("veggie", "Garden Veggie", "pizza", "pizza", [2790, 3290, 4190]),
    new Product("diavola", "Diavola", "pizza", "pizza", [3190, 3690, 4590]),
    new Product("mushroom", "Truffle Mushroom", "pizza", "pizza", [3290, 3890, 4790]),
    new Product("meat", "Meat Feast", "pizza", "pizza", [3390, 3990, 4990]),
    new Product("garlic", "Garlic Knots", "snacks", "bread", [1290]),
    new Product("wings", "Spicy Wings", "snacks", "chicken", [1990]),
    new Product("cola", "Cola 0.5 L", "drinks", "drink", [590]),
    new Product("lemonade", "Mint Lemonade", "drinks", "drink", [890]),
    new Product("cheesecake", "Strawberry Cheesecake", "desserts", "cake", [1390]),
    new Product("brownie", "Brownie & Ice Cream", "desserts", "chocolate", [1490])
];

const sizes = [25, 30, 35];
const stages = ["Order accepted", "Baking", "On the way", "Delivered"];
const cartKey = "pizzagoEndtermCart";
const promoKey = "pizzagoEndtermPromo";
const orderKey = "pizzagoEndtermOrder";
const demoKey = "pizzagoEndtermDemo";
const reviewClientKey = "pizzagoReviewClient";
const localReviewKey = "pizzagoLocalReviews";
const favoriteKey = "pizzagoFavoriteProducts";
const mealApiUrl = "https://www.themealdb.com/api/json/v1/1/search.php?s=pizza";

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

let cart = readStorage(cartKey, []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(item => {
    const product = item && products.find(entry => entry.id === item.id);
    return product && Number.isInteger(item.sizeIndex) && product.prices[item.sizeIndex] !== undefined && Number.isInteger(item.quantity) && item.quantity > 0;
});

let promo = readStorage(promoKey, false) === true;
let trackingTimer;
let reviews = [];
let reviewsUseLocalStorage = typeof location !== "undefined" && location.hostname.endsWith("github.io");
let favorites = new Set(readStorage(favoriteKey, []).filter(id => products.some(product => product.id === id)));

function money(amount) {
    return Math.round(amount).toLocaleString("en-US") + " ₸";
}

function getProduct(id) {
    return products.find(product => product.id === id);
}

function itemName(item) {
    const product = getProduct(item.id);
    return product.name + (product.category === "pizza" ? ` · ${sizes[item.sizeIndex]} cm` : "");
}

function calculateTotals() {
    let subtotal = 0;
    for (const item of cart) {
        subtotal += getProduct(item.id).prices[item.sizeIndex] * item.quantity;
    }
    const discount = promo ? Math.round(subtotal * 0.1) : 0;
    const delivery = subtotal === 0 || subtotal - discount >= 6000 ? 0 : 690;
    return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    const count = document.getElementById("cartCount");
    if (count) count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0) || "";
}

function addToCart(id, sizeIndex) {
    const item = cart.find(entry => entry.id === id && entry.sizeIndex === sizeIndex);
    if (item) item.quantity += 1;
    else cart.push({ id, sizeIndex, quantity: 1 });
    saveCart();
}

function filterAndSortProducts(query, category, maxPrice, sortValue, favoriteIds = favorites, favoritesOnly = false) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const parsedLimit = maxPrice === "" || maxPrice === null ? Infinity : Number(maxPrice);
    const priceLimit = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? parsedLimit : Infinity;
    const favoriteSet = favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds);
    const matches = products.filter(product => product.matchesFilters(normalizedQuery, category, priceLimit) && (!favoritesOnly || favoriteSet.has(product.id)));

    if (sortValue === "price-asc") matches.sort((first, second) => first.displayPrice - second.displayPrice);
    if (sortValue === "price-desc") matches.sort((first, second) => second.displayPrice - first.displayPrice);
    if (sortValue === "name-asc") matches.sort((first, second) => first.name.localeCompare(second.name));
    return matches;
}

function saveFavorites() {
    localStorage.setItem(favoriteKey, JSON.stringify([...favorites]));
}

function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
}

function createProductCard(product) {
    const sizeControl = product.category === "pizza" ? `
        <label class="form-label small" for="size-${product.id}">Size</label>
        <select class="form-select form-select-sm mb-3" id="size-${product.id}">
            ${sizes.map((size, index) => `<option value="${index}" ${index === 1 ? "selected" : ""}>${size} cm</option>`).join("")}
        </select>` : '<p class="small text-secondary">Standard portion</p>';
    const card = document.createElement("article");
    card.className = "col-sm-6 col-lg-3";
    card.dataset.id = product.id;
    card.innerHTML = `
        <div class="card h-100 p-3">
            <img class="product-image" src="images/${product.image}.svg" alt="${product.category} illustration">
            <div class="card-body px-0 pb-0 d-flex flex-column">
                <div class="product-title-row">
                    <h2 class="h5 mb-0">${product.name}</h2>
                    <button class="favorite-button" type="button" aria-label="${favorites.has(product.id) ? "Remove" : "Add"} ${product.name} ${favorites.has(product.id) ? "from" : "to"} favorites" aria-pressed="${favorites.has(product.id)}">
                        <span aria-hidden="true">${favorites.has(product.id) ? "♥" : "♡"}</span>
                    </button>
                </div>
                ${sizeControl}
                <p class="price fw-bold mt-auto">${money(product.displayPrice)}</p>
                <button class="btn btn-primary add-button" type="button" aria-label="Add ${product.name} to cart">Add to cart</button>
            </div>
        </div>`;
    return card;
}

function renderMenu() {
    const search = document.getElementById("searchInput");
    const category = document.getElementById("categoryFilter");
    const maxPrice = document.getElementById("maxPriceFilter");
    const sort = document.getElementById("sortSelect");
    const favoritesOnly = document.getElementById("favoritesOnly");
    const list = document.getElementById("productList");
    if (!search || !category || !maxPrice || !sort || !favoritesOnly || !list) return;
    const matches = filterAndSortProducts(search.value, category.value, maxPrice.value, sort.value, favorites, favoritesOnly.checked);
    list.replaceChildren(...matches.map(createProductCard));
    document.getElementById("menuCount").textContent = matches.length ? `${matches.length} items found` : "No dishes match all selected filters.";
    document.getElementById("favoriteCount").textContent = favorites.size;
}

function setupMenu() {
    const list = document.getElementById("productList");
    if (!list) return;
    document.getElementById("searchInput").addEventListener("input", renderMenu);
    document.getElementById("categoryFilter").addEventListener("change", renderMenu);
    document.getElementById("maxPriceFilter").addEventListener("input", renderMenu);
    document.getElementById("sortSelect").addEventListener("change", renderMenu);
    document.getElementById("favoritesOnly").addEventListener("change", renderMenu);
    list.addEventListener("change", event => {
        const card = event.target.closest("article");
        if (!card || event.target.tagName !== "SELECT") return;
        card.querySelector(".price").textContent = money(getProduct(card.dataset.id).prices[Number(event.target.value)]);
        card.querySelector(".add-button").textContent = "Add to cart";
    });
    list.addEventListener("click", event => {
        const card = event.target.closest("article");
        const favoriteButton = event.target.closest(".favorite-button");
        if (favoriteButton) {
            const product = getProduct(card.dataset.id);
            toggleFavorite(product.id);
            document.getElementById("menuFeedback").textContent = favorites.has(product.id) ? `${product.name} added to favorites.` : `${product.name} removed from favorites.`;
            renderMenu();
            return;
        }
        if (!event.target.closest(".add-button")) return;
        const select = card.querySelector("select");
        const sizeIndex = select ? Number(select.value) : 0;
        addToCart(card.dataset.id, sizeIndex);
        card.querySelector(".add-button").textContent = "Added — add again";
        document.getElementById("menuFeedback").textContent = `${itemName({ id: card.dataset.id, sizeIndex })} added to your cart.`;
    });
    renderMenu();
}

function safeExternalUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

function createRecipeCard(meal) {
    const column = document.createElement("article");
    column.className = "col-md-4";
    const card = document.createElement("div");
    card.className = "card h-100 p-3";
    const imageUrl = safeExternalUrl(meal.strMealThumb);
    if (imageUrl) {
        const image = document.createElement("img");
        image.className = "recipe-image";
        image.src = imageUrl + "/small";
        image.alt = meal.strMeal;
        image.loading = "lazy";
        card.append(image);
    }
    const body = document.createElement("div");
    body.className = "card-body px-0 pb-0 d-flex flex-column";
    const title = document.createElement("h3");
    title.className = "h5";
    title.textContent = meal.strMeal;
    const details = document.createElement("p");
    details.className = "small text-secondary";
    details.textContent = [meal.strArea, meal.strCategory].filter(Boolean).join(" · ") || "Recipe idea";
    body.append(title, details);
    const sourceUrl = safeExternalUrl(meal.strSource) || safeExternalUrl(meal.strYoutube);
    if (sourceUrl) {
        const link = document.createElement("a");
        link.className = "recipe-source mt-auto";
        link.href = sourceUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open recipe ↗";
        body.append(link);
    }
    card.append(body);
    column.append(card);
    return column;
}

async function loadRecipes() {
    const list = document.getElementById("recipeList");
    const status = document.getElementById("recipeStatus");
    const retry = document.getElementById("recipeRetryButton");
    if (!list || !status || !retry) return;
    status.className = "text-secondary mt-3";
    status.textContent = "Loading recipe inspiration…";
    retry.hidden = true;
    list.innerHTML = '<div class="col-12"><div class="loading-placeholder" aria-hidden="true">Connecting to TheMealDB…</div></div>';
    try {
        const response = await fetch(mealApiUrl, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`TheMealDB returned ${response.status}.`);
        const data = await response.json();
        const meals = Array.isArray(data.meals) ? data.meals.filter(meal => meal && meal.strMeal).slice(0, 3) : [];
        list.replaceChildren(...meals.map(createRecipeCard));
        status.textContent = meals.length ? `${meals.length} live recipes loaded from TheMealDB.` : "TheMealDB returned no pizza recipes.";
        retry.hidden = meals.length > 0;
    } catch {
        list.replaceChildren();
        status.className = "text-danger mt-3";
        status.textContent = "Recipe inspiration could not be loaded. Check your connection and try again.";
        retry.hidden = false;
    }
}

function setupRecipes() {
    const retry = document.getElementById("recipeRetryButton");
    if (!retry) return;
    retry.addEventListener("click", loadRecipes);
    loadRecipes();
}

function getReviewClientId() {
    let clientId = localStorage.getItem(reviewClientKey);
    if (!clientId) {
        clientId = `browser-${crypto.randomUUID()}`;
        localStorage.setItem(reviewClientKey, clientId);
    }
    return clientId;
}

function localReviewRequest(path = "", options = {}) {
    const method = options.method || "GET";
    const savedReviews = readStorage(localReviewKey, []);
    const localReviews = Array.isArray(savedReviews) ? savedReviews : [];
    const id = path.startsWith("/") ? path.slice(1) : "";

    if (method === "GET") {
        const sortedReviews = [...localReviews].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
        return { reviews: sortedReviews.map(review => ({ ...review, canEdit: true })) };
    }

    if (method === "DELETE") {
        const index = localReviews.findIndex(review => review.id === id);
        if (index === -1) throw new Error("Review not found.");
        localReviews.splice(index, 1);
        localStorage.setItem(localReviewKey, JSON.stringify(localReviews));
        return null;
    }

    const input = options.body ? JSON.parse(options.body) : {};
    const current = method === "PATCH" ? localReviews.find(review => review.id === id) : null;
    if (method === "PATCH" && !current) throw new Error("Review not found.");
    const reviewData = current ? { ...current, ...input } : input;
    const errors = validateReviewData(reviewData);
    if (Object.keys(errors).length) {
        const error = new Error("Review validation failed.");
        error.errors = errors;
        throw error;
    }

    const now = new Date().toISOString();
    if (method === "POST") {
        const review = { id: crypto.randomUUID(), ...reviewData, createdAt: now, updatedAt: now };
        localReviews.push(review);
        localStorage.setItem(localReviewKey, JSON.stringify(localReviews));
        return { review: { ...review, canEdit: true } };
    }

    if (method === "PATCH") {
        const index = localReviews.findIndex(review => review.id === id);
        const review = { ...current, ...reviewData, updatedAt: now };
        localReviews[index] = review;
        localStorage.setItem(localReviewKey, JSON.stringify(localReviews));
        return { review: { ...review, canEdit: true } };
    }

    throw new Error("Unsupported review action.");
}

async function reviewRequest(path = "", options = {}) {
    if (reviewsUseLocalStorage) return localReviewRequest(path, options);
    const headers = { Accept: "application/json", "X-Client-Id": getReviewClientId(), ...(options.headers || {}) };
    if (options.body) headers["Content-Type"] = "application/json";
    const response = await fetch(`/api/reviews${path}`, { ...options, headers });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(body && body.message ? body.message : `Request failed with status ${response.status}.`);
        error.errors = body && body.errors ? body.errors : null;
        throw error;
    }
    return body;
}

function validateReviewData(data) {
    const errors = {};
    const name = String(data.name || "").trim();
    const text = String(data.text || "").trim();
    const product = getProduct(data.dishId);
    const rating = Number(data.rating);
    if (name.length < 2 || name.length > 50) errors.name = "Enter a name from 2 to 50 characters.";
    if (!product) errors.dishId = "Choose a PizzaGo dish.";
    if (product && product.category === "pizza" && !sizes.includes(Number(data.size))) errors.size = "Choose a pizza size.";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Choose a rating from 1 to 5.";
    if (text.length < 10 || text.length > 300) errors.text = "Write from 10 to 300 characters.";
    return errors;
}

function getReviewFormData() {
    const dishId = document.getElementById("reviewDish").value;
    const product = getProduct(dishId);
    return {
        name: document.getElementById("reviewName").value.trim(),
        dishId,
        size: product && product.category === "pizza" ? Number(document.getElementById("reviewSize").value) : null,
        rating: Number(document.getElementById("reviewRating").value),
        text: document.getElementById("reviewText").value.trim()
    };
}

function clearReviewErrors() {
    for (const name of ["Name", "Dish", "Size", "Rating", "Text"]) {
        const field = document.getElementById(`review${name}`);
        const error = document.getElementById(`review${name}Error`);
        field.classList.remove("is-invalid");
        field.setAttribute("aria-invalid", "false");
        error.textContent = "";
    }
}

function showReviewErrors(errors) {
    clearReviewErrors();
    const fields = { name: "reviewName", dishId: "reviewDish", size: "reviewSize", rating: "reviewRating", text: "reviewText" };
    for (const [name, message] of Object.entries(errors)) {
        const field = document.getElementById(fields[name]);
        if (!field) continue;
        field.classList.add("is-invalid");
        field.setAttribute("aria-invalid", "true");
        document.getElementById(field.id + "Error").textContent = message;
    }
    const firstInvalid = document.querySelector("#reviewForm .is-invalid");
    if (firstInvalid) firstInvalid.focus();
}

function setReviewFormMessage(message, type = "success") {
    const output = document.getElementById("reviewFormMessage");
    output.className = type === "error" ? "mt-3 mb-0 text-danger" : "mt-3 mb-0 text-success";
    output.textContent = message;
}

function updateCharacterCount() {
    const text = document.getElementById("reviewText");
    document.getElementById("reviewCharacterCount").textContent = `${text.value.length} / 300`;
}

function updateReviewSizeField() {
    const product = getProduct(document.getElementById("reviewDish").value);
    const group = document.getElementById("reviewSizeGroup");
    const field = document.getElementById("reviewSize");
    const showSize = product && product.category === "pizza";
    group.hidden = !showSize;
    field.disabled = !showSize;
    if (!showSize) {
        field.classList.remove("is-invalid");
        document.getElementById("reviewSizeError").textContent = "";
    }
}

function resetReviewForm() {
    const form = document.getElementById("reviewForm");
    form.reset();
    delete form.dataset.editingId;
    document.getElementById("reviewFormTitle").textContent = "Add a review";
    document.getElementById("reviewSubmitButton").textContent = "Publish review";
    document.getElementById("reviewCancelButton").hidden = true;
    clearReviewErrors();
    updateReviewSizeField();
    updateCharacterCount();
}

function startReviewEdit(review) {
    const form = document.getElementById("reviewForm");
    form.dataset.editingId = review.id;
    document.getElementById("reviewName").value = review.name;
    document.getElementById("reviewDish").value = review.dishId;
    document.getElementById("reviewRating").value = String(review.rating);
    document.getElementById("reviewText").value = review.text;
    updateReviewSizeField();
    if (review.size) document.getElementById("reviewSize").value = String(review.size);
    document.getElementById("reviewFormTitle").textContent = "Edit your review";
    document.getElementById("reviewSubmitButton").textContent = "Save changes";
    document.getElementById("reviewCancelButton").hidden = false;
    setReviewFormMessage("");
    clearReviewErrors();
    updateCharacterCount();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("reviewName").focus({ preventScroll: true });
}

function reviewDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function createReviewCard(review) {
    const card = document.createElement("article");
    card.className = "review-card";
    const header = document.createElement("div");
    header.className = "review-card-header";
    const identity = document.createElement("div");
    const name = document.createElement("h3");
    name.className = "h5 mb-1";
    name.textContent = review.name;
    const product = getProduct(review.dishId);
    const meta = document.createElement("p");
    meta.className = "review-meta mb-0";
    meta.textContent = `${product ? product.name : "PizzaGo dish"}${review.size ? ` · ${review.size} cm` : ""} · ${reviewDate(review.updatedAt || review.createdAt)}`;
    identity.append(name, meta);
    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
    stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    header.append(identity, stars);
    const text = document.createElement("p");
    text.className = "review-text mt-3 mb-0";
    text.textContent = review.text;
    card.append(header, text);
    if (review.canEdit) {
        const actions = document.createElement("div");
        actions.className = "review-actions";
        const edit = document.createElement("button");
        edit.className = "btn btn-outline-dark btn-sm";
        edit.type = "button";
        edit.dataset.action = "edit-review";
        edit.dataset.id = review.id;
        edit.textContent = "Edit";
        const remove = document.createElement("button");
        remove.className = "btn btn-outline-danger btn-sm";
        remove.type = "button";
        remove.dataset.action = "delete-review";
        remove.dataset.id = review.id;
        remove.textContent = "Delete";
        actions.append(edit, remove);
        card.append(actions);
    }
    return card;
}

function renderReviews() {
    const list = document.getElementById("reviewList");
    list.replaceChildren(...reviews.map(createReviewCard));
    document.getElementById("reviewListStatus").textContent = reviews.length ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` : "No reviews yet. Be the first to add one.";
}

function updateReviewStorageMode() {
    const output = document.getElementById("reviewStorageMode");
    if (!output) return;
    output.textContent = reviewsUseLocalStorage ? "Browser mode: reviews are saved in localStorage on this device." : "Server mode: reviews are saved in data/reviews.json.";
}

async function loadReviews() {
    const status = document.getElementById("reviewListStatus");
    const retry = document.getElementById("reviewRetryButton");
    if (!status || !retry) return;
    status.className = "text-secondary";
    status.textContent = "Loading reviews…";
    retry.hidden = true;
    try {
        const data = await reviewRequest();
        reviews = Array.isArray(data.reviews) ? data.reviews : [];
        updateReviewStorageMode();
        renderReviews();
    } catch {
        reviews = [];
        document.getElementById("reviewList").replaceChildren();
        status.className = "text-danger";
        status.textContent = "Reviews are unavailable. Run the project with npm start and try again.";
        retry.hidden = false;
    }
}

async function submitReview(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = getReviewFormData();
    const errors = validateReviewData(data);
    if (Object.keys(errors).length) {
        showReviewErrors(errors);
        setReviewFormMessage("Please correct the highlighted fields.", "error");
        return;
    }
    clearReviewErrors();
    const editingId = form.dataset.editingId;
    const button = document.getElementById("reviewSubmitButton");
    button.disabled = true;
    setReviewFormMessage(editingId ? "Saving changes…" : "Publishing review…");
    try {
        await reviewRequest(editingId ? `/${editingId}` : "", {
            method: editingId ? "PATCH" : "POST",
            body: JSON.stringify(data)
        });
        resetReviewForm();
        setReviewFormMessage(editingId ? "Review updated." : "Review published.");
        await loadReviews();
    } catch (error) {
        if (error.errors) showReviewErrors(error.errors);
        setReviewFormMessage(error.message || "The review could not be saved.", "error");
    } finally {
        button.disabled = false;
    }
}

async function deleteReview(review) {
    if (!window.confirm(`Delete your review of ${getProduct(review.dishId).name}?`)) return;
    setReviewFormMessage("Deleting review…");
    try {
        await reviewRequest(`/${review.id}`, { method: "DELETE" });
        if (document.getElementById("reviewForm").dataset.editingId === review.id) resetReviewForm();
        setReviewFormMessage("Review deleted.");
        await loadReviews();
    } catch (error) {
        setReviewFormMessage(error.message || "The review could not be deleted.", "error");
    }
}

function setupReviews() {
    const form = document.getElementById("reviewForm");
    if (!form) return;
    const dishSelect = document.getElementById("reviewDish");
    for (const product of products) {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.name;
        dishSelect.append(option);
    }
    dishSelect.addEventListener("change", updateReviewSizeField);
    document.getElementById("reviewText").addEventListener("input", updateCharacterCount);
    form.addEventListener("input", event => {
        event.target.classList.remove("is-invalid");
        event.target.setAttribute("aria-invalid", "false");
        const error = document.getElementById(event.target.id + "Error");
        if (error) error.textContent = "";
    });
    form.addEventListener("submit", submitReview);
    document.getElementById("reviewCancelButton").addEventListener("click", () => {
        resetReviewForm();
        setReviewFormMessage("Editing cancelled.");
    });
    document.getElementById("reviewRetryButton").addEventListener("click", loadReviews);
    document.getElementById("reviewList").addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const review = reviews.find(entry => entry.id === button.dataset.id);
        if (!review || !review.canEdit) return;
        if (button.dataset.action === "edit-review") startReviewEdit(review);
        if (button.dataset.action === "delete-review") deleteReview(review);
    });
    updateReviewSizeField();
    updateCharacterCount();
    loadReviews();
}

function renderCart() {
    const body = document.getElementById("cartBody");
    if (!body) return;
    body.replaceChildren();
    cart.forEach((item, index) => {
        const row = document.createElement("tr");
        row.dataset.index = index;
        row.innerHTML = `
            <th scope="row">${itemName(item)}</th>
            <td><div class="d-flex align-items-center gap-2">
                <button class="btn btn-outline-dark btn-sm" type="button" data-action="minus" aria-label="Decrease ${itemName(item)}">−</button>
                <span>${item.quantity}</span>
                <button class="btn btn-outline-dark btn-sm" type="button" data-action="plus" aria-label="Increase ${itemName(item)}">+</button>
            </div></td>
            <td class="text-nowrap">${money(getProduct(item.id).prices[item.sizeIndex] * item.quantity)}</td>
            <td><button class="btn btn-outline-danger btn-sm" type="button" data-action="remove" aria-label="Remove ${itemName(item)}">Remove</button></td>`;
        body.append(row);
    });
    document.getElementById("emptyCart").hidden = cart.length > 0;
    document.getElementById("cartTable").hidden = cart.length === 0;
    const totals = calculateTotals();
    for (const name of ["subtotal", "discount", "delivery", "total"]) {
        document.getElementById(name).textContent = money(totals[name]);
    }
}

function validateField(field) {
    const value = field.value.trim();
    let message = "";
    if (field.type === "checkbox" && !field.checked) message = "Please confirm your order details.";
    else if (field.required && !value) message = "Please complete this field.";
    else if (field.minLength > 0 && value.length < field.minLength) message = `Enter at least ${field.minLength} characters.`;
    else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Enter a valid email, such as name@example.com.";
    else if (field.type === "tel" && !/^\d{11}$/.test(value.replace(/[+()\s-]/g, ""))) message = "Enter 11 digits, for example +7 777 123 45 67.";
    field.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    document.getElementById(field.id + "Error").textContent = message;
    return !message;
}

function validateForm(form) {
    let valid = true;
    for (const field of form.querySelectorAll("input, select, textarea")) {
        if (!validateField(field)) valid = false;
    }
    if (!valid) form.querySelector(".is-invalid").focus();
    return valid;
}

function setupValidation(form) {
    form.noValidate = true;
    form.addEventListener("input", event => {
        if (event.target.classList.contains("is-invalid")) validateField(event.target);
    });
}

function setupCart() {
    const body = document.getElementById("cartBody");
    if (!body) return;
    const feedback = document.getElementById("cartFeedback");
    body.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const row = button.closest("tr");
        const index = Number(row.dataset.index);
        cart[index].quantity += button.dataset.action === "plus" ? 1 : -1;
        if (button.dataset.action === "remove" || cart[index].quantity === 0) cart.splice(index, 1);
        saveCart();
        renderCart();
        feedback.textContent = "Cart updated.";
    });
    const promoInput = document.getElementById("promoInput");
    if (promo) promoInput.value = "PIZZA10";
    document.getElementById("promoForm").addEventListener("submit", event => {
        event.preventDefault();
        const code = promoInput.value.trim().toUpperCase();
        promo = code === "PIZZA10";
        localStorage.setItem(promoKey, JSON.stringify(promo));
        document.getElementById("promoMessage").textContent = promo ? "PIZZA10 applied: 10% off food and drinks." : code ? "Unknown code. No discount applied; try PIZZA10." : "Promo code removed.";
        renderCart();
    });
    const form = document.getElementById("checkoutForm");
    setupValidation(form);
    form.addEventListener("submit", event => {
        event.preventDefault();
        const valid = validateForm(form);
        feedback.textContent = cart.length ? "" : "Your cart is empty. Add a dish from the menu first.";
        if (!valid || !cart.length) return;
        const order = {
            id: "PG" + Date.now(),
            createdAt: Date.now(),
            total: calculateTotals().total,
            items: cart,
            name: document.getElementById("customerName").value.trim(),
            address: document.getElementById("customerAddress").value.trim()
        };
        localStorage.setItem(orderKey, JSON.stringify(order));
        cart = [];
        promo = false;
        localStorage.removeItem(promoKey);
        saveCart();
        renderCart();
        form.reset();
        promoInput.value = "";
        document.getElementById("promoMessage").textContent = "";
        const confirmation = document.getElementById("orderSuccess");
        confirmation.hidden = false;
        document.getElementById("orderNumber").textContent = order.id;
        document.getElementById("trackLink").href = "tracking.html?order=" + order.id;
        confirmation.focus();
    });
    renderCart();
}

function showOrder(order) {
    const result = document.getElementById("trackResult");
    result.hidden = false;
    document.getElementById("trackId").textContent = order.id;
    document.getElementById("trackDetails").textContent = `${order.address} · Total: ${money(order.total)}`;
    const update = () => {
        const stage = Math.min(3, Math.max(0, Math.floor((Date.now() - order.createdAt) / 20000)));
        document.getElementById("trackStatus").textContent = stages[stage];
        document.querySelectorAll("#trackStages li").forEach((item, index) => {
            item.classList.toggle("fw-bold", index === stage);
            item.classList.toggle("text-success", index <= stage);
            item.setAttribute("aria-current", index === stage ? "step" : "false");
        });
        if (stage === 3) clearInterval(trackingTimer);
    };
    trackingTimer = setInterval(update, 1000);
    update();
}

function setupTracking() {
    const form = document.getElementById("trackForm");
    if (!form) return;
    const input = document.getElementById("orderInput");
    const lookup = () => {
        clearInterval(trackingTimer);
        document.getElementById("trackResult").hidden = true;
        const id = input.value.trim().toUpperCase();
        let order = readStorage(orderKey, null);
        if (id === "PG1024") {
            order = readStorage(demoKey, null);
            if (!order) {
                order = { id, createdAt: Date.now(), total: 4180, address: "Demo address in Astana" };
                localStorage.setItem(demoKey, JSON.stringify(order));
            }
        }
        const found = order && order.id === id;
        document.getElementById("trackMessage").textContent = found ? "" : id ? "Order not found. Check the number or try PG1024." : "Please enter an order number.";
        if (found) showOrder(order);
    };
    form.addEventListener("submit", event => {
        event.preventDefault();
        lookup();
    });
    const requested = new URLSearchParams(location.search).get("order");
    if (requested) {
        input.value = requested;
        lookup();
    }
    window.addEventListener("pagehide", () => clearInterval(trackingTimer));
}

function setupContact() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    setupValidation(form);
    form.addEventListener("input", () => { document.getElementById("contactSuccess").textContent = ""; });
    form.addEventListener("submit", event => {
        event.preventDefault();
        document.getElementById("contactSuccess").textContent = validateForm(form) ? "Your message passed validation. This student demo does not send messages." : "";
    });
}

function setupJQuery() {
    if (!window.jQuery) return;
    $.fx.off = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $(".faq-question").on("click", function () {
        const expanded = $(this).attr("aria-expanded") === "true";
        $(this).attr("aria-expanded", String(!expanded));
        $(this).closest(".faq-item").find(".faq-answer").stop(true, true).slideToggle(150);
    });
    $("#contactTopic").on("change", function () {
        const message = $(this).find("option:selected").data("help") || "";
        $("#topicHelp").stop(true, true).hide().text(message).fadeIn(150);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    saveCart();
    setupMenu();
    setupRecipes();
    setupReviews();
    setupCart();
    setupTracking();
    setupContact();
    setupJQuery();
});

window.addEventListener("pageshow", event => {
    if (event.persisted) location.reload();
});
