"use client";

import { useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EngineModel } from "./engine-model";
import { useEngineStore, type CameraView } from "@/lib/engine/store";

const PRESETS: Record<CameraView, [number, number, number]> = {
  iso: [2.2, 1.5, 2.4],
  front: [0.2, 0.55, 3.35],
  side: [3.4, 0.55, 0.15],
  top: [0.15, 3.55, 0.2],
};

function CameraRig() {
  const view = useEngineStore((s) => s.cameraView);
  const tick = useEngineStore((s) => s.cameraTick);
  const { camera, controls } = useThree();

  useLayoutEffect(() => {
    const [x, y, z] = PRESETS[view];
    camera.position.set(x, y, z);
    camera.lookAt(0, 0.12, -0.12);
    const c = controls as
      | { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void }
      | null;
    c?.target?.set(0, 0.12, -0.12);
    c?.update?.();
  }, [camera, controls, tick, view]);

  return null;
}

function WorkshopFloor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#101114" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[10, 20, "#2a2d33", "#1a1c20"]} position={[0, -1.14, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.145, 0]}>
        <circleGeometry args={[1.8, 40]} />
        <meshStandardMaterial color="#070809" transparent opacity={0.55} />
      </mesh>
    </>
  );
}

export function EngineCanvas() {
  const select = useEngineStore((s) => s.select);

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: PRESETS.iso, fov: 40, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => select(null)}
      className="touch-none"
      style={{ width: "100%", height: "100%", display: "block", background: "#0c0d0f" }}
    >
      <color attach="background" args={["#0c0d0f"]} />
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#d7d2c8", "#2a2622", 0.45]} />
      <directionalLight
        position={[4.2, 6.5, 3.2]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={16}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-3.5, 2.8, -2.4]} intensity={0.32} color="#b9c4d0" />
      <spotLight position={[0.5, 4.2, 1]} intensity={0.55} angle={0.5} penumbra={0.6} color="#f0e6d8" />
      <EngineModel />
      <WorkshopFloor />
      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan
        minDistance={1.4}
        maxDistance={8}
        maxPolarAngle={Math.PI / 1.85}
        target={[0, 0.12, -0.12]}
      />
    </Canvas>
  );
}
