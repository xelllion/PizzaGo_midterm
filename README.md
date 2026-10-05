# PizzaGo — Midterm Project (Pizza Delivery)

**Group:** Aruzhan Amerkhanova, Arai Uakyt, Sulukhan Aizharykova | SE-2529
**Live site:** https://xelllion.github.io/PizzaGo_midterm/

## Topic
PizzaGo is a responsive multi-page website for a pizza delivery service in Astana. The idea comes from **WEB Assignment 1, Task 5** (sitemap + wireframes) and was developed into a full site. The goal: a visitor understands the navigation in seconds, finds a pizza, pays and tracks the order without calling anyone.

## Pages (6)
| Page | File | What it does |
|---|---|---|
| Home | `index.html` | Hero with a whole pizza; **on hover a slice slides out** with cheese strings. Categories, most-ordered pizzas, countdown deal, 3-step "how it works", reviews |
| Menu | `menu.html` | 8 pizzas (3 sizes, price updates), snacks, drinks, desserts, sticky category bar with scroll-spy, filters |
| Deals | `deals.html` | Promo codes (copy button), **combo comparison table**, perks |
| Cart & Checkout | `cart.html` | **Cart table**, quantity controls, free-delivery progress bar, promo code, upsell, **checkout form** with validation |
| Track order | `tracking.html` | Order lookup, live status timeline, moving courier. Demo number: `PG1024` |
| About & contact | `contact.html` | Story, contacts, **opening hours table**, **contact form**, FAQ accordion |

## Requirements checklist
- **Semantic HTML5:** `header`, `nav`, `main`, `section`, `article`, `aside`, `address`, `footer`, `figure`-less cards with `article`, `caption`, `th scope`, `fieldset/legend`, labels for every input.
- **Tables:** deals combos, cart, opening hours. **Forms:** checkout, contact, order lookup, promo.
- **CSS:** custom properties (design tokens), classes and IDs, consistent spacing/typography.
- **Flexbox:** body (sticky footer), header actions, hero buttons, dish buying row, quantity control.
- **Grid:** hero layout, dish grid (`auto-fill, minmax`), category tiles, review/step/coupon grids, cart layout, footer.
- **Positioning:** `sticky` header, menu bar and summary panel; `fixed` mobile cart bar; `absolute` badges, cart counter and hero sticker; `relative` containers.
- **Responsive:** media queries at **991.98px (tablet)** and **575.98px (mobile)**; Bootstrap grid (`row`, `col-*`), navbar collapse, utilities (`d-flex`, `gap-*`, `mb-*`, `text-center`, `visually-hidden`), forms, accordion, toast.
- **JavaScript (vanilla):** cart in `localStorage` shared across pages, promo codes (`PIZZA10`, `WELCOME15`, `COMBO20`), checkout → tracking, countdown, filters, hero slice toggle for touch devices.

## Design decisions
- **Food-first visuals:** all pizzas, drinks and desserts are original SVG illustrations (crust blisters, melted cheese, glossy toppings), stored in `images`.
- **Warm palette:** oven brown, tomato red, cheese yellow, basil green, flour-white paper. Fonts: Fraunces (headings) + Figtree (text) from Google Fonts, with system fallbacks.
- **Marketing hooks:** 30-minute guarantee, social proof (ratings), "most ordered today", countdown deal, promo codes, free-delivery progress bar, combo savings, upsell in cart.
- **Accessibility:** visible focus, keyboard-operable hero (Enter/Space), `prefers-reduced-motion` respected, alt text and labels.

## Structure
```
PizzaGo_midterm/
├── index.html  menu.html  deals.html  cart.html  tracking.html  contact.html
├── styles.css
├── script.js
├── images/      (SVG pizzas, sides, drinks, desserts, logo)
├── vendor/      (Bootstrap 5.1.1 CSS + JS, local copies)
└── README.md
```

## Run locally
Open `index.html` in a browser. Bootstrap, CSS, JS and images are local; only the Google Fonts need internet (fallback fonts are used offline).

## Publish
**GitHub Pages:** push the folder to a repository → Settings → Pages → Branch `main` / root.
**Netlify:** drag the project folder to app.netlify.com/drop.
