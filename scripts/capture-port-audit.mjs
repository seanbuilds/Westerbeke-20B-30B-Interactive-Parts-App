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
  await page.waitForTimeout(1200);

  // ISO view and rotate to exact port fuel & dipstick view
  await page.getByRole("button", { name: "ISO", exact: true }).click();
  await page.waitForTimeout(400);

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // Orbit to match user uploaded screenshot angle
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 280, cy - 40, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  // Zoom in on port fuel system and dipstick
  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, -450);
  await page.waitForTimeout(600);

  const shotPath = path.join(artifactDir, "audit_06_port_flush_hardware.png");
  await page.screenshot({ path: shotPath });
  console.log("Captured port flush hardware screenshot:", shotPath);
  await browser.close();
}

run().catch(console.error);
