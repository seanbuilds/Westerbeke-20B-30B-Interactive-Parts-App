import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function genOg() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Hide UI overlays for clean hero shot or capture rich app card
  const ogPath = path.resolve(process.cwd(), "public/og.jpg");
  await page.screenshot({ path: ogPath, type: "jpeg", quality: 90 });
  console.log("Saved public/og.jpg");

  await browser.close();
}

genOg().catch(console.error);
