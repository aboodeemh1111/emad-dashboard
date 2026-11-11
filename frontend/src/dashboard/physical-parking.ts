import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  polygon3,
  line3,
  circleFace,
  display,
  project,
  type Point3,
} from "./isometric-primitives";
import { fluidShell } from "./physical-water";
import { cameraVisual } from "./physical-cameras";
import { isParking, parkingDockPose } from "./parking-model";

type Pose = (p: Point3) => Point3;
const identity: Pose = (p) => p;
const angle = (d: number) => (d * Math.PI) / 180;
const tip = (p: Point3, cls: string, r = 1.2) => {
  const [x, y] = project(p);
  return svg`<circle class=${cls} cx=${x} cy=${y} r=${r}/>`;
};
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Point3, b: Point3): Point3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const cross = (a: Point3, b: Point3): Point3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
/** Project physical joints in 3D, with hidden-face culling, rather than rotating flattened SVGs. */
function solid(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  cls: string,
  pose: Pose = identity,
) {
  const points: Point3[] = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ].map(([px, py, pz]) => pose([px, py, pz]));
  const faces = [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ]
    .map((ids) => {
      const p = ids.map((i) => points[i]);
      const normal = cross(sub(p[1], p[0]), sub(p[2], p[0]));
      return {
        p,
        normal,
        depth: p.reduce((a, b) => a + dot(b, [1, 1, 0.92]), 0) / 4,
      };
    })
    .filter((f) => dot(f.normal, [1, 1, 0.92]) > 0)
    .sort((a, b) => a.depth - b.depth);
  return svg`<g class=${cls}>${faces.map((f) => polygon3(f.p, Math.abs(f.normal[2]) > Math.max(Math.abs(f.normal[0]), Math.abs(f.normal[1])) ? "iso-top" : Math.abs(f.normal[0]) > Math.abs(f.normal[1]) ? "iso-side" : "iso-front"))}</g>`;
}
const bolts = (x: number, y: number, w: number, d: number, z = 3) =>
  svg`${[0, w].flatMap((dx) => [0, d].map((dy) => tip([x + dx, y + dy, z], "parking-bolt", 1.1)))}`;
function slab(w = 135, d = 82) {
  return svg`${box(-w / 2, -d / 2, -2, w, d, 2, "parking-road")}${line3(
    [
      [-w / 2 + 8, -d / 2 + 7, 0.2],
      [w / 2 - 8, -d / 2 + 7, 0.2],
    ],
    "parking-lane-mark",
  )}${line3(
    [
      [-w / 2 + 8, d / 2 - 7, 0.2],
      [w / 2 - 8, d / 2 - 7, 0.2],
    ],
    "parking-lane-mark",
  )}`;
}
function statusLamp(x: number, y: number, z: number, on: boolean, red = false) {
  return svg`${circleFace(x, y, z, 2.6, on ? (red ? "parking-led-red" : "parking-led-green") : "parking-led-off")}`;
}
function barrier(s: DeviceVisualState) {
  const t = angle(s.position * 0.9);
  const pose: Pose = ([x, y, z]) => [
    -53 + x * Math.cos(t) - z * Math.sin(t),
    y,
    49 + x * Math.sin(t) + z * Math.cos(t),
  ];
  return svg`${slab()}${box(-66, -12, 0, 26, 24, 55, "parking-barrier-cabinet")}${box(-67, -13, 0, 28, 26, 3, "parking-foot")}${bolts(-64, -10, 22, 20)}${box(-63, 12.2, 7, 20, 0.5, 35, "parking-service-door")}${circleFace(-47, 13, 22, 1.7, "parking-keyhole")}${line3(
    [
      [-62, 13, 9],
      [-62, 13, 39],
    ],
    "parking-door-seam",
  )}${box(-64, -12, 54, 24, 24, 3, "parking-cap")}${statusLamp(-55, 13, 43, s.hasTelemetry, s.alert)}
    ${box(53, -5, 0, 8, 10, 42, "parking-arm-rest")}${box(51, -6, 42, 12, 12, 3, "parking-rubber")}
    <g class="parking-boom" data-arm-angle=${s.position * 0.9}>${solid(0, -3, 0, 108, 6, 4, "parking-boom-shell", pose)}${[13, 33, 53, 73, 93].map((x) => solid(x, -3.1, 0.1, 9, 6.2, 4.1, "parking-reflector", pose))}${line3(
      [
        [4, 3.2, -0.6],
        [106, 3.2, -0.6],
      ].map(([px, py, pz]) => pose([px, py, pz])),
      "parking-safety-edge",
    )}${solid(104, -3.3, -0.3, 4, 6.6, 4.6, "parking-end-cap", pose)}</g>
    ${circleFace(-53, 5, 49, 6, "parking-hub")}${circleFace(-53, 5.3, 49, 2, "parking-bolt")}${[-28, 31].map((x) => svg`${box(x, 24, 0, 5, 6, 24, "parking-photocell-post")}${circleFace(x + 2.5, 30.2, 21, 1.6, "parking-optic")}`)}${
      s.alert
        ? line3(
            [
              [-25, 30.3, 21],
              [33, 30.3, 21],
            ],
            "parking-blocked-beam",
          )
        : svg``
    }`;
}
function slidingGate(s: DeviceVisualState) {
  const x = -48 - s.position * 0.67;
  return svg`<g transform="translate(140 128) scale(.88) translate(-140 -128)">${slab(200, 70)}${pipe(
    [
      [-119, 8, 1],
      [66, 8, 1],
    ],
    false,
    2,
  )}${[-57, 57].map((px) => svg`${box(px, -4, 0, 7, 12, 70, "parking-gate-post")}${box(px - 2, -5, 0, 11, 14, 3, "parking-foot")}${bolts(px - 1, -3, 9, 10)}`)}
    <g class="parking-sliding-leaf" data-travel=${s.position}>${box(x, 4, 8, 100, 4, 62, "parking-gate-frame")}${polygon3(
      [
        [x + 3, 8.1, 12],
        [x + 97, 8.1, 12],
        [x + 97, 8.1, 66],
        [x + 3, 8.1, 66],
      ],
      "parking-gate-infill",
    )}${Array.from({ length: 16 }, (_, i) =>
      line3(
        [
          [x + 5 + i * 6, 8.3, 13],
          [x + 5 + i * 6, 8.3, 65],
        ],
        "parking-gate-picket",
      ),
    )}${box(x, 8.4, 7, 100, 2, 3, "parking-rack")}${Array.from({ length: 25 }, (_, i) => box(x + i * 4, 10.5, 7, 1.5, 1, 3, "parking-rack-tooth"))}${[15, 80].map((dx) => svg`${circleFace(x + dx, 9, 5, 4, "parking-roller")}${circleFace(x + dx, 9.3, 5, 1, "parking-bolt")}`)}</g>
    ${box(-70, 13, 0, 20, 17, 23, "parking-gate-motor")}${box(-71, 12, 22, 22, 19, 3, "parking-cap")}${circleFace(-60, 13, 13, 4, "parking-drive-gear")}${line3(
      [
        [-66, 30.3, 5],
        [-53, 30.3, 5],
      ],
      "parking-vent",
    )}${statusLamp(-60, 30.5, 17, s.hasTelemetry, s.alert)}</g>`;
}
function bollard(s: DeviceVisualState) {
  const h = 2 + 60 * (1 - s.position / 100);
  return svg`${slab(110, 80)}${cylinder(0, 0, 0, 22, 3, "parking-ground-collar")}${bolts(-13, -13, 26, 26, 3.3)}<g class="parking-bollard-shaft" data-raised-height=${h - 2}>${
    h > 2
      ? fluidShell(
          "z",
          [0, 0, 0],
          [
            [2, 12.5],
            [3, 13],
            [h, 13],
          ],
          "parking-bollard-steel",
        )
      : svg``
  }${h > 15 ? cylinder(0, 0, h - 9, 13.15, 6, "parking-retro-band") : svg``}${h > 9 ? cylinder(0, 0, h - 1, 13.2, 1.4, "parking-bollard-ring") : svg``}${cylinder(0, 0, h, 13.5, 1.8, "parking-bollard-cap")}${tip([0, 0, h + 2], "parking-bolt", 2)}</g>`;
}
function parkingLock(s: DeviceVisualState) {
  const a = angle(s.position * 0.9);
  const pose: Pose = ([x, y, z]) => [
    x,
    y * Math.cos(a) + z * Math.sin(a),
    7 + z * Math.cos(a) - y * Math.sin(a),
  ];
  const frame: Point3[] = [
    [-24, 0, 0],
    [-24, 0, 31],
    [-20, 0, 36],
    [20, 0, 36],
    [24, 0, 31],
    [24, 0, 0],
  ];
  return svg`${slab(115, 90)}${box(-33, -13, 0, 66, 26, 7, "parking-lock-drive")}${bolts(-29, -9, 58, 18, 7.2)}${[-24, 24].map((x) => svg`${circleFace(x, 5, 7, 4, "parking-hub")}${circleFace(x, 5.3, 7, 1.3, "parking-bolt")}`)}<g class="parking-folding-hoop" data-fold-angle=${s.position * 0.9}>${pipe(
    frame.map(([px, py, pz]) => pose([px, py, pz])),
    false,
    5,
  )}${solid(-17, -1.8, 17, 34, 3.6, 13, "parking-lock-plate", pose)}${polygon3(
    [
      [-10, 2, 20],
      [10, 2, 20],
      [10, 2, 27],
      [-10, 2, 27],
    ].map(([px, py, pz]) => pose([px, py, pz])),
    "parking-reflector",
  )}</g>${statusLamp(0, 13.2, 4, s.hasTelemetry, s.alert)}`;
}
export function parkingTripodTips(position: number): Point3[] {
  const phase = angle(position * 1.2 + 22);
  return [0, 120, 240].map((deg) => {
    const a = phase + angle(deg);
    return [
      31 * Math.cos(a),
      18 + 15.1 + 31 * 0.545 * Math.sin(a),
      44 - 9.8 + 31 * 0.839 * Math.sin(a),
    ];
  });
}
function turnstile(s: DeviceVisualState) {
  const center: Point3 = [0, 18, 44];
  const arms = parkingTripodTips(s.position);
  return svg`${slab(115, 90)}${box(-27, -15, 0, 54, 30, 5, "parking-foot")}${box(-20, -10, 4, 40, 26, 55, "parking-turnstile-body")}${box(-25, -17, 59, 50, 38, 6, "parking-cap")}${polygon3(
    [
      [-17, 21, 50],
      [17, 21, 50],
      [17, 21, 60],
      [-17, 21, 60],
    ],
    "parking-reader-top",
  )}${statusLamp(0, 21.2, 55, s.hasTelemetry, !s.active)}${circleFace(0, 18.2, 44, 8, "parking-hub")}<g class="parking-tripod" data-index-angle=${s.position * 1.2}>${arms.map((end) => pipe([center, end], false, 4))}${circleFace(0, 19, 44, 3, "parking-bolt")}</g>${line3(
    [
      [-15, 16.2, 12],
      [15, 16.2, 12],
    ],
    "parking-door-seam",
  )}`;
}
function speedGate(s: DeviceVisualState) {
  const a = angle(s.position * 0.9);
  const leaf = (side: number) => {
    const pose: Pose = ([x, y, z]) => [
      side * 29 - side * x * Math.cos(a),
      y + x * Math.sin(a),
      z,
    ];
    return svg`<g class="parking-swing-leaf" data-leaf-angle=${s.position * 0.9}>${solid(0, -1, 13, 29, 2, 45, "parking-glass-leaf", pose)}${pipe(
      [
        [0, 0, 11],
        [0, 0, 60],
      ].map(([px, py, pz]) => pose([px, py, pz])),
      false,
      2,
    )}${[22, 51].map((z) => solid(-1, -2, z, 4, 4, 3, "parking-leaf-hinge", pose))}</g>`;
  };
  return svg`${slab(130, 100)}${[-1, 1].map((side) => svg`${box(side < 0 ? -44 : 29, -37, 0, 15, 74, 61, "parking-speed-pedestal")}${box(side < 0 ? -45 : 28, -38, 60, 17, 76, 3, "parking-speed-cap")}${[15, 32, 49].map((z) => circleFace(side < 0 ? -36.5 : 36.5, 37.2, z, 1.4, "parking-optic"))}${statusLamp(side < 0 ? -36.5 : 36.5, 38, 55, s.hasTelemetry, s.position < 100)}`)}${leaf(-1)}${leaf(1)}`;
}
function car() {
  return svg`<g class="parking-example-car">${box(-29, -17, 7, 58, 34, 12, "parking-car-body")}${polygon3(
    [
      [-17, -15, 19],
      [16, -15, 19],
      [9, -12, 30],
      [-10, -12, 30],
    ],
    "parking-car-glass",
  )}${polygon3(
    [
      [-17, 15, 19],
      [16, 15, 19],
      [9, 12, 30],
      [-10, 12, 30],
    ],
    "parking-car-glass",
  )}${polygon3(
    [
      [-10, -12, 30],
      [9, -12, 30],
      [9, 12, 30],
      [-10, 12, 30],
    ],
    "parking-car-roof",
  )}${[-19, 20].map((x) => svg`${circleFace(x, 18, 8, 5, "parking-tire")}${circleFace(x, 18.3, 8, 2.5, "parking-wheel")}`)}${box(26, 17.2, 13, 3, 1, 3, "parking-headlamp")}</g>`;
}
function detector(d: CatalogDevice, s: DeviceVisualState) {
  const occupied = s.mode === "parking_occupied";
  return svg`${slab(130, 90)}${line3(
    [
      [-46, -31, 0.5],
      [-46, 31, 0.5],
      [46, 31, 0.5],
      [46, -31, 0.5],
    ],
    "parking-bay-line",
  )}${
    d.id === "inductive_loop_detector"
      ? svg`${line3(
          [
            [-35, -23, 0.5],
            [35, -23, 0.5],
            [35, 23, 0.5],
            [-35, 23, 0.5],
            [-35, -23, 0.5],
          ],
          "parking-inductive-loop",
        )}${line3(
          [
            [-35, -23, 0.5],
            [-49, -39, 0.5],
            [-63, -39, 0.5],
          ],
          "parking-loop-tail",
        )}${box(-69, -40, 0, 16, 11, 24, "parking-loop-module")}${box(-68, -28.8, 2, 14, 1, 5, "parking-terminal-strip")}${[0, 1, 2, 3].map((i) => tip([-66 + i * 3, -27.5, 4], "parking-terminal-screw", 0.7))}${statusLamp(-61, -28.6, 19, s.hasTelemetry && occupied)}`
      : d.id === "vehicle_radar"
        ? svg`${box(44, -35, 0, 13, 13, 3, "parking-foot")}${bolts(46, -33, 9, 9)}${cylinder(50, -29, 3, 2.5, 68, "parking-sensor-pole")}${box(39, -27, 58, 22, 9, 24, "parking-radar-housing")}${polygon3(
            [
              [40, -17.7, 61],
              [60, -17.7, 61],
              [60, -17.7, 79],
              [40, -17.7, 79],
            ],
            "parking-radome",
          )}${line3(
            [
              [42, -17, 60],
              [58, -17, 60],
            ],
            "parking-radar-seam",
          )}${polygon3(
            [
              [50, -17, 59],
              [-34, -24, 0.6],
              [-34, 25, 0.6],
              [32, 25, 0.6],
            ],
            "parking-detection-zone",
          )}`
        : svg`${cylinder(0, 0, 0.3, 12, 3, "parking-occupancy-puck")}${cylinder(0, 0, 3, 10, 2, "parking-puck-lid")}${[-5, 5].map((x) => tip([x, 0, 5.2], "parking-bolt", 0.8))}${tip([0, 4, 5.3], s.hasTelemetry ? (occupied ? "parking-led-red" : "parking-led-green") : "parking-led-off", 1.4)}`
  }${occupied ? car() : svg``}`;
}
function ticket(s: DeviceVisualState, payment = false) {
  const front = 13.3;
  const progress = s.processProgress ?? 0;
  const paper =
    s.example === true &&
    s.program !== "idle" &&
    (payment ? progress >= 75 : true);
  const extension = paper
    ? (payment
        ? Math.min(1, (progress - 75) / 25)
        : Math.min(1, progress / 90)) * 15
    : 0;
  return svg`${box(-25, -18, 0, 50, 36, 4, "parking-foot")}${bolts(-21, -14, 42, 28, 4.2)}${box(-20, -12, 4, 40, 25, 90, payment ? "parking-payment-body" : "parking-ticket-body")}${box(-22, -14, 93, 44, 29, 4, "parking-kiosk-canopy")}${display(-15, front, 65, 30, 21, payment ? "8.00" : "P")}${box(-16, front, 55, 32, 0.7, 5, "parking-ticket-slot")}${box(-15, front, 17, 30, 0.6, 33, "parking-service-door")}${circleFace(10, front + 1, 25, 1.4, "parking-keyhole")}${line3(
    [
      [-13, front + 1, 20],
      [13, front + 1, 20],
    ],
    "parking-door-seam",
  )}${
    payment
      ? svg`${box(-14, front + 0.2, 42, 14, 1, 10, "parking-card-reader")}${circleFace(-7, front + 1.4, 47, 3, "parking-contactless")}${box(5, front + 0.2, 41, 9, 0.7, 12, "parking-keypad")}${Array.from({ length: 9 }, (_, i) => tip([7 + (i % 3) * 2, front + 1, 44 + Math.floor(i / 3) * 3], "parking-keypad-dot", 0.55))}${box(-14, front + 0.3, 31, 12, 0.7, 6, "parking-barcode-scanner")}${line3(
          [
            [-11, front + 1, 33],
            [-5, front + 1, 33],
          ],
          "parking-scanner-glass",
        )}`
      : svg`${circleFace(9, front + 1, 47, 3.7, "parking-ticket-button")}${Array.from(
          { length: 5 },
          (_, i) =>
            line3(
              [
                [-14 + i * 2, front + 0.4, 42],
                [-14 + i * 2, front + 0.4, 50],
              ],
              "parking-speaker-slot",
            ),
        )}`
  }${
    paper
      ? svg`<g class="parking-issued-ticket" data-paper-extension=${extension}>${polygon3(
          [
            [-10, front + 1, 57],
            [10, front + 1, 57],
            [10, front + 1 + extension, 57 - extension * 0.38],
            [-10, front + 1 + extension, 57 - extension * 0.38],
          ],
          "parking-paper",
        )}${Array.from({ length: 12 }, (_, i) =>
          line3(
            [
              [-8 + i * 1.3, front + 4, 55.9],
              [
                -8 + i * 1.3,
                front + Math.max(4, extension - 1),
                57 - Math.max(4, extension - 1) * 0.38,
              ],
            ],
            "parking-ticket-barcode",
          ),
        )}</g>`
      : svg``
  }${statusLamp(0, front + 1, 89, s.active)}`;
}
function rfid(s: DeviceVisualState) {
  return svg`${box(-19, -16, 0, 38, 32, 4, "parking-foot")}${bolts(-14, -11, 28, 22, 4.2)}${cylinder(0, 0, 4, 3, 65, "parking-sensor-pole")}${box(-19, -3, 56, 38, 7, 34, "parking-rfid-panel")}${box(-17, 4.2, 58, 34, 0.5, 30, "parking-radome")}${line3(
    [
      [-12, 5, 60],
      [12, 5, 60],
    ],
    "parking-radar-seam",
  )}${statusLamp(0, 5, 84, s.program !== "idle" && s.processProgress === 100)}${
    s.example && s.program !== "idle"
      ? svg`${box(-8, 25, 10, 16, 1, 9, "parking-example-tag")}${line3(
          [
            [-4, 26.3, 12],
            [4, 26.3, 12],
            [4, 26.3, 17],
            [-4, 26.3, 17],
            [-4, 26.3, 12],
          ],
          "parking-tag-antenna",
        )}`
      : svg``
  }`;
}
function guidanceController(s: DeviceVisualState) {
  return svg`${box(-43, -8, 9, 86, 7, 3, "parking-din-rail")}${box(-37, -5, 11, 74, 27, 43, "parking-controller-case")}${display(-30, 22.3, 36, 26, 11, s.hasTelemetry ? String(s.example ? 120 - s.level : s.level) : "—")}${[0, 1].map((row) => svg`${box(-32, 22.4, 17 + row * 11, 62, 1, 6, "parking-terminal-strip")}${Array.from({ length: 10 }, (_, i) => tip([-29 + i * 6, 23.7, 20 + row * 11], "parking-terminal-screw", 0.85))}`)}${Array.from({ length: 8 }, (_, i) => tip([3 + i * 3.8, 22.9, 43], s.hasTelemetry ? "parking-led-green" : "parking-led-off", 0.8))}${box(-33, 22.5, 38, 1, 1, 11, "parking-controller-usb")}`;
}
function sign(s: DeviceVisualState) {
  const free = s.hasTelemetry
    ? s.example
      ? 120 - s.level
      : s.level
    : undefined;
  const arrow = s.mode === "parking_left" ? -1 : 1;
  return svg`${[-37, 37].map((x) => svg`${box(x - 10, -9, 0, 20, 18, 3, "parking-foot")}${cylinder(x, 0, 3, 2, 48, "parking-sign-post")}`)}${box(-56, -5, 47, 112, 10, 34, "parking-sign-case")}${display(-51, 5.3, 51, 52, 25, free === undefined ? "—" : String(free))}${polygon3(
    [
      [7, 5.4, 51],
      [51, 5.4, 51],
      [51, 5.4, 76],
      [7, 5.4, 76],
    ],
    "parking-sign-screen",
  )}${
    free === 0
      ? line3(
          [
            [19, 5.8, 55],
            [39, 5.8, 73],
            [29, 5.8, 64],
            [19, 5.8, 73],
            [39, 5.8, 55],
          ],
          "parking-stop-cross",
        )
      : !s.hasTelemetry || s.mode === "unknown"
        ? svg``
        : s.mode === "parking_straight"
          ? line3(
              [
                [29, 5.8, 55],
                [29, 5.8, 72],
                [23, 5.8, 66],
                [29, 5.8, 72],
                [35, 5.8, 66],
              ],
              "parking-led-arrow",
            )
          : line3(
              [
                [29 - arrow * 15, 5.8, 64],
                [29 + arrow * 15, 5.8, 64],
                [29 + arrow * 7, 5.8, 71],
                [29 + arrow * 15, 5.8, 64],
                [29 + arrow * 7, 5.8, 57],
              ],
              "parking-led-arrow",
            )
  }${
    free === 0
      ? line3(
          [
            [-49, 5.8, 52],
            [-2, 5.8, 75],
          ],
          "parking-full-mark",
        )
      : svg``
  }`;
}
function indicator(s: DeviceVisualState) {
  return svg`${box(-32, -9, 87, 64, 18, 4, "parking-ceiling-mount")}${cylinder(0, 0, 63, 2, 24, "parking-indicator-stem")}${cylinder(0, 0, 57, 16, 7, "parking-indicator-housing")}${cylinder(0, 0, 55, 14, 3, s.hasTelemetry ? (s.mode === "parking_occupied" ? "parking-light-red" : s.mode === "parking_reserved" ? "parking-light-blue" : "parking-light-green") : "parking-light-off")}${cylinder(0, 0, 53, 5, 2, "parking-indicator-transducer")}${[-10, 10].map((x) => tip([x, 0, 64.5], "parking-bolt", 0.8))}`;
}
function dock(s: DeviceVisualState) {
  const p = parkingDockPose(s.program ?? "idle", s.processProgress ?? 0);
  const a = angle(p.deck);
  const deck: Pose = ([x, y, z]) => [
    x,
    -24 + y * Math.cos(a) - z * Math.sin(a),
    25 + y * Math.sin(a) + z * Math.cos(a),
  ];
  const hinge = deck([0, 44, 0]);
  const lip: Pose = ([x, y, z]) => [
    x,
    hinge[1] +
      y * Math.cos(angle(p.deck + p.lip)) -
      z * Math.sin(angle(p.deck + p.lip)),
    hinge[2] +
      y * Math.sin(angle(p.deck + p.lip)) +
      z * Math.cos(angle(p.deck + p.lip)),
  ];
  return svg`<g transform="translate(140 128) scale(.82) translate(-140 -128)">${box(-67, -47, 0, 134, 45, 24, "parking-dock-concrete")}${box(-64, -43, 24, 128, 8, 65, "parking-dock-wall")}${box(-37, -34.7, 25, 74, 1, 60, "parking-dock-door")}${Array.from(
    { length: 10 },
    (_, i) =>
      line3(
        [
          [-36, -33.5, 29 + i * 5],
          [36, -33.5, 29 + i * 5],
        ],
        "parking-door-slat",
      ),
  )}${box(-34, -25, 16, 68, 49, 8, "parking-dock-pit")}${[-43, 38].map(
    (x) =>
      svg`${box(x, 0, 4, 6, 9, 21, "parking-dock-bumper")}${line3(
        [
          [x + 1, 9.3, 6],
          [x + 5, 9.3, 10],
          [x + 1, 9.3, 14],
          [x + 5, 9.3, 18],
          [x + 1, 9.3, 22],
        ],
        "parking-hazard-mark",
      )}`,
  )}
    <g class="parking-leveler-deck" data-deck-angle=${p.deck}>${solid(-30, 0, -2, 60, 44, 2, "parking-deck-steel", deck)}${Array.from(
      { length: 8 },
      (_, i) =>
        line3(
          [
            [-26 + i * 7, 3, 0.3],
            [-26 + i * 7 + 3, 6, 0.3],
            [-26 + i * 7, 9, 0.3],
          ].map(([px, py, pz]) => deck([px, py, pz])),
          "parking-deck-tread",
        ),
    )}</g>
    <g class="parking-leveler-lip" data-lip-angle=${p.lip}>${solid(-30, 0, -1.5, 60, 14, 1.5, "parking-lip-steel", lip)}${pipe(
      [
        [-30, hinge[1], hinge[2]],
        [30, hinge[1], hinge[2]],
      ],
      false,
      2,
    )}</g>${pipe([[0, -13, 13], deck([0, 27, -3])], false, 3)}${box(45, -34, 33, 16, 5, 23, "parking-dock-panel")}${statusLamp(53, -28.5, 50, s.example === true && s.program === "docked")}${statusLamp(53, -28.5, 41, s.example === true && s.program !== "docked", true)}${
      s.example
        ? svg`${box(-31, 31, 13, 62, 29, 9, "parking-example-trailer")}${line3(
            [
              [-29, 31, 23],
              [29, 31, 23],
            ],
            "parking-trailer-edge",
          )}`
        : svg``
    }</g>`;
}
export function parkingVisual(d: CatalogDevice, s: DeviceVisualState) {
  if (!isParking(d)) return undefined;
  let drawing;
  switch (d.id) {
    case "vehicle_barrier":
      drawing = svg`<g transform="translate(140 138) scale(.7) translate(-140 -128)">${barrier(s)}</g>`;
      break;
    case "motorized_gate":
      drawing = slidingGate(s);
      break;
    case "retractable_bollard":
      drawing = bollard(s);
      break;
    case "parking_space_lock":
      drawing = parkingLock(s);
      break;
    case "turnstile":
      drawing = turnstile(s);
      break;
    case "speed_gate":
      drawing = speedGate(s);
      break;
    case "parking_occupancy_sensor":
    case "inductive_loop_detector":
    case "vehicle_radar":
      drawing = detector(d, s);
      break;
    case "license_plate_recognition_camera":
      drawing = cameraVisual(d, s);
      break;
    case "parking_ticket_dispenser":
      drawing = ticket(s);
      break;
    case "parking_payment_terminal":
      drawing = ticket(s, true);
      break;
    case "vehicle_rfid_reader":
      drawing = rfid(s);
      break;
    case "parking_guidance_controller":
      drawing = guidanceController(s);
      break;
    case "parking_guidance_sign":
      drawing = sign(s);
      break;
    case "parking_space_indicator":
      drawing = indicator(s);
      break;
    case "loading_dock_controller":
      drawing = dock(s);
      break;
    default:
      return undefined;
  }
  return svg`<g class="realistic-parking ${s.active && s.available ? "parking-moving" : ""} ${s.alert ? "parking-obstructed" : ""} ${s.hasPosition === false ? "parking-position-unknown" : ""}" data-parking-device=${d.id} data-parking-phase=${s.processPhase ?? "unknown"}>${drawing}</g>`;
}
