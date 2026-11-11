import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { PhysicalDeviceProfile } from "./device-physical-profiles";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  topFan,
  grille,
  display,
  gauge,
  line3,
  circleFace,
  polygon3,
  ports,
  antenna,
} from "./isometric-primitives";

export function electricalVisual(
  device: CatalogDevice,
  p: PhysicalDeviceProfile,
  s: DeviceVisualState,
) {
  const shape = p.shape;
  const id = device.id;
  const on = s.active && s.available;
  switch (shape) {
    case "bulb":
      return svg`${cylinder(0, 0, 5, 12, 17, "metal")}${[10, 15, 20].map((z) => cylinder(0, 0, z, 13, 2, "screw-thread"))}${cylinder(0, 0, 22, 17, 15)}<path class="bulb-glass light-emitter" d="M117 69Q100 49 111 32Q140 3 169 32Q180 49 163 69L155 84H125Z"/><path class="bulb-filament" d="m130 76-6-25h32l-6 25"/>${id === "rgb_light" || id === "rgbw_light" ? svg`<path class="rgb-band" d="M120 70q20 12 40 0"/>` : id === "tunable_white_light" ? svg`<path class="warm-band" d="M120 70q20 12 40 0"/>` : svg``}`;
    case "led_strip":
      return svg`${pipe(
        [
          [-54, -20, 7],
          [44, -20, 7],
          [44, 22, 7],
          [-26, 22, 7],
        ],
        false,
        8,
      )}${Array.from({ length: 12 }, (_, i) => box(-49 + i * 8, -22, 12, 4, 4, 2, "light-emitter"))}${Array.from({ length: 5 }, (_, i) => box(42, -14 + i * 8, 12, 4, 4, 2, "light-emitter"))}${box(-52, 21, 2, 20, 13, 10, "driver-body")}`;
    case "led_driver":
      return svg`${box(-48, -14, 4, 96, 28, 20, "metal")}${ports(-44, 14.2, 10, 3, 4)}${ports(26, 14.2, 10, 2, 4)}${grille(-23, 14.2, 9, 42, 10, 4)}${display(-13, 14.3, 13, 25, 7, "LED")}`;
    case "wall_dimmer":
    case "keypad":
    case "exit_button":
    case "panic_button":
    case "call_point":
      return svg`${box(-25, -5, 8, 50, 10, 64, shape === "call_point" || shape === "panic_button" ? "safety-part" : "")}${
        shape === "wall_dimmer"
          ? svg`${circleFace(0, 5.2, 40, 16, "dial-ring")}${line3(
              [
                [0, 5.4, 40],
                [
                  12 * Math.cos(s.level * 0.06),
                  5.4,
                  40 + 12 * Math.sin(s.level * 0.06),
                ],
              ],
              "gauge-needle",
            )}`
          : shape === "keypad"
            ? svg`${display(-17, 5.2, 55, 34, 10, p.mark)}${Array.from({ length: 9 }, (_, i) => box(-15 + (i % 3) * 11, 5, 18 + Math.floor(i / 3) * 10, 8, 2, 6, "keycap"))}`
            : svg`${box(-17, 5.1, 26, 34, 3, 30, "button-face")}${display(-12, 8.2, 36, 24, 10, shape === "call_point" ? "FIRE" : shape === "exit_button" ? "EXIT" : "SOS")}`
      }`;
    case "floodlight":
      return svg`${pipe(
        [
          [-28, 0, 4],
          [-28, 0, 22],
          [28, 0, 22],
          [28, 0, 4],
        ],
        false,
        4,
      )}${box(-35, -8, 27, 70, 16, 42, "metal")}${polygon3(
        [
          [-30, 8.2, 32],
          [30, 8.2, 32],
          [30, 8.2, 64],
          [-30, 8.2, 64],
        ],
        "reflector",
      )}${Array.from({ length: 12 }, (_, i) => box(-24 + (i % 4) * 14, 8.4, 38 + Math.floor(i / 4) * 8, 7, 1, 4, "light-emitter"))}`;
    case "garden_light":
    case "streetlight":
      return svg`${cylinder(0, 0, 0, shape === "streetlight" ? 13 : 18, 4, "metal")}${cylinder(0, 0, 4, shape === "streetlight" ? 3 : 8, shape === "streetlight" ? 91 : 42, "metal")}${
        shape === "streetlight"
          ? svg`${pipe(
              [
                [0, 0, 95],
                [0, 0, 107],
                [34, 0, 107],
              ],
              false,
              4,
            )}${box(18, -9, 104, 35, 18, 7, "light-emitter")}`
          : svg`${box(-15, -15, 46, 30, 30, 5, "metal")}${box(-12, -12, 51, 24, 24, 17, "light-emitter")}${box(-16, -16, 68, 32, 32, 4, "metal")}`
      }`;
    case "emergency_light":
      return svg`${box(-29, -12, 29, 58, 24, 26)}${[-20, 20].map(
        (x) =>
          svg`${pipe(
            [
              [x, 0, 55],
              [x, 0, 68],
            ],
            false,
            3,
          )}${circleFace(x, 10, 73, 12, "light-emitter")}`,
      )}${display(-15, 12.2, 35, 30, 10, "BAT")}`;
    case "exit_sign":
      return svg`${box(-42, -4, 35, 84, 8, 38, "sign-body")}${display(-36, 4.2, 43, 72, 22, "← EXIT")}${pipe(
        [
          [-22, 0, 73],
          [-22, 0, 88],
        ],
        false,
        3,
      )}${pipe(
        [
          [22, 0, 73],
          [22, 0, 88],
        ],
        false,
        3,
      )}`;
    case "grow_light":
      return svg`${pipe(
        [
          [-42, -22, 88],
          [42, -22, 88],
          [42, 22, 88],
          [-42, 22, 88],
          [-42, -22, 88],
        ],
        false,
        3,
      )}${[-22, 0, 22].map(
        (y) =>
          svg`${box(-48, y - 4, 48, 96, 8, 5, "metal")}${Array.from({ length: 10 }, (_, i) => box(-44 + i * 9, y - 3, 44, 5, 6, 3, "light-emitter"))}${line3(
            [
              [-42, y, 53],
              [-30, y, 88],
            ],
            "support-wire",
          )}${line3(
            [
              [42, y, 53],
              [30, y, 88],
            ],
            "support-wire",
          )}`,
      )}`;
    case "underwater_light":
      return svg`${cylinder(0, 0, 4, 31, 8, "metal")}${topFan(0, 0, 13, 25, false)}${polygon3(
        [
          [-19, -19, 14],
          [19, -19, 14],
          [19, 19, 14],
          [-19, 19, 14],
        ],
        "light-emitter",
      )}${line3(
        [
          [0, -31, 8],
          [0, -48, 8],
          [19, -48, 8],
        ],
        "sensor-cable",
      )}`;
    case "electric_meter":
    case "din_meter":
    case "branch_monitor":
    case "gas_meter":
      return svg`${box(-28, -14, 5, 56, 28, 73)}${display(-21, 14.2, 45, 42, 24, shape === "gas_meter" ? "00128 m³" : `${s.value.toFixed(1)} ${p.mark}`)}${display(-17, 14.2, 27, 34, 10, id === "power_quality_meter" ? "230 V" : "L1 L2 L3")}${ports(-20, 14.2, 11, 4, 5)}${
        shape === "gas_meter"
          ? svg`${pipe(
              [
                [-19, 0, 78],
                [-19, 0, 94],
                [-41, 0, 94],
              ],
              on,
              7,
            )}${pipe(
              [
                [19, 0, 78],
                [19, 0, 94],
                [41, 0, 94],
              ],
              on,
              7,
            )}`
          : svg`${line3(
              [
                [-16, -4, 5],
                [-16, -4, -3],
              ],
              "power-cable",
            )}${line3(
              [
                [16, -4, 5],
                [16, -4, -3],
              ],
              "power-cable",
            )}`
      }`;
    case "switchboard":
    case "lighting_panel":
    case "control_panel":
    case "fire_panel":
    case "alarm_panel":
    case "medical_panel":
    case "irrigation_panel":
    case "access_controller":
    case "rack_monitor": {
      const safety =
        shape === "fire_panel" ||
        shape === "medical_panel" ||
        shape === "alarm_panel";
      return svg`${box(-36, -16, 2, 72, 32, 87, safety ? "safety-panel" : "")}${display(-28, 16.2, 56, 48, 23, s.alert ? "ALARM" : p.mark)}${[0, 1, 2].map((i) => circleFace(-23 + i * 17, 16.3, 43, 3, i === 0 ? "status-led" : "iso-metal"))}${shape === "switchboard" || shape === "lighting_panel" ? Array.from({ length: 6 }, (_, i) => box(-26 + (i % 3) * 17, 16.2, 12 + Math.floor(i / 3) * 12, 11, 3, 8, "breaker-toggle")) : svg`${ports(-25, 16.2, 17, 5, 5)}${grille(-24, 16.2, 7, 48, 7, 3)}`}${line3(
        [
          [29, 16.3, 26],
          [29, 16.3, 45],
        ],
        "door-handle",
      )}`;
    }
    case "breaker":
    case "din_relay":
    case "contactor":
    case "protection_relay":
    case "transfer_switch":
    case "din_controller":
    case "din_gateway":
    case "io_module":
    case "ddc":
    case "plc":
    case "interface_module":
    case "motor_starter": {
      const w =
        shape === "plc"
          ? 83
          : shape === "ddc"
            ? 72
            : shape === "transfer_switch"
              ? 57
              : shape === "breaker"
                ? 29
                : 51;
      const h = shape === "breaker" ? 54 : shape === "motor_starter" ? 63 : 42;
      return svg`${box(-w / 2, -14, 10, w, 28, h)}${box(-w / 2 - 3, -13, 4, w + 6, 26, 6, "din-rail")}${ports(-w / 2 + 5, 14.2, 13, Math.max(2, Math.floor(w / 10)), 4)}${ports(-w / 2 + 5, -14, h + 8, Math.max(2, Math.floor(w / 10)), 4)}${shape === "breaker" || shape === "contactor" || shape === "motor_starter" ? svg`${box(-8, 14.2, 28, 16, 7, 16, "switch-track")}${box(-6, 21.3, on ? 36 : 28, 12, 4, 6, "accent-part")}` : display(-w / 2 + 7, 14.3, h / 2 + 10, w - 14, 14, p.mark)}${
        shape === "plc"
          ? Array.from({ length: 4 }, (_, i) =>
              line3(
                [
                  [6 + i * 13, 14.4, 11],
                  [6 + i * 13, 14.4, h + 9],
                ],
                "iso-seam",
              ),
            )
          : svg``
      }`;
    }
    case "control_board":
      return svg`${box(-40, -27, 2, 80, 54, 4, "circuit-board")}${box(-14, -12, 6, 28, 24, 7, "chip")}${ports(-34, 27.2, 6, 8, 5)}${[-29, 22].map((x) => box(x, -21, 6, 8, 14, 7, "component"))}${line3(
        [
          [-34, -10, 7],
          [28, -10, 7],
          [28, 19, 7],
        ],
        "board-trace",
      )}`;
    case "current_transformer":
      return svg`${box(-20, -12, 12, 40, 24, 36, "metal")}${circleFace(0, 12.3, 30, 14, "iso-dark")}${circleFace(0, 12.4, 30, 9, "iso-open")}${pipe(
        [
          [0, -35, 30],
          [0, 30, 30],
        ],
        on,
        6,
      )}${ports(-9, 12.4, 14, 2, 4)}`;
    case "transformer":
      return svg`${box(-40, -25, 2, 80, 50, 9, "base-frame")}${box(-27, -20, 11, 54, 40, 50, "metal")}${[-22, 0, 22].map((x) => cylinder(x, 0, 61, 6, 22, "insulator"))}${Array.from({ length: 8 }, (_, i) => box(-36 + i * 10, 21, 15, 5, 8, 39, "heat-fin"))}${gauge(0, 29, 35, 9, s.value)}`;
    case "capacitor_bank":
    case "filter_bank":
      return svg`${box(-43, -22, 0, 86, 44, 6, "base-frame")}${[-26, 0, 26].map((x) => cylinder(x, 0, 6, 10, shape === "capacitor_bank" ? 52 : 35, "metal"))}${pipe(
        [
          [-35, -10, 64],
          [35, -10, 64],
        ],
        false,
        3,
      )}${[-26, 0, 26].map((x) =>
        line3(
          [
            [x, 0, 58],
            [x, -10, 64],
          ],
          "power-cable",
        ),
      )}`;
    case "generator":
      return svg`${box(-57, -27, 0, 114, 54, 8, "base-frame")}${box(-46, -22, 8, 92, 44, 51, "generator-body")}${grille(-39, 22.2, 16, 44, 33, 9)}${display(15, 22.2, 35, 22, 15, `${Math.round(s.value)} kW`)}${pipe(
        [
          [-31, -6, 59],
          [-31, -6, 89],
          [-10, -6, 89],
        ],
        on,
        7,
      )}${cylinder(32, -5, 59, 5, 8, "fuel-cap")}${on ? svg`<path class="exhaust-puff" d="M128 34q10-5 16-1m-8-9q10-5 16-1"/>` : svg``}`;
    case "ups":
    case "battery_cabinet":
    case "rectifier":
    case "inverter":
    case "charger":
    case "vfd": {
      const rack = shape === "ups" || shape === "battery_cabinet";
      const w = rack ? 48 : 54;
      const h = rack ? 85 : shape === "vfd" ? 70 : 54;
      return svg`${box(-w / 2, -19, 3, w, 38, h)}${display(-w / 2 + 8, 19.2, h - 19, w - 16, 17, shape === "vfd" ? `${Math.round(s.value)} Hz` : shape === "inverter" ? `${s.value.toFixed(1)} kW` : `${Math.round(s.level)}%`)}${grille(-w / 2 + 6, 19.2, 11, w - 12, 18, rack ? 6 : 4)}${rack ? [0, 1, 2].map((i) => box(-w / 2 + 5, 19, 35 + i * 13, w - 10, 2, 10, "battery-tray")) : ports(-w / 2 + 9, 19.2, 5, 3, 5)}${shape === "vfd" ? Array.from({ length: 6 }, (_, i) => box(-24 + i * 8, -25, 5, 3, 7, 52, "heat-fin")) : svg``}`;
    }
    case "battery_bank":
      return svg`${box(-46, -26, 0, 92, 52, 5, "base-frame")}${[-28, 0, 28].map((x) => svg`${box(x - 11, -19, 5, 22, 38, 35, "battery-cell")}${cylinder(x - 5, -10, 40, 2, 3, "positive-terminal")}${cylinder(x + 5, -10, 40, 2, 3, "negative-terminal")}`)}${pipe(
        [
          [-33, -10, 44],
          [33, -10, 44],
        ],
        on,
        3,
      )}${display(-7, 19.2, 17, 14, 10, `${Math.round(s.level)}%`)}`;
    case "solar_panel":
    case "solar_collector":
    case "solar_tracker":
      return svg`${pipe(
        [
          [-35, 5, 0],
          [-35, 5, 43],
        ],
        false,
        4,
      )}${pipe(
        [
          [35, 5, 0],
          [35, 5, 43],
        ],
        false,
        4,
      )}${polygon3(
        [
          [-55, -30, 27],
          [55, -30, 27],
          [55, 30, 57],
          [-55, 30, 57],
        ],
        "solar-frame",
      )}${Array.from({ length: 24 }, (_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const x = -51 + col * 17;
        const y = -26 + row * 14;
        const z = 29 + (y + 30) * 0.5;
        return polygon3(
          [
            [x, y, z],
            [x + 14, y, z],
            [x + 14, y + 11, z + 5.5],
            [x, y + 11, z + 5.5],
          ],
          shape === "solar_collector" ? "solar-tube" : "solar-cell",
        );
      })}${shape === "solar_tracker" ? cylinder(0, 0, 0, 9, 38, "tracker-column") : svg``}`;
    case "wind_turbine":
      return svg`${cylinder(0, 0, 0, 15, 4, "metal")}${pipe(
        [
          [0, 0, 4],
          [0, 0, 96],
        ],
        false,
        6,
      )}${box(-7, -8, 88, 14, 16, 12)}<g class="turbine-rotor ${on ? "spinning" : ""}" style="transform-origin:140px 32px">${[0, 120, 240].map((a) => svg`<path class="turbine-blade" transform="rotate(${a} 140 32)" d="M140 32L135 8L143 0L144 32Z"/>`)}</g>${circleFace(0, 9, 96, 4, "accent-part")}`;
    case "ev_wallbox":
    case "ev_pedestal":
      return svg`${shape === "ev_pedestal" ? box(-22, -15, 0, 44, 30, 92) : box(-26, -12, 28, 52, 24, 53)}${display(-17, shape === "ev_pedestal" ? 15.2 : 12.2, shape === "ev_pedestal" ? 62 : 48, 34, 20, `${s.value.toFixed(1)} kW`)}${circleFace(0, shape === "ev_pedestal" ? 15.3 : 12.3, shape === "ev_pedestal" ? 40 : 35, 6, "charger-socket")}${pipe(
        [
          [25, 0, 70],
          [43, 0, 61],
          [43, 0, 17],
          [25, 0, 8],
          [17, 0, 20],
        ],
        false,
        4,
      )}${box(24, -2, 64, 6, 5, 16, "charger-plug")}${
        on
          ? line3(
              [
                [-15, 16, 52],
                [15, 16, 52],
              ],
              "charging-bar",
            )
          : svg``
      }`;
    case "site_hub":
    case "border_router":
    case "router":
    case "antenna_gateway":
    case "ir_bridge":
    case "usb_radio":
    case "wifi_ap":
    case "tracking_tag": {
      const flat =
        shape === "wifi_ap" ||
        shape === "ir_bridge" ||
        shape === "tracking_tag";
      return svg`${flat ? cylinder(0, 0, 4, shape === "tracking_tag" ? 18 : 31, shape === "tracking_tag" ? 7 : 12) : box(-35, -23, 4, 70, 46, 21)}${!flat ? ports(-27, 23.2, 10, shape === "router" ? 4 : 2, 6) : circleFace(0, 25, 13, 3, "status-led")}${shape === "usb_radio" ? box(35, -7, 9, 15, 14, 9, "metal") : svg``}${shape === "antenna_gateway" || shape === "router" ? svg`${antenna(-24, -15, 25, 35)}${antenna(24, -15, 25, shape === "antenna_gateway" ? 52 : 35)}` : svg``}${shape === "site_hub" ? display(-21, 23.2, 13, 42, 9, "EMAD") : svg``}${on ? svg`<path class="radio-wave" d="M172 36q18 15 0 30m9-37q25 22 0 44"/>` : svg``}`;
    }
    case "server":
    case "nas":
    case "network_switch":
    case "firewall":
    case "recorder":
    case "rack_pdu":
    case "pa_rack":
    case "amplifier":
    case "media_box": {
      const tower = shape === "nas";
      const slim = [
        "network_switch",
        "firewall",
        "media_box",
        "recorder",
        "amplifier",
      ].includes(shape);
      const pdu = shape === "rack_pdu";
      const w = pdu ? 17 : tower ? 50 : 105;
      const h = pdu ? 102 : tower ? 59 : slim ? 18 : 73;
      const d = tower ? 38 : 39;
      return svg`${box(-w / 2, -d / 2, 4, w, d, h, "rack-metal")}${pdu ? Array.from({ length: 7 }, (_, i) => box(-6, d / 2 + 0.2, 11 + i * 12, 12, 2, 8, "outlet")) : slim ? svg`${ports(-w / 2 + 8, d / 2 + 0.2, 10, shape === "network_switch" ? 8 : shape === "firewall" ? 5 : 4, 6)}${display(w / 2 - 20, d / 2 + 0.3, 11, 14, 7, p.mark)}` : Array.from({ length: tower ? 4 : 5 }, (_, i) => svg`${box(-w / 2 + 5, d / 2, 11 + i * 11, w - 10, 2, 8, "drive-bay")}${circleFace(w / 2 - 12, d / 2 + 2.2, 15 + i * 11, 1.8, "status-led")}`)}${!pdu && !slim ? grille(-w / 2 + 6, d / 2 + 0.2, h - 4, w - 12, 8, 4) : svg``}`;
    }
    default:
      return undefined;
  }
}
