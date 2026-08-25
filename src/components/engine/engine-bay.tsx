"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Inspector } from "./inspector";
import { PartsRail } from "./parts-rail";
import { RemovedTray } from "./removed-tray";
import { Toolbar } from "./toolbar";
import { Button } from "@/components/ui/button";
import { useEngineStore } from "@/lib/engine/store";

export function EngineBay() {
  const [CanvasComp, setCanvasComp] = useState<ComponentType | null>(null);
  const onboarded = useEngineStore((s) => s.onboarded);
  const setOnboarded = useEngineStore((s) => s.setOnboarded);
  const restoreAll = useEngineStore((s) => s.restoreAll);
  const toggleExplode = useEngineStore((s) => s.toggleExplode);
  const setRunning = useEngineStore((s) => s.setRunning);
  const running = useEngineStore((s) => s.running);
  const select = useEngineStore((s) => s.select);
  const stripNext = useEngineStore((s) => s.stripNext);
  const setCutaway = useEngineStore((s) => s.setCutaway);
  const cutaway = useEngineStore((s) => s.cutaway);

  useEffect(() => {
    void import("./engine-canvas").then((m) => setCanvasComp(() => m.EngineCanvas));
    void useEngineStore.persist.rehydrate();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) useEngineStore.getState().setRunning(false);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning(!useEngineStore.getState().running);
      } else if (e.key === "Escape") {
        select(null);
      } else if (e.key === "e" || e.key === "E") {
        toggleExplode();
      } else if (e.key === "r" || e.key === "R") {
        restoreAll();
      } else if (e.key === "x" || e.key === "X") {
        setCutaway(!useEngineStore.getState().cutaway);
      } else if (e.key === "]") {
        useEngineStore.getState().setRpm(useEngineStore.getState().rpm + 80);
      } else if (e.key === "[") {
        useEngineStore.getState().setRpm(useEngineStore.getState().rpm - 80);
      } else if (e.key === "s" || e.key === "S") {
        stripNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restoreAll, select, setCutaway, setRunning, stripNext, toggleExplode]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Toolbar />
      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-0 bg-bg max-lg:h-[38vh] max-lg:min-h-[220px]">
          {CanvasComp ? (
            <CanvasComp />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">
              <canvas width={2} height={2} className="hidden" aria-hidden />
              Loading 3D workshop…
            </div>
          )}
          {!onboarded ? (
            <div className="absolute left-3 right-3 top-3 z-10 max-w-sm rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm sm:left-4 sm:right-auto sm:p-4">
              <p className="font-display text-base tracking-tight sm:text-lg">Modular engine bay</p>
              <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                Click any part. Remove it. Strip the next layer. Explode the assembly. The green hose
                is Westerbeke 036868 — injector return to pump.
              </p>
              <Button size="sm" className="mt-3" onClick={setOnboarded}>
                Got it
              </Button>
            </div>
          ) : null}
          <p className="pointer-events-none absolute bottom-3 left-4 hidden text-[11px] text-faint md:block">
            Drag to orbit · Space idle · E explode · S strip · R show all · Esc deselect
            {running ? "" : " · paused"}
            {cutaway ? " · cutaway" : ""}
          </p>
        </div>
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto border-t border-border bg-bg p-3 lg:border-l lg:border-t-0">
          <Inspector />
          <PartsRail />
        </aside>
      </div>
      <RemovedTray />
    </div>
  );
}
