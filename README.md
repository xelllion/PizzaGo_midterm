# PizzaGo — final project

**Group:** Aruzhan Amerkhanova, Arai Uakyt, Sulukhan Aizharykova · SE-2529

PizzaGo is a student pizza delivery website for Astana. The final version keeps the original six pages and all 14 dishes, then adds a small Node.js reviews API, an advanced review form, a `Product` class, favorites, combined menu filtering and live recipe inspiration from TheMealDB.

The project uses plain HTML, CSS, JavaScript and Node.js. It has no framework, database, build step or npm dependencies. Orders, messages and payments remain demonstrations only.

## Quick start

Install Node.js 18 or newer, open the project folder in JetBrains or VS Code, and run:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). The same command starts both the website and the reviews REST API.

- VS Code: open **Run and Debug** and choose **Run PizzaGo**.
- JetBrains: open the shared **Run PizzaGo** configuration in the Run menu.
- Stop the server with `Ctrl+C`.

There is no need to run `npm install` because the server and tests use only built-in Node.js modules.

### Why double-click and Live Server are not enough

Opening an HTML file directly or using Live Server serves only browser files. It cannot execute `server.js`, handle `/api/reviews`, or write reviews to `data/reviews.json`. GitHub Pages therefore uses a specific browser `localStorage` mode. Use `npm start` and `http://localhost:3000` to demonstrate the required Node.js REST API.

## Links

- Repository: [github.com/xelllion/PizzaGo_midterm](https://github.com/xelllion/PizzaGo_midterm)
- Static GitHub Pages preview: [xelllion.github.io/PizzaGo_midterm](https://xelllion.github.io/PizzaGo_midterm/)

GitHub Pages cannot run Node.js or save a server JSON file. On Pages, review Create/Read/Update/Delete remains functional through a clearly labelled `localStorage` fallback. With `npm start`, the same interface uses the required Node.js API and `data/reviews.json`.

## Pages and retained features

| Page | Features |
| --- | --- |
| Home | PizzaGo introduction, ordering steps and PIZZA10 offer |
| Menu | 14 dishes, three pizza sizes, favorites, cart buttons, search, category, maximum price, sorting, TheMealDB recipes and reviews |
| Deals | Promo and delivery rules |
| Cart | Quantity controls, removal, PIZZA10, totals and validated demo checkout |
| Track order | Saved checkout order or PG1024 with four timed stages |
| Contact | Story, details, opening hours, validated form, jQuery topic hints and FAQ |

The cart, favorites and demo order use `localStorage`, so they survive a page refresh in the same browser. Review records use the server JSON file under `npm start`; GitHub Pages stores its separate review list in the current browser.

## Final-project features

### 1. Full CRUD through a REST API

Customer reviews support all four operations in the interface:

- **Create:** `POST /api/reviews`
- **Read:** `GET /api/reviews`
- **Update:** `PATCH /api/reviews/:id`
- **Delete:** `DELETE /api/reviews/:id`

The browser keeps a random client ID in `localStorage`. The server stores that owner ID with a review and shows Edit/Delete only in the browser that created it. This is a simple student-project ownership mechanism, not user authentication.

On GitHub Pages, the same CRUD buttons use a local review array saved with `JSON.stringify()` in `localStorage`. The page shows which storage mode is active, so the fallback does not pretend to be the server API.

### 2. Object-oriented products

Every menu item is an instance of the `Product` class. Its constructor stores the product data, the `displayPrice` getter selects the standard menu price, and `matchesFilters()` checks search, category and maximum price. This is the required OOP example without adding a framework or unnecessary inheritance.

### 3. Favorites

The heart button adds or removes a dish from favorites. Favorite product IDs are saved in `localStorage`, and **Show favorites only** works together with search, category, maximum price and sorting.

### 4. Advanced form

The same review form creates and edits records. It has custom client and server validation for name, dish, rating and review text. Choosing a pizza reveals a required 25/30/35 cm field; choosing a snack, drink or dessert hides it. The review textarea has a live 300-character counter.

### Additional data work

Menu search, category, maximum price and sorting operate together on the real 14-item PizzaGo array. Prices use the displayed default 30 cm pizza price and the standard price for other products. Sorting supports low-to-high price, high-to-low price and alphabetical order.

### TheMealDB API

The Pizza Inspiration section calls the official HTTPS endpoint with `fetch()`:

```text
https://www.themealdb.com/api/json/v1/1/search.php?s=pizza
```

It displays live recipe names, images and source links. Loading, empty, failure and retry states are handled. External recipes never replace PizzaGo products and cannot be added to the cart. The educational API uses TheMealDB's documented free test key `1`.

## Reviews API reference

All write requests require this header:

```text
X-Client-Id: browser-generated-id
```

### Review body

```json
{
    "name": "Arai",
    "dishId": "pepperoni",
    "size": 30,
    "rating": 5,
    "text": "Fresh pizza and a very clear ordering flow."
}
```

`size` must be 25, 30 or 35 for pizza and is stored as `null` for other categories.

| Method and path | Success | Main errors |
| --- | --- | --- |
| `GET /api/reviews` | `200` with `{ reviews: [] }` | `500` if storage JSON is damaged |
| `POST /api/reviews` | `201` with the created review | `400` validation or missing client ID |
| `PATCH /api/reviews/:id` | `200` with the updated review | `400`, `403`, `404` |
| `DELETE /api/reviews/:id` | `204` with no body | `400`, `403`, `404` |

The public response never exposes stored owner IDs. Each review includes `canEdit: true` only for its owner browser. All fields are validated again on the server. The server reads the JSON array, changes it and saves it back with `fs.writeFile()`.

## What the JavaScript terms mean here

- `JSON.stringify(value)` converts the cart, promo state and request body into JSON text.
- `JSON.parse(text)` converts stored JSON text back into a JavaScript value.
- `localStorage` keeps the cart, promo, favorites, demo order, review browser ID and Pages review fallback on one device.
- AJAX means sending an HTTP request without reloading the page. This project uses the modern `fetch()` API instead of `$.ajax()`.
- `GET` reads reviews.
- `POST` creates a review.
- `PATCH` updates selected data in an existing review.
- `DELETE` removes a review.

## Validation and data rules

- Review name: 2–50 trimmed characters.
- Dish: one of the 14 PizzaGo product IDs.
- Pizza size: 25, 30 or 35 cm; hidden and stored as `null` for other dishes.
- Rating: integer from 1 to 5.
- Review text: 10–300 trimmed characters.
- PIZZA10: 10% off the goods subtotal, rounded to whole tenge.
- Delivery: 690 ₸ below 6,000 ₸ after discount; otherwise free.
- Checkout: name of at least 2 characters, 11 phone digits, address of at least 5 characters, confirmation and a nonempty cart.
- Contact: name, valid email, topic and a message of at least 10 characters.

## Tests

Run every automated test, including the live TheMealDB request:

```bash
npm test
```

Run only the local project tests without an internet request:

```bash
npm run test:local
```

Run only the external API check:

```bash
npm run test:external
```

The default suite checks the `Product` class, combined search/filter/sorting/favorites, advanced-form validation, safe `localStorage` parsing, Pages review CRUD, all page links and duplicate IDs, all 14 products, static-file serving, server validation, ownership, API GET/POST/PATCH/DELETE, persistence after a server restart and a real HTTPS response from TheMealDB. `npm test` therefore needs internet access.

## Manual defence walkthrough

1. Run `npm start` and open all six navigation links.
2. On Menu, search `e`, choose Pizza, enter maximum price `3500`, then sort price high-to-low. The result is Pepperoni, Garden Veggie and Margherita.
3. Favorite Pepperoni and Cola, refresh, then enable **Show favorites only** to demonstrate OOP data plus `localStorage` persistence.
4. Change Pepperoni between 25/30/35 cm and add two different sizes to the cart.
5. Apply PIZZA10, change quantities, refresh and confirm the same totals remain.
6. Submit empty checkout and contact forms, then correct the highlighted fields.
7. Place a demo order and open its tracking link. PG1024 also works without checkout.
8. Wait for Pizza Inspiration to show three live recipes, then explain its loading, retry and empty handling.
9. Under `npm start`, create, edit, refresh and delete a server review. The page label must say **Server mode**.
10. Open GitHub Pages and repeat review CRUD. The label must say **Browser mode**, and the review must survive refresh through `localStorage`.

## Project structure

```text
PizzaGo_midterm/
├── data/reviews.json
├── images/
├── tests/
├── index.html
├── menu.html
├── deals.html
├── cart.html
├── tracking.html
├── contact.html
├── styles.css
├── script.js
├── server.js
├── package.json
└── README.md
```

## Image credits

Unmodified Twemoji graphics by Twitter, Inc. and other contributors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Sources: [pizza](https://github.com/twitter/twemoji/blob/master/assets/svg/1f355.svg), [bread](https://github.com/twitter/twemoji/blob/master/assets/svg/1f956.svg), [chicken](https://github.com/twitter/twemoji/blob/master/assets/svg/1f357.svg), [drink](https://github.com/twitter/twemoji/blob/master/assets/svg/1f964.svg), [cake](https://github.com/twitter/twemoji/blob/master/assets/svg/1f370.svg) and [chocolate](https://github.com/twitter/twemoji/blob/master/assets/svg/1f36b.svg).
