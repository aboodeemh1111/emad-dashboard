import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  polygon3,
  line3,
  circleFace,
  display,
  project,
  pipe,
  type Point3,
} from "./isometric-primitives";
import { fluidShell } from "./physical-water";
import { isOccupancy } from "./occupancy-model";

const dot = (p: Point3, cls: string, r = 1) => {
  const [x, y] = project(p);
  return svg`<circle cx=${x} cy=${y} r=${r} class=${cls}/>`;
};
const occupied = (s: DeviceVisualState) =>
  s.hasTelemetry &&
  ["room_occupied", "room_moving", "room_still"].includes(s.mode);
const lamp = (x: number, y: number, z: number, on: boolean, alert = false) =>
  circleFace(
    x,
    y,
    z,
    1.3,
    on ? (alert ? "room-led-red" : "room-led-green") : "room-led-off",
  );
const screw = (x: number, y: number, z: number) =>
  dot([x, y, z], "room-fastener", 0.9);
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
const platform = (w = 110, d = 78) =>
  svg`${polygon3(
    [
      [-w / 2, -d / 2, 0],
      [w / 2, -d / 2, 0],
      [w / 2, d / 2, 0],
      [-w / 2, d / 2, 0],
    ],
    "room-context-floor",
  )}`;
function dome(x: number, y: number, z: number, r = 18, h = 13) {
  const ring = (v: number) =>
    Array.from({ length: 25 }, (_, i) => {
      const a = (i * Math.PI) / 12;
      return [
        x + r * Math.cos(v) * Math.cos(a),
        y + r * Math.cos(v) * Math.sin(a),
        z - h * Math.sin(v),
      ] as Point3;
    });
  return svg`<g class="room-fresnel-lens">${fluidShell(
    "z",
    [x, y, 0],
    Array.from(
      { length: 9 },
      (_, i) =>
        [
          z - h * Math.sin(Math.PI / 2 - (i * Math.PI) / 16),
          Math.max(0.1, r * Math.cos(Math.PI / 2 - (i * Math.PI) / 16)),
        ] as const,
    ),
    "room-lens-shell",
  )}${[0, 0.27, 0.55, 0.83, 1.1].map((v) => line3(ring(v), "room-fresnel-ring"))}${Array.from(
    { length: 12 },
    (_, i) =>
      line3(
        Array.from({ length: 9 }, (_unused, j) => {
          const v = (j * Math.PI) / 16;
          return [
            x + r * Math.cos(v) * Math.cos((i * Math.PI) / 6),
            y + r * Math.cos(v) * Math.sin((i * Math.PI) / 6),
            z - h * Math.sin(v),
          ] as Point3;
        }),
        "room-fresnel-facet",
      ),
  )}</g>`;
}
function person(x: number, y: number, progress = 50, walking = false) {
  const stride = walking ? Math.sin((progress * Math.PI) / 12) * 5 : 0;
  return svg`<g class="room-example-person">${pipe(
    [
      [x - 3, y, 19],
      [x - 4, y + stride, 2],
    ],
    false,
    3,
  )}${pipe(
    [
      [x + 3, y, 19],
      [x + 4, y - stride, 2],
    ],
    false,
    3,
  )}${fluidShell(
    "z",
    [x, y, 0],
    [
      [18, 5],
      [31, 6],
      [34, 4],
    ],
    "room-person-shirt",
  )}${pipe(
    [
      [x - 5, y, 31],
      [x - 8, y - stride, 20],
    ],
    false,
    2.5,
  )}${pipe(
    [
      [x + 5, y, 31],
      [x + 8, y + stride, 20],
    ],
    false,
    2.5,
  )}${fluidShell(
    "z",
    [x, y, 0],
    [
      [35, 0.2],
      [36, 4],
      [40, 5],
      [44, 3.4],
      [45, 0.3],
    ],
    "room-person-head",
  )}</g>`;
}
function pir(s: DeviceVisualState) {
  const p = s.processProgress ?? 100;
  const walking = s.example && s.program === "motion" && p < 65;
  const personY = -28 + Math.min(1, p / 65) * 53;
  return svg`${platform()}${polygon3(
    [
      [-55, -41, 83],
      [5, -41, 83],
      [5, 17, 83],
      [-55, 17, 83],
    ],
    "room-ceiling-tile",
  )}${cylinder(-25, -12, 75, 23, 6, "room-pir-base")}${cylinder(-25, -12, 72, 21, 3, "room-pir-bezel")}${dome(-25, -12, 72, 18, 12)}${[-40, -10].map((x) => screw(x, -13, 81.3))}${lamp(-13, 6, 76, s.hasTelemetry && occupied(s))}${polygon3(
    [
      [-25, -12, 59],
      [-26, 35, 0.3],
      [45, 35, 0.3],
      [32, -24, 0.3],
    ],
    "room-coverage-guide",
  )}${walking ? person(20, personY, p, true) : svg``}`;
}
function radar(s: DeviceVisualState) {
  return svg`${platform()}${pane(-62, -30, 16, 64, 65, "room-panel-wall")}${box(-49, -30, 40, 9, 7, 44, "room-radar-mount")}${cylinder(-43, -20, 48, 4, 13, "room-radar-joint")}${box(-47, -18, 48, 32, 8, 31, "room-radar-shell")}${pane(-45, -9.7, 50, 28, 26, "room-radome")}${line3(
    [
      [-43, -9.2, 52],
      [-19, -9.2, 52],
    ],
    "room-case-seam",
  )}${lamp(-20, -9, 73, s.hasTelemetry && occupied(s))}${pipe(
    [
      [-32, -16, 48],
      [-32, -22, 36],
      [-43, -26, 33],
    ],
    false,
    1,
  )}${polygon3(
    [
      [-30, -8, 50],
      [-18, 35, 0.4],
      [49, 35, 0.4],
      [40, -20, 0.4],
    ],
    "room-coverage-guide",
  )}${s.example && occupied(s) ? person(20, s.program === "presence" && (s.processProgress ?? 100) < 100 ? -25 + (s.processProgress ?? 100) * 0.55 : 12, s.processProgress, s.program === "presence" && (s.processProgress ?? 100) < 100) : svg``}`;
}
function doorway(d: CatalogDevice, s: DeviceVisualState) {
  const dual = d.id === "directional_people_counter";
  const p = (s.processProgress ?? 100) / 100;
  const y = s.program === "leave" ? 35 - p * 72 : -37 + p * 72;
  const crossing = s.example === true && p < 1;
  const beamA = crossing && Math.abs(y + 8) < 12;
  const beamB = crossing && Math.abs(y - 8) < 12;
  return svg`${platform(130, 95)}${box(-45, -3, 0, 7, 8, 84, "room-door-jamb")}${box(38, -3, 0, 7, 8, 84, "room-door-jamb")}${box(-45, -3, 84, 90, 8, 7, "room-door-lintel")}${
    dual
      ? svg`${[-8, 8].map(
          (by, i) =>
            svg`${box(-38, by - 2, 34, 5, 4, 13, "room-beam-node")}${box(33, by - 2, 34, 5, 4, 13, "room-beam-node")}${circleFace(-35.5, by + 2.3, 41, 1.5, "room-optic")}${line3(
              [
                [-33, by, 41],
                [33, by, 41],
              ],
              (i === 0 ? beamA : beamB)
                ? "room-beam-triggered"
                : "room-beam-guide",
            )}`,
        )}`
      : svg`${box(-25, -7, 79, 50, 17, 6, "room-tof-body")}${pane(-21, 10.2, 80, 42, 3, "room-tof-window")}${[-13, 13].map((x) => circleFace(x, 10.5, 81.5, 2, "room-optic"))}${lamp(0, 10.5, 81.5, crossing)}`
  }${line3(
    [
      [-32, 0, 0.4],
      [32, 0, 0.4],
    ],
    "room-counting-line",
  )}${crossing ? person(0, y, s.processProgress ?? 0, true) : svg``}`;
}
function desk(s: DeviceVisualState) {
  return svg`${platform(125, 95)}${box(-48, -25, 50, 96, 50, 4, "room-desk-top")}${[-42, 38].flatMap((x) => [-20, 18].map((y) => box(x, y, 0, 4, 4, 50, "room-furniture-leg")))}<g class="room-underdesk-sensor">${box(-4, 9, 43, 25, 12, 7, "room-desk-sensor-case")}${pane(0, 21.3, 44, 17, 4, "room-small-pir-window")}${Array.from(
    { length: 6 },
    (_, i) =>
      line3(
        [
          [1 + i * 2.5, 21.6, 44],
          [1 + i * 2.5, 21.6, 48],
        ],
        "room-small-fresnel",
      ),
  )}${lamp(17, 21.6, 46, s.hasTelemetry && occupied(s))}${screw(0, 14, 50)}${screw(17, 14, 50)}</g>${box(-17, 31, 23, 34, 26, 3, "room-chair-seat")}${box(-17, 53, 26, 34, 4, 22, "room-chair-back")}${[-13, 9].map((x) => box(x, 35, 0, 4, 20, 23, "room-furniture-leg"))}${s.example && occupied(s) ? svg`<g class="room-desk-user">${cylinder(0, 40, 26, 8, 29, "room-user-body")}${cylinder(0, 40, 57, 5, 10, "room-user-head")}</g>` : svg``}`;
}
function seat(s: DeviceVisualState) {
  const load = s.position / 100;
  return svg`${platform(104, 90)}${[-24, 20].flatMap((x) => [-19, 19].map((y) => box(x, y, 0, 4, 4, 29, "room-furniture-leg")))}${box(-27, -23, 29, 54, 50, 5, "room-seat-frame")}${box(-27, -25, 34, 54, 5, 37, "room-chair-back")}${box(-23, -18, 34, 46, 38, 2.6 - load * 0.2, "room-seat-pressure-pad")}${Array.from(
    { length: 6 },
    (_, i) =>
      line3(
        [
          [-18 + i * 7, -15, 36.7 - load * 0.2],
          [-18 + i * 7, 16, 36.7 - load * 0.2],
        ],
        "room-pad-electrode",
      ),
  )}${pipe(
    [
      [24, 4, 35 - load],
      [32, 4, 28],
      [32, 20, 17],
    ],
    false,
    1.2,
  )}${box(27, 19, 14, 13, 7, 12, "room-pad-transmitter")}${lamp(33, 26.3, 22, s.hasTelemetry && s.position >= 50)}<g class="room-load-indicator" data-pad-compression=${load}>${
    s.example && s.position >= 50
      ? polygon3(
          [
            [-20, -15, 38],
            [-20, 15, 38],
            [20, 15, 38],
            [20, -15, 38],
          ],
          "room-loaded-cushion",
        )
      : svg``
  }</g>`;
}
function bed(s: DeviceVisualState) {
  const loaded = s.position / 100;
  return svg`<g transform="translate(140 128) scale(.88) translate(-140 -128)">${platform(145, 108)}${box(-61, -39, 16, 122, 78, 7, "room-bed-base")}${[-54, 48].flatMap((x) => [-32, 27].map((y) => box(x, y, 0, 6, 6, 16, "room-furniture-leg")))}${box(-65, -41, 19, 5, 82, 35, "room-bed-headboard")}${box(-58, -35, 23, 116, 70, 9 - loaded, "room-mattress-cutaway")}${box(-18, -34, 23, 35, 68, 1.6 - loaded * 0.1, "room-bed-pressure-strip")}${[
    -12, -3, 6,
  ].map((x) =>
    line3(
      [
        [x, -29, 24.7 - loaded * 0.1],
        [x, 29, 24.7 - loaded * 0.1],
      ],
      "room-pad-electrode",
    ),
  )}${box(-53, -29, 32 - loaded, 22, 56, 5, "room-pillow")}${polygon3(
    [
      [-25, -34, 33 - loaded],
      [57, -34, 33 - loaded],
      [57, 34, 33 - loaded],
      [-25, 34, 33 - loaded],
    ],
    "room-bedding-cutaway",
  )}${pipe(
    [
      [15, 33, 24],
      [20, 45, 24],
      [34, 45, 21],
    ],
    false,
    1.1,
  )}${box(32, 43, 14, 20, 9, 15, "room-bed-interface")}${lamp(42, 52.3, 23, s.hasTelemetry && s.position >= 50)}<g data-pad-compression=${loaded} class="room-load-indicator"></g></g>`;
}
function schedulePanel(s: DeviceVisualState, slim = false) {
  const busy = ["room_reserved", "room_in_use"].includes(s.mode);
  const known = s.hasTelemetry;
  const w = slim ? 34 : 78;
  const h = slim ? 73 : 50;
  return svg`${pane(-52, -9, 14, 104, 87, "room-panel-wall")}${box(-w / 2 - 3, -7, 26, w + 6, 6, h + 6, "room-panel-mount")}${box(-w / 2, -1, 29, w, 7, h, "room-touch-panel")}${pane(-w / 2 + 3, 6.4, 32, w - 6, h - 6, "room-tablet-screen")}${box(-w / 2 - 1, 5, 32, 2, 3, h - 5, known ? (busy ? "room-status-red" : "room-status-green") : "room-status-off")}${box(w / 2 - 1, 5, 32, 2, 3, h - 5, known ? (busy ? "room-status-red" : "room-status-green") : "room-status-off")}${
    slim
      ? svg`${display(-w / 2 + 6, 6.7, 66, w - 12, 18, known ? (busy ? "●" : "○") : "—")}${line3(
          [
            [-9, 6.8, 52],
            [9, 6.8, 52],
          ],
          "room-screen-line",
        )}${line3(
          [
            [-7, 6.8, 47],
            [7, 6.8, 47],
          ],
          "room-screen-line",
        )}`
      : svg`${display(-w / 2 + 7, 6.7, 54, 25, 16, s.example ? "30" : "—")}${Array.from({ length: 3 }, (_, i) => pane(0, 6.8, 40 + i * 9, w / 2 - 8, 5, known && busy && i === 1 ? "room-schedule-selected" : "room-schedule-slot"))}${line3(
          [
            [-w / 2 + 7, 6.8, 40],
            [-8, 6.8, 40],
          ],
          "room-screen-line",
        )}${line3(
          [
            [-w / 2 + 7, 6.8, 45],
            [-14, 6.8, 45],
          ],
          "room-screen-line",
        )}`
  }${screw(-w / 2 + 3, 7, 31)}${screw(w / 2 - 3, 7, 31)}${pipe(
    [
      [0, -5, 27],
      [0, -9, 18],
    ],
    false,
    1.5,
  )}`;
}
function kiosk(d: CatalogDevice, s: DeviceVisualState) {
  const visitor = d.id === "visitor_management_terminal";
  const p = s.processProgress ?? 100;
  const paper =
    s.example === true &&
    (s.program === "ticket_ready" ||
      s.program === "checked_in" ||
      s.program === "print" ||
      (s.program === "checkin" && p >= 55));
  const extension = paper
    ? (visitor
        ? Math.min(1, Math.max(0, (p - 55) / 45))
        : Math.min(1, p / 90)) * 17
    : 0;
  return svg`${box(-29, -22, 0, 58, 44, 4, "room-kiosk-foot")}${[-22, 22].flatMap((x) => [-15, 15].map((y) => screw(x, y, 4.2)))}${box(-16, -12, 4, 32, 24, 49, "room-kiosk-pedestal")}${box(-27, -13, 52, 54, 24, 42, "room-kiosk-head")}${pane(-24, 11.4, 59, 48, 31, "room-tablet-screen")}${display(-18, 11.7, 68, 36, 17, visitor ? (s.example ? "042" : "—") : s.hasTelemetry ? `Q${String(s.value).padStart(3, "0")}` : "—")}${pane(-12, 11.8, 61, 24, 4, "room-screen-button")}${
    visitor
      ? svg`${circleFace(0, 11.8, 91, 1.3, "room-camera-aperture")}${box(-12, 12, 45, 24, 1, 7, "room-code-scanner")}${line3(
          [
            [-9, 13.2, 48],
            [9, 13.2, 48],
          ],
          s.active && p < 55 ? "room-scanner-active" : "room-scanner-glass",
        )}`
      : svg``
  }${box(-13, 12.2, 37, 26, 1, 4, "room-printer-slot")}${box(-12, 12.1, 10, 24, 0.5, 21, "room-service-door")}${circleFace(7, 13, 18, 1.4, "room-keyhole")}${
    paper
      ? svg`<g class="room-issued-paper" data-paper-extension=${extension}>${polygon3(
          [
            [-10, 13.5, 39],
            [10, 13.5, 39],
            [10, 13.5 + extension, 39 - extension * 0.5],
            [-10, 13.5 + extension, 39 - extension * 0.5],
          ],
          "room-paper",
        )}${display(-7, 13.6 + extension * 0.4, 37 - extension * 0.15, 14, 4, visitor ? "042" : String(s.value))}${Array.from(
          { length: 10 },
          (_, i) =>
            line3(
              [
                [-7 + i * 1.4, 13.6 + extension * 0.4, 37 - extension * 0.15],
                [-7 + i * 1.4, 13.6 + extension * 0.75, 38 - extension * 0.45],
              ],
              "room-paper-barcode",
            ),
        )}</g>`
      : svg``
  }${lamp(19, 11.6, 86, s.example === true && (s.active || s.program === "checked_in"))}`;
}
function trackingTag(s: DeviceVisualState) {
  return svg`<g transform="translate(140 128) scale(1.3) translate(-140 -128)">${pipe(
    [
      [-24, -3, 32],
      [-33, -5, 42],
      [-35, 4, 49],
      [-28, 12, 51],
      [-21, 7, 44],
      [-24, -3, 32],
    ],
    false,
    2,
  )}${box(-25, -4, 18, 50, 8, 26, "room-tag-shell")}${box(-22, 4.3, 21, 44, 0.6, 20, "room-tag-face")}${circleFace(-15, 5.2, 34, 2.3, "room-tag-button")}${lamp(13, 5.4, 35, s.active)}${pane(-7, 5.3, 25, 24, 4, "room-tag-id")}${[
    0, 1, 2, 3, 4, 5,
  ].map((i) =>
    line3(
      [
        [-5 + i * 3, 5.6, 25.5],
        [-5 + i * 3, 5.6, 28.5],
      ],
      "room-paper-barcode",
    ),
  )}${line3(
    [
      [-20, 4.8, 22],
      [20, 4.8, 22],
    ],
    "room-case-seam",
  )}${screw(19, 5.2, 37)}</g>`;
}
function gateway(s: DeviceVisualState) {
  return svg`${pane(-44, -13, 19, 88, 76, "room-panel-wall")}${box(-35, -8, 36, 70, 25, 31, "room-tracking-gateway")}${box(-38, -10, 33, 6, 29, 36, "room-gateway-bracket")}${box(32, -10, 33, 6, 29, 36, "room-gateway-bracket")}${[-35, 35].map((x) => screw(x, 19.4, 61))}${cylinder(-25, -1, 67, 2.1, 30, "room-gateway-antenna")}${cylinder(25, -1, 67, 2.1, 30, "room-gateway-antenna")}${box(-27, 17.4, 40, 13, 1, 9, "room-ethernet-port")}${Array.from(
    { length: 6 },
    (_, i) =>
      line3(
        [
          [-25 + i * 1.6, 18.6, 46],
          [-25 + i * 1.6, 18.6, 48],
        ],
        "room-port-contact",
      ),
  )}${circleFace(-4, 18.2, 45, 2.8, "room-dc-port")}${[-20, -7, 6, 19].map((x, i) => lamp(x, 18.2, 59, s.example === true && (i === 0 || (s.active && i === 2))))}${Array.from(
    { length: 7 },
    (_, i) =>
      line3(
        [
          [3 + i * 3, 17.5, 39],
          [3 + i * 3, 17.5, 49],
        ],
        "room-gateway-vent",
      ),
  )}`;
}
function callButton(s: DeviceVisualState) {
  const pressing =
    s.example === true &&
    ["call", "ack"].includes(s.program ?? "") &&
    (s.processProgress ?? 100) < 100
      ? Math.sin(((s.processProgress ?? 0) * Math.PI) / 100) * 1.4
      : 0;
  const [cx, cy] = project([0, 10.5 - pressing, 52]);
  return svg`${pane(-41, -10, 9, 82, 93, "room-panel-wall")}${box(-24, -6, 26, 48, 15, 49, "room-call-plate")}${screw(-19, 9.3, 70)}${screw(19, 9.3, 31)}${circleFace(0, 9.4, 52, 15, "room-call-button-bezel")}<g class="room-call-plunger" data-depression=${pressing}>${circleFace(0, 10.5 - pressing, 52, 12, "room-call-red-button")}<text class="room-assistance-symbol" x=${cx} y=${cy + 3}>!</text></g>${lamp(-13, 9.5, 33, s.hasTelemetry && s.alert, true)}${lamp(13, 9.5, 33, s.hasTelemetry && s.processPhase === "acknowledged")}${pipe(
    [
      [0, 0, 26],
      [0, 0, 8],
    ],
    false,
    1,
  )}${cylinder(0, 0, 1, 3, 7, "room-call-cord-grip")}`;
}
export function occupancyVisual(d: CatalogDevice, s: DeviceVisualState) {
  if (!isOccupancy(d)) return undefined;
  let drawing;
  switch (d.id) {
    case "occupancy_sensor":
      drawing = pir(s);
      break;
    case "millimeter_wave_presence_sensor":
      drawing = radar(s);
      break;
    case "people_counter":
    case "directional_people_counter":
      drawing = doorway(d, s);
      break;
    case "desk_occupancy_sensor":
      drawing = desk(s);
      break;
    case "seat_occupancy_sensor":
      drawing = seat(s);
      break;
    case "bed_occupancy_sensor":
      drawing = bed(s);
      break;
    case "room_booking_panel":
      drawing = schedulePanel(s);
      break;
    case "room_availability_display":
      drawing = schedulePanel(s, true);
      break;
    case "queue_management_terminal":
    case "visitor_management_terminal":
      drawing = kiosk(d, s);
      break;
    case "asset_tracking_tag":
      drawing = trackingTag(s);
      break;
    case "asset_tracking_gateway":
      drawing = gateway(s);
      break;
    case "assistance_call_button":
      drawing = callButton(s);
      break;
    default:
      return undefined;
  }
  return svg`<g class="realistic-occupancy ${s.active ? "room-example-active" : ""} ${s.alert ? "room-call-latched" : ""}" data-room-device=${d.id} data-room-phase=${s.processPhase ?? "unknown"}>${drawing}</g>`;
}
