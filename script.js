const products = [
    { id: "pepperoni", name: "Pepperoni", category: "pizza", image: "pizza", prices: [2790, 3490, 4390] },
    { id: "margherita", name: "Margherita", category: "pizza", image: "pizza", prices: [2490, 2990, 3790] },
    { id: "bbq", name: "BBQ Chicken", category: "pizza", image: "pizza", prices: [3090, 3790, 4690] },
    { id: "cheese", name: "Four Cheese", category: "pizza", image: "pizza", prices: [3090, 3590, 4490] },
    { id: "veggie", name: "Garden Veggie", category: "pizza", image: "pizza", prices: [2790, 3290, 4190] },
    { id: "diavola", name: "Diavola", category: "pizza", image: "pizza", prices: [3190, 3690, 4590] },
    { id: "mushroom", name: "Truffle Mushroom", category: "pizza", image: "pizza", prices: [3290, 3890, 4790] },
    { id: "meat", name: "Meat Feast", category: "pizza", image: "pizza", prices: [3390, 3990, 4990] },
    { id: "garlic", name: "Garlic Knots", category: "snacks", image: "bread", prices: [1290] },
    { id: "wings", name: "Spicy Wings", category: "snacks", image: "chicken", prices: [1990] },
    { id: "cola", name: "Cola 0.5 L", category: "drinks", image: "drink", prices: [590] },
    { id: "lemonade", name: "Mint Lemonade", category: "drinks", image: "drink", prices: [890] },
    { id: "cheesecake", name: "Strawberry Cheesecake", category: "desserts", image: "cake", prices: [1390] },
    { id: "brownie", name: "Brownie & Ice Cream", category: "desserts", image: "chocolate", prices: [1490] }
];
const sizes = [25, 30, 35];
const stages = ["Order accepted", "Baking", "On the way", "Delivered"];
const cartKey = "pizzagoEndtermCart";
const promoKey = "pizzagoEndtermPromo";
const orderKey = "pizzagoEndtermOrder";
const demoKey = "pizzagoEndtermDemo";

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

let cart = readStorage(cartKey, []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(item => item && products.some(product => product.id === item.id && product.prices[item.sizeIndex]) && Number.isInteger(item.quantity) && item.quantity > 0);
let promo = readStorage(promoKey, false) === true;
let trackingTimer;

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
    document.getElementById("cartCount").textContent = cart.reduce((sum, item) => sum + item.quantity, 0) || "";
}

function addToCart(id, sizeIndex) {
    const item = cart.find(entry => entry.id === id && entry.sizeIndex === sizeIndex);
    if (item) item.quantity += 1;
    else cart.push({ id, sizeIndex, quantity: 1 });
    saveCart();
}

function renderMenu() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const matches = products.filter(product => product.name.toLowerCase().includes(query) && (category === "all" || product.category === category));
    const list = document.getElementById("productList");
    list.replaceChildren();
    matches.forEach(product => {
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
                    <h2 class="h5">${product.name}</h2>
                    ${sizeControl}
                    <p class="price fw-bold mt-auto">${money(product.prices[product.category === "pizza" ? 1 : 0])}</p>
                    <button class="btn btn-primary add-button" type="button" aria-label="Add ${product.name} to cart">Add to cart</button>
                </div>
            </div>`;
        list.append(card);
    });
    document.getElementById("menuCount").textContent = matches.length ? `${matches.length} items found` : "No dishes found. Try another name or category.";
}

function setupMenu() {
    const list = document.getElementById("productList");
    if (!list) return;
    document.getElementById("searchInput").addEventListener("input", renderMenu);
    document.getElementById("categoryFilter").addEventListener("change", renderMenu);
    list.addEventListener("change", event => {
        const card = event.target.closest("article");
        card.querySelector(".price").textContent = money(getProduct(card.dataset.id).prices[event.target.value]);
        card.querySelector(".add-button").textContent = "Add to cart";
    });
    list.addEventListener("click", event => {
        if (!event.target.closest(".add-button")) return;
        const card = event.target.closest("article");
        const select = card.querySelector("select");
        const sizeIndex = select ? Number(select.value) : 0;
        addToCart(card.dataset.id, sizeIndex);
        card.querySelector(".add-button").textContent = "Added — add again";
        document.getElementById("menuFeedback").textContent = `${itemName({ id: card.dataset.id, sizeIndex })} added to your cart.`;
    });
    renderMenu();
}

function renderCart() {
    const body = document.getElementById("cartBody");
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
        if (button.dataset.action === "remove" || cart[index].quantity === 0) {
            cart.splice(index, 1);
            row.remove();
        }
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

document.addEventListener("DOMContentLoaded", () => {
    saveCart();
    setupMenu();
    setupCart();
    setupTracking();
    setupContact();
});
