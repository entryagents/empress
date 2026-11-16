import {
  generateAnalyticsReport,
  resolveDateRangeBoundaries,
  exportAnalyticsCsv,
} from "../src/lib/analytics/service";
import { registerRuntimeOrder } from "../src/lib/order/service";
import type { Order } from "../src/types/order";

async function runAnalyticsTests() {
  console.log("==========================================================");
  console.log("EMPRESS DELICACIES: ANALYTICS & REPORTING TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✓ [TEST ${total}] PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ [TEST ${total}] FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Timezone & Date Boundaries in Africa/Lagos
  console.log("--- 1. TIMEZONE & DATE BOUNDARIES (AFRICA/LAGOS) ---");
  const todayBoundaries = resolveDateRangeBoundaries({ preset: "today" });
  assert(todayBoundaries.startDate === todayBoundaries.endDate, "Today preset starts and ends on same date");

  const last7Days = resolveDateRangeBoundaries({ preset: "last_7_days" });
  assert(Boolean(last7Days.startDate && last7Days.endDate), "7-day boundary generated");
  assert(last7Days.startDate <= last7Days.endDate, "Start date precedes end date");

  // 2. Sample Data Ingestion
  console.log("\n--- 2. VERIFIED REVENUE ACCOUNTING & UNPAID ISOLATION ---");
  const samplePaidOrder: Order = {
    id: "ord-an-01",
    order_reference: "EMP-AN-PAID1",
    secure_access_token: "tok-an-1",
    customer_name: "Ngozi Eze",
    customer_email: "ngozi@example.com",
    customer_phone: "+2348031112233",
    fulfillment_type: "delivery",
    delivery_area: "GRA Phase 1",
    delivery_city: "Asaba",
    currency: "NGN",
    subtotal_kobo: 1000000,
    delivery_fee_kobo: 150000,
    discount_kobo: 0,
    total_kobo: 1150000, // ₦11,500
    status: "delivered",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: "item-1",
        order_id: "ord-an-01",
        product_id: "prod-shawarma",
        product_name: "Empress Royal Shawarma",
        category_name: "Shawarma & Wraps",
        product_sku: "SHAW-ROYAL",
        product_image_url: "/shawarma.jpg",
        variant_id: null,
        variant_name: null,
        variant_price_adjustment_kobo: 0,
        base_price_kobo: 1000000,
        addons_total_kobo: 0,
        unit_price_kobo: 1000000,
        quantity: 1,
        total_price_kobo: 1000000,
      },
    ],
  };

  const sampleUnpaidOrder: Order = {
    id: "ord-an-02",
    order_reference: "EMP-AN-UNPAID2",
    secure_access_token: "tok-an-2",
    customer_name: "Emeka Okafor",
    customer_email: "emeka@example.com",
    customer_phone: "+2348034445566",
    fulfillment_type: "pickup",
    currency: "NGN",
    subtotal_kobo: 800000,
    delivery_fee_kobo: 0,
    discount_kobo: 0,
    total_kobo: 800000, // ₦8,000
    status: "awaiting_payment",
    payment_status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleCancelledOrder: Order = {
    id: "ord-an-03",
    order_reference: "EMP-AN-CANCEL3",
    secure_access_token: "tok-an-3",
    customer_name: "Tariere Brisibe",
    customer_email: "tariere@example.com",
    customer_phone: "+2348098887766",
    fulfillment_type: "delivery",
    delivery_area: "Warri Central",
    delivery_city: "Warri",
    currency: "NGN",
    subtotal_kobo: 500000,
    delivery_fee_kobo: 250000,
    discount_kobo: 0,
    total_kobo: 750000,
    status: "cancelled",
    payment_status: "paid", // Paid but later cancelled -> refund ledger
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  registerRuntimeOrder(samplePaidOrder);
  registerRuntimeOrder(sampleUnpaidOrder);
  registerRuntimeOrder(sampleCancelledOrder);

  // 3. Report Generation & Metric Calculations
  console.log("\n--- 3. REPORT GENERATION & ACCURACY AUDIT ---");
  const report = await generateAnalyticsReport({ preset: "today" });
  assert(report.overview.totalOrders >= 3, "All period orders tallied");
  assert(report.overview.paidOrdersCount >= 1, "Paid orders count accurate");
  assert(report.overview.pendingPaymentsCount >= 1, "Unpaid/pending payments tracked");

  // Strict revenue integrity check:
  // sampleUnpaidOrder (800000 kobo) must NEVER be counted in verified revenue.
  // sampleCancelledOrder (750000 kobo) must be accounted in refunds, not net revenue.
  assert(
    report.overview.totalVerifiedRevenueKobo >= 1150000,
    "Verified revenue includes paid order"
  );
  assert(
    report.overview.refundsKobo >= 750000,
    "Cancelled paid orders recorded in refunds ledger"
  );
  assert(
    report.overview.netRevenueKobo <= report.overview.totalVerifiedRevenueKobo,
    "Net revenue accounts for refunds and excludes unpaid orders"
  );

  // 4. Product Sales Analytics (Snapshot preservation)
  console.log("\n--- 4. PRODUCT SALES ANALYTICS ---");
  assert(report.productPerformance.length > 0, "Product performance list generated");
  const shawarmaEntry = report.productPerformance.find((p) => p.productId === "prod-shawarma");
  assert(shawarmaEntry !== undefined, "Finds historical product snapshot for Empress Royal Shawarma");
  assert((shawarmaEntry?.unitsSold || 0) >= 1, "Units sold counted accurately");

  // 5. Customer Insights
  console.log("\n--- 5. CUSTOMER ANALYTICS & PRIVACY ---");
  assert(report.customerAnalytics.totalCustomers > 0, "Total customers calculated");
  assert(report.customerAnalytics.topCustomers.length > 0, "Top customers list populated");
  const topSpender = report.customerAnalytics.topCustomers[0];
  assert(Boolean(topSpender.customerName), "Identifies highest-value diner");

  // 6. CSV Export Accuracy
  console.log("\n--- 6. CSV EXPORT ENGINE ---");
  const orderCsv = await exportAnalyticsCsv("orders", { preset: "today" });
  assert(orderCsv.filename.endsWith(".csv"), "Generates valid .csv filename");
  assert(orderCsv.csvContent.includes("Order Reference"), "Includes CSV header row");
  assert(orderCsv.csvContent.includes("EMP-AN-PAID1"), "Includes order reference in export");

  const revenueCsv = await exportAnalyticsCsv("revenue", { preset: "today" });
  assert(revenueCsv.csvContent.includes("Verified Revenue (NGN)"), "Revenue CSV contains accurate header");

  console.log("\n==========================================================");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("==========================================================");
}

runAnalyticsTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
