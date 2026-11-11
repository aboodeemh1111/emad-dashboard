import { svg } from "lit";
import { elevatorVisual } from "./physical-elevators";
import { cameraVisual } from "./physical-cameras";
import type { CatalogDevice } from "./device-catalog";
import type { PhysicalDeviceProfile } from "./device-physical-profiles";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  display,
  line3,
  circleFace,
  polygon3,
  ports,
  antenna,
} from "./isometric-primitives";

export function architectureVisual(
  device: CatalogDevice,
  p: PhysicalDeviceProfile,
  s: DeviceVisualState,
) {
  const shape = p.shape;
  const on = s.active && s.available;
  const opening = s.position / 100;
  switch (shape) {
    case "roller_blind":
    case "venetian_blind":
    case "curtain":
    case "shutter":
    case "louver":
    case "window":
    case "smart_glass":
    case "facade":
    case "greenhouse_shade":
    case "pool_cover":
    case "projection_screen": {
      const pool = shape === "pool_cover";
      const z = pool ? 8 : 5;
      const h = pool ? 9 : 91;
      const w = pool ? 105 : 76;
      if (pool) {
        return svg`${box(-58, -34, 0, 116, 68, 8, "pool-edge")}${polygon3(
          [
            [-53, -29, 9],
            [53, -29, 9],
            [53, 29, 9],
            [-53, 29, 9],
          ],
          "pool-water",
        )}${box(-53, -29, 10, 106 * (1 - opening), 58, 2, "cover-fabric")}${cylinder(-54, -30, 10, 5, 5, "roller")}`;
      }
      return svg`${box(-w / 2 - 4, -5, z, w + 8, 10, h + 7, "window-frame")}${polygon3(
        [
          [-w / 2, -0.1, z + 5],
          [w / 2, -0.1, z + 5],
          [w / 2, -0.1, z + h],
          [-w / 2, -0.1, z + h],
        ],
        shape === "smart_glass" ? "smart-glass" : "window-glass",
      )}${
        shape === "curtain"
          ? svg`${box(-w / 2, 1, z + 5, (w / 2) * (1 - opening), 4, h - 8, "curtain-fabric")}${box((w / 2) * opening, 1, z + 5, (w / 2) * (1 - opening), 4, h - 8, "curtain-fabric")}${Array.from(
              { length: 8 },
              (_, i) =>
                line3(
                  [
                    [-w / 2 + i * 4 * (1 - opening), 5, z + 5],
                    [-w / 2 + i * 4 * (1 - opening), 5, z + h - 4],
                  ],
                  "curtain-fold",
                ),
            )}`
          : shape === "window" || shape === "facade"
            ? svg`<g class="hinged-panel" style="transform:translateX(${opening * 12}px)">${box(-w / 2 + 3, 1, z + 8, w - 6, 4, h - 14, "window-leaf")}${line3(
                [
                  [w / 2 - 9, 6, z + 35],
                  [w / 2 - 9, 6, z + 49],
                ],
                "door-handle",
              )}</g>`
            : shape === "smart_glass"
              ? polygon3(
                  [
                    [-w / 2 + 2, 1, z + 7],
                    [w / 2 - 2, 1, z + 7],
                    [w / 2 - 2, 1, z + h - 3],
                    [-w / 2 + 2, 1, z + h - 3],
                  ],
                  "tint-pane",
                )
              : svg`${Array.from(
                  {
                    length:
                      shape === "venetian_blind" || shape === "louver"
                        ? 12
                        : 16,
                  },
                  (_, i) => {
                    const height = h - 8;
                    const top = z + h - 3 - (i * height) / 16;
                    return polygon3(
                      [
                        [-w / 2 + 2, 2, top],
                        [w / 2 - 2, 2, top],
                        [w / 2 - 2, shape === "louver" ? 8 : 3, top - 4],
                        [-w / 2 + 2, shape === "louver" ? 8 : 3, top - 4],
                      ],
                      shape === "shutter" ? "shutter-slat" : "blind-slat",
                      `transform:translateY(${(-opening * i * height) / 16}px) skewX(${s.tilt * 0.06}deg)`,
                    );
                  },
                )}${box(-w / 2 - 2, -6, z + h + 7, w + 4, 12, 7, "roller")}`
      }${
        shape === "projection_screen"
          ? pipe(
              [
                [0, 0, 5],
                [0, 0, 0],
              ],
              false,
              3,
            )
          : svg``
      }`;
    }
    case "awning":
    case "skylight":
    case "greenhouse_vent":
      return svg`${box(-45, -25, 8, 90, 50, 5, "window-frame")}${
        shape === "awning"
          ? svg`${polygon3(
              [
                [-45, -25, 70],
                [45, -25, 70],
                [45, 25 * opening, 48],
                [-45, 25 * opening, 48],
              ],
              "awning-fabric",
            )}${pipe(
              [
                [-40, -20, 65],
                [-40, 25 * opening, 44],
              ],
              false,
              3,
            )}${pipe(
              [
                [40, -20, 65],
                [40, 25 * opening, 44],
              ],
              false,
              3,
            )}`
          : svg`${polygon3(
              [
                [-40, -20, 14],
                [40, -20, 14],
                [40, 20, 14 + opening * 35],
                [-40, 20, 14 + opening * 35],
              ],
              "window-glass",
            )}${pipe(
              [
                [35, 17, 13],
                [35, 17, 14 + opening * 35],
              ],
              false,
              3,
            )}`
      }`;
    case "smart_lock":
    case "strike":
    case "door_magnet":
    case "contact_sensor": {
      if (shape === "contact_sensor") {
        return svg`${box(-16, -8, 18, 20, 16, 56)}${box(10, -5, 24, 11, 10, 44)}${display(-12, 8.2, 51, 12, 8, on ? "1" : "0")}${
          s.open
            ? line3(
                [
                  [5, 0, 35],
                  [15, 0, 35],
                ],
                "contact-gap",
              )
            : svg``
        }`;
      }
      if (shape === "door_magnet") {
        return svg`${box(-40, -9, 34, 80, 18, 15, "metal")}${box(-35, 7, 16, 70, 7, 14, "metal")}${circleFace(-28, 9.2, 41, 2, "iso-dark")}${circleFace(28, 9.2, 41, 2, "iso-dark")}`;
      }
      if (shape === "strike") {
        return svg`${box(-13, -6, 7, 26, 12, 77, "metal")}${box(-8, 6.1, 27, 16, 7, 34, "iso-dark")}${box(-5, 13.2, 31, s.open ? 2 : 10, 3, 26, "latch-bolt")}`;
      }
      return svg`${box(-31, -4, 3, 62, 8, 96, "door-sample")}${box(-11, 4, 23, 22, 7, 53, "lock-body")}${display(-8, 11.2, 57, 16, 14, s.open ? "OPEN" : "LOCK")}${pipe(
        [
          [0, 13, 44],
          [24, 13, 44],
        ],
        false,
        4,
      )}${circleFace(0, 11.2, 33, 4, "iso-dark")}${
        s.open
          ? line3(
              [
                [12, 0, 14],
                [31, 0, 14],
              ],
              "contact-gap",
            )
          : svg``
      }`;
    }
    case "card_reader":
    case "fingerprint":
    case "face_terminal":
    case "intercom":
    case "doorbell":
    case "destination_terminal":
    case "booking_panel":
    case "nurse_call": {
      const tall = ["face_terminal", "intercom", "doorbell"].includes(shape);
      const w = shape === "doorbell" ? 26 : shape === "booking_panel" ? 79 : 42;
      const h = tall ? 80 : shape === "booking_panel" ? 49 : 60;
      return svg`${box(-w / 2, -6, 8, w, 12, h)}${shape === "card_reader" ? svg`${display(-w / 2 + 6, 6.2, 32, w - 12, 25, p.mark)}${box(15, 13, 12, 26, 2, 38, "rfid-card")}${on ? svg`<path class="radio-wave" d="M168 77q9 8 0 16m7-23q15 14 0 28"/>` : svg``}` : shape === "fingerprint" ? svg`${box(-12, 6.2, 21, 24, 2, 27, "finger-pad")}${[0, 1, 2, 3].map((i) => svg`<path class="fingerprint-ridge" d="M${129 + i * 3} ${100 - i * 3}q${11 - i * 3} -${25 - i * 4} ${22 - i * 6} 0"/>`)}${display(-13, 6.2, 53, 26, 9, "ID")}` : svg`${display(-w / 2 + 5, 6.2, tall ? 36 : 19, w - 10, tall ? 36 : h - 12, shape === "booking_panel" ? (s.open ? "BUSY" : "FREE") : p.mark)}${tall ? circleFace(0, 6.3, h + 2, 5, "camera-lens") : svg``}${shape === "doorbell" ? circleFace(0, 6.3, 25, 7, "doorbell-button") : tall ? ports(-13, 6.2, 19, 3, 5) : svg``}`}`;
    }
    case "kiosk":
    case "ticket_kiosk":
      return svg`${box(-24, -16, 0, 48, 32, 8, "base-frame")}${box(-18, -12, 8, 36, 24, 89)}${display(-14, 12.2, 61, 28, 25, shape === "ticket_kiosk" ? "P" : p.mark)}${box(-10, 12.2, 42, 20, 3, 5, "card-slot")}${shape === "ticket_kiosk" ? box(-7, 15.3, 32, 14, 3, 10, "ticket-paper") : ports(-9, 12.2, 23, 2, 5)}`;
    case "locker":
      return svg`${box(-40, -17, 1, 80, 34, 87)}${Array.from(
        { length: 6 },
        (_, i) => {
          const x = -37 + (i % 2) * 38;
          const z = 6 + Math.floor(i / 2) * 27;
          return svg`${box(x, 17.2, z, 34, 2, 24, "locker-door")}${circleFace(x + 26, 19.4, z + 12, 2, "status-led")}`;
        },
      )}`;
    case "sliding_door":
    case "gate":
    case "speed_gate":
    case "turnstile": {
      if (shape === "turnstile") {
        return svg`${box(-19, -16, 0, 38, 32, 60, "metal")}${pipe(
          [
            [20, 0, 44],
            [20 + 30 * (1 - opening), 25, 44],
          ],
          false,
          5,
        )}${pipe(
          [
            [20, 0, 44],
            [20, -28, 30],
          ],
          false,
          5,
        )}${pipe(
          [
            [20, 0, 44],
            [20, 0, 72],
          ],
          false,
          5,
        )}`;
      }
      if (shape === "speed_gate") {
        return svg`${box(-42, -22, 0, 19, 44, 42, "metal")}${box(23, -22, 0, 19, 44, 42, "metal")}${polygon3(
          [
            [-23, 0, 9],
            [-23 + 23 * (1 - opening), 0, 9],
            [-23 + 23 * (1 - opening), 0, 40],
            [-23, 0, 40],
          ],
          "window-glass",
        )}${polygon3(
          [
            [23, 0, 9],
            [23 - 23 * (1 - opening), 0, 9],
            [23 - 23 * (1 - opening), 0, 40],
            [23, 0, 40],
          ],
          "window-glass",
        )}`;
      }
      const w = shape === "gate" ? 108 : 84;
      const h = shape === "gate" ? 63 : 99;
      return svg`${box(-w / 2 - 5, -5, 0, 6, 10, h + 6, "door-frame")}${box(w / 2 - 1, -5, 0, 6, 10, h + 6, "door-frame")}${box(-w / 2 - 5, -5, h, w + 10, 10, 6, "door-frame")}${[
        -1, 1,
      ].map((dir) => {
        const x = dir === -1 ? -w / 2 - opening * w * 0.42 : opening * w * 0.42;
        return svg`${box(x, 0, 3, w / 2, 3, h - 4, shape === "gate" ? "gate-leaf" : "window-leaf")}${
          shape === "gate"
            ? Array.from({ length: 5 }, (_, i) =>
                line3(
                  [
                    [x + 5 + i * 9, 4, 6],
                    [x + 5 + i * 9, 4, h - 4],
                  ],
                  "gate-bar",
                ),
              )
            : line3(
                [
                  [x + w / 2 - 6, 4, 33],
                  [x + w / 2 - 6, 4, 54],
                ],
                "door-handle",
              )
        }`;
      })}`;
    }
    case "elevator":
    case "platform_lift":
      return elevatorVisual(device, s);
    case "escalator":
    case "walkway":
      return svg`${box(-57, -17, 0, 114, 34, 7, "base-frame")}${Array.from({ length: 12 }, (_, i) => box(-54 + i * 9, -14, 7 + (shape === "escalator" ? i * 4 : 0), 9, 28, shape === "escalator" ? 5 : 2, "escalator-step"))}${[
        -20, 20,
      ].map(
        (y) =>
          svg`${pipe(
            [
              [-57, y, 29],
              [53, y, shape === "escalator" ? 77 : 29],
            ],
            on,
            5,
          )}${polygon3(
            [
              [-57, y, 7],
              [53, y, shape === "escalator" ? 55 : 7],
              [53, y, shape === "escalator" ? 74 : 26],
              [-57, y, 26],
            ],
            "window-glass",
          )}`,
      )}`;
    case "bullet_camera":
    case "thermal_camera":
    case "ptz_camera":
      return cameraVisual(device, s);
    case "barrier":
      return svg`${box(-50, -13, 0, 22, 26, 49, "barrier-base")}${pipe(
        [
          [-39, 0, 43],
          [
            -39 + 94 * Math.cos((opening * Math.PI) / 2),
            0,
            43 + 65 * Math.sin((opening * Math.PI) / 2),
          ],
        ],
        false,
        6,
      )}${[0, 1, 2, 3].map((i) => {
        const x = -25 + i * 20;
        return line3(
          [
            [x, 1, 43],
            [x + 8, 1, 43],
          ],
          "barrier-stripe",
        );
      })}${display(-46, 13.2, 25, 14, 12, "P")}`;
    case "bollard":
      return svg`${cylinder(0, 0, 0, 27, 4, "metal")}${cylinder(0, 0, 4, 13, 8 + opening * 60, "bollard-body")}${cylinder(0, 0, 9 + opening * 60, 14, 5, "light-emitter")}`;
    case "parking_lock":
      return svg`${box(-40, -20, 0, 80, 40, 5, "metal")}${pipe(
        [
          [-24, 0, 5],
          [-24, 0, 10 + opening * 40],
          [24, 0, 10 + opening * 40],
          [24, 0, 5],
        ],
        false,
        6,
      )}${box(-14, -12, 4, 28, 24, 12, "accent-part")}`;
    case "parking_puck":
    case "inductive_loop":
    case "parking_indicator":
      return shape === "inductive_loop"
        ? svg`${polygon3(
            [
              [-51, -30, 2],
              [51, -30, 2],
              [51, 30, 2],
              [-51, 30, 2],
            ],
            "ground-outline",
          )}${pipe(
            [
              [-42, -22, 3],
              [42, -22, 3],
              [42, 22, 3],
              [-42, 22, 3],
              [-42, -22, 3],
            ],
            on,
            3,
          )}${box(-10, -6, 5, 20, 12, 6, "loop-detector")}`
        : svg`${cylinder(0, 0, 1, shape === "parking_indicator" ? 22 : 31, shape === "parking_indicator" ? 13 : 7, "metal")}${cylinder(0, 0, shape === "parking_indicator" ? 15 : 9, shape === "parking_indicator" ? 17 : 26, 4, "parking-light")}`;
    case "parking_sign":
      return svg`${pipe(
        [
          [-34, 0, 0],
          [-34, 0, 53],
        ],
        false,
        4,
      )}${pipe(
        [
          [34, 0, 0],
          [34, 0, 53],
        ],
        false,
        4,
      )}${box(-49, -5, 45, 98, 10, 42, "sign-body")}${display(-43, 5.2, 51, 86, 29, `${Math.round(s.value)} ← P`)}`;
    case "desk_sensor":
    case "seat_sensor":
    case "bed_sensor": {
      if (shape === "bed_sensor") {
        return svg`${box(-51, -26, 12, 102, 52, 16, "mattress")}${box(-51, -26, 28, 21, 52, 9, "pillow")}${box(-55, -30, 0, 5, 60, 42, "bed-frame")}${[-42, 42].map((x) => box(x, -22, 0, 5, 44, 12, "bed-frame"))}${box(-8, 0, 8, 16, 15, 5, "accent-part")}`;
      }
      if (shape === "seat_sensor") {
        return svg`${box(-25, -21, 32, 50, 42, 7, "chair-seat")}${box(-25, -21, 39, 50, 5, 42, "chair-back")}${[-21, 17].map((x) => box(x, -17, 0, 4, 34, 32, "chair-leg"))}${box(-9, 3, 27, 18, 18, 4, "accent-part")}`;
      }
      return svg`${box(-50, -27, 45, 100, 54, 6, "desktop")}${[-43, 39].map((x) => box(x, -21, 0, 4, 42, 45, "desk-leg"))}${box(-9, -6, 36, 18, 12, 9, "accent-part")}`;
    }
    case "weather_mast":
    case "anemometer":
    case "wind_vane":
    case "weather_shield":
    case "rain_gauge":
    case "rain_sensor":
    case "lightning_sensor": {
      if (shape === "rain_gauge") {
        return svg`${cylinder(0, 0, 4, 25, 51)}${cylinder(0, 0, 55, 30, 5, "rain-funnel")}${pipe(
          [
            [0, 0, 4],
            [0, 0, 0],
          ],
          false,
          6,
        )}${display(-12, 25.2, 24, 24, 13, `${s.value.toFixed(1)}`)}`;
      }
      if (shape === "rain_sensor") {
        return svg`${box(-30, -20, 9, 60, 40, 7)}${Array.from(
          { length: 8 },
          (_, i) =>
            line3(
              [
                [-24 + i * 7, -16, 17],
                [-24 + i * 7, 16, 17],
              ],
              "rain-track",
            ),
        )}${pipe(
          [
            [0, 0, 0],
            [0, 0, 9],
          ],
          false,
          5,
        )}`;
      }
      return svg`${cylinder(0, 0, 0, 15, 4, "metal")}${pipe(
        [
          [0, 0, 4],
          [0, 0, 95],
        ],
        false,
        4,
      )}${shape === "weather_shield" || shape === "weather_mast" ? Array.from({ length: 7 }, (_, i) => cylinder(shape === "weather_mast" ? -28 : 0, 0, 55 + i * 4, 11, 2, "radiation-shield")) : svg``}${
        shape === "anemometer" || shape === "weather_mast"
          ? svg`<g class="anemometer-rotor ${on ? "spinning" : ""}" style="transform-origin:140px 31px">${[
              0, 120, 240,
            ].map((a) => {
              const x = Math.cos((a * Math.PI) / 180) * 25;
              const y = Math.sin((a * Math.PI) / 180) * 25;
              return svg`${pipe(
                [
                  [0, 0, 95],
                  [x, y, 95],
                ],
                false,
                2,
              )}${cylinder(x, y, 93, 6, 4, "wind-cup")}`;
            })}</g>`
          : svg``
      }${
        shape === "wind_vane" || shape === "weather_mast"
          ? svg`${pipe(
              [
                [-31, 0, 85],
                [31, 0, 85],
              ],
              false,
              2,
            )}${polygon3(
              [
                [24, 0, 78],
                [40, 0, 85],
                [24, 0, 92],
              ],
              "wind-tail",
            )}`
          : svg``
      }${shape === "lightning_sensor" ? antenna(0, 0, 91, 23) : svg``}`;
    }
    default:
      return undefined;
  }
}
