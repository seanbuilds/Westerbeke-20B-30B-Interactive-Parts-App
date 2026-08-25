"use client";

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GROUP_LABEL, MANUALS, PARTS, type PartGroup } from "@/lib/engine/parts-catalog";
import { useEngineStore } from "@/lib/engine/store";
import { cn } from "@/lib/utils";

const FILTER_GROUPS: { id: PartGroup | "all" | "hoses_clamps" | "fasteners"; label: string }[] = [
  { id: "all", label: "All (67)" },
  { id: "hose", label: "Hoses & Lines" },
  { id: "clamp", label: "Clamps" },
  { id: "fastener", label: "Nuts, Washers & Banjos" },
  { id: "fuel", label: "Fuel System" },
  { id: "cooling", label: "Cooling & Exhaust" },
  { id: "lubrication", label: "Lubrication" },
  { id: "electrical", label: "Electrical" },
  { id: "drive", label: "Drive & Gearbox" },
  { id: "internals", label: "Running Gear" },
];

export function CatalogView() {
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const select = useEngineStore((s) => s.select);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PARTS.filter((p) => {
      if (activeFilter !== "all") {
        if (activeFilter === "hoses_clamps") {
          if (p.group !== "hose" && p.group !== "clamp") return false;
        } else if (p.group !== activeFilter) {
          return false;
        }
      }
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.short.toLowerCase().includes(query) ||
        p.partNumber.toLowerCase().includes(query) ||
        p.notes.toLowerCase().includes(query) ||
        (p.service && p.service.toLowerCase().includes(query))
      );
    });
  }, [activeFilter, q]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-faint">Westerbeke Pub #037115 & Mitsubishi L2E/L3E</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Parts, Hardware & Specs Catalog</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Comprehensive parts list including hoses, Keystone/worm-gear clamps, M8/M10 studs, flat/spring lock washers, single-use copper banjo crush seals, and marine service components.
      </p>

      {/* Manual Links */}
      <div className="mt-6 flex flex-wrap gap-2">
        {MANUALS.map((m) => (
          <a
            key={m.href}
            href={m.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-md bg-raised px-3 text-xs font-medium text-fg hover:bg-surface border border-border"
          >
            {m.label} ↗
          </a>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="mt-6 flex flex-col gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by part number (e.g. 036868, 037163, 037105), name, or keyword..."
          className="w-full"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {FILTER_GROUPS.map((g) => (
            <FilterChip
              key={g.id}
              active={activeFilter === g.id}
              onClick={() => setActiveFilter(g.id)}
            >
              {g.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Parts List */}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
        {rows.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 p-4.5 sm:flex-row sm:items-start sm:justify-between transition-colors hover:bg-raised/40">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary">{p.partNumber}</span>
                {p.highlight ? <Badge tone="ok">Focus User Part</Badge> : null}
                <Badge>{GROUP_LABEL[p.group]}</Badge>
                <Badge>Qty: {p.qty}</Badge>
              </div>
              <p className="mt-1 text-base font-semibold text-fg">{p.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.notes}</p>
              {p.service ? (
                <div className="mt-2.5 rounded-lg bg-raised px-3 py-2 text-xs font-medium text-fg/90 border border-border/50">
                  <span className="text-primary font-semibold">Service Spec: </span>
                  {p.service}
                </div>
              ) : null}
            </div>
            <Link
              to="/"
              onClick={() => select(p.id)}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-3.5 text-xs font-medium text-primary-fg hover:opacity-90 shadow-sm"
            >
              Inspect in 3D Bay
            </Link>
          </li>
        ))}
      </ul>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          No parts match &ldquo;{q}&rdquo;. Try searching for a part number like 036868, 037163, 037105, or selecting another filter category.
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-border/70 bg-surface/50 p-4 text-xs leading-relaxed text-faint">
        <p className="font-semibold text-muted mb-1">Marine Safety & Ordering Notice:</p>
        Marine diesel fuel leaks are an extreme fire and explosion hazard. Inspect every hose, Keystone clamp, and copper crush washer regularly. Banjo copper crush washers are single-use seals and must never be reused. Confirm your engine nameplate and serial number on the manifold before ordering parts.
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-md px-3 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-fg shadow-sm" : "bg-raised text-muted hover:text-fg hover:bg-surface border border-border/50",
      )}
    >
      {children}
    </button>
  );
}
