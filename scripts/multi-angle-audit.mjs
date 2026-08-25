import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.cwd(), "screenshots/audit");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  console.log("Navigating to http://127.0.0.1:8080/...");
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 1. Capture Default ISO View
  await page.screenshot({ path: path.join(outDir, "1_default_iso.png") });
  console.log("Captured 1_default_iso.png");

  // 2. Click Front View button
  const frontBtn = page.getByRole("button", { name: "Front" });
  if (await frontBtn.count() > 0) {
    await frontBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "2_front_timing_view.png") });
    console.log("Captured 2_front_timing_view.png");
  }

  // 3. Click Side View button
  const sideBtn = page.getByRole("button", { name: "Side" });
  if (await sideBtn.count() > 0) {
    await sideBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "3_side_view.png") });
    console.log("Captured 3_side_view.png");
  }

  // 4. Orbit Camera to Aft Transmission / Driveshaft View
  // We can drag the 3D canvas to inspect the aft transmission & prop
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    
    // Drag horizontally to rotate 180 degrees
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 350, cy + 50, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "4_aft_transmission_propshaft.png") });
    console.log("Captured 4_aft_transmission_propshaft.png");
  }

  // 5. Test Explode Mode
  // Find explode slider or click explode button / drag slider
  const sliders = page.locator('input[type="range"]');
  if (await sliders.count() > 0) {
    // First slider is explode
    await sliders.first().fill("0.65");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "5_exploded_assembly.png") });
    console.log("Captured 5_exploded_assembly.png");
  }

  await browser.close();
  console.log("Audit screenshots completed!");
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
