"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PARTS_BY_ID, type PartGroup } from "@/lib/engine/parts-catalog";
import { sim } from "@/lib/engine/sim";
import { useEngineStore, type SystemId } from "@/lib/engine/store";

const SYSTEM_OF: Record<PartGroup, SystemId> = {
  structure: null,
  fuel: "fuel",
  cooling: "cooling",
  electrical: "electrical",
  lubrication: "lubrication",
  internals: null,
  drive: null,
  controls: null,
  fastener: null,
  hose: null,
  clamp: null,
};

type Motion = "none" | "piston" | "rod" | "spin-z";

export function PartNode({
  id,
  children,
  motion = "none",
  index = 0,
}: {
  id: string;
  children: React.ReactNode;
  motion?: Motion;
  index?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const hideT = useRef(0);
  const def = PARTS_BY_ID[id];
  const hidden = useEngineStore((s) => Boolean(s.hidden[id]));
  const ghosts = useEngineStore((s) => s.ghosts);
  const selected = useEngineStore((s) => s.selectedId === id);
  const explode = useEngineStore((s) => s.explode);
  const isolate = useEngineStore((s) => s.isolate);
  const cutaway = useEngineStore((s) => s.cutaway);
  const highlightSystem = useEngineStore((s) => s.highlightSystem);
  const oilPanGone = useEngineStore((s) => Boolean(s.hidden["oil-pan"]));
  const headGone = useEngineStore((s) => Boolean(s.hidden["head"]));
  const blockGone = useEngineStore((s) => Boolean(s.hidden["block"]));
  const select = useEngineStore((s) => s.select);
  const setHidden = useEngineStore((s) => s.setHidden);

  useLayoutEffect(() => {
    hideT.current = hidden ? 1 : 0;
  }, [id]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g || !def) return;
    const d = Math.min(dt, 0.1);
    const concealInternals =
      def.group === "internals" && !cutaway && !oilPanGone && !headGone && !blockGone;
    const effectivelyHidden = hidden || concealInternals;
    hideT.current = THREE.MathUtils.damp(hideT.current, effectivelyHidden ? 1 : 0, 8, d);

    let px = def.rest[0] + def.explode[0] * explode;
    let py = def.rest[1] + def.explode[1] * explode;
    let pz = def.rest[2] + def.explode[2] * explode;

    if (motion === "piston") {
      const a = sim.angle + (index * Math.PI * 2) / 3;
      py += Math.cos(a) * 0.07;
    } else if (motion === "rod") {
      const a = sim.angle + (index * Math.PI * 2) / 3;
      py += Math.cos(a) * 0.034;
      g.rotation.z = Math.sin(a) * 0.13;
    } else if (motion === "spin-z") {
      g.rotation.z = sim.angle;
    }

    px += def.explode[0] * hideT.current * 0.4;
    py += 0.18 * hideT.current;
    pz += def.explode[2] * hideT.current * 0.4;
    g.position.set(px, py, pz);

    const ghosting = hidden && ghosts && !concealInternals;
    const gone = hideT.current > 0.92 && effectivelyHidden && !ghosting;
    g.visible = !gone;

    const sys = SYSTEM_OF[def.group];
    const systemDim =
      highlightSystem && sys !== highlightSystem && !def.highlight ? 0.22 : 1;
    const isolateDim = isolate && !selected ? 0.12 : 1;
    const cutawayDim = cutaway && def.cutaway ? 0.22 : 1;
    const hideDim = ghosting ? 0.16 : 1;
    const opacity = Math.min(systemDim, isolateDim, cutawayDim, hideDim);

    const pulse = selected ? 0.35 + Math.sin(state.clock.elapsedTime * 4) * 0.2 : 0;
    const featured = def.highlight && highlightSystem === "fuel" ? 0.28 : 0;

    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial;
        if (!m || !("opacity" in m)) continue;
        m.transparent = opacity < 0.99 || ghosting;
        m.opacity = opacity;
        m.depthWrite = opacity > 0.6;
        if ("emissive" in m && m.emissive) {
          const e = selected ? pulse : featured;
          m.emissive.setRGB(e, e * (def.highlight ? 1.1 : 0.15), e * 0.12);
        }
      }
    });
  });

  return (
    <group
      ref={group}
      name={id}
      onClick={(e) => {
        e.stopPropagation();
        if (hidden && ghosts) {
          setHidden(id, false);
          select(id);
          return;
        }
        if (hidden) return;
        select(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}
