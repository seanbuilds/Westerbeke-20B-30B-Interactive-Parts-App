import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const artifactDir = "/Users/dad/.gemini/antigravity/brain/a3674c2b-b44e-4db7-a4de-0925c23472be";

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Switch to Front view
  await page.getByRole("button", { name: "Front", exact: true }).click();
  await page.waitForTimeout(500);

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // Zoom in on front timing belt
  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(600);

  const shotPath = path.join(artifactDir, "audit_03_front_timing_belt_zoom.png");
  await page.screenshot({ path: shotPath });
  console.log("Captured zoom front view:", shotPath);
  await browser.close();
}

run().catch(console.error);
