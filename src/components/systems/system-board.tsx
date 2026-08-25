"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useEngineStore } from "@/lib/engine/store";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "fuel", label: "Fuel System" },
  { id: "cooling", label: "Cooling & Marine Exhaust" },
  { id: "lube", label: "Lubrication & Sump" },
  { id: "fire", label: "4-Stroke Diesel Combustion" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const STEPS: Record<Tab, { n: string; t: string; d: string; partId?: string }[]> = {
  fuel: [
    {
      n: "1",
      t: "Marine Diesel Tank",
      d: "Fuel drawn from tank supply pick-up above the water and sludge line via USCG A1-15 hose 030025.",
      partId: "hose-fuel-supply",
    },
    {
      n: "2",
      t: "Primary Filter / Racor R15T",
      d: "10-micron filtration and centrifugal water separation. Transparent sediment bowl with brass drain petcock.",
      partId: "racor",
    },
    {
      n: "3",
      t: "12V Pulse Lift Pump (039275)",
      d: "Solid-state electric fuel pump producing ~3–5 PSI priming pressure through hose 038047.",
      partId: "lift-pump",
    },
    {
      n: "4",
      t: "Secondary Fine Filter (030210)",
      d: "2-micron spin-on element 030200 removes fine contaminants before fuel reaches injection pump via hose 036865.",
      partId: "stock-filter",
    },
    {
      n: "5",
      t: "Injection Pump (037102/037103)",
      d: "Bosch-type cassette pump timed to 17°–19° BTDC. Generates high pressure injection pulses with bleed bolt 037110.",
      partId: "injection-pump",
    },
    {
      n: "6",
      t: "HP Steel Lines (036951/52/53) → Injectors (037091)",
      d: "Delivers 1,990 PSI (140 bar pop pressure) atomized spray directly into swirl pre-combustion chambers.",
      partId: "hp-line-2",
    },
    {
      n: "7",
      t: "Focus Return Hose 036868 & Keystone Clamps 037163",
      d: "Green flexible leak-off hose returning unused bypass fuel to pump return stack with copper crush washers 037105.",
      partId: "return-hose",
    },
  ],
  cooling: [
    {
      n: "A",
      t: "Raw Seawater Intake & Sea Pump (037140)",
      d: "Seacock strainer supplies raw water. Gear-driven bronze pump with 6-blade neoprene impeller 036618.",
      partId: "raw-water-pump",
    },
    {
      n: "B",
      t: "Sea Pump Hose 037157 → Heat Exchanger (037130)",
      d: "Seawater flows through cupronickel tube stack. Sacrificial pencil zinc anode 011885 prevents galvanic corrosion.",
      partId: "heat-exchanger",
    },
    {
      n: "C",
      t: "Closed Freshwater Loop & Water Pump (037145)",
      d: "Internal circulating pump circulates 50/50 ethylene glycol through engine block, cylinder head, and manifold.",
      partId: "freshwater-pump",
    },
    {
      n: "D",
      t: "Thermostat (037380) & Manifold Jacket (037120)",
      d: "180°F (82°C) thermostat meters hot coolant through hose 037383 into freshwater-cooled exhaust manifold.",
      partId: "manifold",
    },
    {
      n: "E",
      t: "Wet Exhaust Mixing Elbow (037124) → Overboard",
      d: "Spent seawater injects into exhaust gas stream to cool fiberglass exhaust tubing before waterlock discharge.",
      partId: "wet-exhaust",
    },
  ],
  lube: [
    {
      n: "1",
      t: "Oil Pan Sump (036908)",
      d: "Holds 3.2 Qts (20B) / 3.8 Qts (30B) of 15W-40 marine diesel oil. Checked via dipstick 036925.",
      partId: "oil-pan",
    },
    {
      n: "2",
      t: "Remote Sump Drain Hose 033691 & Banjo 036819",
      d: "Hollow banjo bolt with dual 036493 copper crush washers for mess-free bilge oil changes.",
      partId: "hose-sump-drain",
    },
    {
      n: "3",
      t: "Internal Gear-Driven Oil Pump",
      d: "Pressurizes lube circuit to 40–60 PSI at cruising speed (minimum 14 PSI at idle).",
      partId: "crankshaft",
    },
    {
      n: "4",
      t: "Full-Flow Oil Filter (036918)",
      d: "Spin-on element with bypass valve. Changed every 100 hours or annually.",
      partId: "oil-filter",
    },
    {
      n: "5",
      t: "Engine Galleries to Crank & Rod Bearings",
      d: "Pressurized oil feeds main bearings, connecting rod big ends (torque 24 lb-ft), camshaft, and rocker arms.",
      partId: "rod-1",
    },
  ],
  fire: [
    {
      n: "1",
      t: "Intake Stroke",
      d: "Piston moves downward from TDC to BDC. Pure filtered air is drawn into cylinder (no throttle plate restriction).",
      partId: "piston-1",
    },
    {
      n: "2",
      t: "Compression Stroke (23:1 Ratio)",
      d: "Piston moves upward, compressing air to ~450–500 PSI, heating it above 1,000°F (540°C). Glow plugs 036930 assist cold starts.",
      partId: "glow-plugs",
    },
    {
      n: "3",
      t: "Injection & Power Stroke",
      d: "Injector sprays atomized diesel at 1,990 PSI into pre-chamber. Spontaneous combustion drives piston down with high torque.",
      partId: "injector-1",
    },
    {
      n: "4",
      t: "Exhaust Stroke",
      d: "Exhaust valve opens; ascending piston pushes hot exhaust through manifold 037120 into wet mixing elbow 037124.",
      partId: "wet-exhaust",
    },
  ],
};

export function SystemBoard() {
  const [tab, setTab] = useState<Tab>("fuel");
  const select = useEngineStore((s) => s.select);
  const setHighlightSystem = useEngineStore((s) => s.setHighlightSystem);

  const onTabChange = (t: Tab) => {
    setTab(t);
    const sysId = t === "fuel" ? "fuel" : t === "cooling" ? "cooling" : t === "lube" ? "lubrication" : null;
    setHighlightSystem(sysId);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-faint">Technical Systems Architecture</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">How the Westerbeke 20B/30B is Plumbed</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Four synchronized mechanical and thermal loops operating within the marine Mitsubishi L3E block. Click any step to inspect the component in the 3D workshop.
      </p>
      <div className="mt-6 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              "h-10 rounded-md px-4 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary text-primary-fg" : "bg-raised text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ol className="mt-8 space-y-3">
        {STEPS[tab].map((s, i) => (
          <li
            key={s.n}
            className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/50"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-raised font-display text-lg font-bold text-primary">
                {s.n}
              </span>
              <div>
                <h3 className="font-display text-base font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
              </div>
            </div>
            {s.partId ? (
              <Link
                to="/"
                onClick={() => {
                  select(s.partId!);
                  const sysId = tab === "fuel" ? "fuel" : tab === "cooling" ? "cooling" : tab === "lube" ? "lubrication" : null;
                  setHighlightSystem(sysId);
                }}
                className="shrink-0 rounded-md border border-border bg-raised px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface"
              >
                Inspect in 3D
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
