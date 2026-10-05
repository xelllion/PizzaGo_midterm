const PRODUCTS = {
    "pepperoni": {
        "name": "Pepperoni",
        "img": "images/pepperoni.svg",
        "prices": [
            2790,
            3490,
            4390
        ]
    },
    "margherita": {
        "name": "Margherita",
        "img": "images/margherita.svg",
        "prices": [
            2490,
            2990,
            3790
        ]
    },
    "bbq": {
        "name": "BBQ Chicken",
        "img": "images/bbq.svg",
        "prices": [
            3090,
            3790,
            4690
        ]
    },
    "cheese": {
        "name": "Four Cheese",
        "img": "images/cheese.svg",
        "prices": [
            3090,
            3590,
            4490
        ]
    },
    "veggie": {
        "name": "Garden Veggie",
        "img": "images/veggie.svg",
        "prices": [
            2790,
            3290,
            4190
        ]
    },
    "diavola": {
        "name": "Diavola",
        "img": "images/diavola.svg",
        "prices": [
            3190,
            3690,
            4590
        ]
    },
    "mushroom": {
        "name": "Truffle Mushroom",
        "img": "images/mushroom.svg",
        "prices": [
            3290,
            3890,
            4790
        ]
    },
    "meat": {
        "name": "Meat Feast",
        "img": "images/meat.svg",
        "prices": [
            3390,
            3990,
            4990
        ]
    },
    "garlic": {
        "name": "Garlic Knots",
        "img": "images/garlic.svg",
        "price": 1290
    },
    "wings": {
        "name": "Spicy Wings",
        "img": "images/wings.svg",
        "price": 1990
    },
    "cola": {
        "name": "Cola 0.5 L",
        "img": "images/cola.svg",
        "price": 590
    },
    "lemonade": {
        "name": "Mint Lemonade",
        "img": "images/lemonade.svg",
        "price": 890
    },
    "cheesecake": {
        "name": "Strawberry Cheesecake",
        "img": "images/cheesecake.svg",
        "price": 1390
    },
    "brownie": {
        "name": "Brownie & Ice Cream",
        "img": "images/brownie.svg",
        "price": 1490
    }
};

const SIZES = [25, 30, 35];
const DELIVERY_FEE = 690;
const FREE_DELIVERY_FROM = 6000;
const PROMOS = { PIZZA10: 0.1, WELCOME15: 0.15, COMBO20: 0.2 };
const CART_KEY = "pizzagoCart";
const PROMO_KEY = "pizzagoPromo";
const ORDER_KEY = "pizzagoLastOrder";


const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const money = value => `${Math.round(value).toLocaleString("ru-RU")} ₸`;
const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};


const getCart = () => read(CART_KEY, []);

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadges();
}

function addToCart(id, sizeIndex = 1) {
    const product = PRODUCTS[id];
    if (!product) return;
    const hasSizes = Array.isArray(product.prices);
    const price = hasSizes ? product.prices[sizeIndex] : product.price;
    const size = hasSizes ? `${SIZES[sizeIndex]} cm` : "";
    const key = `${id}-${size}`;
    const cart = getCart();
    const found = cart.find(item => item.key === key);
    if (found) {
        found.qty += 1;
    } else {
        cart.push({ key, id, name: product.name, size, price, img: product.img, qty: 1 });
    }
    saveCart(cart);
    showToast(`${product.name}${size ? ` (${size})` : ""} added to your cart`);
}

const cartCount = () => getCart().reduce((sum, item) => sum + item.qty, 0);
const cartSubtotal = () => getCart().reduce((sum, item) => sum + item.price * item.qty, 0);

function totals() {
    const subtotal = cartSubtotal();
    const code = localStorage.getItem(PROMO_KEY);
    const discount = code && PROMOS[code] ? Math.round(subtotal * PROMOS[code]) : 0;
    const afterDiscount = subtotal - discount;
    const delivery = subtotal === 0 || afterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return { subtotal, discount, delivery, total: afterDiscount + delivery, code };
}

function updateCartBadges() {
    const count = cartCount();
    $$(".cart-count").forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-flex" : "none";
        badge.classList.remove("bump");
        void badge.offsetWidth;
        badge.classList.add("bump");
    });
    const barText = $("#mobileCartTotal");
    if (barText) barText.textContent = count ? money(totals().total) : "Empty";
}

function showToast(message) {
    const element = $("#cartToast");
    if (!element || typeof bootstrap === "undefined") return;
    $(".toast-body", element).textContent = message;
    bootstrap.Toast.getOrCreateInstance(element, { delay: 2400 }).show();
}


function setupDishCards() {
    $$(".dish[data-id]").forEach(card => {
        const priceEl = $(".js-price", card);
        const radios = $$("input[type=radio]", card);
        radios.forEach((radio, index) => {
            radio.addEventListener("change", () => {
                priceEl.textContent = money(PRODUCTS[card.dataset.id].prices[index]);
            });
        });
        const button = $(".js-add", card);
        button.addEventListener("click", () => {
            const checked = radios.findIndex(radio => radio.checked);
            addToCart(card.dataset.id, checked === -1 ? 1 : checked);
            button.classList.add("is-added");
            button.firstElementChild.nextSibling.textContent = " Added";
            setTimeout(() => {
                button.classList.remove("is-added");
                button.firstElementChild.nextSibling.textContent = " Add";
            }, 1400);
        });
    });
}

function setupFilters() {
    const chips = $$("[data-filter]");
    chips.forEach(chip => chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const filter = chip.dataset.filter;
        $$("#pizza .dish").forEach(card => {
            const tags = card.dataset.tags.split(" ");
            card.classList.toggle("hidden-card", filter !== "all" && !tags.includes(filter));
        });
    }));
}

function setupScrollSpy() {
    const links = $$(".menu-nav a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const sections = links.map(link => $(link.getAttribute("href")));
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
            const active = $(".menu-nav a.active");
            const nav = $(".menu-nav");

            if (active && nav) {
                nav.scrollTo({
                    left: active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2,
                    behavior: "smooth"
                });
            }
        });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(section => section && observer.observe(section));
}


function renderCart() {
    const body = $("#cartBody");
    if (!body) return;
    const cart = getCart();
    const hasItems = cart.length > 0;
    $("#cartTableWrap").classList.toggle("d-none", !hasItems);
    $("#emptyCart").classList.toggle("d-none", hasItems);
    body.innerHTML = cart.map(item => `
        <tr>
            <td>
                <div class="cart-product">
                    <img src="${item.img}" alt="${item.name}">
                    <div><strong>${item.name}</strong><br><small>${item.size || "Standard portion"}</small></div>
                </div>
            </td>
            <td>${money(item.price)}</td>
            <td>
                <div class="qty">
                    <button type="button" data-act="minus" data-key="${item.key}" aria-label="Decrease quantity">−</button>
                    <strong>${item.qty}</strong>
                    <button type="button" data-act="plus" data-key="${item.key}" aria-label="Increase quantity">+</button>
                </div>
            </td>
            <td><strong>${money(item.price * item.qty)}</strong></td>
            <td><button class="remove-btn" type="button" data-act="remove" data-key="${item.key}" aria-label="Remove ${item.name}">×</button></td>
        </tr>`).join("");
    renderSummary();
    renderUpsell();
}

function renderSummary() {
    const t = totals();
    const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
    set("#sumSubtotal", money(t.subtotal));
    set("#sumDelivery", t.delivery === 0 && t.subtotal > 0 ? "Free" : money(t.delivery));
    set("#sumTotal", money(t.total));
    const discountRow = $("#discountRow");
    if (discountRow) {
        discountRow.classList.toggle("d-none", t.discount === 0);
        set("#sumDiscount", `−${money(t.discount)}`);
        set("#promoName", t.code || "");
    }
    const bar = $("#freeBar");
    if (bar) {
        const after = t.subtotal - t.discount;
        const left = FREE_DELIVERY_FROM - after;
        $(".fill", bar).style.width = `${Math.min(100, (after / FREE_DELIVERY_FROM) * 100)}%`;
        $(".msg", bar).textContent = t.subtotal === 0
            ? `Free delivery from ${money(FREE_DELIVERY_FROM)}`
            : left > 0 ? `Add ${money(left)} more for free delivery` : "You've got free delivery 🎉";
    }
    updateCartBadges();
}

function renderUpsell() {
    const box = $("#upsellList");
    if (!box) return;
    const inCart = getCart().map(item => item.id);
    const picks = ["cola", "garlic", "brownie", "lemonade", "wings"].filter(id => !inCart.includes(id)).slice(0, 3);
    box.innerHTML = picks.map(id => `
        <div class="upsell">
            <img src="${PRODUCTS[id].img}" alt="${PRODUCTS[id].name}">
            <strong>${PRODUCTS[id].name}</strong>
            <span>${money(PRODUCTS[id].price)}</span>
            <button class="btn-pizza btn-sm-pizza" type="button" data-upsell="${id}">+ Add</button>
        </div>`).join("");
}

function setupCartPage() {
    const body = $("#cartBody");
    if (!body) return;
    document.addEventListener("click", event => {
        const target = event.target.closest("[data-act], [data-upsell]");
        if (!target) return;
        if (target.dataset.upsell) {
            addToCart(target.dataset.upsell);
            renderCart();
            return;
        }
        let cart = getCart();
        const item = cart.find(entry => entry.key === target.dataset.key);
        if (!item) return;
        if (target.dataset.act === "plus") item.qty += 1;
        if (target.dataset.act === "minus") item.qty -= 1;
        if (target.dataset.act === "remove") item.qty = 0;
        cart = cart.filter(entry => entry.qty > 0);
        saveCart(cart);
        renderCart();
    });

    const promoForm = $("#promoForm");
    promoForm.addEventListener("submit", event => {
        event.preventDefault();
        const code = $("#promoInput").value.trim().toUpperCase();
        const msg = $("#promoMsg");
        if (PROMOS[code]) {
            localStorage.setItem(PROMO_KEY, code);
            msg.textContent = `Code ${code} applied: −${PROMOS[code] * 100}%`;
            msg.className = "small fw-bold text-success";
        } else {
            localStorage.removeItem(PROMO_KEY);
            msg.textContent = "This code doesn't exist. Try PIZZA10.";
            msg.className = "small fw-bold text-danger";
        }
        renderSummary();
    });
    const saved = localStorage.getItem(PROMO_KEY);
    if (saved) $("#promoInput").value = saved;

    const form = $("#checkoutForm");
    form.addEventListener("submit", event => {
        event.preventDefault();
        if (!getCart().length) {
            showToast("Your cart is empty — add a pizza first.");
            return;
        }
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }
        const t = totals();
        const order = {
            id: `PG${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: Date.now(),
            total: t.total,
            name: $("#custName").value.trim(),
            address: $("#custAddress").value.trim(),
            items: getCart()
        };
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(PROMO_KEY);
        window.location.href = `tracking.html?order=${order.id}`;
    });
    renderCart();
}


const STAGES = [
    { name: "Order accepted", text: "We got your order and started the oven.", at: 0 },
    { name: "Baking", text: "Fresh dough, your toppings, 280 °C.", at: 15 },
    { name: "On the way", text: "Your courier is heading to your door.", at: 45 },
    { name: "Delivered", text: "Enjoy your pizza while it's hot!", at: 100 }
];

function stageOf(createdAt) {
    const seconds = (Date.now() - createdAt) / 1000;
    let index = 0;
    STAGES.forEach((stage, i) => { if (seconds >= stage.at) index = i; });
    return { index, seconds };
}

let trackTimer = null;
function renderOrder(order) {
    $("#trackNotFound").classList.add("d-none");
    $("#trackResult").classList.remove("d-none");
    $("#trackId").textContent = order.id;
    $("#trackAddress").textContent = order.address || "Astana";
    $("#trackTotal").textContent = money(order.total || 0);
    $("#trackItems").innerHTML = (order.items || []).map(item =>
        `<li class="d-flex justify-content-between"><span>${item.qty} × ${item.name} ${item.size}</span><strong>${money(item.price * item.qty)}</strong></li>`).join("");

    const tick = () => {
        const { index, seconds } = stageOf(order.createdAt);
        $$("#timeline li").forEach((li, i) => {
            li.classList.toggle("done", i < index || index === STAGES.length - 1);
            li.classList.toggle("current", i === index && index !== STAGES.length - 1);
        });
        $("#trackStatus").textContent = STAGES[index].name;
        const left = Math.ceil(30 * (1 - seconds / STAGES[3].at));
        $("#trackEta").textContent = index === 3 ? "Delivered" : `${Math.max(3, left)} min`;
        const progress = Math.min(1, Math.max(0, (seconds - STAGES[2].at) / (STAGES[3].at - STAGES[2].at)));
        $("#rider").style.left = `${index < 2 ? 2 : 2 + progress * 96}%`;
        if (index === 3) clearInterval(trackTimer);
    };
    clearInterval(trackTimer);
    tick();
    trackTimer = setInterval(tick, 1000);
}

function setupTracking() {
    const form = $("#trackForm");
    if (!form) return;
    const saved = read(ORDER_KEY, null);
    const param = new URLSearchParams(location.search).get("order");
    if (saved && (!param || param.toUpperCase() === saved.id)) {
        $("#orderInput").value = saved.id;
        renderOrder(saved);
    }
    form.addEventListener("submit", event => {
        event.preventDefault();
        const id = $("#orderInput").value.trim().toUpperCase();
        const current = read(ORDER_KEY, null);
        if (current && current.id === id) return renderOrder(current);
        if (id === "PG1024") {
            return renderOrder({
                id, createdAt: Date.now() - 55000, total: 7170, address: "Astana, Mangilik El 10",
                items: [{ qty: 1, name: "Pepperoni", size: "30 cm", price: 3490 }, { qty: 1, name: "Four Cheese", size: "30 cm", price: 3590 }]
            });
        }
        $("#trackResult").classList.add("d-none");
        $("#trackNotFound").classList.remove("d-none");
    });
}


function setupHero() {
    const art = $("#heroArt");
    if (!art) return;
    art.addEventListener("click", () => art.classList.toggle("is-open"));
    art.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); art.classList.toggle("is-open"); }
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setTimeout(() => {
        if (art.matches(":hover")) return;
        art.classList.add("is-open");
        setTimeout(() => art.classList.remove("is-open"), 2400);
    }, 1300);
}


function setupCountdown() {
    const box = $("#countdown");
    if (!box) return;
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    const pad = n => String(n).padStart(2, "0");
    const update = () => {
        const diff = Math.max(0, end - new Date());
        $("[data-t=h]", box).textContent = pad(Math.floor(diff / 3600000));
        $("[data-t=m]", box).textContent = pad(Math.floor(diff / 60000) % 60);
        $("[data-t=s]", box).textContent = pad(Math.floor(diff / 1000) % 60);
    };
    update();
    setInterval(update, 1000);
}

function setupCopyButtons() {
    $$("[data-copy]").forEach(button => button.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(button.dataset.copy); } catch {}
        localStorage.setItem(PROMO_KEY, button.dataset.copy);
        showToast(`Code ${button.dataset.copy} copied and saved for checkout`);
        updateCartBadges();
    }));
    $$("[data-combo]").forEach(button => button.addEventListener("click", () => {
        button.dataset.combo.split(",").forEach(id => addToCart(id.trim(), 1));
    }));
    $$("[data-quick]").forEach(button => button.addEventListener("click", () => {
        addToCart(button.dataset.quick, 1);
        button.classList.add("is-added");
        setTimeout(() => button.classList.remove("is-added"), 1200);
    }));
}


function setupContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    form.addEventListener("submit", event => {
        event.preventDefault();
        if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
        $("#contactSuccess").classList.remove("d-none");
        form.reset();
        form.classList.remove("was-validated");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartBadges();
    setupDishCards();
    setupFilters();
    setupScrollSpy();
    setupCartPage();
    setupTracking();
    setupHero();
    setupCountdown();
    setupCopyButtons();
    setupContactForm();
});
