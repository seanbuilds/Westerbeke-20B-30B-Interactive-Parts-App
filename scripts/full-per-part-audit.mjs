import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const artifactDir = "/Users/dad/.gemini/antigravity/brain/a3674c2b-b44e-4db7-a4de-0925c23472be";
const screenshotsDir = path.resolve(process.cwd(), "screenshots/per-part-audit");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const AUDIT_PARTS = [
  { id: "propeller", name: "3-Blade Marine Propeller", group: "Drive & Propulsion", yaw: -140, pitch: 8 },
  { id: "prop-driveshaft", name: "Propeller Driveshaft (1in Aquamet)", group: "Drive & Propulsion", yaw: -130, pitch: 10 },
  { id: "shaft-seal-stuffing", name: "Bronze Stuffing Box / Shaft Seal", group: "Drive & Propulsion", yaw: -125, pitch: 12 },
  { id: "shaft-coupling-hub", name: "Split Shaft Coupling Hub", group: "Drive & Propulsion", yaw: -135, pitch: 12 },
  { id: "driveshaft-coupling", name: "Flexible Drivesaver Coupling Disc", group: "Drive & Propulsion", yaw: -140, pitch: 15 },
  { id: "transmission", name: "Marine Transmission Gearbox (ZF/Hurth)", group: "Drive & Propulsion", yaw: -145, pitch: 15 },
  { id: "shift-linkage", name: "Transmission Shift Selector Lever", group: "Controls & Linkage", yaw: -140, pitch: 15 },
  { id: "belt", name: "3-Point Closed Triangle V-Belt", group: "Drive & Accessories", yaw: 15, pitch: 10 },
  { id: "pulley", name: "Crankshaft Damper Pulley", group: "Drive & Accessories", yaw: 10, pitch: 10 },
  { id: "raw-water-pump", name: "Raw-Water Seawater Pump", group: "Cooling & Exhaust", yaw: 35, pitch: 5 },
  { id: "freshwater-pump", name: "Freshwater Circulating Pump", group: "Cooling & Exhaust", yaw: -15, pitch: 15 },
  { id: "alternator", name: "12V Marine Alternator", group: "Electrical", yaw: 45, pitch: 15 },
  { id: "return-hose", name: "Focus Green Injector Return Hose 036868", group: "Fuel System", yaw: 45, pitch: 20 },
  { id: "injection-pump", name: "Mechanical Fuel Injection Pump", group: "Fuel System", yaw: 50, pitch: 10 },
  { id: "racor", name: "Primary Fuel Filter / Water Separator", group: "Fuel System", yaw: 55, pitch: 10 },
  { id: "lift-pump", name: "12V Electric Pulse Fuel Lift Pump", group: "Fuel System", yaw: 55, pitch: -10 },
  { id: "heat-exchanger", name: "Tubular Copper-Nickel Heat Exchanger", group: "Cooling & Exhaust", yaw: -45, pitch: 25 },
  { id: "wet-exhaust", name: "Wet Exhaust Mixing Elbow", group: "Cooling & Exhaust", yaw: -120, pitch: 15 },
  { id: "valve-cover", name: "Valve Rocker Cover & Oil Fill Cap", group: "Structure", yaw: 30, pitch: 35 },
  { id: "head", name: "Cylinder Head Assembly", group: "Structure", yaw: 30, pitch: 20 },
  { id: "block", name: "Cylinder Block & Timing Case", group: "Structure", yaw: 30, pitch: 15 },
];

async function runAudit() {
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

  async function orbit(dx, dy) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }

  async function setExplode(val) {
    const sliders = page.locator('input[type="range"]');
    if (await sliders.count() > 0) {
      await sliders.first().fill(String(val));
      await page.waitForTimeout(500);
    }
  }

  const results = [];

  for (let i = 0; i < AUDIT_PARTS.length; i++) {
    const p = AUDIT_PARTS[i];
    console.log(`Processing [${i + 1}/${AUDIT_PARTS.length}]: ${p.name}...`);

    // Reset view
    const isoBtn = page.getByRole("button", { name: "ISO", exact: true });
    if (await isoBtn.count() > 0) await isoBtn.click();
    await page.waitForTimeout(200);

    // Orbit to target view
    await orbit(p.yaw * 2.4, p.pitch * -2);

    // Search and select part
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill(p.id);
    await page.waitForTimeout(300);

    // 1. Assembled screenshot
    await setExplode(0);
    const unexpName = `audit_${p.id}_assembled.png`;
    const unexpLocal = path.join(screenshotsDir, unexpName);
    const unexpArtifact = path.join(artifactDir, unexpName);
    await page.screenshot({ path: unexpLocal });
    fs.copyFileSync(unexpLocal, unexpArtifact);

    // 2. Exploded screenshot
    await setExplode(0.60);
    const expName = `audit_${p.id}_exploded.png`;
    const expLocal = path.join(screenshotsDir, expName);
    const expArtifact = path.join(artifactDir, expName);
    await page.screenshot({ path: expLocal });
    fs.copyFileSync(expLocal, expArtifact);

    results.push({
      ...p,
      assembledFile: unexpName,
      explodedFile: expName,
    });
  }

  fs.writeFileSync(
    path.join(screenshotsDir, "summary.json"),
    JSON.stringify(results, null, 2),
  );

  await browser.close();
  console.log("FULL_PER_PART_AUDIT_COMPLETE");
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
