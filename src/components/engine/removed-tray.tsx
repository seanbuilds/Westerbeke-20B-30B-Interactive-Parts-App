"use client";

import { PARTS } from "@/lib/engine/parts-catalog";
import { useEngineStore } from "@/lib/engine/store";

export function RemovedTray() {
  const hidden = useEngineStore((s) => s.hidden);
  const setHidden = useEngineStore((s) => s.setHidden);
  const select = useEngineStore((s) => s.select);
  const removed = PARTS.filter((p) => hidden[p.id]);

  if (removed.length === 0) return null;

  return (
    <div className="border-t border-border bg-surface px-3 py-2 sm:px-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-faint">Removed on the bench</p>
      <div className="flex flex-wrap gap-1.5">
        {removed.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setHidden(p.id, false);
              select(p.id);
            }}
            className="rounded-full border border-border bg-raised px-3 py-1.5 text-xs text-fg hover:border-primary"
          >
            {p.short}
          </button>
        ))}
      </div>
    </div>
  );
}
