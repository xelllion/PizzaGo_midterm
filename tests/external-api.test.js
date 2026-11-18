const test = require("node:test");
const assert = require("node:assert/strict");

test("TheMealDB returns live pizza recipe data over HTTPS", async () => {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=pizza", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000)
    });
    assert.equal(response.ok, true);
    const data = await response.json();
    assert.equal(Array.isArray(data.meals), true);
    assert.equal(data.meals.length > 0, true);
    assert.equal(typeof data.meals[0].strMeal, "string");
    assert.match(data.meals[0].strMealThumb, /^https:\/\//);
});
