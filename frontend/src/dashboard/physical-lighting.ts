import { svg } from "lit";
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
import { streetlightVisual, exitSignVisual } from "./physical-street-exit";
import { isLighting } from "./lighting-model";

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
const top = (
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
      [x + w, y + h, z],
      [x, y + h, z],
    ],
    cls,
  );
const screw = (p: Point3) => {
  const [x, y] = project(p);
  return svg`<g class="lt-screw"><circle cx=${x} cy=${y} r="1.25"/><path d=${`M${x - 0.8} ${y - 0.4}l1.6 .8`}/></g>`;
};
const cable = (p: Point3[]) => line3(p, "lt-cable");
const round = (
  axis: "x" | "y" | "z",
  c: Point3,
  from: number,
  to: number,
  r: number,
  cls = "lt-aluminum",
) => fluidTube(axis, c, from, to, r, cls);
function kelvin(k: number) {
  const t = Math.max(1000, Math.min(10000, k)) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b =
    t >= 66
      ? 255
      : t <= 19
        ? 0
        : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return `rgb(${[r, g, b].map((n) => Math.round(Math.max(0, Math.min(255, n)))).join(",")})`;
}
function bulb() {
  const helix = Array.from({ length: 97 }, (_, i) => {
    const a = (i * Math.PI) / 8;
    return [Math.cos(a) * 8, Math.sin(a) * 8, 5 + i / 8] as Point3;
  });
  return svg`${fluidShell(
    "z",
    [0, 0, 0],
    [
      [0, 3],
      [3, 5],
      [5, 8],
      [19, 8],
      [21, 9],
    ],
    "lt-nickel",
  )}${line3(helix, "lt-thread")}${round("z", [0, 0, 0], 1, 3, 3, "lt-contact")}${fluidShell(
    "z",
    [0, 0, 0],
    [
      [20, 9],
      [27, 11],
      [40, 15],
      [48, 19],
    ],
    "lt-ceramic",
  )}${fluidShell(
    "z",
    [0, 0, 0],
    [
      [47, 19],
      [55, 24],
      [66, 27],
      [76, 26],
      [85, 21],
      [91, 12],
      [93, 0.1],
    ],
    "lt-opal lt-emitter-shell",
  )}${fluidBand(0, 0, 47, 19, "lt-seam")}${[0, 1, 2, 3].map((i) => fluidBand(0, 0, 29 + i * 3, 11 + i * 0.8, "lt-heat-seam"))}`;
}
function downlight() {
  return svg`${round("y", [0, 0, 51], -22, 6, 18, "lt-aluminum")}${Array.from(
    { length: 11 },
    (_, i) => {
      const a = (i * Math.PI) / 5;
      return line3(
        [
          [Math.cos(a) * 19, -22, 51 + Math.sin(a) * 19],
          [Math.cos(a) * 19, 4, 51 + Math.sin(a) * 19],
        ],
        "lt-fin",
      );
    },
  )}${fluidShell(
    "y",
    [0, 0, 51],
    [
      [5, 20],
      [10, 27],
      [14, 27],
      [15, 22],
    ],
    "lt-ceramic",
  )}${circleFace(0, 15.4, 51, 22, "lt-reflector")}${circleFace(0, 15.8, 51, 14, "lt-diffuser")}${circleFace(0, 16, 51, 6, "lt-cob-emitter lt-emitter")}${[
    -1, 1,
  ].map((sign) =>
    line3(
      [
        [sign * 17, -5, 62],
        [sign * 32, -10, 65],
        [sign * 34, 5, 57],
        [sign * 27, 5, 51],
      ],
      "lt-spring",
    ),
  )}${cable([
    [0, -22, 60],
    [12, -32, 63],
    [30, -32, 57],
  ])}`;
}
function ceilingPanel() {
  return svg`${box(-40, -28, 35, 80, 56, 5, "lt-panel-frame")}${top(-37, -25, 40.2, 74, 50, "lt-diffuser lt-emitter")}${[
    -33, 33,
  ].map((x) =>
    line3(
      [
        [x, -21, 35],
        [x, -21, 27],
        [x, -10, 27],
      ],
      "lt-spring",
    ),
  )}${box(12, -49, 35, 30, 14, 8, "lt-driver-case")}${cable([
    [0, -15, 30],
    [0, -35, 26],
    [25, -39, 24],
  ])}${[-35, 35].map((x) => screw([x, 24, 40.5]))}`;
}
function spot() {
  return svg`${fluidShell(
    "y",
    [0, 0, 54],
    [
      [-29, 13],
      [-24, 16],
      [8, 22],
      [14, 22],
    ],
    "lt-aluminum",
  )}${Array.from({ length: 14 }, (_, i) => {
    const a = (i * Math.PI) / 7;
    return line3(
      [
        [Math.cos(a) * 15, -23, 54 + Math.sin(a) * 15],
        [Math.cos(a) * 21, 7, 54 + Math.sin(a) * 21],
      ],
      "lt-fin",
    );
  })}${circleFace(0, 14.3, 54, 20, "lt-reflector")}${[
    [-7, 57],
    [7, 57],
    [0, 46],
  ].map(
    ([x, z]) =>
      svg`${circleFace(x, 14.6, z, 5, "lt-lens")}${circleFace(x, 15, z, 3, "lt-emitter")}`,
  )}${round("y", [-7, 0, 54], -37, -29, 1.8, "lt-contact")}${round("y", [7, 0, 54], -37, -29, 1.8, "lt-contact")}${round("y", [-7, 0, 54], -38, -36, 3, "lt-contact")}${round("y", [7, 0, 54], -38, -36, 3, "lt-contact")}`;
}
function linear() {
  return svg`${box(-48, -11, 34, 96, 22, 18, "lt-driver-case")}${pane(-46, 11.3, 37, 92, 12, "lt-lens")}${Array.from({ length: 12 }, (_, i) => pane(-43 + i * 7.4, 11.5, 40, 4.5, 6, i % 3 === 0 ? "lt-white-emitter" : "lt-emitter"))}${[-39, 39].map((x) => svg`${box(x - 4, -6, 24, 8, 12, 10, "lt-bracket")}${screw([x, 6.2, 29])}`)}${cable(
    [
      [-47, 0, 36],
      [-57, -4, 29],
      [-59, -17, 25],
    ],
  )}${Array.from({ length: 7 }, (_, i) =>
    line3(
      [
        [-46, -9 + i * 2.5, 52],
        [46, -9 + i * 2.5, 52],
      ],
      "lt-fin",
    ),
  )}`;
}
function strip() {
  const segment = (x: number, y: number, z: number) =>
    svg`${box(x, y, z, 18, 10, 1, "lt-pcb")}${top(x + 5, y + 2, z + 1.2, 7, 6, "lt-led-package")}${top(x + 6, y + 3, z + 1.3, 5, 4, "lt-emitter")}${[2, 5, 8].map((v) => top(x + 0.5, y + v - 1, z + 1.3, 2, 1.5, "lt-copper"))}${line3(
      [
        [x + 17, y, z + 1.4],
        [x + 17, y + 10, z + 1.4],
      ],
      "lt-cut-mark",
    )}`;
  return svg`${[-3, -2, -1, 0, 1, 2].map((i) => segment(i * 18, -8, 24))}${[0, 1, 2].map((i) => segment(50, 3 + i * 11, 24))}${cable(
    [
      [-54, -4, 24],
      [-65, -4, 24],
      [-68, 0, 19],
    ],
  )}${cable([
    [-54, 0, 24],
    [-65, 0, 24],
    [-70, 5, 19],
  ])}${round("z", [-13, 27, 0], 0, 13, 23, "lt-reel")}${round("z", [-13, 27, 0], 13, 15, 25, "lt-aluminum")}${polygon3(
    Array.from(
      { length: 33 },
      (_, i) =>
        [
          -13 + Math.cos((i * Math.PI) / 16) * 9,
          27 + Math.sin((i * Math.PI) / 16) * 9,
          15.5,
        ] as Point3,
    ),
    "lt-reel-hole",
  )}`;
}
function terminals(
  x: number,
  y: number,
  z: number,
  count: number,
  green = false,
) {
  return svg`<g class=${green ? "lt-terminal-green" : "lt-terminal"}>${Array.from({ length: count }, (_, i) => svg`${box(x + i * 8, y, z, 7, 9, 7)}${screw([x + i * 8 + 3.5, y + 4, z + 7.3])}${pane(x + i * 8 + 2, y + 9.2, z + 1, 3, 3, "lt-wire-port")}`)}</g>`;
}
function driver(s: DeviceVisualState) {
  return svg`${box(-43, -20, 10, 86, 40, 26, "lt-driver-case")}${Array.from(
    { length: 10 },
    (_, i) =>
      line3(
        [
          [-39, -17 + i * 3.7, 36.2],
          [39, -17 + i * 3.7, 36.2],
        ],
        "lt-fin",
      ),
  )}${[-1, 1].map((v) => svg`${box(v < 0 ? -50 : 43, -16, 10, 7, 32, 4, "lt-mount-tab")}${screw([v * 46, -11, 14.3])}${screw([v * 46, 11, 14.3])}`)}${terminals(-40, 14, 15, 3)}${terminals(15, 14, 15, 3, true)}${display(-15, 20.5, 20, 30, 10, s.example ? `${s.level.toFixed(1)}V` : "LED")}${cable(
    [
      [30, 24, 17],
      [43, 32, 16],
      [55, 30, 14],
    ],
  )}`;
}
function relay(s: DeviceVisualState) {
  const pull = s.hasTelemetry ? Math.min(1, s.level / 100) : 0;
  return svg`${box(-21, -17, 4, 42, 34, 9, "lt-din-base")}${box(-18, -14, 13, 36, 28, 44, "lt-relay-shell")}${terminals(-16, 9, 9, 4)}${terminals(-16, -18, 52, 4)}${round("x", [0, 0, 29], -10, 10, 7, "lt-copper-coil")}${Array.from(
    { length: 12 },
    (_, i) =>
      fluidShell(
        "x",
        [0, 0, 29],
        [
          [-10 + i * 1.7, 7.5],
          [-9.3 + i * 1.7, 7.5],
        ],
        "lt-copper-coil",
      ),
  )}${line3(
    [
      [-10, 3, 48],
      [11, 3, 48 - pull * 6],
    ],
    "lt-armature",
  )}${line3(
    [
      [11, 3, 42],
      [15, 3, 42],
    ],
    "lt-contact-fixed",
  )}${round("x", [0, 3, 29], 10, 16, 2, "lt-aluminum")}${dotLed([-10, 14.4, 43], s.hasTelemetry && pull >= 0.99)}<g class="lt-contact-motion" data-contact=${pull.toFixed(3)}>${line3(
    [
      [11, 3, 48 - pull * 6],
      [11, 3, 39 - pull * 0],
    ],
    "lt-contact-blade",
  )}</g>`;
}
const dotLed = (p: Point3, on: boolean) => {
  const [x, y] = project(p);
  return svg`<circle cx=${x} cy=${y} r="1.4" class=${on ? "lt-status-on" : "lt-status-off"}/>`;
};
function wallControl(s: DeviceVisualState, keypad = false) {
  return svg`${box(-25, -8, 12, 50, 16, 67, "lt-wallplate")}${[-20, 20].map((x) => screw([x, 8.3, 18]))}${
    keypad
      ? [0, 1, 2, 3].map((i) => {
          const modes = [
            "light_scene_off",
            "light_scene_work",
            "light_scene_relax",
            "light_scene_clean",
          ];
          const chosen = !!s.example && s.mode === modes[i];
          return svg`${box(-18, 8.2 - (chosen && s.processPhase === "press" ? 1.4 : 0), 21 + i * 12, 36, 2, 10, "lt-key")}${line3(
            [
              [-10, 10.5, 26 + i * 12],
              [3 + i * 2, 10.5, 26 + i * 12],
            ],
            "lt-button-mark",
          )}${dotLed([13, 10.6, 26 + i * 12], chosen)}`;
        })
      : svg`${pane(-5, 8.3, 23, 10, 45, "lt-slider-track")}${box(-8, 8.4, 23 + (s.hasTelemetry ? s.level : 0) * 0.35, 16, 5, 9, "lt-slider-thumb")}${box(-18, 8.3, 65, 36, 2, 8, "lt-key")}${dotLed([12, 10.5, 69], s.hasTelemetry && s.level > 0)}`
  }`;
}
function panel(s: DeviceVisualState) {
  return svg`${box(-40, -8, 15, 80, 16, 63, "lt-panel-frame")}${pane(-35, 8.3, 22, 70, 49, "lt-panel-screen")}${[
    0, 1, 2, 3,
  ].map(
    (i) =>
      svg`${pane(-30 + (i % 2) * 32, 8.5, 28 + Math.floor(i / 2) * 22, 26, 17, (s.outputs?.[i] ?? 0) > 0 ? "lt-channel-on" : "lt-channel-off")}${[
        0, 1, 2,
      ].map((j) =>
        line3(
          [
            [-25 + (i % 2) * 32, 8.7, 32 + Math.floor(i / 2) * 22 + j * 3],
            [-12 + (i % 2) * 32, 8.7, 32 + Math.floor(i / 2) * 22 + j * 3],
          ],
          "lt-screen-mark",
        ),
      )}`,
  )}${dotLed([31, 8.4, 18], !!s.example)}`;
}
function dali(s: DeviceVisualState) {
  return svg`${box(-34, -18, 5, 68, 36, 48, "lt-din-base")}${box(-30, -15, 18, 60, 30, 41, "lt-controller-case")}${terminals(-28, 11, 8, 7)}${terminals(-28, -20, 52, 7, true)}${display(-23, 15.3, 35, 46, 15, "DALI-2")}${[0, 1, 2, 3].map((i) => dotLed([-18 + i * 12, 15.5, 28], !!s.outputs?.[i]))}${pane(-7, 15.4, 20, 14, 4, "lt-wire-port")}${line3(
    [
      [-24, 15.5, 55],
      [24, 15.5, 55],
    ],
    "lt-seam",
  )}`;
}
function dmx(s: DeviceVisualState) {
  return svg`${box(-48, -20, 8, 96, 40, 30, "lt-driver-case")}${Array.from(
    { length: 4 },
    (_, i) => {
      const level = s.outputs?.[i] ?? 0;
      return svg`<g class="lt-dmx-fader" data-channel=${i + 1} data-value=${level}>${line3(
        [
          [-33 + i * 22, 10, 38.4],
          [-33 + i * 22, -14, 38.4],
        ],
        "lt-slider-track",
      )}${box(-38 + i * 22, 9 - (level / 255) * 23, 38.5, 10, 4, 3, "lt-fader-thumb")}</g>`;
    },
  )}${[-23, 23].map((x) => svg`${circleFace(x, 20.3, 23, 7, "lt-xlr")}${Array.from({ length: 5 }, (_, i) => circleFace(x + Math.cos(i * Math.PI * 0.4) * 3, 20.6, 23 + Math.sin(i * Math.PI * 0.4) * 3, 0.8, "lt-pin"))}`)}${display(-8, 20.4, 14, 16, 7, "DMX")}`;
}
function outdoor(s: DeviceVisualState, type: string) {
  const flood = type === "floodlight";
  const beam = s.hasTelemetry && s.level > 0;
  if (!flood) {
    return svg`${fluidShell(
      "z",
      [0, 0, 0],
      [
        [0, 0.1],
        [14, 2],
        [29, 2],
      ],
      "lt-dark",
    )}${pipe(
      [
        [0, 0, 29],
        [0, 0, 43],
      ],
      false,
      4,
    )}${round("y", [0, 0, 52], -13, 14, 12, "lt-aluminum")}${fluidShell(
      "y",
      [0, 0, 52],
      [
        [13, 13],
        [20, 13],
        [21, 11],
      ],
      "lt-dark",
    )}${circleFace(0, 21.2, 52, 10, "lt-lens")}${circleFace(0, 21.4, 52, 7, "lt-emitter")}${cable(
      [
        [0, -12, 50],
        [-9, -20, 24],
        [-17, -12, 2],
      ],
    )}${
      beam
        ? polygon3(
            [
              [-5, 21, 48],
              [5, 21, 48],
              [28, 56, 1],
              [-28, 56, 1],
            ],
            "lt-beam",
          )
        : svg``
    }`;
  }
  return svg`${box(-25, -12, 2, 50, 24, 4, "lt-base")}${line3(
    [
      [-27, 0, 5],
      [-27, 0, 56],
      [27, 0, 56],
      [27, 0, 5],
    ],
    "lt-yoke",
  )}${box(-33, -9, 30, 66, 18, 46, "lt-flood-case")}${pane(-29, 9.2, 34, 58, 38, "lt-lens")}${Array.from({ length: 24 }, (_, i) => pane(-24 + (i % 6) * 8.5, 9.4, 39 + Math.floor(i / 6) * 8, 5, 5, "lt-emitter"))}${[-28, 28].map((x) => screw([x, 9.5, 70]))}${Array.from(
    { length: 10 },
    (_, i) =>
      line3(
        [
          [-30 + i * 6.5, -9, 76.3],
          [-30 + i * 6.5, 7, 76.3],
        ],
        "lt-fin",
      ),
  )}${
    beam
      ? polygon3(
          [
            [-27, 10, 33],
            [27, 10, 33],
            [49, 56, 1],
            [-49, 56, 1],
          ],
          "lt-beam",
        )
      : svg``
  }${cable([
    [0, -9, 31],
    [-15, -14, 17],
    [-35, -9, 2],
  ])}`;
}
function emergency(s: DeviceVisualState) {
  return svg`${box(-28, -12, 15, 56, 24, 38, "lt-battery-box")}${[-1, 1].map(
    (sign) =>
      svg`${pipe(
        [
          [sign * 17, 0, 53],
          [sign * 24, 0, 64],
        ],
        false,
        3,
      )}${round("y", [sign * 24, 0, 69], -8, 10, 11, "lt-ceramic")}${circleFace(sign * 24, 10.5, 69, 9, "lt-reflector")}${circleFace(sign * 24, 10.8, 69, 7, "lt-emitter")}${screw([sign * 24, 11, 69])}`,
  )}${pane(-16, 12.3, 24, 32, 18, "lt-battery-cutaway")}${line3(
    [
      [-12, 12.5, 28],
      [-12, 12.5, 38],
      [9, 12.5, 38],
      [9, 12.5, 28],
      [-12, 12.5, 28],
    ],
    "lt-battery-mark",
  )}${dotLed([-19, 12.5, 46], !!s.example && s.mode === "light_mains")}${circleFace(18, 12.5 - (s.processPhase === "test" ? 1 : 0), 46, 2, "lt-test-button")}`;
}
function luxSensor(outdoorSensor: boolean) {
  return outdoorSensor
    ? svg`${box(-21, -15, 3, 42, 30, 6, "lt-mount-tab")}${round("z", [0, 0, 0], 9, 22, 11, "lt-ceramic")}${fluidShell(
        "z",
        [0, 0, 0],
        [
          [22, 12],
          [30, 11],
          [36, 7],
          [38, 0.1],
        ],
        "lt-sensor-dome",
      )}${fluidBand(0, 0, 22, 12, "lt-seam")}${cable([
        [0, -11, 16],
        [14, -20, 11],
        [31, -22, 2],
      ])}${[-15, 15].map((x) => screw([x, 8, 9.3]))}`
    : svg`${box(5, -20, 10, 28, 18, 42, "lt-sensor-transmitter")}${display(9, -1.5, 30, 20, 12, "lx")}${round("z", [-21, 14, 0], 4, 13, 12, "lt-dark")}${fluidShell(
        "z",
        [-21, 14, 0],
        [
          [13, 11],
          [18, 10],
          [20, 7],
          [21, 0.2],
        ],
        "lt-sensor-diffuser",
      )}${cable([
        [-21, 4, 8],
        [-28, -7, 7],
        [-4, -22, 8],
        [10, -19, 15],
      ])}`;
}
export function lightingVisual(
  d: CatalogDevice,
  s: DeviceVisualState,
  instanceId = d.id,
) {
  const id = `light-${instanceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  if (!isLighting(d)) return undefined;
  const colored = ["rgb_light", "rgbw_light", "led_strip"].includes(d.id);
  const color = colored
    ? s.color
    : d.id === "tunable_white_light" || d.id === "streetlight"
      ? s.colorTemperature !== undefined
        ? kelvin(s.colorTemperature)
        : s.color
      : "#ffe4ad";
  const level = s.hasTelemetry ? Math.max(0, Math.min(100, s.level)) / 100 : 0;
  const style = `--fixture-color:${color};--fixture-level:${level};--white-level:${s.hasTelemetry ? (s.whiteLevel ?? 0) / 100 : 0};--fixture-glow:${level * 0.18}`;
  let shape;
  switch (d.id) {
    case "smart_light":
      shape = bulb();
      break;
    case "dimmable_light":
      shape = downlight();
      break;
    case "tunable_white_light":
      shape = ceilingPanel();
      break;
    case "rgb_light":
      shape = spot();
      break;
    case "rgbw_light":
      shape = linear();
      break;
    case "led_strip":
      shape = strip();
      break;
    case "led_driver":
      shape = driver(s);
      break;
    case "lighting_relay":
      shape = relay(s);
      break;
    case "dimmer":
      shape = wallControl(s);
      break;
    case "lighting_keypad":
      shape = wallControl(s, true);
      break;
    case "lighting_control_panel":
      shape = panel(s);
      break;
    case "dali_controller":
      shape = dali(s);
      break;
    case "dmx_controller":
      shape = dmx(s);
      break;
    case "emergency_light":
      shape = emergency(s);
      break;
    case "exit_sign":
      shape = exitSignVisual(s, id);
      break;
    case "daylight_sensor":
      shape = luxSensor(true);
      break;
    case "illuminance_sensor":
      shape = luxSensor(false);
      break;
    case "streetlight":
      shape = streetlightVisual(s, id);
      break;
    default:
      shape = outdoor(s, d.id);
  }
  return svg`<g class="realistic-lighting light-${d.id} ${s.hasTelemetry ? "lt-known" : "lt-unknown"}" style=${style} data-physical-device=${d.id} data-level=${level.toFixed(3)} data-cct=${s.colorTemperature ?? "unknown"}>${shape}</g>`;
}
