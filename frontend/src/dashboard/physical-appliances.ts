import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { PhysicalDeviceProfile } from "./device-physical-profiles";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  fan,
  topFan,
  grille,
  display,
  line3,
  circleFace,
  polygon3,
  ports,
  antenna,
  wheel,
} from "./isometric-primitives";

export function applianceVisual(
  device: CatalogDevice,
  p: PhysicalDeviceProfile,
  s: DeviceVisualState,
) {
  const shape = p.shape;
  const id = device.id;
  const on = s.active && s.available;
  switch (shape) {
    case "washer":
    case "dryer":
    case "dishwasher":
    case "ice_machine":
    case "autoclave":
    case "incubator": {
      const h = shape === "autoclave" ? 55 : 78;
      return svg`${box(-30, -23, 3, 60, 46, h)}${display(-23, 23.2, h - 8, 33, 10, shape === "incubator" ? `${s.value.toFixed(1)}°` : `${Math.round(s.level)}%`)}${circleFace(20, 23.2, h - 3, 4, "dial-ring")}${
        shape === "washer" || shape === "dryer" || shape === "autoclave"
          ? svg`${circleFace(0, 23.3, 35, 22, "door-rim")}${circleFace(0, 23.4, 35, 17, "drum-glass")}${fan(0, 23.5, 35, 14, on, s.speed)}${
              shape === "washer"
                ? pipe(
                    [
                      [-21, -23, 13],
                      [-38, -23, 13],
                      [-38, -23, 33],
                    ],
                    false,
                    4,
                  )
                : grille(-21, 23.2, 8, 42, 8, 3)
            }`
          : svg`${box(-25 - (s.open ? 10 : 0), 23.1, 10, 50, 3, h - 28, shape === "incubator" ? "window-leaf" : "appliance-door")}${line3(
              [
                [-17, 26.3, h - 25],
                [17, 26.3, h - 25],
              ],
              "door-handle",
            )}${shape === "dishwasher" ? grille(-19, 26.4, 14, 38, 28, 5) : shape === "ice_machine" ? box(-18, 26.3, 17, 36, 4, 22, "ice-bin") : svg``}`
      }`;
    }
    case "fridge":
    case "cold_room":
    case "display_fridge": {
      const chest = id === "freezer";
      const lab = id === "laboratory_freezer";
      const w =
        shape === "cold_room" ? 86 : shape === "display_fridge" ? 103 : 57;
      const h = chest ? 48 : 93;
      const d = shape === "display_fridge" ? 42 : 38;
      return svg`${box(-w / 2, -d / 2, 2, w, d, h)}${
        chest
          ? svg`${box(-w / 2, -d / 2, 51 + (s.open ? 10 : 0), w, d, 4, "freezer-lid")}${line3(
              [
                [-12, d / 2 + 1, 47],
                [12, d / 2 + 1, 47],
              ],
              "door-handle",
            )}`
          : shape === "display_fridge"
            ? svg`${polygon3(
                [
                  [-w / 2 + 5, d / 2 + 0.2, 17],
                  [w / 2 - 5, d / 2 + 0.2, 17],
                  [w / 2 - 5, d / 2 + 0.2, h - 8],
                  [-w / 2 + 5, d / 2 + 0.2, h - 8],
                ],
                "display-glass",
              )}${[0, 1, 2].map((i) => box(-w / 2 + 7, 0, 21 + i * 22, w - 14, d / 2 - 2, 2, "shelf"))}${Array.from({ length: 12 }, (_, i) => cylinder(-40 + (i % 6) * 16, 10, 24 + Math.floor(i / 6) * 25, 3, 13, "bottle"))}`
            : svg`${box(-w / 2 + 3 - (s.open ? 14 : 0), d / 2 + 0.1, 6, w - 6, 3, h - 8, "appliance-door")}${
                id === "refrigerator"
                  ? line3(
                      [
                        [-w / 2 + 3, d / 2 + 3.3, 59],
                        [w / 2 - 3, d / 2 + 3.3, 59],
                      ],
                      "door-seam",
                    )
                  : svg``
              }${line3(
                [
                  [w / 2 - 10, d / 2 + 3.4, 28],
                  [w / 2 - 10, d / 2 + 3.4, 64],
                ],
                "door-handle",
              )}${display(-w / 2 + 10, d / 2 + 3.5, lab ? 65 : 76, w - 27, 10, `${s.value.toFixed(1)}°`)}`
      }`;
    }
    case "oven":
    case "air_fryer":
      return svg`${box(-34, -22, 2, 68, 44, shape === "air_fryer" ? 62 : 68)}${display(-24, 22.2, shape === "air_fryer" ? 47 : 55, 32, 10, `${Math.round(s.value)}°`)}${circleFace(22, 22.2, 61, 5, "dial-ring")}${box(-27 - (s.open ? 8 : 0), 22.2, 9, 54, 3, shape === "air_fryer" ? 31 : 36, shape === "air_fryer" ? "fryer-basket" : "oven-glass")}${line3(
        [
          [-20, 25.5, shape === "air_fryer" ? 35 : 43],
          [20, 25.5, shape === "air_fryer" ? 35 : 43],
        ],
        "door-handle",
      )}${shape === "oven" ? grille(-23, 25.6, 14, 46, 22, 4) : svg``}${on ? svg`<path class="heat-haze" d="M128 31q-8-10 0-19m19 19q-8-10 0-19"/>` : svg``}`;
    case "hob":
      return svg`${box(-46, -30, 4, 92, 60, 5, "hob-glass")}${[-23, 23].flatMap((x) => [-14, 14].map((y) => svg`${cylinder(x, y, 10, 12, 1, "hob-ring")}${cylinder(x, y, 11, 8, 1, "heating-ring")}`))}${display(23, 30.2, 5, 15, 5, `${Math.round(s.value)}`)}`;
    case "kettle":
      return svg`${cylinder(0, 0, 3, 25, 5, "metal")}${cylinder(0, 0, 8, 22, 52, "kettle-body", s.level / 100)}${cylinder(0, 0, 60, 20, 4, "kettle-lid")}${pipe(
        [
          [22, 0, 51],
          [37, 0, 52],
          [39, 0, 19],
          [23, 0, 16],
        ],
        false,
        6,
      )}${polygon3(
        [
          [-20, 0, 46],
          [-39, 0, 56],
          [-22, 0, 35],
        ],
        "kettle-spout",
      )}${display(-10, 22.2, 27, 20, 11, `${Math.round(s.value)}°`)}${on ? svg`<path class="steam-plume" d="M123 59q-9-9 0-18q9-9 0-18"/>` : svg``}`;
    case "coffee":
    case "dispenser":
    case "vending":
      return svg`${box(-33, -21, 2, 66, 42, shape === "vending" ? 96 : 76)}${display(-24, 21.2, shape === "vending" ? 70 : 54, 48, 16, p.mark)}${box(-23, 21.2, 19, 46, 2, 28, "dispense-recess")}${
        shape === "coffee"
          ? svg`${box(-13, 21.3, 45, 26, 8, 5, "coffee-spout")}${cylinder(0, 30, 7, 11, 17, "cup")}${pipe(
              [
                [11, 30, 13],
                [18, 30, 13],
                [18, 30, 20],
                [11, 30, 20],
              ],
              false,
              2,
            )}${
              on
                ? line3(
                    [
                      [0, 30, 44],
                      [0, 30, 24],
                    ],
                    "coffee-stream",
                  )
                : svg``
            }${box(-40, -18, 12, 7, 36, 53, "water-reservoir")}`
          : shape === "vending"
            ? svg`${polygon3(
                [
                  [-25, 21.4, 35],
                  [14, 21.4, 35],
                  [14, 21.4, 90],
                  [-25, 21.4, 90],
                ],
                "display-glass",
              )}${Array.from({ length: 9 }, (_, i) => cylinder(-18 + (i % 3) * 13, 17, 39 + Math.floor(i / 3) * 17, 4, 11, "vending-product"))}`
            : svg`${[-12, 12].map((x) => box(x - 4, 21.3, 43, 8, 8, 6, "water-tap"))}${cylinder(0, 28, 7, 10, 14, "cup")}`
      }`;
    case "soap_dispenser":
    case "paper_dispenser":
      return svg`${box(-26, -11, 18, 52, 22, 60)}${
        shape === "soap_dispenser"
          ? svg`${polygon3(
              [
                [-14, 11.2, 27],
                [14, 11.2, 27],
                [14, 11.2, 65],
                [-14, 11.2, 65],
              ],
              "reservoir-window",
            )}${box(-9, 9, 11, 18, 13, 7, "soap-nozzle")}${on ? svg`<path class="dispense-drop" d="M140 127q-6 7 0 10q6-3 0-10"/>` : svg``}`
          : svg`${cylinder(0, 0, 40, 16, 12, "paper-roll")}${box(-14, 11.2, 3, 28, 2, 28, "paper-sheet")}`
      }`;
    case "tap":
      return svg`${cylinder(0, 0, 0, 10, 5, "metal")}${pipe(
        [
          [0, 0, 5],
          [0, 0, 59],
          [27, 0, 59],
          [27, 0, 47],
        ],
        false,
        8,
      )}${box(-5, 1, 31, 10, 8, 8, "sensor-window")}${
        on
          ? line3(
              [
                [27, 0, 46],
                [27, 0, 5],
              ],
              "water-stream",
            )
          : svg``
      }`;
    case "toilet":
      return svg`${box(-20, -25, 30, 40, 19, 44, "ceramic")}${cylinder(0, 8, 14, 25, 17, "ceramic")}${cylinder(0, 8, 31, 27, 4, "toilet-seat")}${cylinder(0, 8, 35, 19, 1, "bowl-water")}${box(-12, -4, 0, 24, 27, 17, "ceramic")}${display(-8, -6.1, 61, 16, 7, "WC")}${on ? svg`<path class="flush-swirl" d="M124 117q19-14 29 2q-15 15-24 1"/>` : svg``}`;
    case "urinal":
      return svg`${box(-22, -7, 13, 44, 14, 69, "ceramic")}${polygon3(
        [
          [-17, 7.2, 19],
          [17, 7.2, 19],
          [17, 7.2, 66],
          [-17, 7.2, 66],
        ],
        "urinal-bowl",
      )}${cylinder(0, 13, 13, 18, 9, "ceramic")}${box(-7, 7.2, 73, 14, 3, 6, "sensor-window")}${
        on
          ? line3(
              [
                [0, 8, 63],
                [0, 8, 24],
              ],
              "water-stream",
            )
          : svg``
      }`;
    case "vacuum":
    case "mower":
    case "window_robot": {
      if (shape === "window_robot") {
        return svg`${box(-28, -24, 10, 56, 48, 13)}${[-15, 15].map((x) => cylinder(x, 0, 3, 14, 7, "cleaning-pad"))}${box(-8, -7, 24, 16, 14, 6, "robot-handle")}${line3(
          [
            [27, -8, 18],
            [48, -8, 48],
            [40, -8, 76],
          ],
          "safety-tether",
        )}`;
      }
      return svg`${shape === "mower" ? box(-34, -25, 10, 68, 50, 24, "robot-shell") : cylinder(0, 0, 7, 32, 14, "robot-shell")}${cylinder(0, -3, shape === "mower" ? 35 : 22, 9, 7, "lidar-head")}${[-25, 25].map((x) => wheel(x, 22, 9, shape === "mower" ? 11 : 6))}${on ? svg`<g class="robot-brush ${on ? "spinning" : ""}" style="transform-origin:140px 145px"><path class="brush-line" d="m125 144 30 0m-15-15v30m-11-26 22 22m0-22-22 22"/></g>` : svg``}${id === "robot_mop" ? box(-20, 22, 3, 40, 12, 4, "mop-pad") : svg``}${display(-10, shape === "mower" ? 25.2 : 30.2, 14, 20, 7, p.mark)}`;
    }
    case "scrubber":
    case "delivery_robot":
    case "rover":
      return svg`${box(-30, -23, 9, 60, 46, shape === "delivery_robot" ? 67 : shape === "scrubber" ? 36 : 29, "robot-shell")}${[-27, 27].flatMap((x) => [-18, 18].map((y) => wheel(x, y, 8, 9)))}${
        shape === "delivery_robot"
          ? svg`${[0, 1, 2].map((i) => box(-25, 23.2, 17 + i * 18, 50, 2, 15, "robot-compartment"))}${display(-15, 23.3, 71, 30, 9, "READY")}`
          : shape === "scrubber"
            ? svg`${pipe(
                [
                  [16, -12, 44],
                  [30, -26, 72],
                  [-3, -26, 72],
                ],
                false,
                4,
              )}${topFan(-12, 30, 5, 15, on, s.speed)}${topFan(17, 30, 5, 15, on, s.speed)}`
            : svg`${box(-12, -6, 39, 24, 12, 15, "robot-camera")}${circleFace(0, 6.2, 46, 7, "camera-lens")}${antenna(20, -10, 38, 27)}`
      }`;
    case "dock":
      return svg`${box(-37, -26, 0, 74, 52, 5, "dock-base")}${box(-33, -23, 5, 66, 12, 40, "dock-station")}${display(-15, -10.8, 24, 30, 10, `${Math.round(s.level)}%`)}${[-12, 12].map((x) => box(x, 3, 6, 5, 14, 3, "charging-contact"))}`;
    case "bin":
    case "compactor":
    case "chute":
      return svg`${box(-29, -22, 3, 58, 44, shape === "chute" ? 83 : 66, "bin-body")}${
        shape === "chute"
          ? svg`${box(-23, 22.2, 34, 46, 3, 38, "chute-flap")}${line3(
              [
                [-13, 25.4, 55],
                [13, 25.4, 55],
              ],
              "door-handle",
            )}`
          : svg`${box(-32, -25, shape === "compactor" ? 73 : 69, 64, 50, 5, "bin-lid")}${s.open ? box(-30, -25, 82, 60, 4, 28, "raised-lid") : svg``}${polygon3(
              [
                [-20, 22.2, 10],
                [20, 22.2, 10],
                [20, 22.2, 10 + s.level * 0.48],
                [-20, 22.2, 10 + s.level * 0.48],
              ],
              "bin-fill",
            )}${display(-13, 22.3, 50, 26, 11, `${Math.round(s.level)}%`)}`
      }${[-23, 23].map((x) => wheel(x, 19, 4, 5))}${shape === "compactor" ? box(-20, -13, 35 + s.position * 0.2, 40, 26, 6, "press-plate") : svg``}`;
    case "television":
    case "video_wall":
      return svg`${shape === "video_wall" ? Array.from({ length: 4 }, (_, i) => box(-52 + (i % 2) * 53, -5, 18 + Math.floor(i / 2) * 35, 51, 10, 33, "display-body")) : box(-53, -5, 23, 106, 10, 62, "display-body")}${shape === "video_wall" ? Array.from({ length: 4 }, (_, i) => display(-49 + (i % 2) * 53, 5.2, 21 + Math.floor(i / 2) * 35, 45, 27, "")) : display(-49, 5.2, 27, 98, 54, on ? p.mark : "")}${
        shape === "television"
          ? svg`${pipe(
              [
                [0, 0, 22],
                [0, 0, 6],
              ],
              false,
              5,
            )}${box(-27, -13, 1, 54, 26, 4, "metal")}`
          : svg``
      }${on ? svg`<path class="screen-content" d="m108 76 14-14 14 8 25-20"/>` : svg``}`;
    case "speaker":
      return svg`${cylinder(0, 0, 4, 26, 62, "speaker-fabric")}${cylinder(0, 0, 66, 25, 3, "speaker-top")}${[
        -13, 0, 13,
      ].map((x, i) =>
        line3(
          [
            [x, 24, 18],
            [x, 24, 18 + (i + 1) * 9],
          ],
          "audio-bar",
        ),
      )}${cylinder(0, 0, 70, 18, 1, "speaker-ring")}`;
    case "projector":
      return svg`${box(-39, -26, 8, 78, 52, 23)}${circleFace(17, 26.2, 20, 13, "projector-lens")}${grille(-31, 26.2, 13, 25, 14, 6)}${ports(-23, -26, 14, 4, 5)}${
        on
          ? polygon3(
              [
                [11, 27, 15],
                [24, 27, 27],
                [52, 76, 54],
                [-7, 76, 22],
              ],
              "projector-beam",
            )
          : svg``
      }`;
    case "conference":
      return svg`${box(-44, -7, 23, 88, 14, 12, "video-bar")}${circleFace(0, 7.2, 29, 6, "camera-lens")}${[-33, 33].map((x) => circleFace(x, 7.2, 29, 5, "speaker-grille"))}${cylinder(0, 20, 3, 15, 7, "conference-mic")}${display(-10, 31, 6, 20, 5, on ? "LIVE" : "MUTE")}`;
    case "clock":
      return id === "master_clock"
        ? svg`${box(-48, -15, 17, 96, 30, 24, "rack-metal")}${display(-41, 15.2, 22, 82, 15, "12:40:08")}${ports(-28, 15.2, 11, 5, 5)}`
        : svg`${cylinder(0, 0, 3, 35, 8, "clock-case")}${topFan(0, 0, 12, 31, false)}${line3(
            [
              [0, 0, 13],
              [0, -21, 13],
            ],
            "clock-hand",
          )}${line3(
            [
              [0, 0, 13],
              [16, 4, 13],
            ],
            "clock-hand",
          )}${cylinder(0, 0, 14, 2, 1, "accent-part")}`;
    case "spa":
      return svg`${box(-48, -34, 0, 96, 68, 29, "spa-shell")}${polygon3(
        [
          [-41, -27, 30],
          [41, -27, 30],
          [41, 27, 30],
          [-41, 27, 30],
        ],
        "pool-water",
      )}${Array.from({ length: 8 }, (_, i) => cylinder(-31 + (i % 4) * 21, -17 + Math.floor(i / 4) * 34, 31, 3, 1, "bubble-jet"))}${box(30, 26, 31, 17, 9, 5, "spa-control")}`;
    case "sauna":
      return svg`${box(-45, -31, 0, 90, 62, 4, "wood-floor")}${box(-45, -31, 4, 90, 4, 88, "wood-wall")}${box(-45, -31, 4, 4, 62, 88, "wood-wall")}${box(-39, -24, 26, 76, 21, 5, "wood-bench")}${box(-39, 5, 12, 76, 17, 5, "wood-bench")}${box(22, -22, 4, 17, 17, 26, "sauna-heater")}${topFan(30, -13, 31, 7, false)}${display(-35, 1, 62, 17, 15, `${Math.round(s.value)}°`)}`;
    case "fume_hood":
      return svg`${box(-44, -24, 0, 88, 48, 9, "lab-bench")}${box(-44, -24, 9, 88, 5, 90, "hood-back")}${box(-44, -24, 9, 5, 48, 90, "hood-side")}${box(39, -24, 9, 5, 48, 90, "hood-side")}${box(-44, -24, 87, 88, 48, 12, "hood-canopy")}${polygon3(
        [
          [-37, 24, 39 + s.position * 0.4],
          [37, 24, 39 + s.position * 0.4],
          [37, 24, 86],
          [-37, 24, 86],
        ],
        "sash-glass",
      )}${pipe(
        [
          [0, 0, 99],
          [0, 0, 113],
        ],
        on,
        18,
      )}${display(24, 24.2, 19, 13, 14, p.mark)}`;
    default:
      return undefined;
  }
}
