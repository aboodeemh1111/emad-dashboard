import { svg } from "lit";
import { valveVisual } from "./physical-valves";
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
  gauge,
  line3,
  circleFace,
  coil,
  polygon3,
} from "./isometric-primitives";

export function mechanicalVisual(
  device: CatalogDevice,
  p: PhysicalDeviceProfile,
  s: DeviceVisualState,
) {
  const id = device.id;
  const shape = p.shape;
  const on =
    s.active &&
    s.available &&
    (!["fan", "pump", "pressure_pump", "drive"].includes(p.interaction) ||
      s.speed > 0);
  switch (shape) {
    case "thermostat":
      return svg`${box(-25, -7, 15, 50, 10, 55)}${display(-19, 3, 39, 38, 23, `${s.value.toFixed(1)}°`)}${circleFace(0, 4, 29, 7, "dial-ring")}${line3(
        [
          [0, 4, 29],
          [4, 4, 33],
        ],
        "gauge-needle",
      )}`;
    case "split_ac":
      return svg`${box(-53, -13, 38, 106, 25, 29)}${grille(-47, 12, 41, 94, 10, 5)}${display(28, 12.1, 55, 16, 6, `${Math.round(s.value)}°`)}${
        on
          ? svg`<g class="air-streams">${[0, 1, 2].map((i) =>
              line3(
                [
                  [-35 + i * 32, 12, 38],
                  [-35 + i * 32, 28, 26],
                  [-35 + i * 32, 43, 19],
                ],
                "air-flow",
              ),
            )}</g>`
          : svg``
      }`;
    case "cassette":
      return svg`${box(-34, -34, 46, 68, 68, 10)}${polygon3(
        [
          [-24, -24, 57],
          [24, -24, 57],
          [24, 24, 57],
          [-24, 24, 57],
        ],
        "iso-grille-face",
      )}${topFan(0, 0, 58, 16, on, s.speed)}${[-28, 24].map((y) =>
        line3(
          [
            [-27, y, 57],
            [27, y, 57],
          ],
          "iso-grille",
        ),
      )}`;
    case "duct_unit":
    case "package_ac":
    case "ahu":
    case "recovery_unit":
    case "precision_ac":
    case "air_dryer": {
      const tall = shape === "precision_ac";
      const long = shape === "ahu" || shape === "recovery_unit";
      const w = long ? 98 : shape === "duct_unit" ? 88 : 58;
      const h = tall ? 95 : shape === "duct_unit" ? 25 : 47;
      const d = long ? 36 : 38;
      return svg`${box(-w / 2, -d / 2, 4, w, d, h)}${box(-w / 2 - 14, -d / 2 + 6, 14, 14, d - 12, h - 20, "duct")} ${box(w / 2, -d / 2 + 5, 14, 17, d - 10, h - 20, "duct")}${fan(-w / 2 + 20, d / 2 + 0.1, 4 + h * 0.55, Math.min(17, h * 0.32), on, s.speed)}${
        long
          ? svg`${line3(
              [
                [2, d / 2, 4],
                [2, d / 2, 4 + h],
              ],
              "iso-seam",
            )}${grille(10, d / 2 + 0.1, 13, w / 2 - 17, h - 14, 8)}`
          : grille(-w / 2 + 6, d / 2 + 0.1, 8, w - 12, 10, 3)
      }${display(w / 2 - 18, d / 2 + 0.2, h - 7, 13, 7, p.mark)}${
        shape === "recovery_unit"
          ? pipe(
              [
                [-30, -22, 35],
                [-30, -35, 35],
                [25, -35, 35],
                [25, -22, 35],
              ],
              on,
              5,
            )
          : svg``
      }`;
    }
    case "condenser":
    case "evaporative_cooler":
    case "dehumidifier":
    case "air_purifier":
    case "humidifier": {
      const slim = shape === "air_purifier";
      const r = slim ? 20 : 27;
      const h = shape === "condenser" ? 57 : 70;
      return svg`${box(-r, -17, 4, r * 2, 34, h, shape === "humidifier" ? "translucent" : "")}${shape === "condenser" ? fan(0, 17.2, 33, 22, on, s.speed) : svg`${grille(-r + 5, 17.2, 15, r * 2 - 10, 32, 8)}${display(-12, 17.3, h - 9, 24, 11, `${Math.round(s.value)}`)}`}${shape === "humidifier" ? svg`${cylinder(0, -1, h + 5, 8, 5)}${on ? svg`<path class="steam-plume" d="M140 45q-12-12 0-24q12-12 0-22"/>` : svg``}` : svg``}${shape === "air_purifier" ? topFan(0, 0, h + 5, 13, on, s.speed) : svg``}`;
    }
    case "vav":
      return svg`${box(-32, -17, 12, 64, 34, 30)}${box(-49, -10, 17, 17, 20, 20, "duct")}${box(32, -10, 17, 20, 20, 20, "duct")}${box(-9, -10, 43, 18, 18, 12, "accent-part")}${line3(
        [
          [-25, 17.2, 17],
          [25, 17.2, 37],
        ],
        "damper-blade",
      )}${display(-16, 17.4, 22, 24, 10, id === "vav_terminal" ? `${s.position}%` : "CAV")}`;
    case "chilled_beam":
      return svg`${box(-49, -17, 28, 98, 34, 9)}${grille(-44, 17.1, 29, 88, 7, 5)}${coil(-38, -10, 38, 76, 9)}${pipe(
        [
          [-49, -13, 42],
          [-65, -13, 42],
        ],
        on,
        4,
      )}${pipe(
        [
          [49, -4, 42],
          [64, -4, 42],
        ],
        on,
        4,
      )}`;
    case "radiator":
    case "panel_heater":
    case "unit_heater": {
      const heater = shape === "unit_heater";
      return svg`${box(-37, -9, 9, 74, 18, 53)}${heater ? fan(0, 9.2, 35, 22, on, s.speed) : Array.from({ length: shape === "radiator" ? 9 : 13 }, (_, i) => box(-33 + i * (shape === "radiator" ? 7.5 : 5), 8, 12, 3, 3, 45, "heat-fin"))}${pipe(
        [
          [-37, 0, 14],
          [-49, 0, 14],
          [-49, 0, 3],
        ],
        on,
        4,
      )}${shape === "radiator" ? box(37, 0, 19, 12, 11, 9, "accent-part") : svg``}${on ? svg`<g class="heat-haze"><path d="M110 40q-6-8 0-16m25 12q-6-8 0-16m25 12q-6-8 0-16"/></g>` : svg``}`;
    }
    case "floor_coil":
      return svg`${box(-47, -33, 0, 94, 66, 3, "floor-slab")}${Array.from(
        { length: 6 },
        (_, i) =>
          pipe(
            [
              [-39 + i * 14, -27, 5],
              [-39 + i * 14, 27, 5],
              [-32 + i * 14, 27, 5],
              [-32 + i * 14, -27, 5],
            ],
            on,
            3,
          ),
      )}${box(-48, -40, 6, 40, 8, 8, "accent-part")}`;
    case "radiator_valve":
      return svg`${pipe(
        [
          [-37, 0, 15],
          [37, 0, 15],
        ],
        on,
        12,
      )}${cylinder(0, 0, 15, 12, 15, "metal")}${cylinder(0, 0, 30, 14, 32)}${display(-8, 13, 42, 16, 12, `${Math.round(s.value)}°`)}`;
    case "air_chiller":
      return svg`${box(-53, -25, 8, 106, 50, 35)}${[-29, 25].map((x) => svg`${topFan(x, 0, 44, 20, on, s.speed)}${grille(x - 19, 25.2, 13, 36, 25, 7)}`)}${[-44, 38].map((x) => box(x, -21, 0, 8, 43, 8, "iso-metal"))}${pipe(
        [
          [53, -9, 18],
          [65, -9, 18],
          [65, -9, 5],
        ],
        on,
        6,
      )}`;
    case "water_chiller":
    case "absorption_chiller":
      return svg`${box(-52, -29, 0, 104, 57, 7, "base-frame")}${[-14, 15].map(
        (y) =>
          svg`${cylinder(-27, y, 8, 13, 33, "metal")}${box(-22, y - 12, 10, 68, 24, 28, "metal")}${circleFace(41, y + 12, 24, 12, "iso-metal")}${pipe(
            [
              [-31, y, 41],
              [-31, y, 52],
              [30, y, 52],
              [30, y, 35],
            ],
            on,
            5,
          )}`,
      )}${box(-4, -19, 42, 35, 24, shape === "absorption_chiller" ? 29 : 18)}${display(3, 5.2, 48, 20, 8, `${Math.round(s.value)}°`)}`;
    case "boiler":
    case "steam_generator":
      return svg`${cylinder(0, 0, 7, 30, 66, "metal")}${box(-16, 24, 15, 32, 19, 25, "accent-part")}${gauge(0, 27, 58, 10, s.value)}${pipe(
        [
          [0, 0, 73],
          [0, 0, 96],
          [22, 0, 96],
        ],
        on,
        12,
      )}${pipe(
        [
          [-30, -4, 20],
          [-48, -4, 20],
          [-48, -4, 3],
        ],
        on,
        7,
      )}${on ? svg`<path class="heat-haze" d="M132 64q-5-8 1-14q6-6 0-14"/>` : svg``}${
        id === "steam_boiler"
          ? pipe(
              [
                [18, 0, 89],
                [18, -24, 89],
              ],
              on,
              5,
            )
          : svg``
      }`;
    case "cooling_tower":
      return svg`${box(-31, -26, 0, 62, 52, 9, "base-frame")}${polygon3(
        [
          [-31, 26, 9],
          [31, 26, 9],
          [23, 19, 65],
          [-23, 19, 65],
        ],
        "iso-front",
      )}${polygon3(
        [
          [31, 26, 9],
          [31, -26, 9],
          [23, -19, 65],
          [23, 19, 65],
        ],
        "iso-side",
      )}${box(-25, -21, 65, 50, 42, 10)}${topFan(0, 0, 76, 22, on, s.speed)}${grille(-25, 26.2, 17, 50, 24, 8)}${pipe(
        [
          [-31, 0, 20],
          [-52, 0, 20],
        ],
        on,
        7,
      )}${on ? svg`<path class="steam-plume" d="M140 30q-8-9 0-18q8-9 0-17"/>` : svg``}`;
    case "plate_exchanger":
    case "cooling_skid":
      return svg`${box(-43, -23, 0, 86, 46, 5, "base-frame")}${Array.from({ length: 11 }, (_, i) => box(-25 + i * 4, -17, 6, 2, 34, 61, "metal"))}${box(-31, -22, 5, 6, 44, 67, "accent-part")}${box(20, -22, 5, 6, 44, 67, "accent-part")}${[
        -25, 24,
      ].map((x) =>
        pipe(
          [
            [x, 20, 18],
            [x, 37, 18],
            [x + 11, 37, 18],
          ],
          on,
          6,
        ),
      )}${display(-26, 22.1, 47, 18, 11, p.mark)}${shape === "cooling_skid" ? box(29, -13, 6, 14, 26, 42) : svg``}`;
    case "vertical_tank":
    case "water_tank":
    case "ice_tank":
    case "calorifier":
    case "expansion_vessel":
    case "lpg_tank": {
      const large = shape === "water_tank";
      const radius = large ? 31 : shape === "expansion_vessel" ? 21 : 26;
      const h = shape === "expansion_vessel" ? 49 : 70;
      return svg`${box(-radius, -radius, 0, radius * 2, radius * 2, 5, "base-frame")}${cylinder(0, 0, 5, radius, h, shape === "calorifier" ? "metal" : "tank-shell", shape === "calorifier" ? undefined : s.level / 100)}${cylinder(0, 0, h + 5, 7, 5, "tank-cap")}${pipe(
        [
          [radius, 0, 16],
          [radius + 20, 0, 16],
          [radius + 20, 0, 3],
        ],
        on,
        6,
      )}${pipe(
        [
          [-radius, 0, h - 5],
          [-radius - 16, 0, h - 5],
        ],
        on,
        5,
      )}${
        large
          ? svg`${line3(
              [
                [radius - 3, 7, 5],
                [radius - 3, 7, h],
              ],
              "ladder",
            )}${Array.from({ length: 7 }, (_, i) =>
              line3(
                [
                  [radius - 8, 7, 12 + i * 8],
                  [radius + 2, 7, 12 + i * 8],
                ],
                "ladder",
              ),
            )}`
          : gauge(0, radius + 0.2, 45, 8, s.level)
      }${shape === "ice_tank" ? Array.from({ length: 4 }, (_, i) => box(-13 + i * 7, -4, 30, 5, 5, 6, "ice-block")) : svg``}${shape === "lpg_tank" ? box(-5, -4, h + 10, 10, 8, 6, "accent-part") : svg``}`;
    }
    case "horizontal_tank":
    case "buried_tank":
      return svg`${box(-48, -22, 0, 96, 44, 7, "base-frame")}${box(-36, -20, 8, 72, 40, 38, "tank-shell")}${circleFace(-28, 21, 27, 18, "iso-front")}${circleFace(28, 21, 27, 18, "iso-front")}${cylinder(0, 0, 46, 11, 7)}${display(-12, 20.2, 22, 24, 11, `${Math.round(s.level)}%`)}${pipe(
        [
          [43, 0, 16],
          [59, 0, 16],
        ],
        on,
        6,
      )}${
        shape === "buried_tank"
          ? polygon3(
              [
                [-56, -32, 2],
                [56, -32, 2],
                [56, 34, 2],
                [-56, 34, 2],
              ],
              "ground-outline",
            )
          : svg``
      }`;
    case "level_probe":
      return svg`${cylinder(0, 0, 2, 24, 54, "tank-shell", s.level / 100)}${box(-9, -7, 58, 18, 14, 13, "accent-part")}${line3(
        [
          [0, 0, 58],
          [0, 0, 9],
        ],
        "probe-rod",
      )}${line3(
        [
          [0, 0, 55],
          [0, 0, 55 - s.level * 0.4],
        ],
        "level-signal",
      )}${display(-7, 7.2, 62, 14, 7, `${Math.round(s.level)}`)}`;
    case "float_switch":
      return svg`${cylinder(0, 0, 1, 27, 42, "tank-shell", s.open ? 0.8 : 0.3)}${line3(
        [
          [-25, -5, 55],
          [0, 0, 55],
          [7, 2, s.open ? 39 : 19],
        ],
        "sensor-cable",
      )}${cylinder(7, 2, s.open ? 30 : 10, 8, 9, "accent-part")}`;
    case "water_heater":
      return svg`${cylinder(0, 0, 5, 22, 67)}${gauge(0, 22.2, 48, 8, s.value)}${display(-11, 22.2, 23, 22, 11, `${Math.round(s.value)}°`)}${pipe(
        [
          [-8, 0, 72],
          [-8, 0, 86],
          [-27, 0, 86],
        ],
        on,
        5,
      )}${pipe(
        [
          [8, 0, 72],
          [8, 0, 86],
          [27, 0, 86],
        ],
        on,
        5,
      )}`;
    case "centrifugal_pump":
    case "circulator":
    case "fire_pump":
    case "booster_set":
    case "compressor": {
      const count = shape === "booster_set" ? 2 : 1;
      return svg`${box(-51, -24, 0, 102, 48, 6, "base-frame")}${Array.from(
        { length: count },
        (_, i) => {
          const y = count === 2 ? -17 + i * 29 : 0;
          return svg`${box(-10, y - 11, 8, 46, 22, 29, "motor-body")}${grille(0, y + 11.1, 12, 29, 20, 7)}${cylinder(-26, y, 8, 15, 30, "pump-volute")}${fan(-27, y + 16, 25, 17, on, s.speed)}${pipe(
            [
              [-26, y, 38],
              [-26, y, 56],
              [4, y, 56],
            ],
            on,
            8,
          )}${pipe(
            [
              [-26, y + 20, 24],
              [-26, y + 40, 24],
            ],
            on,
            8,
          )}`;
        },
      )}${
        shape === "booster_set"
          ? svg`${pipe(
              [
                [-26, -17, 56],
                [-26, 32, 56],
              ],
              on,
              8,
            )}${cylinder(21, -10, 42, 12, 23, "tank-shell")}${gauge(14, 25, 50, 7, s.value * 10)}`
          : svg``
      }${shape === "compressor" ? svg`${box(-43, -19, 7, 83, 38, 22, "tank-shell")}${circleFace(-30, 20, 17, 12, "iso-metal")}` : svg``}${shape === "fire_pump" ? box(40, -17, 6, 11, 32, 45, "safety-part") : svg``}`;
    }
    case "borehole_pump":
    case "submersible_pump":
      return svg`${cylinder(0, 0, 5, shape === "borehole_pump" ? 10 : 23, shape === "borehole_pump" ? 83 : 50, "metal")}${pipe(
        [
          [0, 0, shape === "borehole_pump" ? 88 : 55],
          [0, 0, 97],
          [22, 0, 97],
        ],
        on,
        8,
      )}${grille(-12, 21, 10, 24, 17, 7)}${line3(
        [
          [4, 0, 60],
          [14, -12, 83],
          [34, -12, 95],
        ],
        "sensor-cable",
      )}${
        shape === "submersible_pump"
          ? pipe(
              [
                [-16, -1, 53],
                [-16, -1, 64],
                [16, -1, 64],
                [16, -1, 53],
              ],
              false,
              3,
            )
          : svg``
      }`;
    case "ejector":
    case "macerator":
    case "lift_station":
      return svg`${box(-38, -24, 3, 76, 48, shape === "lift_station" ? 42 : 25, "tank-shell")}${cylinder(4, 0, 29, 15, 20, "motor-body")}${pipe(
        [
          [4, 0, 49],
          [4, 0, 74],
          [40, 0, 74],
        ],
        on,
        8,
      )}${display(-24, 24.2, 14, 20, 9, p.mark)}${shape === "lift_station" ? cylinder(-22, 0, 45, 9, 9) : svg``}`;
    case "blower":
    case "inline_fan":
    case "jet_fan":
    case "axial_fan":
      return svg`${box(-31, -24, 4, 62, 48, 57, "duct")}${fan(0, 24.2, 32, 26, on, s.speed)}${shape === "jet_fan" || shape === "inline_fan" ? svg`${box(-27, -52, 8, 54, 30, 49, "duct")}${box(-27, 25, 8, 54, 26, 49, "duct")}` : svg``}${pipe(
        [
          [-22, -8, 4],
          [-22, -8, 0],
        ],
        false,
        4,
      )}${
        on
          ? svg`<g class="air-streams">${[-17, 0, 17].map((x) =>
              line3(
                [
                  [x, 28, 26],
                  [x, 51, 26],
                  [x, 67, 26],
                ],
                "air-flow",
              ),
            )}</g>`
          : svg``
      }`;
    case "ceiling_fan":
      return svg`${cylinder(0, 0, 61, 6, 25)}${cylinder(0, 0, 51, 14, 10)}<g class="ceiling-rotor ${on ? "spinning" : ""}" style="--spin-duration:${Math.max(0.4, 4 - s.speed * 0.035)}s">${[
        0, 120, 240,
      ].map((angle) => {
        const a = (angle * Math.PI) / 180;
        return polygon3(
          [
            [0, 0, 51],
            [Math.cos(a) * 55, Math.sin(a) * 55, 51],
            [Math.cos(a + 0.25) * 50, Math.sin(a + 0.25) * 50, 51],
          ],
          "ceiling-blade",
        );
      })}</g>${cylinder(0, 0, 46, 9, 5, "accent-part")}`;
    case "pedestal_fan":
      return svg`${cylinder(0, 0, 0, 25, 4)}${cylinder(0, 0, 4, 3, 47, "metal")}${fan(0, 1, 74, 29, on, s.speed)}${pipe(
        [
          [0, -9, 50],
          [0, -9, 74],
        ],
        false,
        5,
      )}`;
    case "hood":
      return svg`${box(-45, -22, 45, 90, 44, 10, "metal")}${polygon3(
        [
          [-45, 22, 55],
          [45, 22, 55],
          [20, 9, 78],
          [-20, 9, 78],
        ],
        "iso-front",
      )}${box(-20, -9, 78, 40, 18, 26, "metal")}${grille(-37, 22.2, 47, 74, 7, 5)}${on ? svg`<path class="steam-plume" d="M132 105q-12-12 0-23m20 27q-12-12 0-23"/>` : svg``}`;
    case "air_curtain":
      return svg`${box(-49, -10, 64, 98, 20, 21)}${grille(-43, 10.2, 67, 86, 10, 4)}${
        on
          ? svg`<g class="air-streams">${Array.from({ length: 7 }, (_, i) =>
              line3(
                [
                  [-40 + i * 13, 12, 63],
                  [-40 + i * 13, 12, 8],
                ],
                "air-flow",
              ),
            )}</g>`
          : svg``
      }`;
    case "damper":
      return svg`${box(-34, -16, 12, 68, 32, 51, "frame")} ${Array.from(
        { length: 5 },
        (_, i) => {
          const z = 18 + i * 9;
          return polygon3(
            [
              [-29, 17, z],
              [29, 17, z],
              [29, 17 - (12 * s.position) / 100, z + 6],
              [-29, 17 - (12 * s.position) / 100, z + 6],
            ],
            "damper-blade",
          );
        },
      )}${box(35, -5, 29, 13, 13, 20, "accent-part")}`;
    case "ball_valve":
    case "butterfly_valve":
    case "solenoid_valve":
    case "globe_valve":
    case "three_way_valve":
    case "pressure_valve":
    case "mixing_valve":
    case "shutoff_valve":
    case "energy_valve":
    case "backflow":
    case "regulator":
    case "valve_sensor":
      return valveVisual(device, s);
    case "treatment_plant":
      return svg`${box(-58, -31, 0, 116, 62, 7, "base-frame")}${[-31, 25].map((x) => svg`${cylinder(x, 0, 7, 23, 35, "tank-shell", s.level / 100)}${topFan(x, 0, 44, 17, on, s.speed)}`)}${pipe(
        [
          [-31, 0, 20],
          [25, 0, 20],
          [56, 0, 20],
        ],
        on,
        5,
      )}${box(42, -30, 7, 14, 12, 55)}`;
    case "softener":
    case "cartridge_filter":
    case "sand_filter":
    case "ro_skid":
    case "uv_tube":
    case "ozone_unit":
    case "chlorinator":
    case "dosing_pump":
    case "dosing_panel": {
      if (shape === "uv_tube") {
        return svg`${pipe(
          [
            [-54, 0, 29],
            [54, 0, 29],
          ],
          on,
          18,
        )}${box(-20, -10, 50, 40, 20, 15)}${line3(
          [
            [-10, 0, 50],
            [-10, 0, 29],
          ],
          "sensor-cable",
        )}${line3(
          [
            [10, 0, 50],
            [10, 0, 29],
          ],
          "sensor-cable",
        )}${line3(
          [
            [-44, 0, 29],
            [44, 0, 29],
          ],
          "uv-glow",
        )}`;
      }
      if (shape === "dosing_pump" || shape === "dosing_panel") {
        return svg`${box(-38, -21, 0, 76, 42, 5, "base-frame")}${cylinder(-18, 0, 5, 17, 40, "tank-shell", s.level / 100)}${box(10, -14, 9, 27, 28, 32, "accent-part")}${fan(23, 14.2, 25, 9, on, s.speed)}${pipe(
          [
            [-18, 0, 45],
            [-18, 0, 56],
            [22, 0, 56],
            [22, 0, 41],
          ],
          on,
          3,
        )}${display(13, 14.2, 35, 18, 8, `${s.value.toFixed(1)}`)}`;
      }
      const count =
        shape === "ro_skid" ? 4 : shape === "cartridge_filter" ? 2 : 1;
      return svg`${box(-48, -23, 0, 96, 46, 6, "base-frame")}${Array.from(
        { length: count },
        (_, i) => {
          const x = (i - (count - 1) / 2) * (count === 4 ? 22 : 32);
          return svg`${cylinder(x, 0, 6, count === 1 ? 25 : count === 4 ? 9 : 14, shape === "sand_filter" ? 43 : 63, "filter-vessel")}${box(x - 8, -8, shape === "sand_filter" ? 50 : 70, 16, 16, 10, "accent-part")}`;
        },
      )}${pipe(
        [
          [-46, -10, 61],
          [46, -10, 61],
        ],
        on,
        6,
      )}${pipe(
        [
          [-46, 13, 17],
          [46, 13, 17],
        ],
        on,
        6,
      )}${gauge(0, 24, 44, 8, s.value)}${shape === "softener" ? cylinder(36, 0, 6, 12, 33) : svg``}`;
    }
    case "gas_manifold":
    case "suppression_cylinders":
      return svg`${box(-44, -22, 0, 88, 44, 5, "base-frame")}${[-25, 0, 25].map(
        (x) =>
          svg`${cylinder(x, 0, 5, 11, 58, shape === "gas_manifold" ? "gas-cylinder" : "safety-part")}${cylinder(x, 0, 63, 4, 10, "metal")}${pipe(
            [
              [x, 0, 73],
              [x, -13, 73],
            ],
            on,
            4,
          )}`,
      )}${pipe(
        [
          [-36, -13, 73],
          [36, -13, 73],
        ],
        on,
        5,
      )}${gauge(0, -12, 88, 9, s.value * 10)}`;
    default:
      return undefined;
  }
}
