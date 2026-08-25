import type { SystemId } from "./store";

export type LessonStep = {
  title: string;
  body: string;
  select?: string;
  explode?: number;
  running?: boolean;
  cutaway?: boolean;
  highlightSystem?: SystemId;
  hide?: string[];
  restore?: boolean;
  cameraView?: "iso" | "front" | "side" | "top";
  challenge?: string;
  challengeHint?: string;
};

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  minutes: string;
  steps: LessonStep[];
};

export const LESSONS: Lesson[] = [
  {
    id: "meet",
    title: "1. Meet the 20B/30B & Core Specs",
    summary: "Base Mitsubishi L3E architecture, 27 HP rating, displacement, and marine conversion.",
    minutes: "4 min",
    steps: [
      {
        title: "Compact Marine Powerplant",
        body: "The Westerbeke 20B TWO and 30B THREE are marinized versions of the renowned Mitsubishi L2E (2-cylinder, 0.635L, 18 HP) and Mitsubishi L3E (3-cylinder, 0.952L, 27 HP @ 3600 RPM) industrial diesel engines. They feature a high 23:1 compression ratio and indirect swirl pre-combustion chambers.",
        restore: true,
        explode: 0,
        cameraView: "iso",
        running: true,
      },
      {
        title: "The Westerbeke Marine Package",
        body: "What converts an industrial Mitsubishi block into a marine propulsion unit: the freshwater-cooled exhaust manifold (037120), cupronickel heat exchanger (037130), bronze raw-water pump (037140), wet exhaust mixing elbow (037124), and Hurth/ZF reduction gear transmission.",
        select: "heat-exchanger",
        cameraView: "front",
      },
      {
        title: "Reading the Serial Plate",
        body: "The engine identification plate is mounted directly on the freshwater-cooled exhaust manifold. Always record the exact model and serial specification before ordering internal engine parts or injector assemblies.",
        select: "manifold",
        cameraView: "side",
      },
    ],
  },
  {
    id: "fuel-hose-focus",
    title: "2. The Green Return Hose 036868 & Fuel Path",
    summary: "Injector leak-off circuit, 037163 Keystone clamps, and NLA supersession guidance.",
    minutes: "5 min",
    steps: [
      {
        title: "The Focus Part: Hose 036868",
        body: "Highlighted in green, Westerbeke part 036868 is the flexible leak-off hose that returns excess bypass diesel from the injector rail back down into the injection pump return barb. It balances injector backpressure. The factory lists it NLA — high-grade Viton/diesel-rated hose of identical inner/outer diameter is the standard marine replacement.",
        select: "return-hose",
        cameraView: "front",
        highlightSystem: "fuel",
      },
      {
        title: "037163 Keystone Clamps",
        body: "Two 037163 Keystone single-ear crimp clamps secure hose 036868 at each nipple. Never overtighten or use slotted worm-gear clamps that slice through small-diameter rubber. Replace clamps whenever the hose is serviced.",
        select: "clamp-1",
        cameraView: "front",
      },
      {
        title: "High-Pressure Steel Injection Lines",
        body: "The injection pump (037102/037103) pulses fuel through rigid steel lines (036951, 036952, 036953) at ~2,000 PSI (140 bar pop pressure) directly to the injectors (037091). These lines must never be bent or kinked.",
        select: "hp-line-2",
        cameraView: "front",
      },
      {
        title: "Primary & Secondary Filtration",
        body: "Fuel flows from the tank through the bulkhead-mounted Racor R15T (10µm separator with clear water bowl), pushed by the 12V pulse lift pump (039275) through the 2µm secondary filter (030210 / element 030200) before reaching the injection pump.",
        select: "racor",
        cameraView: "front",
      },
    ],
  },
  {
    id: "fasteners-torque",
    title: "3. Nuts, Washers, Studs & Torque Specs",
    summary: "Critical tightening values, thread specs, and spiral sequence rules.",
    minutes: "6 min",
    steps: [
      {
        title: "Cylinder Head Bolts (M10)",
        body: "Torque cylinder head bolts cold to 54.2 – 61.5 lb-ft (73.5 – 83.4 N·m) in three progressive stepped passes (e.g. 20, 40, then final torque) following the published spiral pattern from the center cylinders outward.",
        select: "head",
        cameraView: "top",
      },
      {
        title: "Manifold Studs & Washers",
        body: "M8×25 studs (015830) threaded into the head are fitted with M8 flat washers (031787), helical spring lock washers (031786), and M8 hex nuts (018242). Torque to 18.0 – 21.6 lb-ft (24.5 – 29.4 N·m) to prevent exhaust gasket blowout.",
        select: "manifold-nuts",
        cameraView: "side",
      },
      {
        title: "Connecting Rod Cap & Flywheel Torques",
        body: "Connecting rod cap bolts are torqued to 23.2 – 25.3 lb-ft (31.5 – 34.3 N·m) with lightly oiled threads. Flywheel bolts require 61.5 – 68.7 lb-ft (83.4 – 93.2 N·m) in a star cross-pattern with medium-strength threadlocker.",
        select: "crankshaft",
        cutaway: true,
        cameraView: "iso",
      },
      {
        title: "Valve Cover M6 Capscrews",
        body: "M6 capscrews (018804) with M6 washers (031784 flat / 031783 lock) only require 6.0 – 7.5 lb-ft (8 – 10 N·m). Overtightening warps the stamped steel cover and ruins the cork/rubber gasket.",
        select: "valve-cover-bolts",
        cameraView: "top",
      },
    ],
  },
  {
    id: "banjo-crush-washers",
    title: "4. Banjo Hardware & Single-Use Crush Seals",
    summary: "Copper crush seals, hollow cross-drilled bolts, and fuel priming bleed screws.",
    minutes: "4 min",
    steps: [
      {
        title: "Why Banjo Washers Cannot Be Reused",
        body: "Banjo crush washers (such as 037105 ×2 on the fuel return stack, 030289 M8, 030291 M14, and 036493 on the oil sump) are made of soft annealed copper. When torqued, they plastically deform to seal microscopic imperfections. Once removed, they work-harden and will leak if reused!",
        select: "banjo-return-stack",
        cameraView: "front",
      },
      {
        title: "Bleeding Trapped Air (037110 Bolt)",
        body: "Air in diesel lines prevents starting. Loosen the cross-drilled banjo bleed bolt (037110) on top of the injection pump gallery while the 12V electric lift pump clicks until bubble-free fuel emerges, then snug the bolt.",
        select: "banjo-bolt-bleed",
        cameraView: "front",
      },
      {
        title: "Oil Sump Banjo Drain (036819 & 033691)",
        body: "The bottom oil pan port uses hollow banjo bolt 036819 and dual 036493 copper crush washers to attach remote drain hose 033691. Always ensure the hose end brass plug is wire-locked or snug to prevent accidental oil loss into the bilge.",
        select: "banjo-sump-bolt",
        cameraView: "side",
      },
    ],
  },
  {
    id: "cooling-marine",
    title: "5. Dual-Circuit Marine Cooling & Zinc Anode",
    summary: "Closed freshwater loop, raw seawater pump, cupronickel exchanger, and sacrificial zincs.",
    minutes: "5 min",
    steps: [
      {
        title: "Closed Loop vs. Raw Water Loop",
        body: "The closed loop circulates 50/50 ethylene glycol antifreeze through the block, head, and manifold via the internal circulating pump (037145). The raw water pump (037140) draws cold seawater through the heat exchanger tubes and discharges it out the wet exhaust mixing elbow.",
        select: "raw-water-pump",
        highlightSystem: "cooling",
        cameraView: "front",
      },
      {
        title: "Pencil Zinc Anode (011885)",
        body: "Threaded into the bottom of the heat exchanger is a 1/4\" NPT brass plug holding a sacrificial zinc rod (011885). Check it every 30 to 60 days in saltwater. When 50% eroded, replace it immediately to prevent galvanic destruction of the cupronickel tube stack.",
        select: "zinc-anode",
        cameraView: "side",
      },
      {
        title: "Neoprene Impeller Service",
        body: "The bronze raw-water pump uses a 6-blade neoprene impeller (036618). Never start the engine dry without water supply. Replace the impeller annually or immediately if vanes are curved or missing.",
        select: "raw-water-pump",
        cameraView: "front",
      },
    ],
  },
  {
    id: "full-strip",
    title: "6. Modular Disassembly & Service Order",
    summary: "Follow the true mechanical strip order from accessories to block internals.",
    minutes: "6 min",
    steps: [
      {
        title: "Step 1: Outer Belts & Accessories",
        body: "Begin by loosening alternator tensioner bolt 015887, removing drive belt 037168, crank pulley 036912, and alternator 037170.",
        select: "belt",
        explode: 0.25,
        cameraView: "iso",
      },
      {
        title: "Step 2: Fuel Lines & Return Stack",
        body: "Release Keystone clamps 037163, pull focus hose 036868, high-pressure lines 036951/52/53, and remove the fuel injectors 037091.",
        select: "return-hose",
        explode: 0.5,
        cameraView: "front",
      },
      {
        title: "Step 3: Manifold & Heat Exchanger",
        body: "Unbolt cooling hose clamps, remove heat exchanger 037130, unbolt M8 manifold nuts 018242, and lift off exhaust manifold 037120.",
        select: "manifold",
        explode: 0.75,
        cameraView: "side",
      },
      {
        title: "Step 4: Running Gear Exposure",
        body: "Remove valve cover, cylinder head 036901, lower oil pan 036908, and gearbox 037150 to expose the rotating crankshaft, connecting rods, and pistons.",
        select: "crankshaft",
        explode: 1.0,
        cutaway: true,
        cameraView: "iso",
      },
    ],
  },
];
