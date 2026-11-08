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

document.addEventListener("DOMContentLoaded", () => {
    saveCart();
    setupMenu();
});
