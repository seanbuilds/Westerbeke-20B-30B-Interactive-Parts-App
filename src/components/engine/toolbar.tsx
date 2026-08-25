"use client";

import {
  BoxSelect,
  Eye,
  Layers,
  Play,
  RotateCcw,
  Scan,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEngineStore, type CameraView } from "@/lib/engine/store";
import { cn } from "@/lib/utils";

const VIEWS: { id: CameraView; label: string }[] = [
  { id: "iso", label: "ISO" },
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "top", label: "Top" },
];

export function Toolbar() {
  const explode = useEngineStore((s) => s.explode);
  const setExplode = useEngineStore((s) => s.setExplode);
  const running = useEngineStore((s) => s.running);
  const setRunning = useEngineStore((s) => s.setRunning);
  const rpm = useEngineStore((s) => s.rpm);
  const setRpm = useEngineStore((s) => s.setRpm);
  const cutaway = useEngineStore((s) => s.cutaway);
  const setCutaway = useEngineStore((s) => s.setCutaway);
  const ghosts = useEngineStore((s) => s.ghosts);
  const setGhosts = useEngineStore((s) => s.setGhosts);
  const isolate = useEngineStore((s) => s.isolate);
  const setIsolate = useEngineStore((s) => s.setIsolate);
  const cameraView = useEngineStore((s) => s.cameraView);
  const setCameraView = useEngineStore((s) => s.setCameraView);
  const stripNext = useEngineStore((s) => s.stripNext);
  const stripPrev = useEngineStore((s) => s.stripPrev);
  const restoreAll = useEngineStore((s) => s.restoreAll);
  const resetLab = useEngineStore((s) => s.resetLab);
  const hidden = useEngineStore((s) => s.hidden);
  const removed = Object.values(hidden).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={running ? "default" : "secondary"}
          onClick={() => setRunning(!running)}
        >
          {running ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Idle" : "Run"}
        </Button>
        <Button size="sm" variant={cutaway ? "default" : "secondary"} onClick={() => setCutaway(!cutaway)}>
          <Scan className="size-3.5" />
          Cutaway
        </Button>
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          variant={ghosts ? "default" : "secondary"}
          onClick={() => setGhosts(!ghosts)}
        >
          <Eye className="size-3.5" />
          Ghosts
        </Button>
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          variant={isolate ? "default" : "secondary"}
          onClick={() => setIsolate(!isolate)}
        >
          <BoxSelect className="size-3.5" />
          Isolate
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <Button size="sm" variant="outline" onClick={stripPrev}>
          Restore last
        </Button>
        <Button size="sm" variant="outline" onClick={stripNext}>
          <Layers className="size-3.5" />
          Strip next
        </Button>
        <Button size="sm" variant="ghost" onClick={restoreAll}>
          Show all
        </Button>
        <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={resetLab}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted">
          {removed} removed
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <label className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-faint">Explode</span>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[explode]}
            onValueChange={(v) => setExplode(v[0] ?? 0)}
          />
        </label>
        <label className="hidden items-center gap-3 sm:flex">
          <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-faint">RPM</span>
          <Slider
            min={0}
            max={1800}
            step={20}
            value={[rpm]}
            onValueChange={(v) => setRpm(v[0] ?? 0)}
          />
          <span className="w-12 font-mono text-xs tabular-nums text-muted">{Math.round(rpm)}</span>
        </label>
        <div className="flex gap-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setCameraView(v.id)}
              className={cn(
                "h-8 rounded-md px-2.5 text-xs font-medium",
                cameraView === v.id ? "bg-primary text-primary-fg" : "bg-raised text-muted hover:text-fg",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
