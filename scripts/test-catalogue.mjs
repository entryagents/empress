import assert from "node:assert";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductBySlug,
  getProductById,
  createCategory,
  archiveCategory,
  createProduct,
  updateProduct,
} from "../src/lib/catalogue/service.ts";
import { formatKobo, nairaToKobo, koboToNaira, calculateItemPrice } from "../src/types/catalogue.ts";

async function runTests() {
  console.log("▶ Running Catalogue & Monetary Unit Tests...");

  // 1. Monetary tests
  console.log("  Testing monetary conversions & formatting...");
  assert.strictEqual(nairaToKobo(4500), 450000, "4500 NGN must equal 450,000 kobo");
  assert.strictEqual(koboToNaira(450000), 4500, "450,000 kobo must equal 4,500 NGN");
  const formatted = formatKobo(450000);
  assert(formatted.includes("4,500") || formatted.includes("4500"), `Expected 4,500 in formatted string, got: ${formatted}`);

  // 2. Price calculation with variants and add-ons
  console.log("  Testing price calculation logic with variant & addons...");
  const baseKobo = 450000;
  const variant = {
    id: "v1",
    product_id: "p1",
    name: "Double",
    sku: null,
    price_adjustment_kobo: 150000,
    explicit_price_kobo: null,
    is_available: true,
    display_order: 1,
    created_at: "",
  };
  const addon1 = {
    id: "a1",
    addon_group_id: "g1",
    name: "Extra Cheese",
    description: null,
    price_kobo: 50000,
    is_available: true,
    display_order: 1,
    created_at: "",
  };
  const addon2 = {
    id: "a2",
    addon_group_id: "g1",
    name: "Extra Beef",
    description: null,
    price_kobo: 80000,
    is_available: true,
    display_order: 2,
    created_at: "",
  };

  const calcPrice = calculateItemPrice(baseKobo, variant, [addon1, addon2]);
  assert.strictEqual(calcPrice, 450000 + 150000 + 50000 + 80000, "Calculated price must match base + variant + sum(addons)");

  // 3. Category retrieval & lookup
  console.log("  Testing categories retrieval...");
  const cats = await getCategories(true);
  assert(cats.length >= 6, `Expected at least 6 categories, got ${cats.length}`);
  const catShawarma = await getCategoryBySlug("shawarma-wraps");
  assert(catShawarma !== null, "Category shawarma-wraps should exist");
  assert.strictEqual(catShawarma?.name, "Shawarma & Wraps");

  // 4. Product retrieval & lookup
  console.log("  Testing products retrieval & slug resolution...");
  const prods = await getProducts();
  assert(prods.length >= 10, `Expected at least 10 products, got ${prods.length}`);
  const shawarma = await getProductBySlug("shawarma");
  assert(shawarma !== null, "Product 'shawarma' must be resolvable");
  assert.strictEqual(shawarma?.name, "Classic Chicken Shawarma");
  assert.strictEqual(shawarma?.base_price_kobo, 450000);
  assert(shawarma?.images && shawarma.images.length > 0, "Product must have images attached");
  assert(shawarma?.variants && shawarma.variants.length > 0, "Product must have variants attached");

  // 5. Category deletion guard
  console.log("  Testing category deletion protection when items exist...");
  let archiveFailed = false;
  try {
    await archiveCategory("cat-shawarma-wraps");
  } catch (err) {
    archiveFailed = true;
  }
  assert(archiveFailed, "Category containing dishes must NOT be archived without handling dishes first");

  console.log("✔ All Catalogue & Monetary Unit Tests Passed Successfully!");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
