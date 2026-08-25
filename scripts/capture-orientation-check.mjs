import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const artifactDir = "/Users/dad/.gemini/antigravity/brain/a3674c2b-b44e-4db7-a4de-0925c23472be";
const screenshotsDir = path.resolve(process.cwd(), "screenshots");

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  async function orbit(dx, dy) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }

  // 1. Port side (Fuel System) view
  await page.getByRole("button", { name: "ISO", exact: true }).click();
  await page.waitForTimeout(300);
  await orbit(-250, -30);
  await page.screenshot({ path: path.join(artifactDir, "check_port_fuel.png") });

  // 2. Starboard side (Exchanger & Manifold) view
  await page.getByRole("button", { name: "ISO", exact: true }).click();
  await page.waitForTimeout(300);
  await orbit(200, -30);
  await page.screenshot({ path: path.join(artifactDir, "check_starboard_exhaust.png") });

  // 3. Top view showing clean non-clipping heat exchanger
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, "check_top_view.png") });

  await browser.close();
  console.log("ORIENTATION_CHECK_CAPTURED");
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
