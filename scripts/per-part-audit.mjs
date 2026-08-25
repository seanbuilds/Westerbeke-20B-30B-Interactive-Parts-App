import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const artifactDir = "/Users/dad/.gemini/antigravity/brain/a3674c2b-b44e-4db7-a4de-0925c23472be";
const screenshotsDir = path.resolve(process.cwd(), "screenshots/per-part-audit");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Major assemblies to audit per part (assembled vs exploded/isolated)
const KEY_PARTS = [
  { id: "transmission", name: "Transmission (ZF / Hurth)", camera: { yaw: -150, pitch: 10 } },
  { id: "shift-linkage", name: "Shift Linkage Lever", camera: { yaw: -140, pitch: 15 } },
  { id: "prop-driveshaft", name: "Propeller Driveshaft", camera: { yaw: -130, pitch: 10 } },
  { id: "propeller", name: "3-Blade Bronze Propeller", camera: { yaw: -135, pitch: 10 } },
  { id: "shaft-seal-stuffing", name: "Stuffing Box Shaft Seal", camera: { yaw: -130, pitch: 10 } },
  { id: "belt", name: "3-Point Drive V-Belt", camera: { yaw: 20, pitch: 10 } },
  { id: "raw-water-pump", name: "Raw-Water Seawater Pump", camera: { yaw: 35, pitch: 5 } },
  { id: "freshwater-pump", name: "Freshwater Circulating Pump", camera: { yaw: -15, pitch: 15 } },
  { id: "pulley", name: "Crankshaft Damper Pulley", camera: { yaw: 10, pitch: 10 } },
  { id: "alternator", name: "Marine 12V Alternator", camera: { yaw: 45, pitch: 15 } },
  { id: "return-hose", name: "Green Injector Return Hose 036868", camera: { yaw: 45, pitch: 20 } },
  { id: "hp-line-1", name: "High-Pressure Line (Cyl 1)", camera: { yaw: 45, pitch: 20 } },
  { id: "injection-pump", name: "Fuel Injection Pump", camera: { yaw: 50, pitch: 10 } },
  { id: "heat-exchanger", name: "Tubular Heat Exchanger", camera: { yaw: -45, pitch: 25 } },
  { id: "wet-exhaust", name: "Wet Exhaust Mixing Elbow", camera: { yaw: -120, pitch: 15 } },
  { id: "thermostat-housing", name: "Thermostat Housing", camera: { yaw: -30, pitch: 30 } },
  { id: "valve-cover", name: "Valve Rocker Cover", camera: { yaw: 30, pitch: 35 } },
  { id: "oil-pan", name: "Oil Sump Pan", camera: { yaw: 45, pitch: -20 } },
  { id: "block", name: "Cylinder Block & Timing Case", camera: { yaw: 30, pitch: 15 } },
];

async function runPerPartAudit() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  async function setExplode(val) {
    const sliders = page.locator('input[type="range"]');
    if (await sliders.count() > 0) {
      await sliders.first().fill(String(val));
      await page.waitForTimeout(600);
    }
  }

  async function clickReset() {
    const resetBtn = page.getByRole("button", { name: "Reset" });
    if (await resetBtn.count() > 0) {
      await resetBtn.click();
      await page.waitForTimeout(500);
    }
  }

  async function orbit(dx, dy) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(600);
  }

  const results = [];

  for (let i = 0; i < KEY_PARTS.length; i++) {
    const part = KEY_PARTS[i];
    console.log(`Auditing [${i + 1}/${KEY_PARTS.length}]: ${part.name} (${part.id})...`);

    await clickReset();
    await setExplode(0);

    // Set ISO view first
    const isoBtn = page.getByRole("button", { name: "ISO", exact: true });
    if (await isoBtn.count() > 0) await isoBtn.click();
    await page.waitForTimeout(300);

    // Orbit to target angle
    await orbit(part.camera.yaw * 2.5, part.camera.pitch * -2);

    // Select the part via search input to highlight it
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill(part.id);
      await page.waitForTimeout(400);
      const partRow = page.locator(`text=${part.name}`).first();
      if (await partRow.count() > 0) {
        await partRow.click();
        await page.waitForTimeout(500);
      }
    }

    // 1. Capture Assembled (Unexploded) State
    const unexpFile = `part_${String(i + 1).padStart(2, "0")}_${part.id}_assembled.png`;
    const unexpLocal = path.join(screenshotsDir, unexpFile);
    const unexpArtifact = path.join(artifactDir, unexpFile);
    await page.screenshot({ path: unexpLocal });
    fs.copyFileSync(unexpLocal, unexpArtifact);

    // 2. Capture Exploded State (0.65)
    await setExplode(0.65);
    const expFile = `part_${String(i + 1).padStart(2, "0")}_${part.id}_exploded.png`;
    const expLocal = path.join(screenshotsDir, expFile);
    const expArtifact = path.join(artifactDir, expFile);
    await page.screenshot({ path: expLocal });
    fs.copyFileSync(expLocal, expArtifact);

    results.push({
      id: part.id,
      name: part.name,
      assembledImg: unexpFile,
      explodedImg: expFile,
    });
  }

  fs.writeFileSync(
    path.join(screenshotsDir, "audit_results.json"),
    JSON.stringify(results, null, 2),
  );

  await browser.close();
  console.log("Per-part audit complete! All assembled and exploded evidence generated.");
}

runPerPartAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
