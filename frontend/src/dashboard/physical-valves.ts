import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import type { Point3 } from "./isometric-primitives";
import {
  box,
  cylinder,
  circleFace,
  display,
  gauge,
  line3,
  pipe,
  polygon3,
  project,
} from "./isometric-primitives";
import { valveSpec } from "./valve-model";

const STEPS = 24;
type Axis = "x" | "y";
const axisPoint = (
  axis: Axis,
  t: number,
  u: number,
  v: number,
  z = 32,
): Point3 => (axis === "x" ? [t, u, z + v] : [u, t, z + v]);
const ring = (axis: Axis, t: number, r: number, z = 32, segments = STEPS) =>
  Array.from({ length: segments }, (_, i) =>
    axisPoint(
      axis,
      t,
      r * Math.cos((i * Math.PI * 2) / segments),
      r * Math.sin((i * Math.PI * 2) / segments),
      z,
    ),
  );
function shell(
  axis: Axis,
  sections: readonly (readonly [number, number])[],
  z = 32,
  cls = "valve-cast",
) {
  const faces: { points: Point3[]; depth: number; light: number }[] = [];
  const rings = sections.map((section) => ring(axis, ...section, z));
  for (let row = 0; row < sections.length - 1; row++) {
    for (let col = 0; col < STEPS; col++) {
      const next = (col + 1) % STEPS;
      const first = rings[row];
      const second = rings[row + 1];
      const points = [first[col], first[next], second[next], second[col]];
      faces.push({
        points,
        depth: points.reduce((n, p) => n + p[0] + p[1] + p[2] * 0.92, 0) / 4,
        light: Math.round(
          40 + 40 * Math.sin(((col + 0.5) * Math.PI * 2) / STEPS),
        ),
      });
    }
  }
  faces.sort((a, b) => a.depth - b.depth);
  return svg`<g class=${cls}>${faces.map((face) => polygon3(face.points, "valve-metal-face", `--valve-face-light:${face.light}%`))}</g>`;
}
function flange(axis: Axis, t: number, r = 20, z = 32, bolts = 6, bore = 11) {
  return svg`<g class="valve-flange">${shell(
    axis,
    [
      [t - 3, r],
      [t + 3, r],
    ],
    z,
    "valve-steel",
  )}${polygon3(ring(axis, t + 3.1, r, z), "valve-flange-face")}${polygon3(ring(axis, t + 3.2, bore, z), "valve-port-bore")}${Array.from(
    { length: bolts },
    (_, i) => {
      const angle = (i * Math.PI * 2) / bolts + Math.PI / bolts;
      const u = (r - 4) * Math.cos(angle);
      const v = (r - 4) * Math.sin(angle);
      return polygon3(
        Array.from({ length: 6 }, (_vertex, j) =>
          axisPoint(
            axis,
            t + 3.4,
            u + 1.5 * Math.cos((j * Math.PI) / 3),
            v + 1.5 * Math.sin((j * Math.PI) / 3),
            z,
          ),
        ),
        "valve-bolt",
      );
    },
  )}</g>`;
}
function union(axis: Axis, t: number, z = 32) {
  return svg`${shell(
    axis,
    [
      [t - 7, 10],
      [t - 3, 10],
    ],
    z,
    "valve-brass",
  )}${polygon3(ring(axis, t - 3, 13, z, 6), "valve-union-face")}${shell(
    axis,
    [
      [t - 3, 12],
      [t + 3, 12],
    ],
    z,
    "valve-brass",
  )}${polygon3(ring(axis, t + 3, 13, z, 6), "valve-union-face")}${polygon3(ring(axis, t + 3.2, 8, z), "valve-port-bore")}`;
}
const circleZ = (x: number, y: number, z: number, r: number, cls: string) =>
  polygon3(
    Array.from(
      { length: STEPS },
      (_, i) =>
        [
          x + r * Math.cos((i * Math.PI * 2) / STEPS),
          y + r * Math.sin((i * Math.PI * 2) / STEPS),
          z,
        ] as Point3,
    ),
    cls,
  );
function dial(z: number, angle: number, known: boolean, r = 8) {
  const [cx, cy] = project([0, 0, z]);
  return svg`<g class="valve-dial">${circleZ(0, 0, z, r + 1, "valve-dial-face")}${[
    0, 1, 2, 3, 4,
  ].map((i) => {
    const a = Math.PI / 2 - (i * Math.PI) / 8;
    return line3(
      [
        [r * 0.75 * Math.cos(a), r * 0.75 * Math.sin(a), z + 0.1],
        [r * Math.cos(a), r * Math.sin(a), z + 0.1],
      ],
      "valve-dial-tick",
    );
  })}${known ? svg`<g transform="matrix(.92 .46 -.92 .46 ${cx} ${cy})"><g class="valve-angle-pointer" style="transform:rotate(${angle}deg)"><path d="M0 0H${r * 0.7}m-2-1 2 1-2 1"/></g></g>` : svg``}</g>`;
}
function actuator(p: number, known: boolean, butterfly = false) {
  const z = butterfly ? 68 : 59;
  const w = butterfly ? 40 : 36;
  return svg`<g class="valve-rotary-actuator">${cylinder(0, 0, 49, 4, z - 46, "valve-shaft")}${box(-13, -10, z - 3, 26, 20, 3, "valve-yoke")}${box(-w / 2, -12, z, w, 24, 20, "valve-actuator-case")}${box(-w / 2 + 1, -11, z + 20, w - 2, 22, 3, "valve-actuator-lid")}${[-1, 1].flatMap((x) => [-1, 1].map((y) => circleZ(x * (w / 2 - 4), y * 8, z + 23.2, 1.1, "valve-bolt")))}${dial(z + 23.3, 90 - p * 90, known)}${circleFace(-w / 2 + 7, 12.2, z + 9, 3, "valve-override")}${box(w / 2, -3, z + 5, 5, 7, 7, "valve-cable-gland")}${line3(
    [
      [w / 2 + 5, 0, z + 8],
      [w / 2 + 11, 0, z + 4],
      [w / 2 + 13, 0, z - 5],
    ],
    "sensor-cable",
  )}</g>`;
}
function linearActuator(p: number, known: boolean, safety = false) {
  return svg`<g class="valve-linear-actuator">${cylinder(0, 0, 43, 8, 15, "valve-bonnet")}${[
    -12, 12,
  ].map((x) =>
    pipe(
      [
        [x, 0, 56],
        [x, 0, 89],
      ],
      false,
      2.6,
    ),
  )}${pipe(
    [
      [0, 0, 50],
      [0, 0, 90],
    ],
    false,
    2.6,
  )}${known ? svg`<g class="valve-stem-indicator valve-position-detail" style="transform:translateY(${-p * 13}px)">${box(-5, -5, 61, 10, 10, 5, "valve-stem-coupling")}</g>` : svg``}${
    safety
      ? svg`${cylinder(0, 0, 85, 22, 4, "valve-spring-actuator")}${cylinder(0, 0, 89, 19, 8, "valve-spring-actuator")}${cylinder(0, 0, 97, 13, 4, "valve-spring-actuator")}${cylinder(11, -6, 101, 3.5, 6, "valve-reset-button")}`
      : svg`${box(-15, -12, 88, 30, 24, 20, "valve-actuator-case")}${box(-13, -10, 108, 26, 20, 4, "valve-actuator-lid")}${box(15, -3, 96, 5, 7, 6, "valve-cable-gland")}${line3(
          [
            [20, 0, 99],
            [27, 0, 94],
            [27, 0, 82],
          ],
          "sensor-cable",
        )}${line3(
          [
            [9, 12.2, 92],
            [9, 12.2, 104],
          ],
          "valve-travel-scale",
        )}`
  }</g>`;
}
function handwheel(p: number, known: boolean) {
  const z = 72 + p * 6;
  const angle = p * Math.PI * 4;
  return svg`<g class="valve-handwheel">${cylinder(0, 0, 45, 7, 14, "valve-bonnet")}${cylinder(0, 0, 58, 2, z - 58, "valve-shaft")}${circleZ(0, 0, z, 16, "valve-wheel-hoop")}${[
    0, 1, 2,
  ].map((i) => {
    const a = (known ? angle : 0) + (i * Math.PI * 2) / 3;
    return pipe(
      [
        [0, 0, z],
        [15 * Math.cos(a), 15 * Math.sin(a), z],
      ],
      false,
      1.8,
    );
  })}${cylinder(0, 0, z - 2, 3, 4, "valve-shaft")}</g>`;
}
function testPorts() {
  return svg`${[-15, 15].map((x, i) => svg`${cylinder(x, 10, 43, 2.7, 7, "valve-test-point")}${cylinder(x, 10, 50, 3, 2, i ? "valve-test-blue" : "valve-test-red")}`)}`;
}
function selfActing(
  value: number,
  target: number | undefined,
  mixer = false,
  known = true,
) {
  const fraction = mixer
    ? Math.max(0, Math.min(1, ((target ?? 42) - 30) / 25))
    : Math.max(0, Math.min(1, ((target ?? 3.2) - 0.5) / 5));
  return svg`${cylinder(0, 0, 47, mixer ? 10 : 15, mixer ? 14 : 23, "valve-regulator-bonnet")}${cylinder(0, 0, mixer ? 61 : 70, mixer ? 11 : 7, mixer ? 17 : 10, "valve-setting-knob")}${Array.from(
    { length: 10 },
    (_, i) => {
      const a = (i * Math.PI) / 5;
      const r = mixer ? 11.1 : 7.1;
      return line3(
        [
          [r * Math.cos(a), r * Math.sin(a), mixer ? 63 : 72],
          [r * Math.cos(a), r * Math.sin(a), mixer ? 76 : 78],
        ],
        "valve-knob-rib",
      );
    },
  )}${dial(mixer ? 79 : 81, 35 + fraction * 270, target !== undefined, mixer ? 8 : 6)}${
    mixer
      ? display(-5, 11.2, 66, 10, 6, "°C")
      : svg`${pipe(
          [
            [24, 0, 37],
            [24, 17, 43],
          ],
          false,
          2.4,
        )}${known ? gauge(24, 18, 47, 8, Math.max(0, Math.min(100, (value / 8) * 100))) : circleFace(24, 18, 47, 8, "gauge-face")}`
  }`;
}
function backflow(state: DeviceVisualState) {
  return svg`${shell(
    "x",
    [
      [-47, 9],
      [-35, 13],
      [-23, 18],
      [-10, 14],
      [10, 14],
      [23, 18],
      [35, 13],
      [47, 9],
    ],
    32,
    "valve-brass",
  )}${flange("x", -43, 18)}${flange("x", 43, 18)}${[-26, -9, 9, 26].map(
    (x) =>
      svg`${cylinder(x, 0, 45, 2.5, 9, "valve-test-point")}${pipe(
        [
          [x - 3, 0, 54],
          [x + 3, 0, 54],
        ],
        false,
        1.3,
      )}`,
  )}${cylinder(0, 0, 7, 7, 14, "valve-relief-body")}${pipe(
    [
      [0, 0, 12],
      [0, 15, 12],
      [0, 15, 5],
    ],
    false,
    4,
  )}${box(-11, -22, 65, 22, 15, 13, "valve-monitor-module")}${[-23, 23].map(
    (x) =>
      line3(
        [
          [x, 0, 53],
          [x, -18, 58],
          [0, -18, 65],
        ],
        "sensor-cable",
      ),
  )}${circleFace(0, -6.8, 72, 2, state.alert ? "valve-alarm-led" : "valve-monitor-led")}`;
}
export function valveVisual(device: CatalogDevice, state: DeviceVisualState) {
  const v = valveSpec(device);
  if (!v) return undefined;
  const known = state.hasPosition ?? state.hasTelemetry;
  const p = known ? Math.max(0, Math.min(1, state.position / 100)) : 0;
  const moving =
    state.active &&
    (typeof state.target === "number"
      ? Math.abs(state.target - state.position) > 0.01
      : ["opening", "closing"].includes(state.mode));
  const body = v.body;
  const butterfly = body === "butterfly";
  const three = body === "threeway" || body === "mixing";
  return svg`<g class="realistic-valve ${moving ? "valve-actuating" : ""} ${state.alert ? "valve-tripped" : ""} ${known ? "" : "valve-position-unknown"}" data-valve-type=${device.id} data-valve-position=${known ? state.position : "unknown"} data-valve-mechanism=${v.actuator} transform="translate(140 145) scale(.98) translate(-140 -128)">
  ${
    body === "backflow"
      ? backflow(state)
      : svg`
    ${
      butterfly
        ? svg`${shell(
            "x",
            [
              [-7, 27],
              [7, 27],
            ],
            32,
            "valve-cast",
          )}${flange("x", 0, 27, 32, 8, 18)}${
            known
              ? polygon3(
                  Array.from({ length: STEPS }, (_, i) => {
                    const y = 17 * Math.cos((i * Math.PI * 2) / STEPS);
                    const z = 32 + 17 * Math.sin((i * Math.PI * 2) / STEPS);
                    return [
                      y * Math.sin((p * Math.PI) / 2) + 3,
                      y * Math.cos((p * Math.PI) / 2),
                      z,
                    ] as Point3;
                  }),
                  "valve-butterfly-disc",
                )
              : svg``
          }${pipe(
            [
              [0, 0, 7],
              [0, 0, 61],
            ],
            false,
            2.7,
          )}`
        : svg`
      ${shell(
        "x",
        body === "diaphragm"
          ? [
              [-38, 8],
              [-20, 12],
              [-10, 19],
              [10, 19],
              [20, 12],
              [38, 8],
            ]
          : [
              [-37, 8],
              [-23, 10],
              [-14, 19],
              [0, 21],
              [14, 19],
              [23, 10],
              [37, 8],
            ],
        32,
        "valve-brass",
      )}
      ${union("x", -37)}${union("x", 37)}
      ${
        three
          ? svg`${shell(
              "y",
              [
                [0, 12],
                [33, 9],
              ],
              32,
              "valve-brass",
            )}${union("y", 35)}`
          : svg``
      }
      ${line3(
        [
          [-10, 18, 33],
          [9, 18, 33],
          [5, 18, 36],
          [9, 18, 33],
          [5, 18, 30],
        ],
        "valve-flow-mark",
      )}
    `
    }
    ${body === "mixing" ? svg`${cylinder(-25, 0, 38, 3, 3, "valve-test-red")}${cylinder(0, 25, 38, 3, 3, "valve-test-blue")}` : svg``}
    ${
      v.actuator === "rotary"
        ? actuator(p, known, butterfly)
        : v.actuator === "linear"
          ? linearActuator(p, known)
          : v.actuator === "safety"
            ? linearActuator(p, known, true)
            : v.actuator === "wheel"
              ? handwheel(p, known)
              : v.actuator === "lever"
                ? svg`${cylinder(0, 0, 47, 7, 9, "valve-bonnet")}${
                    known
                      ? pipe(
                          [
                            [0, 0, 58],
                            [
                              25 * Math.sin((p * Math.PI) / 2),
                              25 * Math.cos((p * Math.PI) / 2),
                              58,
                            ],
                          ],
                          false,
                          4,
                        )
                      : svg``
                  }${cylinder(0, 0, 55, 3, 6, "valve-shaft")}`
                : v.actuator === "solenoid"
                  ? svg`<g class="valve-solenoid ${["energized", "on"].includes(state.mode) ? "valve-coil-on" : ""}">${cylinder(0, 0, 47, 7, 14, "valve-armature")}${box(-10, -10, 58, 20, 20, 24, "valve-coil")}${cylinder(0, 0, 82, 4, 3, "valve-armature-cap")}${box(10, -5, 67, 9, 10, 12, "valve-terminal-plug")}${line3(
                      [
                        [19, 0, 73],
                        [27, 0, 70],
                        [28, 0, 56],
                      ],
                      "sensor-cable",
                    )}${known ? svg`<g class="valve-stem-indicator" style="transform:translateY(${-p * 4}px)">${cylinder(0, 0, 48, 8, 3, "valve-stem-coupling")}</g>` : svg``}</g>`
                  : v.actuator === "spring"
                    ? selfActing(
                        state.value,
                        state.example ? state.target : undefined,
                        false,
                        state.hasTelemetry &&
                          (state.example === true || state.valueUnit === "bar"),
                      )
                    : v.actuator === "thermostat"
                      ? selfActing(
                          state.value,
                          state.example ? state.target : undefined,
                          true,
                          state.hasTelemetry,
                        )
                      : v.actuator === "sensor"
                        ? svg`${cylinder(0, 0, 47, 4, 14, "valve-shaft")}${box(-14, -10, 61, 28, 20, 14, "valve-monitor-module")}${dial(75.2, 90 - p * 90, known)}${line3(
                            [
                              [14, 0, 68],
                              [25, 0, 65],
                              [28, 0, 51],
                            ],
                            "sensor-cable",
                          )}`
                        : svg``
    }
    ${device.id === "balancing_valve" || device.id === "pressure_independent_control_valve" ? testPorts() : svg``}
    ${device.id === "pressure_independent_control_valve" ? cylinder(15, -6, 6, 10, 23, "valve-pressure-capsule") : svg``}
    ${
      device.id === "energy_valve"
        ? svg`${box(30, -10, 45, 18, 20, 15, "valve-monitor-module")}${[
            -23, 23,
          ].map(
            (x) =>
              svg`${cylinder(x, 4, 41, 2, 7, "valve-temperature-probe")}${line3(
                [
                  [x, 4, 48],
                  [x, 6, 57],
                  [38, 0, 60],
                ],
                "sensor-cable",
              )}`,
          )}`
        : svg``
    }
  `
  }
  </g>`;
}
