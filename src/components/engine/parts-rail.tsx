"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GROUP_LABEL, PARTS, type PartGroup } from "@/lib/engine/parts-catalog";
import { useEngineStore } from "@/lib/engine/store";
import { cn } from "@/lib/utils";

const GROUPS: PartGroup[] = [
  "structure",
  "fuel",
  "hose",
  "clamp",
  "fastener",
  "cooling",
  "electrical",
  "lubrication",
  "drive",
  "controls",
  "internals",
];

export function PartsRail() {
  const [q, setQ] = useState("");
  const selectedId = useEngineStore((s) => s.selectedId);
  const hidden = useEngineStore((s) => s.hidden);
  const select = useEngineStore((s) => s.select);
  const toggleHidden = useEngineStore((s) => s.toggleHidden);

  const grouped = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = PARTS.filter((p) => {
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.short.toLowerCase().includes(query) ||
        p.partNumber.toLowerCase().includes(query) ||
        p.notes.toLowerCase().includes(query)
      );
    });
    return GROUPS.map((g) => ({
      group: g,
      items: filtered.filter((p) => p.group === g),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border p-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 67 parts, hoses, fasteners..."
        />
      </div>
      <ScrollArea className="min-h-0 flex-1 p-2">
        {grouped.map(({ group, items }) => (
          <div key={group} className="mb-3">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              {GROUP_LABEL[group]} ({items.length})
            </p>
            <ul className="space-y-0.5">
              {items.map((p) => {
                const isHidden = Boolean(hidden[p.id]);
                const active = selectedId === p.id;
                return (
                  <li key={p.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-lg pr-1 transition-colors",
                        active ? "bg-raised border border-border" : "hover:bg-raised/50",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => select(p.id)}
                        className="flex min-w-0 flex-1 items-start gap-2 px-2 py-2 text-left"
                      >
                        <span
                          className={cn(
                            "mt-1 size-2 shrink-0 rounded-full",
                            p.highlight ? "bg-ok" : isHidden ? "bg-faint" : "bg-primary",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-fg">{p.short}</span>
                          <span className="block truncate font-mono text-[10px] text-faint">
                            {p.partNumber}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={isHidden ? `Refit ${p.short}` : `Remove ${p.short}`}
                        onClick={() => toggleHidden(p.id)}
                        className="grid size-8 place-items-center rounded-md text-muted hover:bg-bg hover:text-fg transition-colors"
                      >
                        {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
