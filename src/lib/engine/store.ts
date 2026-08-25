import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PARTS, STRIP_ORDER, type PartGroup } from "./parts-catalog";

export type CameraView = "iso" | "front" | "side" | "top";
export type SystemId = "fuel" | "cooling" | "lubrication" | "electrical" | null;

type EngineState = {
  selectedId: string | null;
  hidden: Record<string, boolean>;
  explode: number;
  running: boolean;
  rpm: number;
  cutaway: boolean;
  ghosts: boolean;
  isolate: boolean;
  highlightSystem: SystemId;
  cameraView: CameraView;
  cameraTick: number;
  onboarded: boolean;
  select: (id: string | null) => void;
  setHidden: (id: string, hidden: boolean) => void;
  toggleHidden: (id: string) => void;
  hideGroup: (group: PartGroup) => void;
  restoreGroup: (group: PartGroup) => void;
  restoreAll: () => void;
  setExplode: (n: number) => void;
  toggleExplode: () => void;
  setRunning: (v: boolean) => void;
  setRpm: (n: number) => void;
  setCutaway: (v: boolean) => void;
  setGhosts: (v: boolean) => void;
  setIsolate: (v: boolean) => void;
  setHighlightSystem: (s: SystemId) => void;
  setCameraView: (v: CameraView) => void;
  stripNext: () => void;
  stripPrev: () => void;
  applyHidden: (ids: string[], hidden: boolean) => void;
  resetLab: () => void;
  setOnboarded: () => void;
};

const defaultHidden: Record<string, boolean> = {};

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      selectedId: "return-hose",
      hidden: defaultHidden,
      explode: 0,
      running: true,
      rpm: 720,
      cutaway: false,
      ghosts: false,
      isolate: false,
      highlightSystem: null,
      cameraView: "iso",
      cameraTick: 0,
      onboarded: false,
      select: (id) => set({ selectedId: id, isolate: id ? get().isolate : false }),
      setHidden: (id, hidden) =>
        set({ hidden: { ...get().hidden, [id]: hidden } }),
      toggleHidden: (id) => {
        const next = !get().hidden[id];
        set({
          hidden: { ...get().hidden, [id]: next },
          selectedId: next ? get().selectedId : id,
        });
      },
      hideGroup: (group) => {
        const hidden = { ...get().hidden };
        for (const p of PARTS) if (p.group === group) hidden[p.id] = true;
        set({ hidden });
      },
      restoreGroup: (group) => {
        const hidden = { ...get().hidden };
        for (const p of PARTS) if (p.group === group) hidden[p.id] = false;
        set({ hidden });
      },
      restoreAll: () => set({ hidden: {}, isolate: false }),
      setExplode: (n) => set({ explode: Math.min(1, Math.max(0, n)) }),
      toggleExplode: () => set({ explode: get().explode > 0.5 ? 0 : 1 }),
      setRunning: (v) => set({ running: v }),
      setRpm: (n) => set({ rpm: Math.min(2200, Math.max(0, n)) }),
      setCutaway: (v) => set({ cutaway: v }),
      setGhosts: (v) => set({ ghosts: v }),
      setIsolate: (v) => set({ isolate: v }),
      setHighlightSystem: (s) => set({ highlightSystem: s }),
      setCameraView: (v) =>
        set({ cameraView: v, cameraTick: get().cameraTick + 1 }),
      stripNext: () => {
        const hidden = { ...get().hidden };
        const next = STRIP_ORDER.find((id) => !hidden[id]);
        if (!next) return;
        hidden[next] = true;
        set({ hidden, selectedId: next });
      },
      stripPrev: () => {
        const hidden = { ...get().hidden };
        const reversed = [...STRIP_ORDER].reverse();
        const last = reversed.find((id) => hidden[id]);
        if (!last) return;
        hidden[last] = false;
        set({ hidden, selectedId: last });
      },
      applyHidden: (ids, hiddenFlag) => {
        const hidden = { ...get().hidden };
        for (const id of ids) hidden[id] = hiddenFlag;
        set({ hidden });
      },
      resetLab: () =>
        set({
          hidden: {},
          explode: 0,
          cutaway: false,
          isolate: false,
          highlightSystem: null,
          selectedId: "return-hose",
          running: true,
          rpm: 720,
        }),
      setOnboarded: () => set({ onboarded: true }),
    }),
    {
      name: "ohheysaen-engine-lab-v2",
      skipHydration: true,
      partialize: (s) => ({
        hidden: s.hidden,
        onboarded: s.onboarded,
      }),
    },
  ),
);

export function removedCount() {
  const hidden = useEngineStore.getState().hidden;
  return Object.values(hidden).filter(Boolean).length;
}
