import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  line3,
  polygon3,
  project,
  circleFace,
  display,
  gauge,
  type Point3,
} from "./isometric-primitives";
import { isWaterDevice } from "./water-model";

const STEPS = 32;
type Axis = "x" | "y" | "z";
const ring = (axis: Axis, c: Point3, at: number, r: number): Point3[] =>
  Array.from({ length: STEPS }, (_, i) => {
    const a = (i * Math.PI * 2) / STEPS;
    return axis === "z"
      ? [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), at]
      : axis === "x"
        ? [at, c[1] + r * Math.cos(a), c[2] + r * Math.sin(a)]
        : [c[0] + r * Math.cos(a), at, c[2] + r * Math.sin(a)];
  });
function shell(
  axis: Axis,
  c: Point3,
  sections: readonly (readonly [number, number])[],
  cls = "water-steel",
) {
  const rings = sections.map(([at, r]) => ring(axis, c, at, r));
  // Back faces first; shaded facets have no artificial seam strokes.
  const faces = rings
    .slice(1)
    .flatMap((row, k) =>
      row.map((p, i) => ({
        points: [
          rings[k][i],
          rings[k][(i + 1) % STEPS],
          row[(i + 1) % STEPS],
          p,
        ],
        depth: p[0] + p[1],
        light: Math.round(45 + 35 * Math.cos((i * Math.PI * 2) / STEPS + 0.7)),
      })),
    )
    .sort((a, b) => a.depth - b.depth);
  return svg`<g class=${cls}>${faces.map((f) => polygon3(f.points, "water-metal-surface", `--water-face-light:${f.light}%`))}${polygon3(rings[rings.length - 1], "water-end-face")}${[
    -Math.PI / 4,
    (3 * Math.PI) / 4,
  ].map((angle) =>
    line3(
      sections.map(([at, r]) =>
        axis === "z"
          ? ([
              c[0] + r * Math.cos(angle),
              c[1] + r * Math.sin(angle),
              at,
            ] as Point3)
          : axis === "x"
            ? ([at, c[1] + r * (angle < 0 ? 1 : -1), c[2]] as Point3)
            : ([c[0] + r * (angle < 0 ? 1 : -1), at, c[2]] as Point3),
      ),
      "water-body-contour",
    ),
  )}</g>`;
}
const tube = (
  axis: Axis,
  c: Point3,
  from: number,
  to: number,
  r: number,
  cls = "water-steel",
) =>
  shell(
    axis,
    c,
    [
      [from, r],
      [to, r],
    ],
    cls,
  );
function flange(x: number, y: number, z: number, r = 11) {
  return svg`${tube("x", [0, y, z], x - 2, x + 2, r)}${polygon3(ring("x", [0, y, z], x + 2.2, r), "water-flange-face")}${polygon3(ring("x", [0, y, z], x + 2.4, r * 0.56), "water-port")}${[0.25, 0.75, 1.25, 1.75].map((a) => polygon3(ring("x", [0, y + Math.cos(a * Math.PI) * r * 0.78, z + Math.sin(a * Math.PI) * r * 0.78], x + 2.6, 1.2), "water-bolt"))}`;
}
function band(x: number, y: number, z: number, r: number, cls = "water-seam") {
  return line3(
    [...ring("z", [x, y, z], z, r), ring("z", [x, y, z], z, r)[0]],
    cls,
  );
}
function arrow(x: number, y: number, z: number) {
  return line3(
    [
      [x - 6, y, z],
      [x + 6, y, z],
      [x + 3, y, z + 2],
      [x + 6, y, z],
      [x + 3, y, z - 2],
    ],
    "water-direction-mark",
  );
}
function motor(
  x: number,
  y: number,
  z: number,
  running: boolean,
  speed: number,
) {
  const [px, py] = project([x - 1, y, z]);
  return svg`<g class="water-motor ${running ? "water-motor-running" : ""}" style="--water-rotation:${Math.max(0.2, 1.8 - speed * 0.015)}s">${tube("x", [0, y, z], x, x + 35, 13, "water-motor-case")}${tube("x", [0, y, z], x + 35, x + 42, 12, "water-motor-case")}${Array.from(
    { length: 11 },
    (_, i) => {
      const a = (i * Math.PI) / 10;
      return line3(
        [
          [x + 4, y + 13.6 * Math.cos(a), z + 13.6 * Math.sin(a)],
          [x + 33, y + 13.6 * Math.cos(a), z + 13.6 * Math.sin(a)],
        ],
        "water-motor-fin",
      );
    },
  )}${box(x + 9, y - 6, z + 13, 16, 12, 8, "water-terminal")}${box(x + 5, y - 10, 5, 26, 20, 4, "water-foot")}${tube("x", [0, y, z], x - 8, x, 4)}<g transform="matrix(-.92 .46 0 -1 ${px} ${py})"><g class="water-shaft-rotation"><circle class="water-coupling" r="5"/><path class="water-coupling-groove" d="M-4-2 4 2M-4 2 4-2"/></g></g>${box(x - 10, y - 7, z - 7, 11, 14, 14, "water-coupling-guard")}</g>`;
}
function supplyPump(s: DeviceVisualState) {
  const on = s.active && s.available;
  return svg`${box(-48, -23, 0, 102, 46, 5, "water-skid")}${pipe(
    [
      [-61, 0, 26],
      [-26, 0, 26],
    ],
    false,
    12,
  )}${flange(-47, 0, 26)}${shell(
    "x",
    [0, 0, 26],
    [
      [-27, 13],
      [-23, 20],
      [-13, 21],
      [-7, 12],
    ],
    "water-pump-cast",
  )}${flange(-26, 0, 26, 17)}${pipe(
    [
      [-17, 0, 43],
      [-17, 0, 62],
      [-17, -26, 62],
    ],
    false,
    10,
  )}${tube("y", [-17, 0, 62], -25, -30, 10)}${arrow(-16, 21, 26)}${motor(7, 0, 26, on, s.speed)}${box(-24, -8, 5, 20, 16, 8, "water-foot")}`;
}
function verticalPump(x: number, on: boolean) {
  return svg`${box(x - 12, -12, 4, 24, 24, 9, "water-pump-cast")}${cylinder(x, 0, 13, 8, 43, "water-stainless")}${Array.from({ length: 7 }, (_, i) => band(x, 0, 17 + i * 5, 8.2))}${[
    -6, 6,
  ].map((y) =>
    line3(
      [
        [x - 6, y, 14],
        [x - 6, y, 58],
      ],
      "water-tie-rod",
    ),
  )}${cylinder(x, 0, 56, 10, 4, "water-pump-cast")}${cylinder(x, 0, 60, 11, 22, "water-motor-case")}${cylinder(x, 0, 82, 12, 5, "water-motor-case")}${Array.from(
    { length: 9 },
    (_, i) => {
      const a = (i * Math.PI) / 8;
      return line3(
        [
          [x + 11.2 * Math.cos(a), 11.2 * Math.sin(a), 61],
          [x + 11.2 * Math.cos(a), 11.2 * Math.sin(a), 80],
        ],
        "water-motor-fin",
      );
    },
  )}${box(x - 6, 9, 66, 12, 8, 12, "water-terminal")}${circleFace(x, 17.2, 72, 1.4, on ? "water-run-led" : "water-idle-led")}`;
}
function booster(s: DeviceVisualState) {
  const on = s.active && s.available;
  const first = s.example ? s.program !== "pump_2" : s.program === "pump_1";
  const second = s.program === "pump_2";
  return svg`${box(-53, -30, 0, 112, 60, 4, "water-skid")}${pipe(
    [
      [-62, 23, 15],
      [51, 23, 15],
    ],
    false,
    8,
  )}${pipe(
    [
      [-61, -23, 48],
      [35, -23, 48],
    ],
    false,
    8,
  )}${[-28, 4].map(
    (x) =>
      svg`${pipe(
        [
          [x, 23, 15],
          [x, 0, 15],
        ],
        false,
        6,
      )}${pipe(
        [
          [x, 0, 40],
          [x, -23, 40],
          [x, -23, 48],
        ],
        false,
        6,
      )}`,
  )}${verticalPump(-28, on && first)}${verticalPump(4, on && second)}${shell(
    "z",
    [38, -4, 0],
    [
      [7, 6],
      [10, 11],
      [18, 13],
      [38, 13],
      [45, 10],
      [48, 2],
    ],
    "water-vessel-shell",
  )}${pipe(
    [
      [38, -4, 7],
      [38, 23, 7],
      [38, 23, 15],
    ],
    false,
    4,
  )}${cylinder(38, -4, 48, 2, 4, "water-air-valve")}${pipe(
    [
      [-42, -23, 48],
      [-42, -23, 62],
    ],
    false,
    3,
  )}${s.pressure !== undefined ? gauge(-42, -20, 67, 7, (s.pressure / 10) * 100) : circleFace(-42, -20, 67, 7, "gauge-face")}${box(24, 16, 25, 23, 13, 27, "water-controller")}${display(27, 29.2, 41, 17, 7, s.pressure !== undefined ? s.pressure.toFixed(1) : "—")}${arrow(-15, 28, 15)}`;
}
function circulator(s: DeviceVisualState) {
  return svg`${pipe(
    [
      [-52, 0, 34],
      [52, 0, 34],
    ],
    false,
    10,
  )}${flange(-34, 0, 34)}${flange(34, 0, 34)}${shell(
    "x",
    [0, 0, 34],
    [
      [-16, 10],
      [-10, 18],
      [10, 18],
      [16, 10],
    ],
    "water-bronze",
  )}${tube("y", [0, 0, 34], 0, 25, 17, "water-motor-case")}${polygon3(ring("y", [0, 0, 34], 25.2, 15), "water-head-cover")}${[-1, 1].map((n) => circleFace(n * 10, 25.6, 34, 1.1, "water-bolt"))}${box(-10, 21, 25, 20, 10, 18, "water-controller")}${display(-7, 31.2, 33, 14, 6, s.example ? (s.program === "low" ? "I" : s.program === "high" ? "III" : "II") : "—")}${circleFace(0, 31.3, 28, 1.2, s.active && s.available ? "water-run-led" : "water-idle-led")}${arrow(28, 6, 39)}`;
}
function borehole(s: DeviceVisualState) {
  return svg`${shell(
    "z",
    [0, 0, 0],
    [
      [4, 3],
      [6, 8],
      [40, 8],
      [43, 9],
      [55, 9],
      [94, 9],
      [100, 6],
      [105, 4],
    ],
    "water-stainless",
  )}${[9, 37, 43, 55, 98].map((z) => band(0, 0, z, 9))}${Array.from({ length: 7 }, (_, i) => band(0, 0, 59 + i * 5, 9.1))}${Array.from(
    { length: 8 },
    (_, i) => {
      const a = (i * Math.PI) / 7;
      return line3(
        [
          [9.2 * Math.cos(a), 9.2 * Math.sin(a), 46],
          [9.2 * Math.cos(a), 9.2 * Math.sin(a), 52],
        ],
        "water-intake-slot",
      );
    },
  )}${cylinder(0, 0, 105, 4, 10, "water-stainless")}${line3(
    [
      [10, -2, 13],
      [12, -2, 92],
      [15, -2, 105],
      [25, -2, 114],
    ],
    "water-power-cable",
  )}${[22, 66, 90].map((z) =>
    pipe(
      [
        [8, -3, z],
        [14, -3, z],
      ],
      false,
      1.4,
    ),
  )}${line3(
    [
      [-6, -4, 101],
      [-10, -4, 116],
      [-17, -4, 123],
    ],
    "water-safety-rope",
  )}${arrow(10, 7, 74)}${box(-3, 8, 20, 6, 1, 11, "water-nameplate")}${windowSurface(8.3, 15, 35, "water-cutaway")}${cylinder(0, 6, 15, 2.5, 20, "water-stainless")}<g transform="matrix(.92 .46 -.92 .46 ${project([0, 6, 33])[0]} ${project([0, 6, 33])[1]})"><g class="water-shaft-rotation ${s.active && s.available ? "water-submersible-rotating" : ""}"><circle class="water-coupling" r="4"/><path class="water-coupling-groove" d="M-3-1 3 1M-3 1 3-1"/></g></g>`;
}
function windowSurface(r: number, low: number, high: number, cls: string) {
  const angles = Array.from(
    { length: 17 },
    (_, i) => Math.PI / 6 + (i * Math.PI * 2) / 3 / 16,
  );
  return polygon3(
    [
      ...angles.map((a) => [r * Math.cos(a), r * Math.sin(a), high] as Point3),
      ...angles
        .slice()
        .reverse()
        .map((a) => [r * Math.cos(a), r * Math.sin(a), low] as Point3),
    ],
    cls,
  );
}
function storage(d: CatalogDevice, s: DeviceVisualState) {
  const r = 27;
  const h = 80;
  const liquid = Math.max(0, Math.min(100, s.level)) / 100;
  return svg`${[
    [-20, -10],
    [17, -10],
    [0, 19],
  ].map(([x, y]) => box(x - 3, y - 3, 0, 6, 6, 9, "water-foot"))}${shell(
    "z",
    [0, 0, 0],
    [
      [8, 19],
      [11, r],
      [h, r],
      [h + 7, 19],
      [h + 9, 5],
    ],
    "water-tank-shell",
  )}${band(0, 0, 23, r + 0.1)}${band(0, 0, 67, r + 0.1)}${windowSurface(r + 0.2, 15, 76, "water-cutaway")}${s.hasLevel && liquid > 0 ? windowSurface(r + 0.3, 15, 15 + 61 * liquid, "water-liquid-body") : svg``}${s.hasLevel ? band(0, 0, 15 + 61 * liquid, r - 0.5, "water-level-line") : svg``}${cylinder(0, -3, h + 8, 8, 3, "water-manway")}${cylinder(0, -3, h + 11, 9, 2, "water-manway")}${pipe(
    [
      [-20, 0, h],
      [-36, 0, h],
      [-36, 0, h - 9],
    ],
    false,
    5,
  )}${pipe(
    [
      [19, 0, 18],
      [43, 0, 18],
    ],
    false,
    6,
  )}${flange(41, 0, 18, 7)}${pipe(
    [
      [0, -20, 13],
      [0, -38, 13],
      [0, -38, 8],
    ],
    false,
    3,
  )}${[0, 1, 2, 3, 4].map((i) =>
    line3(
      [
        [14, 23, 18 + i * 13],
        [17, 23, 18 + i * 13],
      ],
      "water-level-tick",
    ),
  )}${
    d.id === "tank_level_sensor"
      ? svg`${cylinder(-7, 8, 15, 2.3, 8, "water-level-probe")}${line3(
          [
            [-7, 8, 23],
            [-7, 8, 90],
            [-20, 8, 96],
            [-37, 8, 88],
          ],
          "water-power-cable",
        )}${box(-48, 3, 74, 16, 13, 20, "water-transmitter")}${display(-46, 16.2, 82, 12, 7, s.hasLevel ? Math.round(s.level).toString() : "—")}`
      : svg``
  }`;
}
function floatSwitch(s: DeviceVisualState) {
  const level = s.hasLevel
    ? Math.max(0, Math.min(100, s.level))
    : s.open
      ? 80
      : 20;
  const z = 13 + level * 0.48;
  const [px, py] = project([5, 5, z]);
  return svg`${shell(
    "z",
    [0, 0, 0],
    [
      [3, 27],
      [6, 30],
      [66, 30],
    ],
    "water-tank-shell",
  )}${windowSurface(30.1, 8, 62, "water-cutaway")}${s.hasLevel && level > 0 ? windowSurface(30.2, 8, 8 + (54 * level) / 100, "water-liquid-body") : svg``}${box(-28, -5, 77, 12, 10, 7, "water-cable-anchor")}${line3(
    [
      [-22, 0, 78],
      [-18, 0, 65],
      [5, 5, z],
    ],
    "water-float-tether",
  )}${cylinder(-14, 0, 54, 3, 9, "water-counterweight")}<g class="water-float" data-contact=${s.open ? "made" : "open"} transform="translate(${px} ${py})"><g transform="rotate(${Math.max(-55, Math.min(55, (level - 50) * 1.8))})"><path class="water-float-shell" d="M-11-2C-12-8-4-10 3-8C14-7 15 3 6 7C-2 11-11 6-11-2Z"/><path class="water-float-seam" d="M-9-3Q1 1 10-1"/><path class="water-float-cable" d="M-11-2H-17"/></g></g>`;
}
function heater(d: CatalogDevice, s: DeviceVisualState) {
  const indirect = d.id === "calorifier";
  return svg`${[
    [-15, -9],
    [15, -9],
    [0, 17],
  ].map(([x, y]) => box(x - 3, y - 3, 0, 6, 6, 8, "water-foot"))}${shell(
    "z",
    [0, 0, 0],
    [
      [7, 17],
      [10, 24],
      [81, 24],
      [87, 17],
      [89, 4],
    ],
    "water-enamel",
  )}${windowSurface(24.2, 17, 73, "water-thermal-window")}${
    indirect
      ? svg`${Array.from({ length: 6 }, (_, i) =>
          pipe(
            [
              [-13, 10, 23 + i * 7],
              [13, 10, 23 + i * 7],
              [13, 10, 26 + i * 7],
              [-13, 10, 26 + i * 7],
            ],
            s.active,
            2.2,
          ),
        )}${pipe(
          [
            [-13, 10, 23],
            [-34, 10, 23],
          ],
          s.active,
          4,
        )}${pipe(
          [
            [-13, 10, 65],
            [-34, 10, 65],
          ],
          s.active,
          4,
        )}`
      : svg`${pipe(
          [
            [-12, 15, 27],
            [11, 15, 27],
            [13, 15, 31],
            [11, 15, 35],
            [-12, 15, 35],
          ],
          false,
          2.8,
        )}${box(-18, 14, 23, 7, 4, 17, "water-heater-cover")}${
          s.active && s.available
            ? line3(
                [
                  [-10, 15.3, 27],
                  [10, 15.3, 27],
                  [12, 15.3, 31],
                  [10, 15.3, 35],
                  [-10, 15.3, 35],
                ],
                "water-element-hot",
              )
            : svg``
        }`
  }${s.active && s.available ? svg`<path class="water-convection" d="M134 92q-5-9 0-19m11 23q5-10 0-21"/>` : svg``}${pipe(
    [
      [-9, -2, 87],
      [-9, -2, 101],
      [-24, -2, 101],
    ],
    false,
    5,
  )}${pipe(
    [
      [10, -2, 87],
      [10, -2, 101],
      [24, -2, 101],
    ],
    false,
    5,
  )}${cylinder(-9, -2, 94, 4, 3, "water-cold-port")}${cylinder(10, -2, 94, 4, 3, "water-hot-port")}${pipe(
    [
      [20, 3, 70],
      [32, 3, 70],
      [32, 3, 8],
    ],
    false,
    3,
  )}${box(26, 0, 68, 7, 6, 6, "water-relief-valve")}${pipe(
    [
      [19, 5, 14],
      [33, 5, 14],
    ],
    false,
    3,
  )}${display(-8, 24.2, 70, 16, 8, s.temperature !== undefined ? `${Math.round(s.temperature)}°` : "—")}`;
}
function vessel(s: DeviceVisualState) {
  const fraction =
    s.pressure === undefined
      ? undefined
      : Math.max(0, Math.min(0.65, 1 - 3 / (s.pressure + 1)));
  return svg`${shell(
    "z",
    [0, 0, 0],
    [
      [13, 3],
      [17, 16],
      [25, 23],
      [61, 23],
      [70, 17],
      [75, 3],
    ],
    "water-vessel-shell",
  )}${windowSurface(23.2, 26, 62, "water-air-chamber")}${
    fraction !== undefined
      ? svg`${windowSurface(23.3, 26, 26 + 36 * fraction, "water-liquid-body")}${polygon3(
          [
            [-17, 16, 26 + 36 * fraction],
            [0, 23, 23 + 36 * fraction],
            [17, 16, 26 + 36 * fraction],
            [17, 16, 29 + 36 * fraction],
            [0, 23, 26 + 36 * fraction],
            [-17, 16, 29 + 36 * fraction],
          ],
          "water-diaphragm",
        )}`
      : svg``
  }${band(0, 0, 44, 23.3)}${cylinder(0, 0, 75, 2.5, 7, "water-air-valve")}${cylinder(0, 0, 81, 3.2, 2, "water-air-cap")}${pipe(
    [
      [0, 0, 13],
      [0, 0, 4],
      [30, 0, 4],
    ],
    false,
    5,
  )}${[
    [-15, -9],
    [15, -9],
    [0, 16],
  ].map(([x, y]) => box(x - 2, y - 2, 0, 4, 4, 19, "water-foot"))}`;
}
function measuring(d: CatalogDevice, s: DeviceVisualState) {
  const flow = s.flow !== undefined && s.flow > 0 && s.available;
  return svg`${pipe(
    [
      [-57, 0, 20],
      [57, 0, 20],
    ],
    flow,
    11,
  )}${flange(-42, 0, 20)}${flange(42, 0, 20)}${shell(
    "x",
    [0, 0, 20],
    [
      [-27, 9],
      [-17, 15],
      [17, 15],
      [27, 9],
    ],
    "water-bronze",
  )}${arrow(2, 16, 23)}${
    d.id === "water_meter"
      ? svg`${cylinder(0, 0, 34, 16, 12, "water-meter-register")}${cylinder(0, 0, 46, 17, 3, "water-meter-lid")}${box(-14, 6, 42, 28, 8, 12, "water-meter-register")}${display(-12, 14.2, 45, 24, 7, s.example ? s.value.toFixed(3) : s.hasTelemetry && s.valueUnit === "m³" ? s.value.toFixed(3) : "—")}`
      : d.id === "water_flow_sensor"
        ? svg`${cylinder(0, 0, 34, 5, 22, "water-transducer")}${box(-11, -8, 56, 22, 16, 17, "water-transmitter")}${display(-8, 8.2, 62, 16, 7, s.flow !== undefined ? s.flow.toFixed(1) : "—")}${line3(
            [
              [11, 0, 65],
              [24, 0, 69],
              [31, 0, 62],
            ],
            "water-power-cable",
          )}`
        : svg`${cylinder(0, 0, 34, 6, 4, "water-bronze")}${shell(
            "z",
            [0, 0, 0],
            [
              [38, 5],
              [42, 6],
              [62, 6],
              [65, 4],
            ],
            "water-stainless",
          )}${box(-5, -5, 65, 10, 10, 12, "water-terminal")}${line3(
            [
              [5, 0, 71],
              [16, 0, 75],
              [25, 0, 67],
            ],
            "water-power-cable",
          )}`
  }`;
}
function leak(d: CatalogDevice, s: DeviceVisualState) {
  const cable = d.id === "leak_detection_cable";
  return svg`${
    s.alert
      ? polygon3(
          [
            [-42, -6, 1],
            [-24, -22, 1],
            [19, -26, 1],
            [48, -1, 1],
            [36, 25, 1],
            [-19, 28, 1],
            [-47, 9, 1],
          ],
          "water-leak-puddle",
        )
      : svg``
  }${
    cable
      ? svg`${line3(
          [
            [-40, -17, 3],
            [20, -17, 3],
            [32, -4, 3],
            [-24, 2, 3],
            [-36, 17, 3],
            [30, 17, 3],
          ],
          "water-sensing-cable",
        )}${line3(
          [
            [-40, -17, 3],
            [-48, -17, 3],
            [-48, -17, 18],
          ],
          "water-power-cable",
        )}${box(-57, -24, 18, 20, 15, 18, "water-leak-controller")}${circleFace(-48, -8.8, 28, 2, s.alert ? "water-alarm-led" : "water-run-led")}`
      : svg`${[-11, 11].map((x) => cylinder(x, 0, 1, 2.2, 6, "water-electrode"))}${cylinder(0, 0, 6, 20, 10, "water-leak-puck")}${cylinder(0, 0, 16, 18, 4, "water-leak-puck")}${circleFace(0, 18.5, 11, 1.6, s.alert ? "water-alarm-led" : "water-idle-led")}${line3(
          [
            [-20, 0, 11],
            [-32, 0, 11],
            [-41, -6, 6],
          ],
          "water-power-cable",
        )}`
  }`;
}
export function waterVisual(d: CatalogDevice, s: DeviceVisualState) {
  if (!isWaterDevice(d)) return undefined;
  const drawing =
    d.id === "water_supply_pump"
      ? supplyPump(s)
      : d.id === "booster_pump"
        ? booster(s)
        : d.id === "hot_water_circulation_pump"
          ? circulator(s)
          : d.id === "borehole_pump"
            ? borehole(s)
            : ["water_tank", "tank_level_sensor"].includes(d.id)
              ? storage(d, s)
              : d.id === "float_switch"
                ? floatSwitch(s)
                : ["water_heater", "calorifier"].includes(d.id)
                  ? heater(d, s)
                  : d.id === "expansion_vessel"
                    ? vessel(s)
                    : [
                          "water_meter",
                          "water_flow_sensor",
                          "water_pressure_sensor",
                        ].includes(d.id)
                      ? measuring(d, s)
                      : leak(d, s);
  return svg`<g class="realistic-water ${s.active && s.available ? "water-operating" : ""}" data-water-device=${d.id} data-water-level=${s.hasLevel ? s.level : "unknown"} data-water-speed=${s.speed} data-water-flow=${s.flow ?? "unknown"} transform="translate(140 137) scale(.96) translate(-140 -128)">${drawing}</g>`;
}

export {
  shell as fluidShell,
  tube as fluidTube,
  flange as fluidFlange,
  band as fluidBand,
  windowSurface as fluidWindowSurface,
};
