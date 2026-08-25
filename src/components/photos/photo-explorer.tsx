"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HOTSPOTS, type PhotoView } from "@/lib/engine/hotspots";
import { PARTS_BY_ID } from "@/lib/engine/parts-catalog";
import { useEngineStore } from "@/lib/engine/store";
import { cn } from "@/lib/utils";

export function PhotoExplorer() {
  const [view, setView] = useState<PhotoView>("front");
  const [active, setActive] = useState<string | null>("return-hose");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const select = useEngineStore((s) => s.select);

  const spots = HOTSPOTS.filter(
    (h) => h.view === view && (categoryFilter === "all" || h.category === categoryFilter),
  );
  const part = active ? PARTS_BY_ID[active] : undefined;
  const src = view === "front" ? "/engines/front.jpg" : "/engines/side.jpg";

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {(["front", "side"] as const).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={view === v ? "default" : "secondary"}
                onClick={() => setView(v)}
              >
                {v === "front" ? "Front / Fuel Side" : "Side / Exhaust Side"}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: "All Hotspots" },
              { id: "hose", label: "Hoses" },
              { id: "clamp", label: "Clamps" },
              { id: "fastener", label: "Hardware & Banjos" },
              { id: "assembly", label: "Assemblies" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  categoryFilter === f.id ? "bg-primary text-primary-fg" : "bg-raised text-muted hover:text-fg",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
          <div className="relative bg-bg">
            <img
              src={src}
              alt={view === "front" ? "Westerbeke engine, fuel side" : "Westerbeke engine, exhaust side"}
              className="block max-h-[640px] w-full object-contain"
            />
            {spots.map((h) => (
              <button
                key={`${h.view}-${h.partId}-${h.label}`}
                type="button"
                title={h.label}
                onClick={() => setActive(h.partId)}
                className={cn(
                  "absolute rounded-md border-2 transition-all duration-150 cursor-pointer",
                  h.featured
                    ? "border-ok bg-ok/30 shadow-[0_0_18px_rgba(16,163,86,0.6)] animate-pulse"
                    : h.category === "clamp"
                      ? "border-amber-400 bg-amber-400/30"
                      : h.category === "fastener"
                        ? "border-sky-400 bg-sky-400/30"
                        : "border-primary/80 bg-primary/20",
                  active === h.partId && "scale-[1.04] ring-2 ring-white z-20",
                )}
                style={{
                  left: `${h.left}%`,
                  top: `${h.top}%`,
                  width: `${h.width}%`,
                  height: `${h.height}%`,
                }}
              >
                <span
                  className={cn(
                    "absolute -top-6 left-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm",
                    h.featured
                      ? "bg-ok"
                      : h.category === "clamp"
                        ? "bg-amber-600"
                        : h.category === "fastener"
                          ? "bg-sky-600"
                          : "bg-primary",
                  )}
                >
                  {h.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Photographs from the real Westerbeke installation. Green highlight identifies the 036868 injector return hose & 037163 Keystone clamps. Amber marks hose clamps, and Blue marks nuts, washers, studs, and copper crush banjos.
        </p>
      </div>

      <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        {part ? (
          <>
            <div>
              <p className="font-mono text-xs font-semibold text-primary">{part.partNumber}</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">{part.name}</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {part.highlight ? <Badge tone="ok">Focus User Part</Badge> : null}
              <Badge>{part.group}</Badge>
              <Badge>Qty: {part.qty}</Badge>
              <Badge>{part.models}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted">{part.notes}</p>
            {part.service ? (
              <div className="rounded-lg bg-raised p-3 text-xs font-medium text-fg border border-border/50">
                <p className="font-semibold text-primary mb-1">Service & Torque Note:</p>
                {part.service}
              </div>
            ) : null}
            <div className="mt-auto pt-4">
              <Link
                to="/"
                onClick={() => select(part.id)}
                className="inline-flex w-full h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:opacity-90 transition-opacity"
              >
                Inspect in 3D Workshop
              </Link>
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center text-center text-sm text-muted">
            Click on any colored hotspot box on the engine photo to inspect parts and technical specifications.
          </div>
        )}
      </aside>
    </div>
  );
}
