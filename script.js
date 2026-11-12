// List of products with their categories, images and prices
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

// Constants for pizza sizes, delivery stages and localStorage keys
const sizes = [25, 30, 35];
const stages = ["Order accepted", "Baking", "On the way", "Delivered"];
const cartKey = "pizzagoEndtermCart";
const promoKey = "pizzagoEndtermPromo";
const orderKey = "pizzagoEndtermOrder";
const demoKey = "pizzagoEndtermDemo";

// Use the default value if saved data is missing or cannot be read as JSON
function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

// Load the cart and remove invalid items
let cart = readStorage(cartKey, []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(item => item && products.some(product => product.id === item.id && product.prices[item.sizeIndex]) && Number.isInteger(item.quantity) && item.quantity > 0);
// Restore the promo status and prepare the tracking timer
let promo = readStorage(promoKey, false) === true;
let trackingTimer;

// Format a number as a price in tenge
function money(amount) {
    return Math.round(amount).toLocaleString("en-US") + " ₸";
}

// Find a product by its ID
function getProduct(id) {
    return products.find(product => product.id === id);
}

// Get the product name and include the pizza size if needed
function itemName(item) {
    const product = getProduct(item.id);
    return product.name + (product.category === "pizza" ? ` · ${sizes[item.sizeIndex]} cm` : "");
}

// Calculate subtotal, discount, delivery fee and final total
function calculateTotals() {
    let subtotal = 0;
    for (const item of cart) {
        subtotal += getProduct(item.id).prices[item.sizeIndex] * item.quantity;
    }
    const discount = promo ? Math.round(subtotal * 0.1) : 0;
    // Delivery costs 690 below 6,000 after discount; an empty cart has no delivery fee
    const delivery = subtotal === 0 || subtotal - discount >= 6000 ? 0 : 690;
    return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

// Save the cart and update the item count in the navbar
function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    document.getElementById("cartCount").textContent = cart.reduce((sum, item) => sum + item.quantity, 0) || "";
}

// Add a product to the cart or increase its quantity
function addToCart(id, sizeIndex) {
    const item = cart.find(entry => entry.id === id && entry.sizeIndex === sizeIndex);
    if (item) item.quantity += 1;
    else cart.push({ id, sizeIndex, quantity: 1 });
    saveCart();
}

// Filter products and display matching menu cards
function renderMenu() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const matches = products.filter(product => product.name.toLowerCase().includes(query) && (category === "all" || product.category === category));
    const list = document.getElementById("productList");
    list.replaceChildren();
    matches.forEach(product => {
        // Show a size selector for pizza or a standard portion for other items
        const sizeControl = product.category === "pizza" ? `
            <label class="form-label small" for="size-${product.id}">Size</label>
            <select class="form-select form-select-sm mb-3" id="size-${product.id}">
                ${sizes.map((size, index) => `<option value="${index}" ${index === 1 ? "selected" : ""}>${size} cm</option>`).join("")}
            </select>` : '<p class="small text-secondary">Standard portion</p>';
        // Create a product card with its image, price and button
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
    // Display the number of matching products
    document.getElementById("menuCount").textContent = matches.length ? `${matches.length} items found` : "No dishes found. Try another name or category.";
}

// Set up menu search, category filters and add-to-cart buttons
function setupMenu() {
    const list = document.getElementById("productList");
    if (!list) return;
    document.getElementById("searchInput").addEventListener("input", renderMenu);
    document.getElementById("categoryFilter").addEventListener("change", renderMenu);
    // Update the price when the selected pizza size changes
    list.addEventListener("change", event => {
        const card = event.target.closest("article");
        card.querySelector(".price").textContent = money(getProduct(card.dataset.id).prices[event.target.value]);
        card.querySelector(".add-button").textContent = "Add to cart";
    });
    // Handle adding products to the cart
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

// Display cart items, quantities and updated totals
function renderCart() {
    const body = document.getElementById("cartBody");
    body.replaceChildren();
    // Create a table row for each product in the cart
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
    // Show the empty cart message or the cart table
    document.getElementById("emptyCart").hidden = cart.length > 0;
    document.getElementById("cartTable").hidden = cart.length === 0;
    // Update the displayed order totals
    const totals = calculateTotals();
    for (const name of ["subtotal", "discount", "delivery", "total"]) {
        document.getElementById(name).textContent = money(totals[name]);
    }
}

// Check checkbox, required value, length, email and phone in order, show the first error
function validateField(field) {
    const value = field.value.trim();
    let message = "";
    if (field.type === "checkbox" && !field.checked) message = "Please confirm your order details.";
    else if (field.required && !value) message = "Please complete this field.";
    else if (field.minLength > 0 && value.length < field.minLength) message = `Enter at least ${field.minLength} characters.`;
    // Email needs text before @ and a domain with a dot, with no spaces
    else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Enter a valid email, such as name@example.com.";
    // Remove +, spaces, parentheses and hyphens, then require exactly 11 digits
    else if (field.type === "tel" && !/^\d{11}$/.test(value.replace(/[+()\s-]/g, ""))) message = "Enter 11 digits, for example +7 777 123 45 67.";
    // Update the field's error style and message
    field.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    document.getElementById(field.id + "Error").textContent = message;
    return !message;
}

// Validate all form fields and focus on the first error
function validateForm(form) {
    let valid = true;
    for (const field of form.querySelectorAll("input, select, textarea")) {
        if (!validateField(field)) valid = false;
    }
    if (!valid) form.querySelector(".is-invalid").focus();
    return valid;
}

// Enable custom validation and recheck fields while typing
function setupValidation(form) {
    form.noValidate = true;
    form.addEventListener("input", event => {
        if (event.target.classList.contains("is-invalid")) validateField(event.target);
    });
}

// Handle cart updates, promo codes and checkout
function setupCart() {
    const body = document.getElementById("cartBody");
    if (!body) return;
    const feedback = document.getElementById("cartFeedback");
    // Increase, decrease or remove cart items
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
    // Restore the saved promo code
    const promoInput = document.getElementById("promoInput");
    if (promo) promoInput.value = "PIZZA10";
    // Apply or remove the PIZZA10 discount
    document.getElementById("promoForm").addEventListener("submit", event => {
        event.preventDefault();
        const code = promoInput.value.trim().toUpperCase();
        promo = code === "PIZZA10";
        localStorage.setItem(promoKey, JSON.stringify(promo));
        document.getElementById("promoMessage").textContent = promo ? "PIZZA10 applied: 10% off food and drinks." : code ? "Unknown code. No discount applied; try PIZZA10." : "Promo code removed.";
        renderCart();
    });
    // Set up the checkout form and validate the order
    const form = document.getElementById("checkoutForm");
    setupValidation(form);
    form.addEventListener("submit", event => {
        event.preventDefault();
        const valid = validateForm(form);
        feedback.textContent = cart.length ? "" : "Your cart is empty. Add a dish from the menu first.";
        if (!valid || !cart.length) return;
        // Create a new order with its ID, time and delivery details
        const order = {
            id: "PG" + Date.now(),
            createdAt: Date.now(),
            total: calculateTotals().total,
            items: cart,
            name: document.getElementById("customerName").value.trim(),
            address: document.getElementById("customerAddress").value.trim()
        };
        // Save the order and reset the cart after checkout
        localStorage.setItem(orderKey, JSON.stringify(order));
        cart = [];
        promo = false;
        localStorage.removeItem(promoKey);
        saveCart();
        renderCart();
        form.reset();
        promoInput.value = "";
        document.getElementById("promoMessage").textContent = "";
        // Show the order confirmation and tracking link
        const confirmation = document.getElementById("orderSuccess");
        confirmation.hidden = false;
        document.getElementById("orderNumber").textContent = order.id;
        document.getElementById("trackLink").href = "tracking.html?order=" + order.id;
        confirmation.focus();
    });
    renderCart();
}

// Display order details and update its delivery status
function showOrder(order) {
    const result = document.getElementById("trackResult");
    result.hidden = false;
    document.getElementById("trackId").textContent = order.id;
    document.getElementById("trackDetails").textContent = `${order.address} · Total: ${money(order.total)}`;
    // Calculate the current delivery stage based on elapsed time
    const update = () => {
        // Move to the next stage every 10 seconds, keeping the index between 0 and 3
        const stage = Math.min(3, Math.max(0, Math.floor((Date.now() - order.createdAt) / 10000)));
        document.getElementById("trackStatus").textContent = stages[stage];
        // Highlight completed stages and the current status
        document.querySelectorAll("#trackStages li").forEach((item, index) => {
            item.classList.toggle("fw-bold", index === stage);
            item.classList.toggle("text-success", index <= stage);
            item.setAttribute("aria-current", index === stage ? "step" : "false");
        });
        if (stage === 3) clearInterval(trackingTimer);
    };
    // Check the delivery status every second
    trackingTimer = setInterval(update, 1000);
    update();
}

// Set up order search and tracking by order number
function setupTracking() {
    const form = document.getElementById("trackForm");
    if (!form) return;
    const input = document.getElementById("orderInput");
    // Find a saved order using its order number
    const lookup = () => {
        clearInterval(trackingTimer);
        document.getElementById("trackResult").hidden = true;
        const id = input.value.trim().toUpperCase();
        let order = readStorage(orderKey, null);
        // Load or create a sample order for demonstration
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
    // Automatically track an order from the URL
    const requested = new URLSearchParams(location.search).get("order");
    if (requested) {
        input.value = requested;
        lookup();
    }
    // Stop the tracking timer when leaving the page
    window.addEventListener("pagehide", () => clearInterval(trackingTimer));
}

// Validate the contact form and show a demo confirmation
function setupContact() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    setupValidation(form);
    // Clear the success message when the user edits the form
    form.addEventListener("input", () => { document.getElementById("contactSuccess").textContent = ""; });
    // Check the message without sending it to a server
    form.addEventListener("submit", event => {
        event.preventDefault();
        document.getElementById("contactSuccess").textContent = validateForm(form) ? "Your message passed validation. This student demo does not send messages." : "";
    });
}

// Set up FAQ animations and topic hints using jQuery
function setupJQuery() {
    // Turn off jQuery animations when the user prefers reduced motion
    $.fx.off = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Expand or collapse FAQ answers when clicked
    $(".faq-question").on("click", function () {
        const expanded = $(this).attr("aria-expanded") === "true";
        $(this).attr("aria-expanded", String(!expanded));
        $(this).closest(".faq-item").find(".faq-answer").stop(true, true).slideToggle(150);
    });
    // Show a helpful hint for the selected contact topic
    $("#contactTopic").on("change", function () {
        const message = $(this).find("option:selected").data("help") || "";
        $("#topicHelp").stop(true, true).hide().text(message).fadeIn(150);
    });
}

// Initialize all page features after the HTML has loaded
document.addEventListener("DOMContentLoaded", () => {
    saveCart();
    setupMenu();
    setupCart();
    setupTracking();
    setupContact();
    setupJQuery();
});

// Reload pages restored from the browser cache to refresh the cart and tracking
window.addEventListener("pageshow", event => {
    if (event.persisted) location.reload();
});
