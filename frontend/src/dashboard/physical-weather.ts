import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  display,
  line3,
  pipe,
  polygon3,
  project,
  type Point3,
} from "./isometric-primitives";
import { fluidShell, fluidTube, fluidBand } from "./physical-water";
import { isWeather } from "./weather-model";

const ring = (x: number, y: number, z: number, r: number): Point3[] =>
  Array.from({ length: 33 }, (_, i) => [
    x + Math.cos((i * Math.PI) / 16) * r,
    y + Math.sin((i * Math.PI) / 16) * r,
    z,
  ]);
const dot = (p: Point3, r = 1.2, cls = "wx-screw") => {
  const [x, y] = project(p);
  return svg`<circle class=${cls} cx=${x} cy=${y} r=${r}/>`;
};
const cable = (p: Point3[]) => line3(p, "wx-cable");
function base(height = 95) {
  return svg`${box(-17, -15, 0, 34, 30, 3, "wx-foot")}${[
    [-12, -10],
    [12, -10],
    [-12, 10],
    [12, 10],
  ].map(
    ([x, y]) =>
      svg`${fluidTube("z", [x, y, 0], 3, 5, 1.8, "wx-metal")}${dot([x, y, 5])}`,
  )}${fluidTube("z", [0, 0, 0], 3, height, 2.6, "wx-metal")}${fluidTube("z", [0, 0, 0], 8, 13, 4, "wx-metal")}${cable(
    [
      [2, 0, height - 4],
      [3, 2, 16],
      [13, 7, 5],
      [27, 7, 2],
    ],
  )}`;
}
function shield(x: number, y: number, z: number, humidity = false) {
  return svg`<g class="wx-radiation-shield" data-sensor=${humidity ? "humidity" : "temperature"}>${fluidTube("z", [x, y, 0], z + 3, z + 28, 4, "wx-probe")}${Array.from(
    { length: humidity ? 3 : 8 },
    (_, i) =>
      fluidShell(
        "z",
        [x, y, 0],
        [
          [z + i * 3, 11],
          [z + i * 3 + 1, 13],
          [z + i * 3 + 2, 11],
        ],
        "wx-white",
      ),
  )}${fluidShell(
    "z",
    [x, y, 0],
    [
      [z + 24, 13],
      [z + 26, 10],
      [z + 27, 2],
    ],
    "wx-white",
  )}${
    humidity
      ? Array.from({ length: 5 }, (_, i) =>
          fluidBand(x, y, z + 5 + i * 3, 4.1, "wx-mesh"),
        )
      : cable([
          [x, y, z],
          [x, y, z - 7],
          [x + 12, y, z - 10],
        ])
  }</g>`;
}
function cups(x: number, y: number, z: number, phase: number) {
  const a = (phase * Math.PI) / 180;
  const one = (angle: number) => {
    const cx = x + 23 * Math.cos(angle);
    const cy = y + 23 * Math.sin(angle);
    const ux = -Math.sin(angle);
    const uy = Math.cos(angle);
    // A concave, open hemisphere facing tangentially to the rotor arm.
    const rim = Array.from({ length: 25 }, (_, i) => {
      const t = (i * Math.PI) / 12;
      return [
        cx + Math.cos(angle) * 6 * Math.cos(t),
        cy + Math.sin(angle) * 6 * Math.cos(t),
        z + 6 * Math.sin(t),
      ] as Point3;
    });
    const back: Point3 = [cx - ux * 5, cy - uy * 5, z];
    return svg`${pipe(
      [
        [x, y, z],
        [cx, cy, z],
      ],
      false,
      1.5,
    )}<g class="wx-wind-cup">${rim.slice(1).map((p, i) => polygon3([rim[i], p, back], "wx-cup-surface"))}${polygon3(rim, "wx-cup-interior")}${line3(rim, "wx-cup-rim")}${line3([back, [cx, cy, z]], "wx-cup-shade")}</g>`;
  };
  return svg`<g class="wx-cup-rotor" data-angle=${phase.toFixed(2)}>${[0, 120, 240].map((v) => one(a + (v * Math.PI) / 180))}${fluidTube("z", [x, y, 0], z - 8, z + 2, 3, "wx-dark")}${dot([x, y, z + 2], 1.3)}</g>`;
}
function vane(x: number, y: number, z: number, bearing: number, known = true) {
  const a = ((bearing - 90) * Math.PI) / 180;
  const p = (along: number, side = 0, up = 0): Point3 => [
    x + along * Math.cos(a) - side * Math.sin(a),
    y + along * Math.sin(a) + side * Math.cos(a),
    z + up,
  ];
  return svg`<g class=${known ? "wx-wind-vane" : "wx-wind-vane wx-vane-unknown"} data-bearing=${known ? bearing.toFixed(2) : "unknown"}>${pipe([p(-24), p(28)], false, 1.5)}${polygon3([p(28), p(17, -4), p(17, 4)], "wx-arrowhead")}${polygon3([p(-24, 0, 0), p(-12, 0, 0), p(-13, 0, 10), p(-24, 0, 10)], "wx-vane-tail")}${fluidTube("z", [x, y, 0], z - 10, z + 3, 1.8, "wx-metal")}${dot([x, y, z + 3], 1.2)}</g>`;
}
function compass() {
  return svg`${line3(
    [
      [-25, 0, 67],
      [25, 0, 67],
    ],
    "wx-compass",
  )}${line3(
    [
      [0, -25, 67],
      [0, 25, 67],
    ],
    "wx-compass",
  )}${[
    ["N", 0, -29],
    ["E", 29, 0],
    ["S", 0, 29],
    ["W", -29, 0],
  ].map(([text, x, y]) => {
    const [px, py] = project([Number(x), Number(y), 67]);
    return svg`<text x=${px} y=${py} class="screen-label wx-cardinal">${text}</text>`;
  })}`;
}
function funnel(x: number, y: number, z: number, r = 18) {
  return svg`${fluidShell(
    "z",
    [x, y, 0],
    [
      [z, 3],
      [z + 12, r],
      [z + 16, r],
    ],
    "wx-white",
  )}${polygon3(ring(x, y, z + 16, r - 1.5), "wx-funnel-inside")}${fluidBand(x, y, z + 16, r, "wx-lip")}${fluidTube("z", [x, y, 0], z - 8, z, 3, "wx-metal")}`;
}
function drops(s: DeviceVisualState, x = 0, y = 0, z = 65) {
  if (s.processPhase !== "shower" && s.processPhase !== "tip") return svg``;
  const t = (s.processProgress ?? 0) / 100;
  return svg`<g class="wx-shower" data-progress=${s.processProgress}>${Array.from(
    { length: 9 },
    (_, i) => {
      const f = (t * 4 + i / 9) % 1;
      return line3(
        [
          [x + ((i % 3) - 1) * 7, y + (Math.floor(i / 3) - 1) * 6, z - f * 35],
          [
            x + ((i % 3) - 1) * 7,
            y + (Math.floor(i / 3) - 1) * 6,
            z - f * 35 - 3,
          ],
        ],
        "wx-raindrop",
      );
    },
  )}</g>`;
}
export function weatherBucketPoint(
  degrees: number,
  x: number,
  z: number,
  y = 5,
): Point3 {
  const a = (degrees * Math.PI) / 180;
  return [
    x * Math.cos(a) - z * Math.sin(a),
    y,
    24 + x * Math.sin(a) + z * Math.cos(a),
  ];
}
function rainGauge(s: DeviceVisualState) {
  // Front shell is omitted intentionally to reveal the bucket and reed pickup.
  const parity = Math.round(s.value / 0.2) % 2;
  const t = s.processPhase === "tip" ? (s.processProgress ?? 0) / 100 : 0;
  const angle =
    (parity ? -22 : 22) +
    (s.processPhase === "tip"
      ? (parity ? 44 : -44) * (t * t * (3 - 2 * t))
      : 0);
  const p = (x: number, z: number, y = 5): Point3 =>
    weatherBucketPoint(angle, x, z, y);
  const arc = (z: number) =>
    Array.from({ length: 17 }, (_, i) => {
      const a = Math.PI * 0.75 + (i * Math.PI) / 16;
      return [22 * Math.cos(a), 22 * Math.sin(a), z] as Point3;
    });
  const low = arc(4);
  const high = arc(43);
  const housing = svg`<g class="wx-gauge-cutaway">${low.slice(1).map((point, i) => polygon3([low[i], point, high[i + 1], high[i]], "wx-gauge-wall"))}${line3(high, "wx-lip")}${line3([high[0], low[0]], "wx-lip")}${line3([high[16], low[16]], "wx-lip")}</g>`;
  return svg`${box(-26, -24, 0, 52, 48, 4, "wx-foot")}${housing}${funnel(0, 0, 43, 25)}<g class="wx-tipping-bucket" data-angle=${angle.toFixed(2)}>${polygon3([p(-16, 7, -7), p(0, -4, -7), p(0, -4, 7), p(-16, 7, 7)], "wx-bucket")}${polygon3([p(0, -4, -7), p(16, 7, -7), p(16, 7, 7), p(0, -4, 7)], "wx-bucket")}${polygon3([p(-16, 7, 7), p(0, -4, 7), p(16, 7, 7), p(12, -6, 7), p(-12, -6, 7)], "wx-bucket")}${line3([p(0, -4), p(0, 8)], "wx-bucket-seam")}${pipe(
    [
      [-1, 0, 6],
      [0, 0, 24],
    ],
    false,
    2,
  )}${dot([0, 6, 24], 2, "wx-bearing")}</g>${box(9, 7, 12, 8, 4, 4, "wx-reed-switch")}${cable(
    [
      [13, 9, 12],
      [24, 9, 5],
      [36, 12, 2],
    ],
  )}${drops(s, 0, 0, 78)}`;
}
function dial(value: number, known: boolean) {
  const [x, y] = project([0, 13, 47]);
  const a = ((((value - 800) / 300) * 260 + 140) * Math.PI) / 180;
  return svg`${box(-19, -5, 0, 38, 25, 5, "wx-foot")}${fluidTube("z", [0, 0, 0], 5, 25, 4, "wx-metal")}${fluidTube("y", [0, 0, 47], -4, 12, 27, "wx-metal")}<g transform="matrix(.92 .46 0 -1 ${x} ${y})"><circle class="wx-dial" r="25"/>${Array.from(
    { length: 31 },
    (_, i) => {
      const r = (((i / 30) * 260 + 140) * Math.PI) / 180;
      return svg`<line class="wx-tick" x1=${Math.cos(r) * (i % 5 ? 21 : 19)} y1=${Math.sin(r) * (i % 5 ? 21 : 19)} x2=${Math.cos(r) * 23} y2=${Math.sin(r) * 23}/>`;
    },
  )}${known ? svg`<line class="wx-needle" data-pressure=${value} x1=${-Math.cos(a) * 5} y1=${-Math.sin(a) * 5} x2=${Math.cos(a) * 18} y2=${Math.sin(a) * 18}/>` : svg``}<circle class="wx-bearing" r="2"/></g>${display(-10, 14, 37, 20, 7, known ? String(Math.round(value)) : "—")}${cable(
    [
      [0, -4, 30],
      [13, -4, 12],
      [27, 5, 2],
    ],
  )}`;
}
function optical(s: DeviceVisualState, uv = false) {
  return svg`${[
    [-15, -12],
    [15, -12],
    [0, 18],
  ].map(([x, y]) =>
    fluidTube("z", [x, y, 0], 0, 8, 2.5, "wx-metal"),
  )}${fluidTube("z", [0, 0, 0], 6, 17, 20, "wx-white")}${fluidTube("z", [0, 0, 0], 17, 20, 23, "wx-white")}${fluidTube("z", [0, 0, 0], 20, 24, uv ? 10 : 13, "wx-dark")}${fluidShell(
    "z",
    [0, 0, 0],
    uv
      ? [
          [24, 10],
          [29, 9],
          [31, 1],
        ]
      : [
          [24, 13],
          [29, 12],
          [35, 9],
          [38, 0.5],
        ],
    uv ? "wx-diffuser" : "wx-optical-glass",
  )}${
    uv
      ? svg``
      : fluidShell(
          "z",
          [0, 0, 0],
          [
            [24, 16],
            [31, 14],
            [39, 9],
            [42, 0.5],
          ],
          "wx-optical-glass",
        )
  }${dot([15, 0, 21], 2, "wx-level-bubble")}${cable([
    [0, -20, 13],
    [12, -27, 10],
    [28, -25, 2],
    [44, -18, 1],
  ])}${s.hasTelemetry ? display(-12, 21, 8, 24, 7, uv ? "UV" : "W/m²") : svg``}`;
}
function waterDisc(depth: number, size = 35) {
  return depth > 0
    ? svg`<g class="wx-pond" data-depth=${depth.toFixed(2)}>${polygon3(ring(0, 0, 1 + depth / 10, size), "wx-water")}${fluidBand(0, 0, 1 + depth / 10, size * 0.7, "wx-water-ripple")}</g>`
    : svg``;
}
function roof(s: DeviceVisualState) {
  return svg`${box(-42, -34, -2, 84, 68, 2, "wx-roof")}${waterDisc(s.hasTelemetry ? s.value : 0, 39)}${fluidTube("z", [0, 0, 0], -15, 0, 11, "wx-drain-outlet")}${fluidTube("z", [0, 0, 0], 0, 3, 23, "wx-metal")}${Array.from(
    { length: 13 },
    (_, i) => {
      const a = (i * Math.PI) / 6;
      return line3(
        Array.from({ length: 10 }, (_u, j) => {
          const v = (j * Math.PI) / 18;
          return [
            Math.cos(a) * 20 * Math.cos(v),
            Math.sin(a) * 20 * Math.cos(v),
            3 + 19 * Math.sin(v),
          ] as Point3;
        }),
        "wx-strainer-rib",
      );
    },
  )}${[4, 9, 14].map((z) => fluidBand(0, 0, z, Math.sqrt(400 - (z - 3) ** 2), "wx-strainer-ring"))}${box(25, -7, 1, 10, 14, 16, "wx-probe-box")}${cable(
    [
      [30, 0, 15],
      [22, 0, 14],
      [16, 0, 5],
    ],
  )}${
    s.example && s.mode === "weather_clear_drain" && s.value > 0 && s.active
      ? line3(
          [
            [0, 0, 5],
            [0, 0, -14],
          ],
          "wx-drain-flow",
        )
      : svg``
  }`;
}
export function weatherVisual(d: CatalogDevice, s: DeviceVisualState) {
  if (!isWeather(d)) return undefined;
  let shape;
  switch (d.id) {
    case "weather_station":
      shape = svg`${base(91)}${pipe(
        [
          [-37, 0, 91],
          [39, 0, 91],
        ],
        false,
        3,
      )}${shield(-30, 0, 58)}${cups(27, 0, 112, s.position)}${vane(0, -23, 98, s.windBearing ?? 0, s.windBearing !== undefined)}${funnel(0, 23, 77, 14)}${box(-8, -6, 26, 16, 12, 23, "wx-enclosure")}${display(-5, 6.5, 36, 10, 8, s.hasTelemetry ? "WX" : "—")}`;
      break;
    case "weather_temperature_sensor":
    case "weather_humidity_sensor":
      shape = svg`${base(70)}${pipe(
        [
          [0, 0, 66],
          [18, 0, 66],
        ],
        false,
        3,
      )}${shield(18, 0, 66, d.id === "weather_humidity_sensor")}${box(-7, -5, 28, 14, 10, 15, "wx-enclosure")}`;
      break;
    case "anemometer":
      shape = svg`${base(76)}${cups(0, 0, 86, s.position)}${fluidTube("z", [0, 0, 0], 70, 77, 5, "wx-dark")}`;
      break;
    case "wind_direction_sensor":
      shape = svg`${base(83)}${compass()}${vane(0, 0, 97, s.pan, s.hasTelemetry)}`;
      break;
    case "barometer":
      shape = dial(s.value, s.hasTelemetry);
      break;
    case "rain_gauge":
      shape = rainGauge(s);
      break;
    case "rain_sensor":
      shape = svg`${base(36)}${box(-20, -15, 36, 40, 30, 4, "wx-rain-case")}${polygon3(
        [
          [-18, -13, 41],
          [18, -13, 41],
          [18, 13, 51],
          [-18, 13, 51],
        ],
        "wx-rain-board",
      )}${Array.from({ length: 12 }, (_, i) =>
        line3(
          [
            [-16 + i * 2.8, -11, 42],
            [-16 + i * 2.8, 11, 50],
          ],
          "wx-rain-electrode",
        ),
      )}${
        s.mode === "weather_wet" || s.processPhase === "shower"
          ? [
              [-9, -6, 44],
              [8, 5, 48],
              [0, 9, 49],
            ].map(([x, y, z]) => dot([x, y, z], 2, "wx-droplet"))
          : svg``
      }${drops(s, 0, 0, 85)}`;
      break;
    case "solar_irradiance_sensor":
      shape = optical(s);
      break;
    case "uv_sensor":
      shape = optical(s, true);
      break;
    case "lightning_detector":
      shape = svg`${base(48)}${box(-13, -9, 45, 26, 18, 37, "wx-enclosure")}${fluidTube("z", [0, 0, 0], 82, 111, 1.3, "wx-metal")}${fluidTube("z", [0, 0, 0], 82, 87, 3, "wx-dark")}${[-9, 9].map((x) => dot([x, 9.5, 77], 1))}${dot([0, 9.5, 62], 1.5, s.example && s.processPhase === "event" ? "wx-led-on" : "wx-led-off")}${Array.from(
        { length: 5 },
        (_, i) =>
          line3(
            [
              [-8, 10, 48 + i * 1.5],
              [8, 10, 48 + i * 1.5],
            ],
            "wx-vent",
          ),
      )}`;
      break;
    case "frost_sensor":
      shape = svg`${box(-37, -27, 0, 74, 54, 3, "wx-surface")}${fluidTube("z", [0, 0, 0], 3, 8, 11, "wx-metal")}${cable(
        [
          [0, 0, 8],
          [17, -5, 8],
          [27, -14, 6],
          [34, -20, 4],
        ],
      )}${
        s.mode === "weather_frosted" && s.hasTelemetry
          ? Array.from({ length: 11 }, (_, i) => {
              const x = ((i % 4) - 1.5) * 14;
              const y = (Math.floor(i / 4) - 1) * 15;
              return svg`<g class="wx-frost-crystal">${[0, 60, 120].map((a) =>
                line3(
                  [
                    [
                      x - 4 * Math.cos((a * Math.PI) / 180),
                      y - 4 * Math.sin((a * Math.PI) / 180),
                      4,
                    ],
                    [
                      x + 4 * Math.cos((a * Math.PI) / 180),
                      y + 4 * Math.sin((a * Math.PI) / 180),
                      4,
                    ],
                  ],
                  "wx-ice",
                ),
              )}</g>`;
            })
          : svg``
      }${box(24, -30, 3, 15, 12, 16, "wx-enclosure")}`;
      break;
    case "snow_sensor":
      shape = svg`${box(-43, -30, 0, 86, 60, 2, "wx-ground")}${
        s.hasTelemetry && s.value > 0
          ? fluidShell(
              "z",
              [7, 4, 0],
              [
                [2, 28],
                [2 + s.value / 18, 25],
                [5 + s.value / 18, 12],
              ],
              "wx-snow",
            )
          : svg``
      }${fluidTube("z", [-29, -16, 0], 2, 100, 2.5, "wx-metal")}${pipe(
        [
          [-29, -16, 97],
          [13, -16, 97],
        ],
        false,
        3,
      )}${fluidTube("z", [13, -16, 0], 78, 97, 8, "wx-metal")}${polygon3(ring(13, -16, 78, 6), "wx-transducer")}${cable(
        [
          [-26, -16, 93],
          [-26, -16, 12],
          [-15, -13, 2],
        ],
      )}`;
      break;
    case "flood_sensor":
      shape = svg`${box(-37, -30, 0, 74, 60, 2, "wx-ground")}${waterDisc(s.example ? s.value : s.mode === "weather_wet" ? 25 : 0)}${fluidTube("z", [-18, -12, 0], 2, 65, 2, "wx-metal")}${box(-27, -19, 45, 20, 14, 20, "wx-enclosure")}${[
        2, 11,
      ].map(
        (x) =>
          svg`${fluidTube("z", [x, 0, 0], 2, 16, 1.7, "wx-electrode")}${cable([
            [x, 0, 16],
            [-12, 0, 25],
            [-17, -5, 45],
          ])}`,
      )}${dot([-17, -4.5, 57], 1.5, s.hasTelemetry && s.alert ? "wx-led-on" : "wx-led-off")}`;
      break;
    default:
      shape = roof(s);
  }
  return svg`<g class="realistic-weather weather-${d.id} ${s.hasTelemetry ? "wx-known" : "wx-unknown"}" data-physical-device=${d.id}>${shape}</g>`;
}
