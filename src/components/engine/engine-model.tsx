"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PartNode } from "./part-node";
import { sim } from "@/lib/engine/sim";
import { useEngineStore } from "@/lib/engine/store";

// Materials & Authentic Color Palette
const PAINT = "#a31d24";
const PAINT_DARK = "#6b1419";
const IRON = "#2a2c30";
const ALUM = "#c8ccd0";
const CHROME = "#e2e6eb";
const BRASS = "#c59b4e";
const COPPER = "#b85d38";
const RUBBER = "#1a1b1d";
const GREEN_HOSE = "#15a85c";
const RACOR_BLUE = "#1a2a48";
const BOWL_TINT = "#5a6848";

function Mat({
  color,
  metalness = 0.35,
  roughness = 0.5,
  opacity = 1,
}: {
  color: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metalness}
      roughness={roughness}
      opacity={opacity}
      transparent={opacity < 1}
    />
  );
}

function SimTicker() {
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const { running, rpm } = useEngineStore.getState();
    if (running && rpm > 0) sim.angle += (rpm / 60) * Math.PI * 2 * d;
  });
  return null;
}

// Reusable Hex Bolt Component
function HexBolt({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.016,
  height = 0.02,
  washer = true,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  height?: number;
  washer?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      {washer && (
        <mesh position={[0, -height * 0.4, 0]}>
          <cylinderGeometry args={[radius * 1.5, radius * 1.5, height * 0.25, 12]} />
          <Mat color={CHROME} metalness={0.8} roughness={0.2} />
        </mesh>
      )}
      <mesh position={[0, height * 0.2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 6]} />
        <Mat color={CHROME} metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Reusable Hose Clamp Band Component
function ClampBand({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.024,
  width = 0.015,
  isKeystone = false,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  width?: number;
  isKeystone?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[radius, width * 0.35, 8, 18]} />
        <Mat color={CHROME} metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[radius * 0.95, radius * 0.3, 0]}>
        <boxGeometry args={[isKeystone ? 0.012 : 0.018, 0.012, 0.014]} />
        <Mat color={CHROME} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Reusable Banjo Crush Washer Ring
function BanjoCrushRing({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  outerRadius = 0.022,
  innerRadius = 0.014,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  outerRadius?: number;
  innerRadius?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[(outerRadius + innerRadius) / 2, (outerRadius - innerRadius) / 2, 8, 16]} />
        <Mat color={COPPER} metalness={0.75} roughness={0.28} />
      </mesh>
    </group>
  );
}

function tube(points: [number, number, number][], radius = 0.014, closed = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
  );
  return new THREE.TubeGeometry(curve, 48, radius, 10, closed);
}

// Realistic 3D Hydrofoil Marine Propeller Blade Shape Generator
function createPropellerBladeGeometry(diameter = 0.36, hubRadius = 0.042) {
  const shape = new THREE.Shape();
  const rRoot = hubRadius * 0.95;
  const rTip = diameter / 2;
  const length = rTip - rRoot;

  shape.moveTo(0, 0);
  // Leading edge curvature
  shape.bezierCurveTo(0.045, length * 0.25, 0.065, length * 0.65, 0.015, length);
  // Rounded tip
  shape.bezierCurveTo(0.0, length * 1.04, -0.03, length * 1.02, -0.045, length * 0.92);
  // Trailing edge cupped curve
  shape.bezierCurveTo(-0.065, length * 0.55, -0.045, length * 0.20, 0, 0);

  const extrudeSettings = {
    steps: 8,
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 4,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Apply true helical hydrodynamic pitch twist along radius
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const x = pos.getX(i);
    const progress = Math.min(Math.max(y / length, 0), 1);
    const pitchAngle = (32 - progress * 14) * (Math.PI / 180);
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const newX = x * cosP - z * sinP;
    const newZ = x * sinP + z * cosP;
    pos.setXYZ(i, newX, y + rRoot, newZ);
  }
  geom.computeVertexNormals();
  return geom;
}

export function EngineModel() {
  const root = useRef<THREE.Group>(null);

  // Precomputed Propeller Blade Geometry
  const propBladeGeom = useMemo(() => createPropellerBladeGeometry(0.36, 0.042), []);

  // ===================== PORT SIDE FUEL LINES (X < 0) =====================
  // 1. High Pressure Injector Lines (from pump delivery valves at [-0.42, 0.16, z] up to injector bodies at [-0.25, 0.48, z])
  const hp1 = useMemo(
    () =>
      tube([
        [-0.42, 0.16, -0.12],
        [-0.38, 0.32, -0.16],
        [-0.30, 0.44, -0.22],
        [-0.25, 0.48, -0.24],
      ], 0.007),
    [],
  );

  const hp2 = useMemo(
    () =>
      tube([
        [-0.42, 0.16, 0.04],
        [-0.36, 0.32, 0.04],
        [-0.29, 0.44, 0.04],
        [-0.25, 0.48, 0.04],
      ], 0.007),
    [],
  );

  const hp3 = useMemo(
    () =>
      tube([
        [-0.42, 0.16, 0.20],
        [-0.38, 0.32, 0.22],
        [-0.30, 0.44, 0.23],
        [-0.25, 0.48, 0.24],
      ], 0.007),
    [],
  );

  // 2. Focus Green Injector Return Hose 036868 (from injector leak-off at [-0.26, 0.56, -0.24] arching down to pump return barb [-0.44, 0.16, 0.08])
  const returnHoseTube = useMemo(
    () =>
      tube([
        [-0.26, 0.56, -0.24],
        [-0.30, 0.52, -0.12],
        [-0.36, 0.44, 0.0],
        [-0.42, 0.30, 0.06],
        [-0.44, 0.16, 0.08],
      ], 0.010),
    [],
  );

  // 3. Auxiliary Fuel Return Lines
  const fuelReturn2 = useMemo(
    () =>
      tube([
        [-0.44, 0.14, 0.08],
        [-0.48, 0.10, -0.06],
        [-0.46, 0.04, -0.22],
      ], 0.009),
    [],
  );

  const fuelReturn3 = useMemo(
    () =>
      tube([
        [-0.44, 0.14, 0.08],
        [-0.50, 0.08, 0.16],
        [-0.54, 0.02, 0.24],
      ], 0.009),
    [],
  );

  // 4. Fuel Supply Lines (5/16" and 3/8" lines on Port side)
  const hoseFuelSupply = useMemo(
    () =>
      tube([
        [-0.56, 0.30, 0.36],
        [-0.54, 0.12, 0.36],
        [-0.50, -0.08, 0.36],
      ], 0.010),
    [],
  );

  const hoseLiftToFilter = useMemo(
    () =>
      tube([
        [-0.50, -0.05, 0.36],
        [-0.52, 0.06, 0.18],
        [-0.50, 0.14, -0.05],
        [-0.46, 0.18, -0.18],
      ], 0.009),
    [],
  );

  const hoseFilterToInj = useMemo(
    () =>
      tube([
        [-0.46, 0.14, -0.20],
        [-0.45, 0.08, -0.12],
        [-0.44, 0.06, -0.02],
      ], 0.009),
    [],
  );

  // ===================== STARBOARD COOLING HOSES (X > 0) =====================
  // Sea pump top outlet [-0.26, 0.01, 0.72] around front timing cover over to heat exchanger front inlet [0.46, 0.55, 0.41]
  const hoseSeaToHeatex = useMemo(
    () =>
      tube([
        [-0.26, 0.01, 0.72],
        [-0.15, 0.18, 0.74],
        [0.10, 0.36, 0.72],
        [0.32, 0.48, 0.58],
        [0.46, 0.55, 0.41],
      ], 0.016),
    [],
  );

  // Thermostat cover [0.36, 0.52, 0.40] to manifold [0.46, 0.42, 0.18]
  const hoseThermoManifold = useMemo(
    () =>
      tube([
        [0.36, 0.52, 0.40],
        [0.42, 0.46, 0.30],
        [0.46, 0.42, 0.18],
      ], 0.016),
    [],
  );

  // Heat exchanger bottom [0.46, 0.55, 0.20] to circulating water pump [0.06, 0.26, 0.66]
  const hoseFwToHeatex = useMemo(
    () =>
      tube([
        [0.46, 0.55, 0.20],
        [0.36, 0.44, 0.42],
        [0.22, 0.35, 0.56],
        [0.06, 0.26, 0.66],
      ], 0.018),
    [],
  );

  const hoseFlowCtrl1 = useMemo(
    () =>
      tube([
        [0.46, 0.34, 0.35],
        [0.48, 0.28, 0.30],
        [0.50, 0.24, 0.25],
      ], 0.009),
    [],
  );

  const hoseFlowCtrl2 = useMemo(
    () =>
      tube([
        [0.50, 0.24, 0.25],
        [0.48, 0.18, 0.20],
        [0.46, 0.12, 0.15],
      ], 0.009),
    [],
  );

  // Sump remote drain from banjo [-0.28, -0.38, 0.1] to port bracket [-0.44, -0.32, 0.32]
  const hoseSumpDrain = useMemo(
    () =>
      tube([
        [-0.28, -0.38, 0.10],
        [-0.34, -0.40, 0.16],
        [-0.40, -0.36, 0.24],
        [-0.44, -0.32, 0.32],
      ], 0.013),
    [],
  );

  // Transmission cooler lines: Exchanger [0.46, 0.55, -0.33] -> Cooler [0.34, -0.04, -0.80] -> Mixing elbow [0.55, 0.22, -0.56]
  const hoseTransCooler1 = useMemo(
    () =>
      tube([
        [0.46, 0.55, -0.33],
        [0.42, 0.30, -0.55],
        [0.38, 0.10, -0.72],
        [0.34, -0.04, -0.80],
      ], 0.013),
    [],
  );

  const hoseTransCooler2 = useMemo(
    () =>
      tube([
        [0.34, -0.04, -1.04],
        [0.45, 0.06, -0.85],
        [0.50, 0.14, -0.68],
        [0.55, 0.22, -0.56],
      ], 0.013),
    [],
  );

  // Overflow from pressure cap [0.46, 0.70, 0.37] over the top cover to port coolant bottle [-0.56, 0.16, 0.52]
  const hoseCoolantOverflow = useMemo(
    () =>
      tube([
        [0.43, 0.70, 0.37],
        [0.25, 0.68, 0.40],
        [0.0, 0.65, 0.44],
        [-0.30, 0.45, 0.48],
        [-0.56, 0.16, 0.52],
      ], 0.007),
    [],
  );

  // 6. Realistic 3-Point V-Belt Path around Crank Pulley [0, 0.02, 0.72], Water Pump Pulley [0.06, 0.30, 0.72], and Alternator Pulley [-0.44, 0.16, 0.72]
  const vBeltLoop = useMemo(
    () =>
      tube(
        [
          [0.0, -0.12, 0.72],
          [0.14, 0.02, 0.72],
          [0.14, 0.22, 0.72],
          [0.12, 0.36, 0.72],
          [0.06, 0.38, 0.72],
          [-0.02, 0.34, 0.72],
          [-0.20, 0.26, 0.72],
          [-0.38, 0.20, 0.72],
          [-0.48, 0.16, 0.72],
          [-0.46, 0.11, 0.72],
          [-0.28, 0.04, 0.72],
          [-0.14, -0.04, 0.72],
        ],
        0.009,
        true,
      ),
    [],
  );

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const d = Math.min(dt, 0.1);
    const running = useEngineStore.getState().running;
    const shake = running ? 1 : 0;
    g.position.x = THREE.MathUtils.damp(g.position.x, Math.sin(sim.angle * 8) * 0.0012 * shake, 12, d);
    g.position.y = THREE.MathUtils.damp(g.position.y, Math.cos(sim.angle * 9) * 0.0008 * shake, 12, d);
  });

  return (
    <group ref={root}>
      <SimTicker />
      <FuelParticles />

      {/* ==================== 1. CYLINDER BLOCK & FRONT GEAR CASE ==================== */}
      <PartNode id="block">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.52, 1.12]} />
          <Mat color={PAINT} roughness={0.55} metalness={0.18} />
        </mesh>
        {/* Front Timing Gear Case Cover (Forward of block from Z = 0.56 to 0.64) */}
        <mesh position={[0, 0.02, 0.60]} castShadow>
          <boxGeometry args={[0.68, 0.50, 0.08]} />
          <Mat color={PAINT_DARK} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Cylinder Bores */}
        {[-0.24, 0.04, 0.24].map((z) => (
          <mesh key={z} position={[0, 0.261, z]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 20]} />
            <Mat color="#241014" roughness={0.8} metalness={0.2} />
          </mesh>
        ))}
        {/* Side inspection cover */}
        <mesh position={[0.37, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.28, 0.06, 0.9]} />
          <Mat color={PAINT_DARK} />
        </mesh>
        {/* Engine Mount Foot Brackets */}
        {[[-0.38, -0.22, 0.35], [-0.38, -0.22, -0.35], [0.38, -0.22, 0.35], [0.38, -0.22, -0.35]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.16]} />
            <Mat color={IRON} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </PartNode>

      {/* ==================== 2. CYLINDER HEAD ==================== */}
      <PartNode id="head">
        <mesh castShadow>
          <boxGeometry args={[0.72, 0.22, 1.12]} />
          <Mat color={PAINT} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Combustion chamber pre-chambers */}
        {[-0.24, 0.04, 0.24].map((z) => (
          <mesh key={z} position={[0.25, 0.08, z]}>
            <cylinderGeometry args={[0.045, 0.048, 0.1, 14]} />
            <Mat color={IRON} />
          </mesh>
        ))}
        {/* Head Bolt Bosses */}
        {[-0.42, -0.14, 0.14, 0.42].map((z) =>
          [-0.26, 0.26].map((x) => (
            <mesh key={`${x}-${z}`} position={[x, 0.11, z]}>
              <cylinderGeometry args={[0.022, 0.022, 0.03, 10]} />
              <Mat color={CHROME} metalness={0.8} roughness={0.25} />
            </mesh>
          )),
        )}
      </PartNode>

      {/* ==================== 3. VALVE COVER ==================== */}
      <PartNode id="valve-cover">
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.12, 1.0]} />
          <Mat color={PAINT_DARK} roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.42, 0.04, 0.92]} />
          <Mat color={PAINT_DARK} roughness={0.45} />
        </mesh>
        <mesh position={[-0.14, 0.08, -0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 12]} />
          <Mat color={IRON} />
        </mesh>
      </PartNode>

      {/* ==================== 4. VALVE COVER BOLTS ==================== */}
      <PartNode id="valve-cover-bolts">
        {[-0.32, -0.1, 0.1, 0.32].map((z) =>
          [-0.18, 0.18].map((x) => (
            <HexBolt
              key={`${x}-${z}`}
              position={[x, 0.07, z]}
              radius={0.013}
              height={0.022}
            />
          )),
        )}
      </PartNode>

      {/* ==================== 5. OIL FILLER CAP ==================== */}
      <PartNode id="oil-fill-cap">
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
          <Mat color={RUBBER} roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[0.065, 0.015, 0.02]} />
          <Mat color={RUBBER} />
        </mesh>
      </PartNode>

      {/* ==================== 6. OIL PAN ==================== */}
      <PartNode id="oil-pan">
        <mesh castShadow>
          <boxGeometry args={[0.66, 0.22, 1.02]} />
          <Mat color={IRON} metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.7]} />
          <Mat color={IRON} />
        </mesh>
        {[-0.42, -0.21, 0, 0.21, 0.42].map((z) =>
          [-0.3, 0.3].map((x) => (
            <HexBolt key={`${x}-${z}`} position={[x, 0.1, z]} radius={0.013} height={0.018} />
          )),
        )}
      </PartNode>

      {/* ==================== 7. EXHAUST MANIFOLD (STARBOARD X > 0) ==================== */}
      <PartNode id="manifold">
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.2, 1.05]} />
          <Mat color={PAINT} />
        </mesh>
        {/* Runners from manifold inward (-X) into head ports */}
        {[-0.32, 0, 0.32].map((z) => (
          <mesh key={z} position={[-0.12, -0.02, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.08, 14]} />
            <Mat color={IRON} />
          </mesh>
        ))}
        {/* Serial plate facing outward (+X) to Starboard */}
        <mesh position={[0.115, 0.04, 0.1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.18, 0.07]} />
          <Mat color="#e5c878" metalness={0.8} roughness={0.3} />
        </mesh>
      </PartNode>

      {/* ==================== 8. MANIFOLD FASTENERS ==================== */}
      <PartNode id="manifold-studs">
        {[-0.36, -0.28, -0.04, 0.04, 0.28, 0.36].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            <Mat color={CHROME} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </PartNode>

      <PartNode id="manifold-washers">
        {[-0.36, -0.28, -0.04, 0.04, 0.28, 0.36].map((z, i) => (
          <group key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <mesh position={[0, -0.004, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.003, 10]} />
              <Mat color={CHROME} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.002, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.004, 10]} />
              <Mat color={IRON} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </PartNode>

      <PartNode id="manifold-nuts">
        {[-0.36, -0.28, -0.04, 0.04, 0.28, 0.36].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.014, 6]} />
            <Mat color={CHROME} metalness={0.85} roughness={0.2} />
          </mesh>
        ))}
      </PartNode>

      {/* ==================== 9. WET EXHAUST MIXING ELBOW (STARBOARD AFT) ==================== */}
      <PartNode id="wet-exhaust">
        <mesh castShadow rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.14, 0.07, 12, 16, Math.PI / 1.3]} />
          <Mat color={IRON} metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh position={[0.02, -0.14, -0.18]} rotation={[Math.PI / 2.4, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.08, 0.42, 16]} />
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0.12, 0.08, 0.02]} rotation={[0, 0, -Math.PI / 3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 10]} />
          <Mat color={BRASS} metalness={0.7} roughness={0.3} />
        </mesh>
      </PartNode>

      {/* ==================== 10. THERMOSTAT HOUSING ==================== */}
      <PartNode id="thermostat-housing">
        <mesh castShadow>
          <cylinderGeometry args={[0.065, 0.07, 0.12, 14]} />
          <Mat color={PAINT} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.12, 0.02, 0.1]} />
          <Mat color={PAINT} />
        </mesh>
        <HexBolt position={[-0.04, 0.08, 0.03]} radius={0.012} height={0.016} />
        <HexBolt position={[0.04, 0.08, -0.03]} radius={0.012} height={0.016} />
      </PartNode>

      {/* ==================== 11. INJECTION PUMP (PORT SIDE) ==================== */}
      <PartNode id="injection-pump">
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.28, 0.44]} />
          <Mat color={IRON} metalness={0.45} roughness={0.4} />
        </mesh>
        {/* Delivery valve holders on top of pump */}
        {[-0.16, 0, 0.16].map((z) => (
          <group key={z} position={[0.02, 0.14, z]}>
            <cylinderGeometry args={[0.018, 0.02, 0.06, 12]} />
            <Mat color={CHROME} metalness={0.8} roughness={0.2} />
          </group>
        ))}
        {/* Return Barb Fitting for green hose 036868 */}
        <mesh position={[0.0, 0.12, 0.04]}>
          <cylinderGeometry args={[0.012, 0.012, 0.04, 10]} />
          <Mat color={BRASS} metalness={0.8} roughness={0.25} />
        </mesh>
      </PartNode>

      {/* ==================== 12. BANJO BOLTS & CRUSH WASHERS ==================== */}
      <PartNode id="banjo-return-stack">
        <BanjoCrushRing position={[0, 0.008, 0]} outerRadius={0.022} innerRadius={0.014} />
        <BanjoCrushRing position={[0, -0.008, 0]} outerRadius={0.022} innerRadius={0.014} />
      </PartNode>

      <PartNode id="banjo-bleed-stack">
        <BanjoCrushRing position={[0, 0, 0]} outerRadius={0.016} innerRadius={0.01} />
      </PartNode>

      <PartNode id="banjo-bolt-bleed">
        <HexBolt position={[0, 0, 0]} radius={0.012} height={0.025} washer={false} />
      </PartNode>

      <PartNode id="banjo-bolt-fuel">
        <HexBolt position={[0, 0, 0]} radius={0.018} height={0.035} washer={false} />
      </PartNode>

      <PartNode id="banjo-washer-m8">
        <BanjoCrushRing position={[0, 0, 0]} outerRadius={0.016} innerRadius={0.009} />
      </PartNode>

      <PartNode id="banjo-washer-m14">
        <BanjoCrushRing position={[0, 0, 0]} outerRadius={0.022} innerRadius={0.014} />
      </PartNode>

      <PartNode id="banjo-cooling-m16">
        <BanjoCrushRing position={[0, 0, 0]} outerRadius={0.024} innerRadius={0.016} />
      </PartNode>

      <PartNode id="banjo-sump-washers">
        <BanjoCrushRing position={[0, 0.006, 0]} outerRadius={0.025} innerRadius={0.016} />
        <BanjoCrushRing position={[0, -0.006, 0]} outerRadius={0.025} innerRadius={0.016} />
      </PartNode>

      <PartNode id="banjo-sump-bolt">
        <HexBolt position={[0, 0, 0]} radius={0.02} height={0.036} washer={false} />
      </PartNode>

      {/* ==================== 13. INJECTORS & GLOW PLUGS (PORT SIDE) ==================== */}
      {(["injector-1", "injector-2", "injector-3"] as const).map((id) => (
        <PartNode key={id} id={id}>
          <mesh castShadow>
            <cylinderGeometry args={[0.018, 0.022, 0.18, 12]} />
            <Mat color={BRASS} metalness={0.75} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.04, 6]} />
            <Mat color={IRON} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Leak-off nipple pointing outward toward port */}
          <mesh position={[-0.01, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
            <Mat color={CHROME} metalness={0.85} roughness={0.2} />
          </mesh>
        </PartNode>
      ))}

      <PartNode id="injector-nuts">
        {[-0.28, 0, 0.28].map((z) => (
          <HexBolt key={z} position={[0, 0, z]} radius={0.016} height={0.02} washer={true} />
        ))}
      </PartNode>

      <PartNode id="injector-gaskets">
        {[-0.28, 0, 0.28].map((z) => (
          <BanjoCrushRing key={z} position={[0, 0, z]} outerRadius={0.02} innerRadius={0.012} />
        ))}
      </PartNode>

      <PartNode id="glow-plugs">
        {[-0.26, 0.02, 0.22].map((z) => (
          <group key={z} position={[0, 0, z]} rotation={[0, 0, -Math.PI / 3]}>
            <mesh>
              <cylinderGeometry args={[0.008, 0.008, 0.14, 8]} />
              <Mat color={CHROME} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.02, 6]} />
              <Mat color={BRASS} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.02, 0.06, 0]}>
          <boxGeometry args={[0.01, 0.005, 0.52]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.2} />
        </mesh>
      </PartNode>

      {/* ==================== 14. HIGH-PRESSURE FUEL LINES ==================== */}
      <PartNode id="hp-line-1">
        <mesh geometry={hp1} castShadow>
          <Mat color={PAINT} metalness={0.6} roughness={0.3} />
        </mesh>
      </PartNode>
      <PartNode id="hp-line-2">
        <mesh geometry={hp2} castShadow>
          <Mat color={PAINT} metalness={0.6} roughness={0.3} />
        </mesh>
      </PartNode>
      <PartNode id="hp-line-3">
        <mesh geometry={hp3} castShadow>
          <Mat color={PAINT} metalness={0.6} roughness={0.3} />
        </mesh>
      </PartNode>

      <PartNode id="leak-off-rail">
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.52, 8]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
      </PartNode>

      {/* ==================== 15. FOCUS GREEN HOSE & RETURN HOSES ==================== */}
      <PartNode id="return-hose">
        <mesh geometry={returnHoseTube} castShadow>
          <Mat color={GREEN_HOSE} roughness={0.6} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="fuel-return-hose-2">
        <mesh geometry={fuelReturn2} castShadow>
          <Mat color={RUBBER} roughness={0.8} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="fuel-return-hose-3">
        <mesh geometry={fuelReturn3} castShadow>
          <Mat color={RUBBER} roughness={0.8} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-lift-to-filter">
        <mesh geometry={hoseLiftToFilter} castShadow>
          <Mat color={RUBBER} roughness={0.8} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-filter-to-inj">
        <mesh geometry={hoseFilterToInj} castShadow>
          <Mat color={RUBBER} roughness={0.8} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-fuel-supply">
        <mesh geometry={hoseFuelSupply} castShadow>
          <Mat color={RUBBER} roughness={0.8} metalness={0.05} />
        </mesh>
      </PartNode>

      {/* ==================== 16. CLAMPS ==================== */}
      <PartNode id="clamp-1">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.014} isKeystone={true} />
      </PartNode>

      <PartNode id="clamp-2">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.014} isKeystone={true} />
      </PartNode>

      <PartNode id="clamp-sea-pump">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.022} />
      </PartNode>

      <PartNode id="clamp-thermo-1">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.022} />
      </PartNode>

      <PartNode id="clamp-thermo-2">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.022} />
      </PartNode>

      <PartNode id="clamp-fw-pump">
        <ClampBand position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} radius={0.024} />
      </PartNode>

      <PartNode id="clamp-exchanger-in">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.024} />
      </PartNode>

      <PartNode id="clamp-small-cooling">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.014} />
      </PartNode>

      <PartNode id="clamp-fuel-mini">
        <ClampBand position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.014} />
      </PartNode>

      {/* ==================== 17. COOLING HOSES ==================== */}
      <PartNode id="hose-sea-to-heatex">
        <mesh geometry={hoseSeaToHeatex} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-thermostat-manifold">
        <mesh geometry={hoseThermoManifold} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-fw-to-heatex">
        <mesh geometry={hoseFwToHeatex} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-flow-ctrl-1">
        <mesh geometry={hoseFlowCtrl1} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-flow-ctrl-2">
        <mesh geometry={hoseFlowCtrl2} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-sump-drain">
        <mesh geometry={hoseSumpDrain} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-trans-cooler-1">
        <mesh geometry={hoseTransCooler1} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-trans-cooler-2">
        <mesh geometry={hoseTransCooler2} castShadow>
          <Mat color={RUBBER} roughness={0.85} metalness={0.05} />
        </mesh>
      </PartNode>

      <PartNode id="hose-coolant-overflow">
        <mesh geometry={hoseCoolantOverflow}>
          <Mat color="#a0c8d0" opacity={0.5} roughness={0.2} metalness={0.1} />
        </mesh>
      </PartNode>

      {/* ==================== 18. FILTERS & PUMPS (Scale Proportional) ==================== */}
      {/* Racor 500FG / R15T Scale Proportion: H: 24cm, Dia: 10cm */}
      <PartNode id="racor">
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.14, 24]} />
          <Mat color={RACOR_BLUE} metalness={0.2} roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.048, 0.046, 0.10, 24]} />
          <Mat color={BOWL_TINT} roughness={0.25} metalness={0.1} opacity={0.6} />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
          <Mat color={BRASS} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.06, 0.015, 0.015]} />
          <Mat color={BRASS} metalness={0.8} roughness={0.25} />
        </mesh>
      </PartNode>

      {/* Stock Engine-Mounted Secondary Filter (Scale Proportion: Dia: 7.5cm, H: 12cm) */}
      <PartNode id="stock-filter">
        <mesh castShadow>
          <cylinderGeometry args={[0.042, 0.042, 0.12, 18]} />
          <Mat color={ALUM} metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.025, 18]} />
          <Mat color={IRON} />
        </mesh>
      </PartNode>

      {/* 12V Electric Pulse Lift Pump (Scale Proportion: 8cm x 7cm x 6cm) */}
      <PartNode id="lift-pump">
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.07, 0.09]} />
          <Mat color={IRON} />
        </mesh>
        <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.05, 14]} />
          <Mat color={ALUM} />
        </mesh>
      </PartNode>

      {/* Spin-On Oil Filter (Scale Proportion: Dia: 7.6cm, L: 9.5cm) */}
      <PartNode id="oil-filter">
        <mesh rotation={[0, 0, Math.PI / 2.6]} castShadow>
          <cylinderGeometry args={[0.044, 0.044, 0.12, 20]} />
          <Mat color={ALUM} metalness={0.6} roughness={0.3} />
        </mesh>
      </PartNode>

      <PartNode id="oil-dipstick">
        <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.25, 8]} />
          <Mat color={CHROME} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.02, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.016, 0.004, 8, 16]} />
          <Mat color="#e5a015" roughness={0.4} metalness={0.1} />
        </mesh>
      </PartNode>

      {/* ==================== 19. COOLING & MARINE EXCHANGER (STARBOARD FORE-AFT) ==================== */}
      <PartNode id="heat-exchanger">
        {/* Main Cupronickel Cylindrical Body aligned fore-aft along Z axis */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.88, 24]} />
          <Mat color={PAINT} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Forward & Aft Cast Bronze End Caps */}
        {[-0.44, 0.44].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.082, 0.082, 0.04, 20]} />
            <Mat color={BRASS} metalness={0.78} roughness={0.3} />
          </mesh>
        ))}
        {/* Pressure Filler Cap on top forward */}
        <mesh position={[0, 0.085, 0.32]}>
          <cylinderGeometry args={[0.032, 0.032, 0.022, 14]} />
          <Mat color={CHROME} metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Overflow Barb on filler neck */}
        <mesh position={[-0.03, 0.085, 0.32]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.025, 8]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Seawater Inlet Barb (from raw water pump) */}
        <mesh position={[0, -0.065, 0.36]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.04, 10]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Seawater Outlet Barb (aft to wet exhaust mixing elbow) */}
        <mesh position={[0, -0.065, -0.38]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.04, 10]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
      </PartNode>

      <PartNode id="zinc-anode">
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 6]} />
          <Mat color={BRASS} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.010, 0.010, 0.06, 12]} />
          <Mat color="#9aa0a6" metalness={0.7} roughness={0.4} />
        </mesh>
      </PartNode>

      {/* Raw Water Seawater Pump (Mounted on Front Gear Case at [0.26, -0.06, 0.70]) */}
      <PartNode id="raw-water-pump" motion="spin-z">
        {/* Bronze Pump Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.10, 20]} />
          <Mat color={BRASS} metalness={0.75} roughness={0.3} />
        </mesh>
        {/* Front End Plate with 6 Cover Screws */}
        <mesh position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.012, 20]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <mesh key={i} position={[0.06 * Math.cos(angle), 0.06 * Math.sin(angle), 0.062]}>
              <cylinderGeometry args={[0.005, 0.005, 0.004, 6]} />
              <Mat color={IRON} metalness={0.8} />
            </mesh>
          );
        })}
        {/* Top Outlet Hose Barb (pointing up to hose-sea-to-heatex) */}
        <mesh position={[0, 0.07, 0.02]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.05, 12]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Side Inlet Hose Barb */}
        <mesh position={[0.07, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.05, 12]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
      </PartNode>

      {/* Freshwater Circulating Water Pump (Mounted on Upper Front Gear Case at [-0.06, 0.30, 0.66]) */}
      <PartNode id="freshwater-pump" motion="spin-z">
        {/* Centrifugal Scroll Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.095, 0.08, 20]} />
          <Mat color={PAINT} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Circulating Pump Pulley at Z = 0.72 (aligned with Belt) */}
        <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 24]} />
          <Mat color={IRON} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Lower Antifreeze Inlet Neck */}
        <mesh position={[0, -0.06, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.05, 12]} />
          <Mat color={PAINT_DARK} />
        </mesh>
      </PartNode>

      {/* Translucent Coolant Expansion Tank Bottle (Scale Proportion: Dia: 9cm, H: 16cm) */}
      <PartNode id="coolant-bottle">
        <mesh>
          <cylinderGeometry args={[0.045, 0.048, 0.16, 18]} />
          <Mat color="#9ab0b8" opacity={0.4} roughness={0.15} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.044, 0.044, 0.09, 18]} />
          <Mat color="#2ecc71" opacity={0.65} roughness={0.2} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.03, 12]} />
          <Mat color={RUBBER} />
        </mesh>
      </PartNode>

      {/* ==================== 20. ELECTRICAL ==================== */}
      <PartNode id="alternator" motion="spin-z">
        {/* Alternator Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.14, 20]} />
          <Mat color={ALUM} metalness={0.65} roughness={0.3} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
            <boxGeometry args={[0.20, 0.015, 0.10]} />
            <Mat color={IRON} />
          </mesh>
        ))}
        {/* Alternator Pulley at Z = 0.72 (aligned with Belt) */}
        <mesh position={[0, 0, 0.10]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.03, 20]} />
          <Mat color={IRON} metalness={0.8} roughness={0.25} />
        </mesh>
      </PartNode>

      <PartNode id="alt-bracket">
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.18, 0.08]} />
          <Mat color={IRON} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.06, 0.08, 0.05]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.16, 0.03, 0.02]} />
          <Mat color={CHROME} metalness={0.8} roughness={0.2} />
        </mesh>
      </PartNode>

      <PartNode id="alt-adjust-bolt">
        <HexBolt position={[0, 0, 0]} radius={0.016} height={0.028} washer={true} />
      </PartNode>

      <PartNode id="starter">
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.24, 18]} />
          <Mat color={IRON} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.09, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.14, 14]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.14, 0.06, -0.06]}>
          <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
          <Mat color={COPPER} metalness={0.8} roughness={0.25} />
        </mesh>
      </PartNode>

      {/* ==================== 21. DRIVE & TRANSMISSION ==================== */}
      {/* Crankshaft Damper Pulley at [0, 0.02, 0.72] */}
      <PartNode id="pulley" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 28]} />
          <Mat color={IRON} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
      </PartNode>

      {/* Realistic 3-Point Drive V-Belt */}
      <PartNode id="belt">
        <mesh geometry={vBeltLoop} castShadow>
          <Mat color={RUBBER} roughness={0.9} metalness={0} />
        </mesh>
      </PartNode>

      {/* Flywheel Bell Housing (Flush against block rear) */}
      <PartNode id="flywheel-housing">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.29, 0.20, 24]} />
          <Mat color={PAINT} metalness={0.4} roughness={0.45} />
        </mesh>
        {/* Rear Mating Bolt Flange */}
        <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.02, 24]} />
          <Mat color={PAINT_DARK} metalness={0.5} roughness={0.4} />
        </mesh>
      </PartNode>

      {/* Internal Flywheel */}
      <PartNode id="flywheel" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.05, 32]} />
          <Mat color={IRON} metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.242, 0.008, 6, 40]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
      </PartNode>

      {/* Marine Transmission Gearbox (ZF 10M / Hurth HBW-50) */}
      <PartNode id="transmission">
        {/* 1. Forward Bell Housing Adapter Flange (Bolted Flush to Bell Housing at Z = -0.78) */}
        <mesh position={[0, 0, 0.20]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.03, 24]} />
          <Mat color={ALUM} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Adapter Perimeter Bolts */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <HexBolt
              key={i}
              position={[0.22 * Math.cos(angle), 0.22 * Math.sin(angle), 0.215]}
              rotation={[Math.PI / 2, 0, 0]}
              radius={0.012}
              height={0.018}
              washer={true}
            />
          );
        })}

        {/* 2. Main Cast Aluminum Gearcase Body */}
        <mesh position={[0, 0, 0.02]} castShadow>
          <boxGeometry args={[0.30, 0.28, 0.32]} />
          <Mat color={ALUM} metalness={0.55} roughness={0.32} />
        </mesh>

        {/* Horizontal Ribbed Cooling Fins */}
        {[-0.08, -0.02, 0.04, 0.10].map((y) => (
          <mesh key={y} position={[0, y, 0.02]}>
            <boxGeometry args={[0.32, 0.012, 0.30]} />
            <Mat color={ALUM} metalness={0.65} roughness={0.28} />
          </mesh>
        ))}

        {/* Top Inspection / Fill Cover */}
        <mesh position={[0, 0.15, 0.02]}>
          <boxGeometry args={[0.18, 0.02, 0.20]} />
          <Mat color={ALUM} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.17, -0.02]}>
          <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
          <Mat color="#b32424" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Port-side Shift Lever Selector Pivot Boss */}
        <mesh position={[-0.16, 0.10, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 12]} />
          <Mat color={IRON} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* 3. Aft Bearing Carrier & Shaft Extension */}
        <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.085, 0.08, 20]} />
          <Mat color={ALUM} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* 4. Output Propshaft Coupling Flange */}
        <mesh position={[0, 0, -0.23]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.03, 24]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Propshaft 4-bolt coupling pattern */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          return (
            <mesh key={i} position={[0.065 * Math.cos(angle), 0.065 * Math.sin(angle), -0.245]}>
              <cylinderGeometry args={[0.008, 0.008, 0.01, 8]} />
              <Mat color={IRON} metalness={0.8} />
            </mesh>
          );
        })}
      </PartNode>

      {/* External Transmission Oil Cooler on Starboard Bracket */}
      <PartNode id="trans-cooler">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.24, 16]} />
          <Mat color={BRASS} metalness={0.8} roughness={0.25} />
        </mesh>
        {/* End Hose Barbs */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.04, 12]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.04, 12]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Mounting Strap */}
        <mesh position={[-0.02, 0, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.04]} />
          <Mat color={IRON} metalness={0.6} roughness={0.4} />
        </mesh>
      </PartNode>

      {/* Shift Linkage Lever on Port Side (Extends upward/forward outside transmission wall) */}
      <PartNode id="shift-linkage">
        {/* Pivot Boss Cap */}
        <mesh position={[-0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.02, 12]} />
          <Mat color={IRON} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Upward Shift Arm */}
        <mesh position={[-0.01, 0.08, 0.03]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.012, 0.18, 0.018]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Teardrop Shift Grip Knob */}
        <mesh position={[-0.01, 0.17, 0.06]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <Mat color={RUBBER} roughness={0.8} metalness={0.1} />
        </mesh>
      </PartNode>

      {/* Throttle speed control lever on Port side */}
      <PartNode id="throttle">
        <mesh rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.01, 0.01, 0.28, 10]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[-0.02, 0.12, 0]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <Mat color={IRON} />
        </mesh>
      </PartNode>

      {/* ==================== 22. MARINE PROPELLER DRIVESHAFT SYSTEM ==================== */}
      {/* Flexible Shaft Coupling / Drivesaver Disc at [0, -0.04, -1.24] */}
      <PartNode id="driveshaft-coupling" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.025, 24]} />
          <Mat color="#c53a1a" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* 8 Coupling Bolts */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <mesh key={i} position={[0.07 * Math.cos(angle), 0.07 * Math.sin(angle), 0]}>
              <cylinderGeometry args={[0.007, 0.007, 0.035, 8]} />
              <Mat color={CHROME} metalness={0.85} roughness={0.2} />
            </mesh>
          );
        })}
      </PartNode>

      {/* Split Shaft Coupling Hub with Clamping Capscrews at [0, -0.04, -1.32] */}
      <PartNode id="shaft-coupling-hub" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.10, 20]} />
          <Mat color={IRON} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Forward Flange Ring */}
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.02, 24]} />
          <Mat color={CHROME} metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Split Pinch Clamp Hex Screws */}
        <HexBolt position={[0.045, 0.02, -0.01]} rotation={[0, 0, 0]} radius={0.008} height={0.03} washer={false} />
        <HexBolt position={[-0.045, -0.02, -0.01]} rotation={[0, 0, Math.PI]} radius={0.008} height={0.03} washer={false} />
      </PartNode>

      {/* Stainless Steel Propeller Driveshaft at [0, -0.04, -1.75] (Length 0.85) */}
      <PartNode id="prop-driveshaft" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.85, 20]} />
          <Mat color={CHROME} metalness={0.92} roughness={0.15} />
        </mesh>
      </PartNode>

      {/* Bronze Marine Stuffing Box / Packing Gland Shaft Seal at [0, -0.04, -1.48] */}
      <PartNode id="shaft-seal-stuffing">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.048, 0.052, 0.09, 16]} />
          <Mat color={BRASS} metalness={0.8} roughness={0.28} />
        </mesh>
        {/* Bronze Hex Packing Nut */}
        <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.054, 0.054, 0.03, 6]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Water Injection Lube Nipple */}
        <mesh position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
          <Mat color={BRASS} metalness={0.85} roughness={0.25} />
        </mesh>
      </PartNode>

      {/* Heavy-Duty Stern Tube Hose with T-Bolt Clamps at [0, -0.04, -1.58] */}
      <PartNode id="stern-tube-hose">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.14, 16]} />
          <Mat color={RUBBER} roughness={0.9} metalness={0.05} />
        </mesh>
        {/* Dual Stainless T-Bolt Clamps */}
        {[-0.04, 0.04].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.058, 0.005, 8, 20]} />
            <Mat color={CHROME} metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </PartNode>

      {/* Sacrificial Zinc Collar Anode (Shaft Zinc) at [0, -0.04, -1.88] */}
      <PartNode id="shaft-zinc-anode" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.042, 0.042, 0.05, 16]} />
          <Mat color="#9aa0a6" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Streamlined Collar Flutes & 4 Clamp Screws */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <mesh key={i} position={[0.035 * Math.cos(angle), 0.035 * Math.sin(angle), 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.015, 6]} />
              <Mat color={IRON} metalness={0.8} />
            </mesh>
          );
        })}
      </PartNode>

      {/* 3-Blade Authentic Marine Propeller (14RH10 Hydrofoil Blades with Pitch & Cup) */}
      <PartNode id="propeller" motion="spin-z">
        {/* 1. Tapered Marine Bronze Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.036, 0.044, 0.10, 24]} />
          <Mat color={BRASS} metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Forward Streamlined Hub Collar */}
        <mesh position={[0, 0, 0.048]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.01, 24]} />
          <Mat color={BRASS} metalness={0.88} roughness={0.22} />
        </mesh>
        {/* 2. Three 3D Extruded Hydrofoil Blades with Helical Pitch Angle */}
        {Array.from({ length: 3 }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / 3;
          return (
            <group key={i} rotation={[0, 0, angle]}>
              <mesh geometry={propBladeGeom} castShadow receiveShadow>
                <Mat color={BRASS} metalness={0.90} roughness={0.20} />
              </mesh>
            </group>
          );
        })}
      </PartNode>

      {/* Slotted Castle Nut, Cotter Pin & Key at [0, -0.04, -2.18] */}
      <PartNode id="prop-castle-nut" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.03, 6]} />
          <Mat color={BRASS} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Bronze Cotter Pin */}
        <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.004, 0.004, 0.05, 8]} />
          <Mat color={COPPER} metalness={0.8} />
        </mesh>
      </PartNode>

      <PartNode id="engine-mount-nuts">
        {[[-0.38, -0.22, 0.35], [-0.38, -0.22, -0.35], [0.38, -0.22, 0.35], [0.38, -0.22, -0.35]].map((pos, i) => (
          <HexBolt key={i} position={pos as [number, number, number]} radius={0.018} height={0.028} washer={true} />
        ))}
      </PartNode>

      {/* ==================== 23. RUNNING GEAR INTERNALS ==================== */}
      <PartNode id="crankshaft" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 1.05, 18]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
        {[-0.24, 0.04, 0.24].map((z, idx) => (
          <mesh key={z} position={[0.05 * (idx % 2 === 0 ? 1 : -1), 0, z]}>
            <boxGeometry args={[0.12, 0.1, 0.08]} />
            <Mat color={IRON} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </PartNode>

      {([0, 1, 2] as const).map((i) => (
        <PartNode key={`p${i}`} id={`piston-${i + 1}`} motion="piston" index={i}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.112, 0.1, 24]} />
            <Mat color={ALUM} metalness={0.65} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <torusGeometry args={[0.111, 0.004, 6, 24]} />
            <Mat color={IRON} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <torusGeometry args={[0.111, 0.004, 6, 24]} />
            <Mat color={IRON} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.015, 0]}>
            <torusGeometry args={[0.111, 0.006, 6, 24]} />
            <Mat color={IRON} metalness={0.8} roughness={0.2} />
          </mesh>
        </PartNode>
      ))}

      {([0, 1, 2] as const).map((i) => (
        <PartNode key={`r${i}`} id={`rod-${i + 1}`} motion="rod" index={i}>
          <mesh>
            <boxGeometry args={[0.04, 0.22, 0.03]} />
            <Mat color={IRON} metalness={0.65} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.035, 16]} />
            <Mat color={IRON} metalness={0.7} roughness={0.3} />
          </mesh>
          <HexBolt position={[-0.03, -0.1, 0]} radius={0.008} height={0.015} washer={false} />
          <HexBolt position={[0.03, -0.1, 0]} radius={0.008} height={0.015} washer={false} />
        </PartNode>
      ))}

      <PartNode id="camshaft" motion="spin-z">
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 1.0, 16]} />
          <Mat color={CHROME} metalness={0.85} roughness={0.2} />
        </mesh>
        {[-0.30, -0.18, 0.0, 0.08, 0.20, 0.28].map((z, idx) => (
          <mesh key={z} position={[0.02 * Math.cos(idx * 1.2), 0.02 * Math.sin(idx * 1.2), z]}>
            <cylinderGeometry args={[0.038, 0.042, 0.035, 14]} />
            <Mat color={IRON} metalness={0.75} roughness={0.25} />
          </mesh>
        ))}
      </PartNode>
    </group>
  );
}

function FuelParticles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const highlight = useEngineStore((s) => s.highlightSystem);
  const explode = useEngineStore((s) => s.explode);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.56, 0.30, 0.36),
        new THREE.Vector3(0.50, -0.08, 0.36),
        new THREE.Vector3(0.46, 0.18, -0.18),
        new THREE.Vector3(0.44, 0.06, -0.02),
        new THREE.Vector3(0.42, 0.16, -0.12),
        new THREE.Vector3(0.25, 0.48, -0.24),
        new THREE.Vector3(0.26, 0.56, -0.24),
        new THREE.Vector3(0.44, 0.16, 0.08),
      ]),
    [],
  );

  useFrame(() => {
    const show = highlight === "fuel" && explode < 0.45;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      m.visible = show;
      if (!show) return;
      const t = (sim.angle * 0.12 + i / 10) % 1;
      const p = curve.getPointAt(t);
      m.position.copy(p);
    });
  });

  if (highlight !== "fuel") return null;

  return (
    <group>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshStandardMaterial
            color="#e2b15a"
            emissive="#e2b15a"
            emissiveIntensity={0.85}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
