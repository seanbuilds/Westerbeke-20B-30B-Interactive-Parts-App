"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LESSONS } from "@/lib/engine/lessons";
import { useEngineStore } from "@/lib/engine/store";
import { cn } from "@/lib/utils";

export function LessonView() {
  const [lessonId, setLessonId] = useState(LESSONS[0]?.id ?? "meet");
  const [step, setStep] = useState(0);
  const lesson = useMemo(() => LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0], [lessonId]);
  const current = lesson.steps[step];
  const selectedId = useEngineStore((s) => s.selectedId);
  const hidden = useEngineStore((s) => s.hidden);

  useEffect(() => {
    if (!current) return;
    const store = useEngineStore.getState();
    if (current.restore) store.restoreAll();
    if (current.hide) store.applyHidden(current.hide, true);
    if (current.select) store.select(current.select);
    if (typeof current.explode === "number") store.setExplode(current.explode);
    if (typeof current.running === "boolean") store.setRunning(current.running);
    if (typeof current.cutaway === "boolean") store.setCutaway(current.cutaway);
    if (current.highlightSystem !== undefined) store.setHighlightSystem(current.highlightSystem);
    if (current.cameraView) store.setCameraView(current.cameraView);
  }, [current, lessonId, step]);

  const challengeMet = current?.challenge
    ? current.challenge === "valve-cover"
      ? Boolean(hidden["valve-cover"]) || selectedId === "valve-cover"
      : selectedId === current.challenge
    : true;

  const last = step >= lesson.steps.length - 1;

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
      <aside className="rounded-2xl border border-border bg-surface p-4">
        <p className="px-2 text-[11px] uppercase tracking-[0.16em] text-faint">Lessons</p>
        <ul className="mt-2">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  setLessonId(l.id);
                  setStep(0);
                }}
                className={cn(
                  "w-full rounded-lg px-3 py-3 text-left",
                  l.id === lessonId ? "bg-raised" : "hover:bg-raised/60",
                )}
              >
                <span className="block text-sm font-medium">{l.title}</span>
                <span className="mt-1 block text-xs text-faint">{l.minutes}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-faint">
          {lesson.title} · {step + 1} / {lesson.steps.length}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{current.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{current.body}</p>
        {current.challenge ? (
          <p className="mt-4 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm">
            {current.challengeHint}
            {challengeMet ? " — got it." : ""}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <Button disabled={!challengeMet} onClick={() => setStep((s) => Math.min(lesson.steps.length - 1, s + 1))}>
            {last ? "End of lesson" : "Next"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Open the bay</Link>
          </Button>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-muted">{lesson.summary}</p>
      </div>
    </div>
  );
}
