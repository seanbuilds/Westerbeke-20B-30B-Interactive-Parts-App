import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const artifactDir = "/Users/dad/.gemini/antigravity/brain/a3674c2b-b44e-4db7-a4de-0925c23472be";
const screenshotsDir = path.resolve(process.cwd(), "screenshots/audit");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runDetailedAudit() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Helper to drag canvas
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  async function orbit(dx, dy) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 25 });
    await page.mouse.up();
    await page.waitForTimeout(800);
  }

  // 1. Evidence 1: Aft Transmission & Complete Marine Propeller Driveshaft System
  await orbit(-340, 40);
  const p1 = path.join(screenshotsDir, "evidence_1_transmission_propshaft.png");
  const a1 = path.join(artifactDir, "evidence_1_transmission_propshaft.png");
  await page.screenshot({ path: p1 });
  fs.copyFileSync(p1, a1);
  console.log("Saved Evidence 1: Transmission & Driveshaft");

  // 2. Evidence 2: Front Timing Case, Pumps & 3-Point Drive V-Belt
  const frontBtn = page.getByRole("button", { name: "Front", exact: true });
  await frontBtn.click();
  await page.waitForTimeout(800);
  await orbit(40, -20);
  const p2 = path.join(screenshotsDir, "evidence_2_front_timing_belt.png");
  const a2 = path.join(artifactDir, "evidence_2_front_timing_belt.png");
  await page.screenshot({ path: p2 });
  fs.copyFileSync(p2, a2);
  console.log("Saved Evidence 2: Front Timing & Belt");

  // 3. Evidence 3: Starboard Fuel System & Focus Green Hose 036868
  const isoBtn = page.getByRole("button", { name: "ISO", exact: true });
  await isoBtn.click();
  await page.waitForTimeout(800);
  const p3 = path.join(screenshotsDir, "evidence_3_fuel_system_green_hose.png");
  const a3 = path.join(artifactDir, "evidence_3_fuel_system_green_hose.png");
  await page.screenshot({ path: p3 });
  fs.copyFileSync(p3, a3);
  console.log("Saved Evidence 3: Starboard Fuel & Green Hose");

  // 4. Evidence 4: Port Side Heat Exchanger, Mixing Elbow & Cooler Lines
  await orbit(280, 20);
  const p4 = path.join(screenshotsDir, "evidence_4_port_cooling_exhaust.png");
  const a4 = path.join(artifactDir, "evidence_4_port_cooling_exhaust.png");
  await page.screenshot({ path: p4 });
  fs.copyFileSync(p4, a4);
  console.log("Saved Evidence 4: Port Cooling & Exhaust");

  // 5. Evidence 5: Running Engine & Cutaway Internal Running Gear
  const cutawayBtn = page.getByRole("button", { name: "Cutaway", exact: true });
  await cutawayBtn.click();
  const idleBtn = page.getByRole("button", { name: "Idle", exact: true });
  await idleBtn.click();
  await page.waitForTimeout(1000);
  const p5 = path.join(screenshotsDir, "evidence_5_running_cutaway.png");
  const a5 = path.join(artifactDir, "evidence_5_running_cutaway.png");
  await page.screenshot({ path: p5 });
  fs.copyFileSync(p5, a5);
  console.log("Saved Evidence 5: Running & Cutaway");

  // 6. Evidence 6: Exploded Assembly Validation
  await cutawayBtn.click(); // toggle cutaway off
  const sliders = page.locator('input[type="range"]');
  if (await sliders.count() > 0) {
    await sliders.first().fill("0.55");
    await page.waitForTimeout(1000);
  }
  const p6 = path.join(screenshotsDir, "evidence_6_exploded_assembly.png");
  const a6 = path.join(artifactDir, "evidence_6_exploded_assembly.png");
  await page.screenshot({ path: p6 });
  fs.copyFileSync(p6, a6);
  console.log("Saved Evidence 6: Exploded Assembly");

  await browser.close();
  console.log("ALL_AUDIT_IMAGES_SUCCESS");
}

runDetailedAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
