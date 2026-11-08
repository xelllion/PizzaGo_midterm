# PizzaGo — endterm project

**Group:** Aruzhan Amerkhanova, Arai Uakyt, Sulukhan Aizharykova · SE-2529

PizzaGo is a student pizza delivery website for Astana. It continues the original midterm topic and six pages, with a simpler warm design and JavaScript/jQuery interactions. It does not send real orders or messages, take payments, or track real couriers.

## Run and publish

Serve this folder with an IDE static preview such as Live Server, then open `index.html` through its `http://localhost` address. Alternatively, if Python is installed, run `python -m http.server 8000` from this folder and open `http://localhost:8000`. Use HTTP instead of opening files directly so all pages share the same browser storage.

No build, npm install, application server or database is needed. Internet access is required for Bootstrap 5.3.8 from jsDelivr and full jQuery 3.7.1 from code.jquery.com. Images are local. The CDN tags pin versions and include integrity hashes.

**GitHub Pages:** [PizzaGo](https://xelllion.github.io/PizzaGo_midterm/). Pages publishes `main` from the repository root. Changes in `codex/pizzago-simplify-endterm` appear there after the PR is merged and the Pages deployment succeeds.

## Pages and features

| Page | Purpose |
| --- | --- |
| Home | PizzaGo introduction, ordering steps and offer |
| Menu | 14 dishes rendered from an array; combined name search/category filter; three pizza sizes; add to cart |
| Deals | PIZZA10 and delivery terms |
| Cart | Quantities, removal, discount, total and validated demo checkout |
| Track order | Last saved order or PG1024; four stages over one minute |
| Contact | Story, contact details, hours, validated message form, jQuery topic hints and FAQ |

The folder contains six HTML files, one `styles.css`, one `script.js`, six SVG images and this README. Navigation stays in each HTML page so the pages remain easy to read and explain. The first new commit is the static midterm baseline; the next adds JavaScript; the third adds jQuery and this guide.

## Requirements map

| Requirement | Where to demonstrate it |
| --- | --- |
| Six connected pages and semantic HTML | Shared navigation; `header`, `nav`, `main`, `section`, `article`, `footer`, `address` |
| Headings, lists, links, images, div/span | Home steps, menu cards and shared layout |
| Tables and forms | Deals terms, cart, opening hours, checkout and contact forms |
| CSS classes and IDs | `.hero`, `.offer`, `.footer-content`, `#heroTitle` |
| Flexbox, Grid, positioning | Body/footer flex; hero/steps grid; relative `.offer` |
| Responsive CSS and Bootstrap | Media queries at 991.98 and 575.98 px; Bootstrap rows/columns, navbar, buttons, forms and utilities |
| Two or more arrays | `products`, `sizes`, `stages`, `cart` |
| Two loop examples | `forEach` in menu/cart rendering; `for...of` in totals and form validation |
| Reusable functions with parameters/returns | `money`, `getProduct`, `addToCart`, `validateField`, `calculateTotals` |
| Dynamic DOM content and removal | Menu/card creation, cart rows, `append`, `replaceChildren`, `remove` |
| Five useful interface features | Search, category filtering, cart, order tracking and FAQ; also sizes and promo |
| Native events and event object | `addEventListener` for click/input/change/submit; `preventDefault` in forms |
| Custom form validation | `validateField` and `validateForm`; field errors, `aria-invalid`, focus and success feedback |
| jQuery selectors and traversal | `.faq-question`, `#contactTopic`, `closest`, `find` in `setupJQuery` |
| jQuery events and effects | FAQ click/`slideToggle`; topic change/`fadeIn`; reduced-motion preference respected |

Comments are intentionally omitted from the source at the project owner's request. This differs from the assignment's request for comments on non-obvious logic; explanations are here instead. Deployment and the individual defence remain separate assessment requirements.

## Rules and storage

- The original 14 dishes and prices are retained. Pizza sizes are 25/30/35 cm; other dishes have one price.
- Search ignores letter case and surrounding spaces. Search and category apply together. Changing either rebuilds the cards and resets their size selection to 30 cm.
- Cart entries store a product ID, size index and quantity. Adding the same size increases quantity; another size creates another entry. Decreasing one item to zero removes it.
- PIZZA10 takes 10% off the goods subtotal, rounded to whole tenge. Delivery is 690 ₸ below 6,000 ₸ after discount, otherwise free. An empty cart totals zero. Applying an empty/invalid code removes the discount.
- Checkout requires a trimmed name of at least 2 characters, 11 phone digits after removing spaces and common separators, an address of at least 5 characters, confirmation and a nonempty cart.
- Contact requires a name of at least 2 characters, an email with a domain, a selected topic and a trimmed message of at least 10 characters.
- Only the current browser's cart and last demo order are kept. Keys start with `pizzagoEndterm`; old midterm keys are not read or migrated. No personal information is transmitted.
- Tracking uses elapsed time from `createdAt`: accepted at 0 seconds, baking at 20, on the way at 40 and delivered at 60. Reloading or repeating a lookup does not restart it. Timers stop on completion, another lookup or leaving the page.
- PG1024 creates its own persistent demo on first lookup. To restart it, remove only `pizzagoEndtermDemo` in browser DevTools → Application → Local Storage. Remove the other `pizzagoEndterm` keys there to reset all demo data.

## Test and defence walkthrough

1. Open all six pages at phone, tablet and desktop widths. Check the collapsed navigation, tables, form labels and images.
2. On Menu, search `pepperoni`, select Drinks to see no results, then clear the search to see two drinks. Switch back to All.
3. Change Pepperoni between 25/30/35 cm: prices are 2,790/3,490/4,390 ₸. Add 30 cm twice and 25 cm once; the basket has two rows and a subtotal of 9,770 ₸.
4. Decrease the 30 cm row to one: subtotal is 6,280 ₸. Apply PIZZA10: discount 628 ₸, delivery 690 ₸, total 6,342 ₸. Reload to check persistence. Try an invalid code and delete all items.
5. Submit an empty checkout and correct each field. An empty basket must still block the order. Add a dish, submit valid details and follow the confirmation link.
6. Watch tracking at 0/20/40/60 seconds, reload during baking, and try an unknown number. PG1024 is available without checkout.
7. Submit an empty contact form, an invalid email and a short message. Correct them and show the demo success message. Change the topic to show a jQuery hint. Open/close FAQ answers with a mouse or Enter.

Browser checks passed in Chrome through Playwright: six pages at 375/768/1440 px, navigation, local links, images, overflow, duplicate IDs, cart and promo arithmetic, delivery boundaries, validation, persistence, tracking, keyboard FAQ and both jQuery effects. No normal-use console errors or failed resource requests were recorded. Test scripts and screenshots are kept outside the project.

For the defence, each group member should be able to explain the following; this list does not claim or assign individual contributions:

- How the HTML pages and Bootstrap grid preserve the midterm structure.
- How `filter` chooses products, `forEach` creates cards and `for...of` adds totals.
- Why the cart stores IDs/quantities and uses the product array for prices.
- How `event.target` identifies a clicked control and `preventDefault` keeps forms on the page.
- How validation returns true/false, updates field errors and blocks submission.
- Why user-entered order details are displayed with `textContent`.
- How jQuery selectors, traversal, events and effects work in `setupJQuery`.
- Why tracking is a local time-based demonstration, and why a page restored from browser history reloads to refresh its stored state.

## Image credits

Unmodified Twemoji graphics by Twitter, Inc. and other contributors, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The same pizza illustration is reused across pizza cards to keep assets small.

Sources: [pizza](https://github.com/twitter/twemoji/blob/master/assets/svg/1f355.svg), [bread](https://github.com/twitter/twemoji/blob/master/assets/svg/1f956.svg), [chicken](https://github.com/twitter/twemoji/blob/master/assets/svg/1f357.svg), [drink](https://github.com/twitter/twemoji/blob/master/assets/svg/1f964.svg), [cake](https://github.com/twitter/twemoji/blob/master/assets/svg/1f370.svg), [chocolate](https://github.com/twitter/twemoji/blob/master/assets/svg/1f36b.svg).
