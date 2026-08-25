"use client";

import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GROUP_LABEL, PARTS_BY_ID } from "@/lib/engine/parts-catalog";
import { useEngineStore } from "@/lib/engine/store";

export function Inspector() {
  const selectedId = useEngineStore((s) => s.selectedId);
  const hidden = useEngineStore((s) => s.hidden);
  const toggleHidden = useEngineStore((s) => s.toggleHidden);
  const hideGroup = useEngineStore((s) => s.hideGroup);
  const isolate = useEngineStore((s) => s.isolate);
  const setIsolate = useEngineStore((s) => s.setIsolate);
  const part = selectedId ? PARTS_BY_ID[selectedId] : undefined;

  if (!part) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="font-display text-lg tracking-tight">No part selected</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Click any piece in the bay, or pick one from the list. Remove parts one at a time,
          explode the assembly, or run a strip sequence.
        </p>
      </div>
    );
  }

  const isHidden = Boolean(hidden[part.id]);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-primary">{part.partNumber}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight">
            {part.name}
          </h2>
        </div>
        {part.highlight ? <Badge tone="ok">Focus</Badge> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{GROUP_LABEL[part.group]}</Badge>
        <Badge>Qty {part.qty}</Badge>
        <Badge>{part.models}</Badge>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{part.notes}</p>
      {part.service ? (
        <p className="mt-3 rounded-lg bg-raised px-3 py-2 text-sm text-fg">
          <span className="text-faint">Service. </span>
          {part.service}
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant={isHidden ? "secondary" : "default"}
          onClick={() => toggleHidden(part.id)}
        >
          {isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          {isHidden ? "Refit part" : "Remove part"}
        </Button>
        <Button variant="outline" onClick={() => setIsolate(!isolate)}>
          {isolate ? "Show others" : "Isolate"}
        </Button>
        <Button variant="ghost" className="col-span-2" onClick={() => hideGroup(part.group)}>
          Remove entire {GROUP_LABEL[part.group].toLowerCase()} group
        </Button>
      </div>
    </div>
  );
}
