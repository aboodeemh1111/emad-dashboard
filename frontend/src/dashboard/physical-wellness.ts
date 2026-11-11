import { svg, type TemplateResult } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  circleFace,
  display,
  line3,
  pipe,
  polygon3,
  project,
  type Point3,
} from "./isometric-primitives";
import { fluidShell, fluidTube, fluidBand } from "./physical-water";
import { isWellness } from "./wellness-model";

const pane = (
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  cls: string,
) =>
  polygon3(
    [
      [x, y, z],
      [x + w, y, z],
      [x + w, y, z + h],
      [x, y, z + h],
    ],
    cls,
  );
const plane = (z: number) => {
  const [x, y] = project([0, 0, z]);
  return `matrix(.92 .46 -.92 .46 ${x} ${y})`;
};
const roundPlane = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  r = 5,
): Point3[] =>
  [
    [x + r, y + r, Math.PI],
    [x + w - r, y + r, Math.PI * 1.5],
    [x + w - r, y + d - r, 0],
    [x + r, y + d - r, Math.PI * 0.5],
  ].flatMap(([cx, cy, a]) =>
    Array.from(
      { length: 5 },
      (_, i) =>
        [
          cx + Math.cos(a + (i * Math.PI) / 8) * r,
          cy + Math.sin(a + (i * Math.PI) / 8) * r,
          z,
        ] as Point3,
    ),
  );
const waterCircle = (r: number, z: number): Point3[] =>
  Array.from({ length: 48 }, (_, i) => [
    Math.cos((i * Math.PI) / 24) * r,
    Math.sin((i * Math.PI) / 24) * r,
    z,
  ]);
const output = (s: DeviceVisualState) =>
  s.available && s.hasTelemetry && Number.isFinite(s.level)
    ? Math.max(0, Math.min(100, s.level)) / 100
    : 0;
const screw = (p: Point3, r = 1) => {
  const [x, y] = project(p);
  return svg`<g class="wl-screw"><circle cx=${x} cy=${y} r=${r}/><path d=${`M${x - r * 0.6} ${y - r * 0.3}l${r * 1.2} ${r * 0.6}`}/></g>`;
};
const union = (axis: "x" | "y" | "z", c: Point3, at: number, r = 6) =>
  svg`${fluidTube(axis, c, at - 3, at + 3, r, "wl-pvc")}${fluidTube(axis, c, at - 1.2, at + 1.2, r + 1, "wl-union-nut")}`;
const cable = (p: Point3[]) => line3(p, "wl-cable");
const flow = (p: Point3[], on: boolean, width = 5) =>
  svg`<g class="wl-plumbing">${pipe(p, false, width)}${on ? line3(p, "wl-flowline") : svg``}</g>`;
const screen = (
  x: number,
  y: number,
  z: number,
  text: string,
  w = 22,
  h = 11,
) => svg`<g class="wl-controller-screen">${display(x, y, z, w, h, text)}</g>`;
const currentLabel = (s: DeviceVisualState, unit = "%") =>
  s.hasTelemetry && (s.example || s.hasLevel)
    ? `${Math.round(s.level)}${unit}`
    : s.powerOn === undefined
      ? "—"
      : s.powerOn
        ? "●"
        : "—";
const indicator = (p: Point3, on: boolean) =>
  circleFace(...p, 1.3, on ? "wl-led-on" : "wl-led-off");
function rotor(
  p: Point3,
  r: number,
  on: boolean,
  speed: number,
  axis: "x" | "y" = "y",
) {
  const [x, y] = project(p);
  return svg`<g transform=${`matrix(${axis === "x" ? "-.92" : ".92"} .46 0 -1 ${x} ${y})`}><circle class="wl-fan-recess" r=${r + 1}/><g class="wl-rotor ${on ? "wl-spinning" : ""}" style=${`--wl-cycle:${Math.max(0.35, 2 - speed * 0.016)}s`}>${[0, 90, 180, 270].map((a) => svg`<path class="wl-fan-blade" transform=${`rotate(${a})`} d=${`M0 0Q${r * 0.15} ${r} ${r * 0.8} ${r * 0.45}Q${r * 0.9} ${-r * 0.15} 0 0`}/>`)}</g>${[0.48, 0.72, 0.94].map((v) => svg`<circle class="wl-fan-guard" r=${r * v}/> `)}${[0, 45, 90, 135].map((a) => svg`<path class="wl-fan-guard" transform=${`rotate(${a})`} d=${`M${-r} 0H${r}`}/> `)}<circle r="2.8" class="wl-chrome-face"/></g>`;
}
function pressureGauge(p: Point3, value?: number) {
  const [x, y] = project(p);
  const angle = ((-140 + ((value ?? 0) / 6) * 280) * Math.PI) / 180;
  return svg`<g class="wl-pressure-gauge" transform=${`matrix(.92 .46 0 -1 ${x} ${y})`}><circle r="7.5" class="wl-chrome-face"/><circle r="6" class="wl-gauge-face"/>${Array.from(
    { length: 7 },
    (_, i) => {
      const a = ((-140 + (i * 280) / 6) * Math.PI) / 180;
      return svg`<path class="wl-gauge-tick" d=${`M${Math.sin(a) * 4.5} ${Math.cos(a) * 4.5}L${Math.sin(a) * 5.3} ${Math.cos(a) * 5.3}`}/>`;
    },
  )}${value !== undefined ? svg`<path class="wl-gauge-needle" d=${`M0 0L${Math.sin(angle) * 4.4} ${Math.cos(angle) * 4.4}`}/>` : svg`<path class="wl-gauge-tick" d="M-2 0H2"/>`}<circle r=".7" class="wl-metal-face"/></g>`;
}
function controller(
  x: number,
  y: number,
  z: number,
  label: string,
  on: boolean,
) {
  return svg`${box(x, y - 4, z, 31, 8, 27, "wl-control-box")}${screen(x + 3, y + 4.2, z + 12, label, 25, 11)}${indicator([x + 6, y + 4.4, z + 6], on)}${[0, 1, 2].map((i) => circleFace(x + 15 + i * 5, y + 4.3, z + 6, 1.3, "wl-control-key"))}`;
}
function pump(s: DeviceVisualState) {
  const level = output(s);
  const on = level > 0;
  return svg`<g class="wl-circulation-pump">${box(-56, -24, 0, 114, 48, 5, "wl-equipment-pad")}${box(-7, -11, 5, 53, 22, 5, "wl-pump-feet")}${fluidTube("x", [0, 0, 26], -5, 40, 14, "wl-motor")}${Array.from(
    { length: 11 },
    (_, i) => {
      const a = (i * Math.PI) / 10;
      return line3(
        [
          [-1, 14.5 * Math.cos(a), 26 + 14.5 * Math.sin(a)],
          [35, 14.5 * Math.cos(a), 26 + 14.5 * Math.sin(a)],
        ],
        "wl-cooling-fin",
      );
    },
  )}${box(9, -8, 40, 24, 16, 10, "wl-drive-housing")}${screen(11, 8.3, 43, currentLabel(s), 20, 6)}${fluidTube("x", [0, 0, 26], 38, 45, 14.4, "wl-motor")}${rotor([45.3, 0, 26], 10, on, s.speed, "x")}${fluidShell(
    "z",
    [-9, 0, 0],
    [
      [7, 9],
      [14, 15],
      [32, 15],
      [40, 7],
    ],
    "wl-volute",
  )}${flow(
    [
      [-64, 0, 24],
      [-31, 0, 24],
      [-9, 0, 24],
    ],
    on && s.flowAvailable === true,
    8,
  )}${union("x", [0, 0, 24], -57, 7)}${fluidShell(
    "z",
    [-32, 0, 0],
    [
      [7, 10],
      [10, 14],
      [40, 14],
      [44, 11],
    ],
    "wl-strainer-case",
  )}${pane(-43, 10, 14, 21, 23, "wl-strainer-window")}${Array.from(
    { length: 7 },
    (_, i) =>
      line3(
        [
          [-41 + i * 3, 11, 15],
          [-41 + i * 3, 11, 35],
        ],
        "wl-basket-mesh",
      ),
  )}${[19, 25, 31].map((z) =>
    line3(
      [
        [-42, 11, z],
        [-22, 11, z],
      ],
      "wl-basket-mesh",
    ),
  )}${fluidTube("z", [-32, 0, 0], 42, 45, 15, "wl-lid-lock")}${polygon3(
    waterCircle(12, 46).map(([x, y, z]) => [x - 32, y, z] as Point3),
    "wl-clear-lid",
  )}${[-1, 1].map((sign) => screw([-32 + sign * 12, 0, 46], 1.1))}${flow(
    [
      [-9, 0, 37],
      [-9, 0, 51],
      [-9, -30, 51],
    ],
    on && s.flowAvailable === true,
    7,
  )}${union("y", [-9, 0, 51], -23, 6)}${screw([-20, 12, 12], 1.6)}${cable([
    [25, -7, 48],
    [39, -13, 44],
    [49, -21, 18],
    [59, -21, 8],
  ])}</g>`;
}
function filter(s: DeviceVisualState) {
  const on = output(s) > 0 && s.flowAvailable === true;
  const phase = s.processPhase ?? "unknown";
  const p = s.processProgress ?? 100;
  const angle =
    phase === "filter"
      ? 0
      : p < 12
        ? (p / 12) * 60
        : p < 60
          ? 60
          : p < 68
            ? 60 + ((p - 60) / 8) * 60
            : p < 92
              ? 120
              : (120 * (100 - p)) / 8;
  const back = phase === "backwash";
  const rinse = phase === "rinse";
  const [vx, vy] = project([0, 0, 100]);
  return svg`<g class="wl-sand-filter" data-filter-phase=${phase} data-valve-angle=${Number.isFinite(angle) ? angle : 0}>${fluidShell(
    "z",
    [0, 0, 0],
    [
      [0, 20],
      [7, 22],
      [12, 20],
    ],
    "wl-filter-foot",
  )}${fluidShell(
    "z",
    [0, 0, 0],
    [
      [10, 17],
      [18, 31],
      [57, 34],
      [74, 25],
      [80, 10],
    ],
    "wl-fiberglass",
  )}${pane(-23, 24, 22, 46, 35, "wl-filter-cutaway")}${pane(-22, 24.3, 23, 44, 24, "wl-sand-bed")}${Array.from({ length: 45 }, (_, i) => circleFace(-20 + ((i * 13) % 41), 24.6, 25 + ((i * 7) % 21), 0.65, "wl-sand-grain"))}${flow(
    [
      [0, 23, 24],
      [0, 23, 63],
    ],
    on && back,
    2,
  )}${[-1, 1].map((sign) =>
    flow(
      [
        [0, 24.6, 25],
        [sign * 20, 24.6, 25],
      ],
      on,
      2,
    ),
  )}${line3(
    [
      [0, 24.8, 24],
      [0, 24.8, 63],
    ],
    "wl-filter-riser",
  )}${fluidTube("z", [0, 0, 0], 80, 86, 8, "wl-pvc")}${fluidTube("z", [0, 0, 0], 86, 96, 13, "wl-multiport")}${fluidBand(0, 0, 96, 13, "wl-valve-ring")}${flow(
    [
      [-52, 0, 89],
      [0, 0, 89],
    ],
    on,
    6,
  )}${union("x", [0, 0, 89], -39, 6)}${flow(
    [
      [0, 5, 89],
      [41, 5, 89],
    ],
    on && !back && !rinse,
    6,
  )}${flow(
    [
      [0, -5, 89],
      [20, -24, 89],
      [42, -24, 22],
    ],
    on && (back || rinse),
    5,
  )}${pressureGauge([19, 10, 77], s.pressure)}<g transform=${`matrix(.92 .46 -.92 .46 ${vx} ${vy})`}><g class="wl-multiport-handle" transform=${`rotate(${Number.isFinite(angle) ? angle : 0})`}><path d="M-2-3H2L4 21H-4Z" class="wl-handle"/><circle r="4" class="wl-control-key"/></g></g>${screw([-12, 0, 96])}${screw([12, 0, 96])}</g>`;
}
function heater(s: DeviceVisualState, heatPump: boolean) {
  const on = s.available && (heatPump ? s.active : !!s.heating);
  if (heatPump) {
    return svg`<g class="wl-pool-heat-pump">${box(-41, -24, 0, 82, 48, 6, "wl-equipment-pad")}${box(-39, -22, 6, 78, 44, 67, "wl-heat-pump-case")}${[
      -36, -31, -26,
    ].map((x) =>
      line3(
        [
          [x, -22.3, 11],
          [x, -22.3, 68],
        ],
        "wl-cooling-fin",
      ),
    )}${Array.from({ length: 14 }, (_, i) =>
      line3(
        [
          [39.3, -19 + i * 2.8, 13],
          [39.3, -19 + i * 2.8, 67],
        ],
        "wl-coil-fin",
      ),
    )}${rotor([-1, 22.5, 41], 24, on, s.speed)}${screen(-33, 22.8, 63, s.temperature === undefined ? "—" : `${s.temperature.toFixed(1)}°`, 24, 7)}${flow(
      [
        [-45, -13, 23],
        [-51, -13, 23],
        [-51, -30, 23],
      ],
      on && s.flowAvailable === true,
      5,
    )}${flow(
      [
        [-45, -13, 41],
        [-51, -13, 41],
        [-51, -30, 41],
      ],
      on && s.flowAvailable === true,
      5,
    )}${[23, 41].map((z) => union("x", [0, -13, z], -44, 5))}${cable([
      [32, -22, 10],
      [44, -28, 6],
      [55, -25, 6],
    ])}${
      on
        ? svg`<g class="wl-warm-air">${[-12, 0, 12].map((x) =>
            line3(
              [
                [x, 36, 30],
                [x, 48, 32],
                [x + 3, 55, 33],
              ],
              "wl-air-wisp",
            ),
          )}</g>`
        : svg``
    }</g>`;
  }
  return svg`<g class="wl-inline-heater">${box(-45, -20, 0, 90, 40, 5, "wl-equipment-pad")}${fluidTube("x", [0, 0, 26], -31, 31, 15, "wl-stainless")}${[-28, 28].map((x) => fluidTube("x", [0, 0, 26], x - 2, x + 2, 17, "wl-end-flange"))}${flow(
    [
      [-61, 0, 26],
      [-31, 0, 26],
    ],
    on && s.flowAvailable === true,
    7,
  )}${flow(
    [
      [31, 0, 26],
      [61, 0, 26],
    ],
    on && s.flowAvailable === true,
    7,
  )}${[-46, 46].map((x) => union("x", [0, 0, 26], x, 7))}${pane(-25, 12, 20, 50, 13, "wl-heater-cutaway")}${line3(
    Array.from(
      { length: 33 },
      (_, i) =>
        [-24 + i * 1.5, 12.3, 26 + Math.sin((i * Math.PI) / 2) * 4] as Point3,
    ),
    on ? "wl-element-on" : "wl-element-off",
  )}${box(-20, -7, 41, 40, 17, 18, "wl-control-box")}${screen(-16, 10.3, 47, s.temperature === undefined ? "—" : `${s.temperature.toFixed(1)}°`, 32, 8)}${indicator([14, 10.5, 44], on)}${cable(
    [
      [16, -6, 50],
      [29, -14, 41],
      [40, -18, 7],
    ],
  )}</g>`;
}
function cell(s: DeviceVisualState) {
  const n = output(s);
  const on = n > 0 && s.flowAvailable === true;
  return svg`<g class="wl-salt-chlorinator">${controller(-45, -24, 49, currentLabel(s), s.powerOn === true)}${box(-53, -29, 47, 46, 2, 32, "wl-panel-backplate")}${flow(
    [
      [-62, 8, 23],
      [-35, 8, 23],
    ],
    s.flowAvailable === true,
    7,
  )}${flow(
    [
      [32, 8, 23],
      [62, 8, 23],
    ],
    s.flowAvailable === true,
    7,
  )}${[-35, 32].map((x) => union("x", [0, 8, 23], x, 9))}${fluidTube("x", [0, 8, 23], -30, 28, 12, "wl-cell-transparent")}${Array.from({ length: 9 }, (_, i) => pane(-23 + i * 5.5, 17, 16, 2.2, 14, "wl-electrode"))}${
    on
      ? svg`<g class="wl-cell-bubbles" style=${`opacity:${Math.sqrt(n)}`}>${Array.from(
          { length: 9 },
          (_, i) => {
            const [x, y] = project([-20 + i * 5, 18, 20 + (i % 3) * 3]);
            return svg`<circle class="wl-rising-bubble" style=${`--wl-delay:${-i * 0.17}s`} cx=${x} cy=${y} r=${0.8 + (i % 2) * 0.3}/> `;
          },
        )}</g>`
      : svg``
  }${fluidTube("z", [8, 8, 0], 35, 42, 4, "wl-electrode-connector")}${cable([
    [8, 8, 42],
    [8, 2, 65],
    [-15, -20, 65],
  ])}${fluidTube("z", [-12, 8, 0], 35, 40, 2, "wl-flow-switch")}${cable([
    [-12, 8, 40],
    [-22, -2, 43],
    [-35, -20, 48],
  ])}</g>`;
}
function dosing(s: DeviceVisualState) {
  const on = output(s) > 0 && s.flowAvailable === true;
  return svg`<g class="wl-dosing-controller">${box(-48, -9, 15, 96, 15, 66, "wl-dosing-panel")}${screen(-40, 6.3, 62, s.example ? `pH ${s.value.toFixed(1)}` : "pH / ORP", 42, 12)}${indicator([32, 6.5, 70], s.powerOn === true)}${[
    -23, 22,
  ].map((x, i) => {
    const [px, py] = project([x, 9, 41]);
    const selected =
      s.mode === (i === 0 ? "wellness_acid" : "wellness_sanitizer");
    return svg`<g class=${i === 0 ? "wl-acid-line" : "wl-sanitizer-line"}>${circleFace(x, 8.5, 41, 16, "wl-dose-pump-case")}<g transform=${`matrix(.92 .46 0 -1 ${px} ${py})`}><path class="wl-peristaltic-tube" d="M-11-16V0a11 11 0 1 0 22 0v-16"/><g class="wl-dose-rotor ${on && selected ? "wl-spinning" : ""}">${[0, 120, 240].map((a) => svg`<g transform=${`rotate(${a})`}><path class="wl-roller-arm" d="M0 0V8"/><circle class="wl-dose-roller" cy="8" r="3"/></g>`)}</g><circle class="wl-chrome-face" r="3"/></g>${line3(
      [
        [x - 11, 9, 25],
        [x - 11, 9, 6],
        [x - 11, 20, 6],
      ],
      "wl-chemical-tube",
    )}${line3(
      [
        [x + 11, 9, 25],
        [x + 11, 9, 6],
        [x + 11, 28, 6],
      ],
      on && selected ? "wl-chemical-tube wl-flowline" : "wl-chemical-tube",
    )}${fluidTube("z", [x - 11, 20, 0], 0, 9, 4, "wl-suction-foot")}${fluidTube("z", [x + 11, 28, 0], 0, 10, 2, "wl-injection-valve")}</g>`;
  })}${[
    [-43, 22],
    [43, 22],
    [-43, 75],
    [43, 75],
  ].map(([x, z]) => screw([x, 6.5, z]))}${cable([
    [44, -4, 32],
    [55, -14, 24],
    [57, -20, 6],
  ])}</g>`;
}
function basin(
  s: DeviceVisualState,
  id: string,
  kind: "level" | "cover" | "light" | "spa",
) {
  const spa = kind === "spa";
  const w = spa ? 104 : 126;
  const d = spa ? 76 : 78;
  const x = -w / 2;
  const y = -d / 2;
  const known = kind !== "level" || s.hasLevel;
  const waterZ =
    kind === "level" ? 6 + Math.max(0, Math.min(100, s.level)) * 0.23 : 26;
  const surface = roundPlane(x + 6, y + 6, waterZ, w - 12, d - 12, spa ? 9 : 3);
  const floor = roundPlane(x + 6, y + 6, 5, w - 12, d - 12, spa ? 9 : 3);
  const waterId = `${id}-water-surface`;
  const floorId = `${id}-receiver`;
  const grad = `${id}-water`;
  const spill = `${id}-spill`;
  const light = kind === "light" ? Math.sqrt(output(s)) : 0;
  const jets = spa ? output(s) : 0;
  return svg`<g class="wl-basin wl-basin-${kind}" data-water-level=${kind === "level" ? (s.hasLevel ? s.level : "unknown") : "scene"} data-jets=${jets.toFixed(3)}>
 <defs><clipPath id=${waterId}>${polygon3(surface)}</clipPath><clipPath id=${floorId}>${polygon3(floor)}</clipPath><linearGradient id=${grad} x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a5d9db" stop-opacity=".6"/><stop offset=".55" stop-color="#4eafc0" stop-opacity=".65"/><stop offset="1" stop-color="#388e9f" stop-opacity=".8"/></linearGradient><radialGradient id=${spill}><stop stop-color="color-mix(in srgb, var(--wl-light-color) 60%, white)" stop-opacity=".96"/><stop offset=".35" stop-color="var(--wl-light-color)" stop-opacity=".66"/><stop offset=".75" stop-color="var(--wl-light-color)" stop-opacity=".18"/><stop offset="1" stop-color="var(--wl-light-color)" stop-opacity="0"/></radialGradient></defs>
 ${box(x - 5, y - 5, 0, w + 10, d + 10, 5, "wl-pool-foundation")}${box(x, y, 5, w, 6, 27, "wl-pool-tile")}${box(x, y + 6, 5, 6, d - 6, 27, "wl-pool-tile")}${polygon3(floor, "wl-pool-floor")}${Array.from(
   { length: 11 },
   (_, i) =>
     line3(
       [
         [x + 7 + (i * (w - 14)) / 10, y + 6, 5.2],
         [x + 7 + (i * (w - 14)) / 10, y + d - 6, 5.2],
       ],
       "wl-tile-joint",
     ),
 )}${Array.from({ length: 7 }, (_, i) =>
   line3(
     [
       [x + 6, y + 7 + (i * (d - 14)) / 6, 5.2],
       [x + w - 6, y + 7 + (i * (d - 14)) / 6, 5.2],
     ],
     "wl-tile-joint",
   ),
 )}${Array.from({ length: 10 }, (_, i) =>
   line3(
     [
       [x + 8 + (i * (w - 16)) / 9, y + 6.2, 6],
       [x + 8 + (i * (w - 16)) / 9, y + 6.2, 30],
     ],
     "wl-tile-joint",
   ),
 )}${[12, 21, 29].map((z) =>
   line3(
     [
       [x + 6, y + 6.2, z],
       [x + w - 6, y + 6.2, z],
     ],
     "wl-tile-joint",
   ),
 )}
 ${kind === "light" ? svg`${circleFace(0, y + 6.5, 18, 7, "wl-pool-light-ring")}${circleFace(0, y + 6.8, 18, 5, "wl-pool-light-glass")}<g class="wl-underwater-emission" opacity=${light}>${circleFace(0, y + 7, 18, 5, "wl-pool-led")}<g clip-path=${`url(#${floorId})`}><g transform=${plane(5.3)}><ellipse cy="-2" rx="49" ry="33" fill=${`url(#${spill})`}/>${[-18, 0, 18].map((v) => svg`<path class="wl-lit-caustic" d=${`M-47 ${v}q13 -6 26 0t26 0t26 0`}/>`)}</g></g></g>` : svg``}
 ${
   known && waterZ > 6
     ? svg`${polygon3(
         [
           [x + 6, y + d - 6, 6],
           [x + w - 6, y + d - 6, 6],
           [x + w - 6, y + d - 6, waterZ],
           [x + 6, y + d - 6, waterZ],
         ],
         "wl-water-depth",
       )}${polygon3(
         [
           [x + w - 6, y + 6, 6],
           [x + w - 6, y + d - 6, 6],
           [x + w - 6, y + d - 6, waterZ],
           [x + w - 6, y + 6, waterZ],
         ],
         "wl-water-depth",
       )}${polygon3(surface, "wl-water-surface", `fill:url(#${grad})`)}<g clip-path=${`url(#${waterId})`}><g transform=${plane(waterZ + 0.1)}>${[-22, -8, 7, 22].map((v, i) => svg`<path class="wl-water-glint" style=${`--wl-delay:${-i * 0.65}s`} d=${`M-62 ${v}q13 -4 26 0t26 0t26 0t26 0`}/>`)}</g></g>`
     : svg``
 }
 ${kind === "light" ? svg`<g class="wl-pool-light-source" opacity=${light}>${circleFace(0, y + 7.2, 18, 4.7, "wl-pool-led")}<g clip-path=${`url(#${waterId})`}><g transform=${plane(waterZ + 0.2)}><ellipse class="wl-water-light-spill" cx="0" cy="-6" rx="47" ry="28" fill=${`url(#${spill})`} opacity=".65"/></g></g></g>` : svg``}
 ${!known ? svg`${polygon3(roundPlane(x + 6, y + 6, 17, w - 12, d - 12), "wl-unknown-water")}` : svg``}
 ${spa ? svg`${[-26, 24].map((v) => svg`${box(v - 11, y + 3, 25, 22, 9, 7, "wl-spa-headrest")}${circleFace(v, y + 7, 20, 2.6, "wl-spa-jet")}`)}${jets > 0 ? svg`<g clip-path=${`url(#${waterId})`} class="wl-spa-bubbles" opacity=${Math.sqrt(jets)}><g transform=${plane(waterZ + 0.3)}>${Array.from({ length: 18 }, (_, i) => svg`<circle class="wl-spa-bubble" style=${`--wl-delay:${-i * 0.13}s`} cx=${-37 + ((i * 17) % 75)} cy=${-22 + ((i * 11) % 45)} r=${1.2 + (i % 3) * 0.55}/>`)}</g></g>` : svg``}` : svg``}
 ${box(x, y + d - 6, 5, w, 6, 27, spa ? "wl-spa-skirt" : kind === "level" ? "wl-pool-cutaway" : "wl-pool-concrete")}${box(x + w - 6, y + 6, 5, 6, d - 12, 27, spa ? "wl-spa-skirt" : kind === "level" ? "wl-pool-cutaway" : "wl-pool-concrete")}${[
   0, 1, 2, 3, 4, 5, 6, 7,
 ].map((i) =>
   spa
     ? line3(
         [
           [x + 7 + i * 13, y + d + 0.1, 7],
           [x + 7 + i * 13, y + d + 0.1, 29],
         ],
         "wl-spa-panel-joint",
       )
     : svg``,
 )}${box(x - 2, y - 2, 32, w + 4, 8, 4, "wl-pool-coping")}${box(x - 2, y + 6, 32, 8, d - 12, 4, "wl-pool-coping")}${box(x - 2, y + d - 6, 32, w + 4, 8, 4, "wl-pool-coping")}${box(x + w - 6, y + 6, 32, 8, d - 12, 4, "wl-pool-coping")}
 ${
   kind === "level"
     ? svg`<g class="wl-level-probe">${box(-24, y - 2, 36, 24, 10, 7, "wl-probe-head")}${screen(-21, y + 8.2, 37, s.hasLevel ? `${Math.round(s.level)}%` : s.hasTelemetry && s.valueUnit ? `${s.value}${s.valueUnit}` : "—", 18, 5)}${[
         -17, -10, -3,
       ].map((v, i) =>
         line3(
           [
             [v, y + 10, 38],
             [v, y + 10, 9 + i * 8],
           ],
           "wl-level-electrode",
         ),
       )}${box(18, y + 5, 24, 21, 2, 8, "wl-skimmer")}${pane(20, y + 7.3, 25, 17, 5, "wl-skimmer-mouth")}${cable(
         [
           [-17, y + 2, 41],
           [-31, y - 7, 40],
           [-37, y - 13, 9],
         ],
       )}</g>`
     : svg``
 }
 ${kind === "cover" ? cover(s, w, d) : svg``}${spa ? svg`${controller(15, y - 12, 40, s.temperature === undefined ? "—" : `${s.temperature.toFixed(1)}°`, s.powerOn === true)}${box(x - 10, y + d - 16, 0, 15, 25, 10, "wl-spa-step")}${box(x - 10, y + d - 16, 10, 10, 25, 9, "wl-spa-step")}` : svg``}
 </g>`;
}
function cover(s: DeviceVisualState, w: number, d: number) {
  const opening = s.hasPosition
    ? Math.max(0, Math.min(100, s.position))
    : undefined;
  const end = -w / 2 + 8 + (w - 16) * (1 - (opening ?? 100) / 100);
  const known = opening !== undefined;
  const on = s.active && s.available;
  const [x, y] = project([-w / 2 - 3, d / 2 + 1, 46]);
  return svg`<g class="wl-pool-cover" data-opening=${opening ?? "unknown"}>${[-d / 2 + 1, d / 2 - 5].map((v) => box(-w / 2 - 10, v, 34, 15, 6, 14, "wl-cover-support"))}${fluidTube("y", [-w / 2 - 3, 0, 46], -d / 2, d / 2, 7 + (opening ?? 0) * 0.035, "wl-cover-roll")}${fluidTube("y", [-w / 2 - 3, 0, 46], d / 2, d / 2 + 4, 8, "wl-cover-motor")}<g transform=${`matrix(.92 .46 0 -1 ${x} ${y})`}><g class="wl-cover-spindle ${on ? "wl-cover-turning" : ""}" style=${`--wl-cover-direction:${s.processPhase === "closing" || (s.example && s.target !== undefined && s.target < s.position) ? "reverse" : "normal"}`}><circle class="wl-chrome-face" r="5"/><path class="wl-roll-spiral" d="M0 0q-3-3-3 1t6 1q2-6-4-7"/></g></g>${
    known
      ? Array.from(
          { length: Math.ceil(Math.max(0, end - (-w / 2 + 8)) / 5.5) },
          (_, i) => {
            const slatX = -w / 2 + 8 + i * 5.5;
            return box(
              slatX,
              -d / 2 + 8,
              34,
              Math.min(5.2, end - slatX),
              d - 16,
              1.8,
              "wl-cover-slat",
            );
          },
        )
      : svg``
  }${known && opening < 100 ? svg`${fluidTube("y", [end, 0, 35.5], -d / 2 + 7, d / 2 - 7, 1.4, "wl-cover-leading-edge")}` : svg``}${cable(
    [
      [-w / 2 - 3, d / 2 + 4, 44],
      [-w / 2 - 13, d / 2 + 8, 39],
      [-w / 2 - 13, d / 2 + 8, 5],
    ],
  )}</g>`;
}
function fountain(s: DeviceVisualState, id: string) {
  const n = output(s);
  const on = n > 0;
  const height = 53 * n ** 0.65;
  const crown = s.mode !== "wellness_column";
  const ends: Point3[] = crown
    ? [
        [-26, 8, 17],
        [25, 10, 17],
        [1, 31, 17],
        [-17, -24, 17],
        [20, -20, 17],
      ]
    : [[9, 3, 17]];
  const waterId = `${id}-fountain-surface`;
  const [x, y] = project([0, 0, 16]);
  return svg`<g class="wl-fountain" data-jet-intensity=${n.toFixed(3)} data-jet-height=${height.toFixed(2)}><defs><clipPath id=${waterId}>${polygon3(waterCircle(41, 16))}</clipPath></defs>${fluidShell(
    "z",
    [0, 0, 0],
    [
      [0, 38],
      [5, 47],
      [17, 47],
      [20, 42],
    ],
    "wl-fountain-stone",
  )}${polygon3(waterCircle(41, 16), "wl-fountain-water")}${fluidTube("z", [0, 0, 0], 5, 13, 9, "wl-submersible-pump")}${Array.from(
    { length: 10 },
    (_, i) =>
      line3(
        [
          [-7 + i * 1.5, 7, 7],
          [-7 + i * 1.5, 7, 12],
        ],
        "wl-intake-slot",
      ),
  )}${fluidTube("z", [0, 0, 0], 13, 22, 3, "wl-fountain-nozzle")}${union("z", [0, 0, 0], 16, 4)}${cable(
    [
      [4, 4, 9],
      [23, 17, 7],
      [36, 27, 18],
      [49, 33, 20],
      [54, 41, 3],
    ],
  )}${
    on
      ? svg`<g class="wl-water-jets" style=${`--wl-flow-speed:${1.6 - n * 0.8}s`}>${ends.map(
          ([ex, ey, ez]) => {
            const [startX, startY] = project([0, 0, 22]);
            const [cx, cy] = project([ex * 0.48, ey * 0.48, 22 + height * 2]);
            const [endX, endY] = project([ex, ey, ez]);
            const path = `M${startX} ${startY}Q${cx} ${cy} ${endX} ${endY}`;
            return svg`<path class="wl-jet-body" d=${path}/><path class="wl-jet-sparkle" d=${path}/>`;
          },
        )}</g><g clip-path=${`url(#${waterId})`}><g transform=${`matrix(.92 .46 -.92 .46 ${x} ${y})`}>${ends.map(([ex, ey], i) => svg`<g transform=${`translate(${ex} ${ey})`}><g class="wl-splash-ripple" style=${`--wl-delay:${-i * 0.3}s`}><circle r="6"/><circle r="9"/></g></g>`)}</g></g>`
      : svg``
  }</g>`;
}
function room(s: DeviceVisualState, steam: boolean) {
  const on = !!s.heating && s.available;
  const vapor = steam
    ? on
    : s.processPhase === "steam_example" && (s.temperature ?? 0) >= 50;
  const [x, y] = project(steam ? [33, -28, 20] : [27, 1, 61]);
  return svg`<g class="wl-wellness-room ${steam ? "wl-steam-room" : "wl-sauna"}" data-heating=${on} data-vapor=${vapor} transform="translate(0 8)">${box(-59, -39, 0, 116, 81, 5, "wl-room-plinth")}${box(-57, -37, 5, 112, 5, 85, steam ? "wl-room-tile" : "wl-wood-wall")}${box(-57, -32, 5, 5, 69, 85, steam ? "wl-room-tile" : "wl-wood-wall")}${Array.from(
    { length: 11 },
    (_, i) =>
      line3(
        [
          [-49 + i * 10, -31.7, 7],
          [-49 + i * 10, -31.7, 88],
        ],
        steam ? "wl-tile-joint" : "wl-wood-joint",
      ),
  )}${Array.from({ length: 7 }, (_, i) =>
    line3(
      [
        [-51.7, -27 + i * 10, 7],
        [-51.7, -27 + i * 10, 88],
      ],
      steam ? "wl-tile-joint" : "wl-wood-joint",
    ),
  )}${[24, 44, 64, 84].map((z) =>
    steam
      ? line3(
          [
            [-51, -31.5, z],
            [52, -31.5, z],
          ],
          "wl-tile-joint",
        )
      : svg``,
  )}${Array.from({ length: 7 }, (_, i) => box(-46, -27 + i * 3, 29, 70, 2.5, 3, steam ? "wl-tile-bench" : "wl-wood-bench"))}${box(-46, -23, 5, 5, 13, 24, "wl-bench-leg")}${box(17, -23, 5, 5, 13, 24, "wl-bench-leg")}${box(-46, -6, 5, 70, 14, 13, steam ? "wl-tile-bench" : "wl-wood-step")}${controller(-40, -27, 51, s.temperature === undefined ? "—" : `${s.temperature.toFixed(1)}°`, s.powerOn === true)}${circleFace(36, -31.4, 74, 2, "wl-room-probe")}${cable(
    [
      [36, -31.2, 74],
      [36, -31.2, 85],
      [49, -31.2, 85],
    ],
  )}
 ${
   steam
     ? svg`${circleFace(34, -31, 18, 6, "wl-steam-nozzle")}${circleFace(34, -30.6, 18, 3, "wl-steam-port")}${box(38, -40, 2, 13, 8, 15, "wl-steam-generator")}${cable(
         [
           [39, -36, 12],
           [34, -36, 12],
           [34, -31, 18],
         ],
       )}${[8, 24, 40].map((v, i) => {
         const [px, py] = project([v, -31.4, 49 - i * 8]);
         return svg`<path class="wl-condensation" d=${`M${px} ${py}q-3 5 0 5q3 0 0-5`}/> `;
       })}`
     : svg`<g class="wl-sauna-heater">${fluidShell(
         "z",
         [29, 11, 0],
         [
           [7, 10],
           [12, 14],
           [47, 14],
           [51, 12],
         ],
         "wl-sauna-cage",
       )}${Array.from({ length: 9 }, (_, i) =>
         line3(
           [
             [16 + i * 3.2, 22, 13],
             [16 + i * 3.2, 22, 45],
           ],
           "wl-heater-mesh",
         ),
       )}${Array.from({ length: 16 }, (_, i) => {
         const px = 21 + ((i * 7) % 19);
         const py = 5 + ((i * 5) % 15);
         return polygon3(
           [
             [px - 3, py, 49 + (i % 2) * 2],
             [px, py - 3, 51 + (i % 2) * 2],
             [px + 4, py, 50 + (i % 2) * 2],
             [px + 1, py + 4, 48 + (i % 2) * 2],
           ],
           "wl-sauna-stone",
         );
       })}${cable([
         [34, 17, 9],
         [45, 19, 7],
         [51, 26, 5],
       ])}${
         on
           ? svg`<g class="wl-heat-convection">${[19, 29, 39].map((v, i) => {
               const [px, py] = project([v, 11, 56]);
               return svg`<path class="wl-heat-wisp" style=${`--wl-delay:${-i * 0.6}s`} d=${`M${px} ${py}q-4-7 0-14t0-14`}/>`;
             })}</g>`
           : svg``
       }</g>`
 }
 ${vapor ? svg`<g class="wl-vapor" transform=${`translate(${x} ${y})`}>${[0, 1, 2, 3, 4].map((i) => svg`<path class="wl-steam-wisp" style=${`--wl-delay:${-i * 0.63}s`} d=${`M${-5 + i * 3} 0q${-8 + i * 2}-10 ${-5 + i * 3}-23t${8 - i * 3}-24`}/>`)}</g>` : svg``}${line3(
   [
     [-51, 36, 6],
     [51, 36, 6],
   ],
   "wl-door-threshold",
 )}${
   steam
     ? svg`${pane(48, -29, 6, 2, 71, "wl-glass-door-edge")}${line3(
         [
           [49, -27, 34],
           [49, -27, 48],
         ],
         "wl-door-handle",
       )}`
     : svg``
 }</g>`;
}
export function wellnessVisual(
  d: CatalogDevice,
  s: DeviceVisualState,
  instanceId = d.id,
): TemplateResult | undefined {
  if (!isWellness(d)) return undefined;
  const id = `wellness-${instanceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  let drawing: TemplateResult;
  switch (d.id) {
    case "pool_circulation_pump":
      drawing = pump(s);
      break;
    case "pool_filter":
      drawing = filter(s);
      break;
    case "pool_heater":
      drawing = heater(s, false);
      break;
    case "pool_heat_pump":
      drawing = heater(s, true);
      break;
    case "pool_chlorinator":
      drawing = cell(s);
      break;
    case "pool_dosing_controller":
      drawing = dosing(s);
      break;
    case "pool_level_sensor":
      drawing = basin(s, id, "level");
      break;
    case "pool_cover":
      drawing = basin(s, id, "cover");
      break;
    case "pool_light":
      drawing = basin(s, id, "light");
      break;
    case "fountain_pump":
      drawing = fountain(s, id);
      break;
    case "spa_controller":
      drawing = basin(s, id, "spa");
      break;
    default:
      drawing = room(s, d.id === "steam_room_controller");
  }
  return svg`<g class="realistic-wellness ${s.available && s.hasTelemetry ? "wl-known" : "wl-unknown"} ${s.active && s.available ? "wl-running" : "wl-idle"}" data-wellness-device=${d.id} data-wellness-output=${output(s).toFixed(3)} data-power=${s.powerOn ?? "unknown"} style=${`--wl-light-color:${s.color};--wl-flow-speed:${Math.max(0.5, 2 - output(s) * 1.4)}s`}>${drawing}</g>`;
}
