import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { PhysicalDeviceProfile } from "./device-physical-profiles";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  grille,
  display,
  gauge,
  line3,
  circleFace,
  polygon3,
  ports,
  antenna,
} from "./isometric-primitives";

export function sensorVisual(
  _device: CatalogDevice,
  p: PhysicalDeviceProfile,
  s: DeviceVisualState,
) {
  const shape = p.shape;
  const on = s.active && s.available;
  switch (shape) {
    case "wall_sensor":
    case "particle_sensor":
    case "outdoor_sensor":
    case "gas_detector":
    case "barometer":
    case "glass_sensor":
    case "tilt_sensor": {
      const gas = shape === "gas_detector";
      const w = gas ? 45 : 47;
      const h = gas ? 66 : shape === "barometer" ? 43 : 54;
      return svg`${box(-w / 2, -7, 13, w, 14, h, gas ? "industrial-sensor" : "")}${shape === "barometer" ? gauge(0, 7.2, 37, 17, s.value / 11) : svg`${display(-w / 2 + 6, 7.2, h - 10, w - 12, 17, p.mark)}${grille(-w / 2 + 7, 7.2, 20, w - 14, 12, 5)}`}${gas ? svg`${cylinder(0, 0, 3, 10, 10, "sintered-probe")}${antenna(14, -3, h + 13, 15)}` : svg``}${shape === "outdoor_sensor" ? box(-w / 2 - 3, -9, h + 14, w + 6, 18, 4, "weather-hood") : svg``}${
        shape === "particle_sensor"
          ? pipe(
              [
                [-12, 0, 13],
                [-12, 0, 2],
              ],
              false,
              4,
            )
          : svg``
      }${shape === "glass_sensor" ? circleFace(0, 7.3, 28, 7, "microphone-grille") : svg``}`;
    }
    case "duct_probe":
    case "ground_probe":
    case "soil_probe":
    case "immersion_probe":
    case "flow_probe":
    case "corrosion_probe":
    case "displacement_probe": {
      const immersion = shape === "immersion_probe";
      const soil = shape === "soil_probe";
      return svg`${box(-19, -11, 64, 38, 22, 24, "probe-head")}${display(-13, 11.2, 70, 26, 12, p.mark)}${
        soil
          ? svg`${line3(
              [
                [-8, 0, 64],
                [-8, 0, 4],
              ],
              "soil-prong",
            )}${line3(
              [
                [8, 0, 64],
                [8, 0, 4],
              ],
              "soil-prong",
            )}${Array.from({ length: 5 }, (_, i) =>
              line3(
                [
                  [-8, 0, 12 + i * 8],
                  [8, 0, 12 + i * 8],
                ],
                "soil-trace",
              ),
            )}`
          : svg`${cylinder(0, 0, 8, immersion ? 5 : 3, 56, "probe-rod")}${cylinder(0, 0, 5, immersion ? 7 : 4, 8, shape === "flow_probe" ? "flow-tip" : "probe-tip")}`
      }${shape === "duct_probe" ? box(-18, -14, 57, 36, 28, 4, "mount-flange") : svg``}${
        shape === "ground_probe" || soil
          ? polygon3(
              [
                [-43, -23, 2],
                [43, -23, 2],
                [43, 23, 2],
                [-43, 23, 2],
              ],
              "soil-bed",
            )
          : svg``
      }${line3(
        [
          [18, -6, 78],
          [36, -6, 78],
          [42, -6, 64],
        ],
        "sensor-cable",
      )}`;
    }
    case "pressure_sensor":
    case "pipe_pressure":
    case "flow_switch": {
      if (shape === "pipe_pressure") {
        return svg`${pipe(
          [
            [-48, 0, 14],
            [48, 0, 14],
          ],
          on,
          13,
        )}${cylinder(0, 0, 18, 6, 17, "threaded-stem")}${cylinder(0, 0, 35, 14, 32, "metal")}${display(-9, 14.2, 45, 18, 12, `${s.value.toFixed(1)}`)}${box(-7, -6, 67, 14, 12, 10, "connector")}`;
      }
      return svg`${box(-27, -10, 36, 54, 20, 39)}${display(-19, 10.2, 47, 38, 17, p.mark)}${[
        -14, 14,
      ].map(
        (x) =>
          svg`${cylinder(x, 0, 23, 4, 13, "hose-nipple")}${pipe(
            [
              [x, 0, 23],
              [x, 0, 8],
              [x + (x < 0 ? -17 : 17), 0, 8],
            ],
            false,
            3,
          )}`,
      )}${
        shape === "flow_switch"
          ? pipe(
              [
                [0, 0, 36],
                [0, 0, 3],
              ],
              false,
              3,
            )
          : svg``
      }`;
    }
    case "pipe_meter":
      return svg`${pipe(
        [
          [-57, 0, 20],
          [57, 0, 20],
        ],
        on,
        16,
      )}${[-36, 30].map((x) => box(x, -15, 5, 6, 30, 30, "pipe-flange"))}${cylinder(0, 0, 23, 14, 21, "meter-neck")}${box(-22, -14, 44, 44, 28, 19)}${display(-17, 14.2, 48, 34, 11, `${s.value.toFixed(1)}`)}`;
    case "leak_puck":
    case "leak_cable":
      return shape === "leak_cable"
        ? svg`${pipe(
            [
              [-53, -20, 2],
              [33, -20, 2],
              [43, 0, 2],
              [28, 24, 2],
              [-19, 24, 2],
              [-31, 9, 2],
              [-9, -3, 2],
            ],
            s.alert,
            3,
          )}${box(-51, -28, 5, 24, 16, 11, "sensor-head")}${
            s.alert
              ? polygon3(
                  [
                    [-24, -13, 1],
                    [14, -19, 1],
                    [31, 11, 1],
                    [0, 25, 1],
                    [-29, 12, 1],
                  ],
                  "leak-puddle",
                )
              : svg``
          }`
        : svg`${cylinder(0, 0, 5, 26, 9)}${box(-9, -8, 14, 18, 16, 4, "accent-part")}${[-15, 15].map((x) => cylinder(x, 0, 0, 2, 5, "wet-contact"))}${
            s.alert
              ? polygon3(
                  [
                    [-43, -20, 1],
                    [31, -25, 1],
                    [45, 15, 1],
                    [6, 32, 1],
                    [-42, 15, 1],
                  ],
                  "leak-puddle",
                )
              : svg``
          }`;
    case "smoke_detector":
    case "heat_detector":
    case "pir_sensor":
    case "radar":
    case "parking_puck":
    case "light_sensor":
      return svg`${cylinder(0, 0, 11, shape === "pir_sensor" ? 24 : 30, 7)}${cylinder(0, 0, 18, shape === "pir_sensor" ? 19 : 25, shape === "heat_detector" ? 20 : 12)}${
        shape === "pir_sensor"
          ? svg`${cylinder(0, 0, 30, 14, 7, "fresnel-lens")}${[0, 1, 2, 3].map(
              (i) =>
                line3(
                  [
                    [-12 + i * 8, 13, 29],
                    [-12 + i * 8, 13, 38],
                  ],
                  "lens-facet",
                ),
            )}`
          : shape === "heat_detector"
            ? svg`${cylinder(0, 0, 39, 7, 15, "heat-element")}${[-13, 13].map(
                (x) =>
                  pipe(
                    [
                      [x, 0, 30],
                      [x, 0, 54],
                    ],
                    false,
                    2,
                  ),
              )}`
            : shape === "radar" || shape === "light_sensor"
              ? svg`${cylinder(0, 0, 30, 15, 3, "sensor-window")}${on ? svg`<path class="radio-wave" d="M170 70q16 10 0 22m7-29q24 17 0 36"/>` : svg``}`
              : svg`${Array.from({ length: 10 }, (_, i) => {
                  const a = (i * Math.PI) / 5;
                  return line3(
                    [
                      [Math.cos(a) * 22, Math.sin(a) * 22, 22],
                      [Math.cos(a) * 22, Math.sin(a) * 22, 29],
                    ],
                    "detector-vent",
                  );
                })}${cylinder(14, 5, 31, 2, 1, "alarm-led")}`
      }`;
    case "flame_detector":
    case "beam_detector":
    case "beam_pair":
    case "people_counter":
      return svg`${box(-30, -9, 27, 60, 18, 31, "sensor-housing")}${circleFace(-14, 9.2, 43, 9, "sensor-lens")}${circleFace(14, 9.2, 43, shape === "people_counter" ? 9 : 6, "sensor-lens")}${display(-12, 9.3, 29, 24, 7, p.mark)}${shape === "beam_pair" ? box(43, -9, 10, 10, 18, 65, "beam-receiver") : svg``}${
        on
          ? line3(
              [
                [-14, 10, 43],
                [-14, 64, 12],
              ],
              "sensor-beam",
            )
          : svg``
      }${shape === "flame_detector" ? box(-35, -13, 58, 70, 26, 5, "sensor-hood") : svg``}`;
    case "aspirating_detector":
      return svg`${box(-31, -11, 10, 62, 22, 58)}${display(-22, 11.2, 36, 44, 21, "ASD")}${pipe(
        [
          [-17, 0, 68],
          [-17, 0, 91],
          [-49, 0, 91],
        ],
        on,
        5,
      )}${pipe(
        [
          [17, 0, 68],
          [17, 0, 91],
          [49, 0, 91],
        ],
        on,
        5,
      )}${ports(-19, 11.2, 18, 4, 5)}`;
    case "sounder":
    case "beacon":
      return shape === "beacon"
        ? svg`${cylinder(0, 0, 4, 27, 10, "metal")}${cylinder(0, 0, 14, 22, 39, "beacon-lens")}${cylinder(0, 0, 54, 14, 4, "beacon-cap")}${s.alert ? svg`<g class="beacon-rays"><path d="m96 52-15-5m17 24-16 4m98-22 15-5m-15 24 16 4"/></g>` : svg``}`
        : svg`${box(-30, -9, 19, 60, 18, 52, "safety-part")}${Array.from({ length: 6 }, (_, i) => circleFace(0, 9.2, 45, 5 + i * 3.2, "sounder-ring"))}${s.alert ? svg`<path class="sound-wave" d="M179 58q18 17 0 34m10-42q25 25 0 50"/>` : svg``}`;
    case "extinguisher":
      return svg`${cylinder(0, 0, 5, 15, 66, "safety-part")}${cylinder(0, 0, 71, 5, 8, "metal")}${pipe(
        [
          [-11, 0, 79],
          [13, 0, 79],
        ],
        false,
        4,
      )}${pipe(
        [
          [5, 0, 76],
          [25, 0, 68],
          [25, 0, 15],
        ],
        false,
        4,
      )}${display(-10, 15.2, 32, 20, 23, "FIRE")}${gauge(0, 7, 82, 6, s.value)}`;
    case "fence":
      return svg`${[-46, 46].map((x) =>
        pipe(
          [
            [x, 0, 0],
            [x, 0, 84],
          ],
          false,
          5,
        ),
      )}${Array.from({ length: 7 }, (_, i) =>
        line3(
          [
            [-46, 0, 9 + i * 11],
            [46, 0, 9 + i * 11],
          ],
          "fence-wire",
        ),
      )}${box(-10, -5, 31, 20, 10, 22, "fence-monitor")}`;
    case "drain_monitor":
      return svg`${box(-42, -30, 0, 84, 60, 3, "roof-slab")}${cylinder(0, 0, 3, 22, 4, "drain-rim")}${Array.from(
        { length: 7 },
        (_, i) =>
          line3(
            [
              [-16 + i * 5, -15, 8],
              [-16 + i * 5, 15, 8],
            ],
            "drain-grille",
          ),
      )}${box(20, -12, 6, 17, 17, 14, "sensor-head")}`;
    case "vibration_probe":
    case "load_cell":
    case "strain_gauge":
    case "crack_gauge":
      return svg`${box(-43, -23, 0, 86, 46, 5, "mounting-plate")}${
        shape === "vibration_probe"
          ? svg`${cylinder(0, 0, 5, 13, 27, "metal")}${box(-8, -6, 32, 16, 12, 10, "connector")}${line3(
              [
                [8, 0, 37],
                [34, 0, 37],
                [45, 0, 19],
              ],
              "sensor-cable",
            )}`
          : shape === "load_cell"
            ? svg`${box(-31, -14, 5, 62, 28, 20, "metal")}${box(-12, -14, 13, 24, 28, 5, "load-cell-slot")}${circleFace(-23, 14.2, 15, 4, "bolt-head")}${circleFace(23, 14.2, 15, 4, "bolt-head")}`
            : svg`${box(-28, -11, 6, 56, 22, 3, "gauge-substrate")}${Array.from(
                { length: 7 },
                (_, i) =>
                  line3(
                    [
                      [-22 + i * 7, -8, 10],
                      [-22 + i * 7, 8, 10],
                      [-18 + i * 7, 8, 10],
                    ],
                    "strain-trace",
                  ),
              )}${
                shape === "crack_gauge"
                  ? line3(
                      [
                        [0, -25, 5],
                        [-5, -5, 5],
                        [3, 6, 5],
                        [-2, 25, 5],
                      ],
                      "wall-crack",
                    )
                  : svg``
              }`
      }`;
    default:
      return undefined;
  }
}
