import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on("pageerror", (err) => {
    console.error("[PAGE ERROR]:", err.message, err.stack);
  });

  console.log("Navigating directly to /admin/orders unauthenticated...");
  await page.goto("https://empress-delicacies.vercel.app/admin/orders", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  console.log("Current URL after /admin/orders load:", page.url());
  console.log("Page title:", await page.title());

  await browser.close();
}

run().catch((err) => {
  console.error("Test script failed:", err);
  process.exit(1);
});
