import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  cylinder,
  pipe,
  line3,
  polygon3,
  project,
  circleFace,
  display,
  gauge,
  type Point3,
} from "./isometric-primitives";
import {
  fluidShell,
  fluidTube,
  fluidFlange,
  fluidBand,
  fluidWindowSurface,
} from "./physical-water";
import { isTreatment, TREATMENT_SENSORS } from "./treatment-model";

const section = (
  x: number,
  y: number,
  r: number,
  height: number,
  cls = "treatment-frp",
) =>
  fluidShell(
    "z",
    [x, y, 0],
    [
      [6, r * 0.55],
      [11, r],
      [height - 8, r],
      [height - 2, r * 0.65],
      [height, r * 0.2],
    ],
    cls,
  );
const feet = (x: number, y: number, r: number) =>
  svg`${[-1, 1].map((i) => box(x + i * r * 0.7 - 2, y - 3, 0, 4, 6, 10, "treatment-foot"))}`;
const flow = (points: Point3[], on: boolean, kind = "feed", width = 4) =>
  svg`<g class="treatment-${kind}">${pipe(points, on, width)}</g>`;
const frontWindow = (
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
function valveHead(x: number, y: number, z: number) {
  return svg`${cylinder(x, y, z, 7, 8, "treatment-valve-neck")}${box(x - 11, y - 8, z + 8, 22, 16, 15, "treatment-control-head")}${display(x - 8, y + 8.2, z + 14, 16, 7, "·")}${pipe(
    [
      [x - 16, y, z + 5],
      [x + 16, y, z + 5],
    ],
    false,
    5,
  )}${cylinder(x + 13, y, z + 5, 3, 6, "treatment-valve-knob")}`;
}
function mediaBed(
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  kind: string,
  expanded: boolean,
) {
  const top = z + h + (expanded ? 5 : 0);
  return svg`<g transform="translate(${project([x, y, 0])[0] - 140} ${project([x, y, 0])[1] - 128})">${fluidWindowSurface(r + 0.1, z, top, `treatment-media treatment-${kind}`)}${Array.from(
    { length: 35 },
    (_, i) => {
      const px = ((i * 11) % 33) - 16;
      const py = ((i * 7) % Math.max(8, h - 2)) + z;
      return circleFace(
        px,
        Math.sqrt(Math.max(0, r * r - px * px)) + 0.5,
        py,
        kind === "carbon" ? 0.7 : 1.1,
        `treatment-grain treatment-${kind}-grain`,
      );
    },
  )}${cylinder(0, 0, 12, 2, top + 3, "treatment-riser")}${[-1, 1].map((n) =>
    pipe(
      [
        [0, 0, 14],
        [n * 14, 0, 14],
      ],
      false,
      2,
    ),
  )}</g>`;
}
function softener(s: DeviceVisualState) {
  const phase = s.processPhase ?? "service";
  const back = phase === "backwash";
  const brine = phase === "brine_draw";
  const on = (s.flow ?? 0) > 0 && s.available;
  return svg`${feet(-18, 0, 21)}${section(-18, 0, 21, 82)}${mediaBed(-18, 0, 17, 21, 39, "resin", back && on)}${valveHead(-18, 0, 82)}${section(32, 3, 16, 48, "treatment-brine-tank")}${cylinder(32, 3, 48, 17, 3, "treatment-brine-lid")}${box(23, 14, 32, 18, 1, 13, "treatment-salt-window")}${Array.from({ length: Math.ceil((Math.max(0, Math.min(100, s.level)) / 100) * 12) }, (_, i) => box(24 + (i % 4) * 4, 15, 34 + Math.floor(i / 4) * 3, 3, 1, 2, "treatment-salt"))}${flow(
    [
      [-42, 0, 90],
      [-18, 0, 90],
    ],
    on && !brine,
    "feed",
    4,
  )}${flow(
    [
      [-18, 0, 83],
      [-18, 0, 19],
    ],
    on && !brine,
    "bed-flow",
    2,
  )}${flow(
    [
      [32, 3, 14],
      [32, 3, 57],
      [-18, 3, 57],
      [-18, 3, 87],
    ],
    on && (brine || phase === "refill"),
    "brine",
    2.3,
  )}${flow(
    [
      [-18, -5, 88],
      [-18, -23, 88],
      [17, -23, 88],
      [17, -23, 5],
    ],
    on && phase !== "service" && phase !== "refill",
    "drain",
    3,
  )}${flow(
    [
      [-18, 8, 90],
      [1, 8, 90],
    ],
    on && (phase === "service" || phase === "refill"),
    "permeate",
    4,
  )}`;
}
function cartridge(s: DeviceVisualState) {
  const on = (s.flow ?? 0) > 0 && s.available;
  return svg`${box(-45, -8, 81, 91, 10, 7, "treatment-wall-bracket")}${[
    -24, 19,
  ].map(
    (x, i) =>
      svg`${cylinder(x, 0, 20, 13, 58, "treatment-filter-bowl")}${cylinder(x, 0, 74, 15, 9, "treatment-filter-cap")}${cylinder(x, 0, 17, 8, 4, "treatment-filter-drain")}${frontWindow(x - 9, 10.5, 25, 18, 43, "treatment-bowl-window")}${Array.from(
        { length: 9 },
        (_, j) =>
          line3(
            [
              [x - 7 + j * 1.7, 11, 29],
              [x - 7 + j * 1.7, 11, 65],
            ],
            i ? "treatment-carbon-pleat" : "treatment-pleat",
          ),
      )}`,
  )}${flow(
    [
      [-52, 0, 79],
      [-24, 0, 79],
      [19, 0, 79],
      [48, 0, 79],
    ],
    on,
    "feed",
    5,
  )}${s.pressure !== undefined ? gauge(-3, 20, 88, 7, s.pressure * 100) : circleFace(-3, 20, 88, 7, "gauge-face")}${[
    -24, 19,
  ].map((x) =>
    pipe(
      [
        [x, 7, 79],
        [x, 18, 85],
        [-3, 18, 85],
      ],
      false,
      1,
    ),
  )}}`;
}
function mediaFilter(d: CatalogDevice, s: DeviceVisualState) {
  const carbon = d.id === "activated_carbon_filter";
  const r = carbon ? 24 : 31;
  const h = carbon ? 87 : 66;
  const phase = s.processPhase ?? "service";
  const on = (s.flow ?? 0) > 0 && s.available;
  const back = phase === "backwash";
  return svg`${feet(0, 0, r)}${section(0, 0, r, h)}${mediaBed(0, 0, 16, r, h - 34, carbon ? "carbon" : "sand", back && on)}${
    carbon
      ? valveHead(0, 0, h)
      : svg`${cylinder(0, 0, h, 11, 8, "treatment-multiport")}${pipe(
          [
            [0, 0, h + 8],
            [18, 0, h + 8],
          ],
          false,
          3,
        )}`
  }${flow(
    [
      [-48, 0, h + 4],
      [0, 0, h + 4],
      [0, 0, 18],
    ],
    on,
    "bed-flow",
    4,
  )}${flow(
    [
      [0, 0, 18],
      [22, 0, 18],
      [43, 0, 18],
    ],
    on && !back,
    "permeate",
    4,
  )}${flow(
    [
      [0, -8, h],
      [0, -25, h],
      [38, -25, h],
      [38, -25, 6],
    ],
    on && phase !== "service",
    "drain",
    3,
  )}${s.pressure !== undefined ? gauge(-15, 20, h - 1, 7, s.pressure * 100) : circleFace(-15, 20, h - 1, 7, "gauge-face")}`;
}
function rack() {
  return svg`${[-46, 46].map((x) => svg`${box(x - 2, -18, 0, 4, 40, 4, "treatment-skid")}${box(x - 2, -15, 4, 4, 4, 99, "treatment-rack")}`)}${box(-48, -15, 98, 96, 4, 4, "treatment-rack")}${box(-48, -15, 8, 96, 4, 4, "treatment-rack")}`;
}
function ro(s: DeviceVisualState) {
  const on = (s.flow ?? 0) > 0 && s.available;
  const flushing = s.processPhase === "flush";
  return svg`${rack()}${[56, 82].map(
    (z) =>
      svg`${fluidShell(
        "x",
        [0, -6, z],
        [
          [-42, 9],
          [-37, 11],
          [38, 11],
          [43, 8],
        ],
        "treatment-ro-vessel",
      )}${fluidFlange(40, -6, z, 10)}${[-28, 25].map((x) => box(x - 2, -18, z - 10, 4, 24, 3, "treatment-vessel-strap"))}`,
  )}${frontWindow(-24, 4.4, 54, 45, 6, "treatment-membrane-cutaway")}${Array.from(
    { length: 7 },
    (_, i) =>
      line3(
        [
          [-21, 4.7, 54.5 + i * 0.7],
          [18, 4.7, 54.5 + i * 0.7],
        ],
        "treatment-membrane-layer",
      ),
  )}${[-26, -4].map((x) => svg`${cylinder(x, 8, 13, 7, 27, "treatment-filter-bowl")}${cylinder(x, 8, 40, 8, 5, "treatment-filter-cap")}`)}${box(20, 5, 13, 18, 18, 20, "treatment-hp-pump")}${cylinder(29, 14, 33, 6, 8, "treatment-hp-motor")}${box(-10, 15, 67, 31, 9, 22, "treatment-control-panel")}${display(-6, 24.2, 75, 22, 8, on ? "RO" : "—")}${flow(
    [
      [-59, 9, 18],
      [-26, 9, 18],
      [-26, 9, 45],
      [29, 9, 45],
      [42, -6, 56],
    ],
    on,
    "feed",
    4,
  )}${flow(
    [
      [-42, -6, 56],
      [-52, -6, 56],
      [-52, -6, 82],
      [-42, -6, 82],
    ],
    on,
    "feed",
    3,
  )}${flow(
    [
      [43, -6, 82],
      [54, -6, 82],
      [54, -6, 9],
    ],
    on,
    "concentrate",
    3,
  )}${flow(
    [
      [0, -17, 56],
      [0, -30, 56],
      [46, -30, 56],
    ],
    on && !flushing && (s.recovery ?? 0) > 0,
    "permeate",
    3,
  )}`;
}
function uf(s: DeviceVisualState) {
  const on = (s.flow ?? 0) > 0 && s.available;
  const back = s.processPhase === "backwash";
  return svg`${rack()}${[-28, 0, 28].map(
    (x) =>
      svg`${cylinder(x, 0, 17, 9, 67, "treatment-uf-module")}${[18, 81].map((z) => cylinder(x, 0, z, 11, 4, "treatment-uf-clamp"))}${flow(
        [
          [x, 0, 12],
          [x, 0, 18],
        ],
        on,
        "feed",
        4,
      )}${flow(
        [
          [x, 0, 84],
          [x, 0, 96],
        ],
        on,
        "permeate",
        4,
      )}`,
  )}${frontWindow(-5, 9.2, 27, 10, 46, "treatment-fiber-window")}${Array.from(
    { length: 9 },
    (_, i) =>
      line3(
        [
          [-4 + i, 9.5, 30],
          [-4 + i, 9.5, 70],
        ],
        "treatment-hollow-fiber",
      ),
  )}${flow(
    [
      [-52, 0, 12],
      [40, 0, 12],
    ],
    on,
    "feed",
    6,
  )}${flow(
    [
      [-40, 0, 96],
      [53, 0, 96],
    ],
    on,
    "permeate",
    5,
  )}${flow(
    [
      [-40, 0, 12],
      [-51, 0, 12],
      [-51, 0, 3],
    ],
    on && back,
    "drain",
    3,
  )}${box(28, 14, 46, 21, 11, 27, "treatment-control-panel")}${display(31, 25.2, 58, 15, 8, on ? "UF" : "—")}`;
}
function uv(s: DeviceVisualState) {
  const lamp = s.active && s.available && !s.alert;
  return svg`${[-29, 30].map((x) => box(x - 3, -10, 0, 6, 20, 22, "treatment-reactor-foot"))}${fluidShell(
    "x",
    [0, 0, 38],
    [
      [-49, 12],
      [-43, 15],
      [43, 15],
      [49, 12],
    ],
    "water-stainless",
  )}${fluidFlange(-46, 0, 38, 15)}${fluidFlange(46, 0, 38, 15)}${pipe(
    [
      [-30, 0, 51],
      [-30, 0, 69],
      [-45, 0, 69],
    ],
    false,
    7,
  )}${pipe(
    [
      [30, 0, 25],
      [30, 0, 10],
      [46, 0, 10],
    ],
    false,
    7,
  )}${frontWindow(-28, 14.5, 33, 56, 11, "treatment-uv-window")}${line3(
    [
      [-34, 14.8, 38],
      [34, 14.8, 38],
    ],
    lamp ? "treatment-uv-lamp-on" : "treatment-uv-lamp-off",
  )}${[-35, 35].map((x) => fluidTube("x", [0, 14, 38], x - 2, x + 2, 4, "treatment-lamp-seal"))}${box(-5, -26, 70, 31, 14, 23, "treatment-ballast")}${display(0, -11.8, 79, 20, 8, s.alert ? "!" : lamp ? "UV" : "—")}${line3(
    [
      [-46, 0, 38],
      [-56, 0, 48],
      [-56, -23, 75],
      [-5, -23, 75],
    ],
    "water-power-cable",
  )}${cylinder(4, 0, 53, 3, 8, "treatment-uv-sensor")}`;
}
function meteringPump(x: number, y: number, z: number, s: DeviceVisualState) {
  const on = (s.deliveryRate ?? 0) > 0 && s.available;
  return svg`<g class="treatment-metering-pump ${on ? "treatment-dosing" : ""}" style="--treatment-stroke-period:${(s.deliveryRate ?? 0) > 0 ? 3.6 / s.deliveryRate! : 2}s">${box(x, y - 9, z, 26, 18, 25, "treatment-dose-drive")}${display(x + 4, y + 9.2, z + 14, 18, 7, s.deliveryRate !== undefined ? s.deliveryRate.toFixed(1) : "—")}${fluidTube("x", [0, y, z + 10], x - 10, x + 1, 9, "treatment-dose-head")}${fluidFlange(x - 10, y, z + 10, 9)}<g class="treatment-dose-plunger">${fluidTube("x", [0, y, z + 10], x - 2, x + 3, 2, "water-stainless")}</g>${pipe(
    [
      [x - 6, y, z + 19],
      [x - 6, y, z + 29],
    ],
    on,
    2,
  )}${pipe(
    [
      [x - 6, y, z + 1],
      [x - 6, y, z - 7],
    ],
    on,
    2,
  )}${box(x + 6, y - 6, z - 3, 17, 12, 3, "treatment-foot")}</g>`;
}
function chemicalSkid(d: CatalogDevice, s: DeviceVisualState) {
  const chlor = d.id === "chlorinator";
  const on = (s.deliveryRate ?? 0) > 0 && s.available;
  return svg`${box(-48, -26, 0, 100, 53, 4, "treatment-skid")}${section(-24, -1, chlor ? 20 : 16, chlor ? 61 : 52, "treatment-chemical-tank")}${cylinder(-24, -1, chlor ? 61 : 52, chlor ? 21 : 17, 3, "treatment-chemical-lid")}${frontWindow(-31, 15, 14, 14, 29, "treatment-level-window")}${frontWindow(-30, 15.2, 15, 12, 27 * Math.max(0, Math.min(1, s.level / 100)), "treatment-chemical-liquid")}${meteringPump(12, 10, 14, s)}${flow(
    [
      [-23, -1, 14],
      [-23, -1, 69],
      [6, -1, 69],
      [6, 10, 7],
    ],
    on,
    "chemical-suction",
    2,
  )}${flow(
    [
      [6, 10, 43],
      [6, 10, 77],
      [45, 10, 77],
      [45, 10, 61],
    ],
    on,
    "chemical-discharge",
    2,
  )}${flow(
    [
      [20, 10, 62],
      [61, 10, 62],
    ],
    (s.flow ?? 0) > 0 && s.available,
    "feed",
    6,
  )}${cylinder(45, 10, 58, 3, 9, "treatment-injection-check")}${line3(
    [
      [45, 10, 58],
      [45, 10, 64],
    ],
    "treatment-injection-quill",
  )}`;
}
function ozone(s: DeviceVisualState) {
  const on = (s.deliveryRate ?? 0) > 0 && s.available;
  return svg`${box(-50, -15, 0, 44, 32, 78, "treatment-ozone-cabinet")}${display(-43, 17.2, 55, 29, 13, s.deliveryRate !== undefined ? s.deliveryRate.toFixed(1) : "—")}${Array.from(
    { length: 6 },
    (_, i) =>
      line3(
        [
          [-43, 17.2, 14 + i * 4],
          [-14, 17.2, 14 + i * 4],
        ],
        "treatment-vent",
      ),
  )}${[-41, -22].map((x) => cylinder(x, -1, 81, 3, 7, "treatment-gas-fittings"))}${section(25, 0, 15, 82, "treatment-contact-column")}${frontWindow(15, 12.5, 15, 20, 53, "treatment-contact-window")}${on ? svg`<g class="treatment-contact-bubbles">${Array.from({ length: 6 }, (_, i) => circleFace(18 + (i % 3) * 6, 13.1, 18 + i * 7, 1.4, "treatment-gas-bubble"))}</g>` : svg``}${flow(
    [
      [-6, 0, 60],
      [8, 0, 60],
      [8, 0, 10],
      [25, 0, 10],
    ],
    on,
    "gas",
    2,
  )}${flow(
    [
      [45, 0, 14],
      [25, 0, 14],
      [25, 0, 69],
      [52, 0, 69],
    ],
    (s.flow ?? 0) > 0 && s.available,
    "feed",
    5,
  )}${cylinder(25, 0, 82, 3, 9, "treatment-offgas-line")}${pipe(
    [
      [25, 0, 91],
      [43, 0, 91],
      [43, 0, 77],
    ],
    false,
    2,
  )}${cylinder(43, 0, 68, 5, 14, "treatment-offgas-destructor")}`;
}
function transmitter(s: DeviceVisualState) {
  return svg`${box(-36, -11, 67, 31, 20, 23, "treatment-transmitter")}${display(-32, 9.2, 75, 23, 9, s.hasTelemetry ? s.value.toFixed(1) : "—")}${line3(
    [
      [-5, 0, 76],
      [7, 0, 83],
      [27, 0, 83],
      [27, 0, 67],
    ],
    "water-power-cable",
  )}`;
}
function opticalFlowCell(s: DeviceVisualState) {
  return svg`${box(-17, -10, 13, 47, 27, 40, "treatment-flow-cell")}${frontWindow(-10, 17.2, 19, 33, 28, "treatment-optical-window")}${pipe(
    [
      [-29, 3, 17],
      [-18, 3, 17],
    ],
    (s.flow ?? 0) > 0,
    3,
  )}${pipe(
    [
      [30, 3, 48],
      [43, 3, 48],
    ],
    (s.flow ?? 0) > 0,
    3,
  )}${box(-23, 0, 28, 8, 10, 13, "treatment-optical-emitter")}${box(4, -17, 28, 10, 8, 13, "treatment-optical-detector")}${line3(
    [
      [-15, 6, 34],
      [9, 6, 34],
      [9, -10, 34],
    ],
    "treatment-optical-path",
  )}${transmitter(s)}`;
}
function analyzer(s: DeviceVisualState) {
  const sampling = s.active && s.available && s.processPhase !== "service";
  return svg`${box(-38, -14, 9, 75, 29, 85, "treatment-analyzer-cabinet")}${display(-26, 15.2, 76, 50, 11, s.hasTelemetry ? s.value.toFixed(0) : "—")}${frontWindow(-31, 15.3, 23, 61, 46, "treatment-analyzer-window")}${[
    -20, -4, 12,
  ].map(
    (x, i) =>
      svg`${cylinder(x, 19, 27, 5, 19, "treatment-reagent-bottle")}${cylinder(x, 19, 46, 3, 4, "treatment-reagent-cap")}${line3(
        [
          [x, 19, 49],
          [x, 19, 61],
          [21, 19, 61],
          [21, 19, 47],
        ],
        "treatment-sample-tube",
      )}${
        i === 1 && sampling && s.processPhase === "reagent"
          ? line3(
              [
                [x, 19.2, 50],
                [x, 19.2, 61],
                [21, 19.2, 61],
              ],
              "treatment-reagent-pulse",
            )
          : svg``
      }`,
  )}${cylinder(22, 19, 43, 4, 11, "treatment-cuvette")}${line3(
    [
      [16, 19, 48],
      [28, 19, 48],
    ],
    "treatment-optical-path",
  )}${pipe(
    [
      [-38, 0, 58],
      [-49, 0, 58],
      [-49, 0, 14],
    ],
    sampling,
    2,
  )}${pipe(
    [
      [37, 0, 27],
      [48, 0, 27],
      [48, 0, 7],
    ],
    sampling,
    2,
  )}`;
}
function probe(d: CatalogDevice, s: DeviceVisualState) {
  const id = d.id;
  if (id === "water_hardness_sensor") return analyzer(s);
  if (id === "turbidity_sensor") return opticalFlowCell(s);
  const ph = id === "ph_sensor";
  const orp = id === "orp_sensor";
  const oxygen = id === "dissolved_oxygen_sensor";
  const salinity = id === "salinity_sensor";
  const chlorine = id === "chlorine_sensor";
  const radius = oxygen || salinity ? 7 : 4;
  return svg`${transmitter(s)}${chlorine ? box(7, -6, 7, 39, 26, 43, "treatment-chlorine-flow-cell") : svg``}${cylinder(27, 0, chlorine ? 20 : 17, radius, 44, oxygen ? "treatment-optical-probe" : "treatment-probe-body")}${[54, 57, 60].map((z) => fluidBand(27, 0, z, radius + 0.6, "treatment-probe-thread"))}${cylinder(27, 0, 61, radius + 2, 7, "treatment-probe-connector")}${
    ph
      ? svg`${cylinder(27, 0, 10, 2.8, 10, "treatment-ph-glass")}${fluidShell(
          "z",
          [27, 0, 0],
          [
            [5, 0.3],
            [6, 2.2],
            [9, 3],
            [12, 2.2],
          ],
          "treatment-ph-bulb",
        )}${circleFace(30, 3, 16, 1.1, "treatment-reference-junction")}`
      : orp
        ? svg`${cylinder(27, 0, 8, 4, 9, "treatment-orp-tip")}${cylinder(27, 0, 8, 4.1, 2, "treatment-platinum-ring")}`
        : oxygen
          ? svg`${cylinder(27, 0, 8, 8, 11, "treatment-oxygen-cap")}${circleFace(27, 8, 13, 3.5, "treatment-luminescent-spot")}`
          : salinity
            ? svg`<g transform="translate(${project([27, 0, 13])[0]} ${project([27, 0, 13])[1]}) matrix(.92 .46 0 -1 0 0)"><circle class="treatment-toroid" r="10"/><circle class="treatment-toroid-hole" r="4.3"/></g>`
            : chlorine
              ? svg`${cylinder(27, 0, 10, 6, 11, "treatment-chlorine-membrane")}${circleFace(27, 6, 14, 3, "treatment-membrane-face")}`
              : svg`${[-1, 1].map((n) => svg`${cylinder(27 + n * 3, 0, 7, 1.3, 12, "treatment-ec-electrode")}`)}${id === "conductivity_sensor" ? cylinder(27, 2, 7, 1, 12, "treatment-ec-electrode") : svg``}`
  }${
    chlorine
      ? svg`${pipe(
          [
            [-5, 4, 12],
            [7, 4, 12],
          ],
          (s.flow ?? 0) > 0,
          3,
        )}${pipe(
          [
            [46, 4, 41],
            [54, 4, 41],
          ],
          (s.flow ?? 0) > 0,
          3,
        )}`
      : svg``
  }`;
}
export function treatmentVisual(d: CatalogDevice, s: DeviceVisualState) {
  if (!isTreatment(d)) return undefined;
  const phase = s.processPhase ?? "service";
  const on = s.active && s.available;
  const drawing = TREATMENT_SENSORS[d.id]
    ? probe(d, s)
    : d.id === "water_softener"
      ? softener(s)
      : d.id === "water_filter"
        ? cartridge(s)
        : ["sand_filter", "activated_carbon_filter"].includes(d.id)
          ? mediaFilter(d, s)
          : d.id === "reverse_osmosis_unit"
            ? ro(s)
            : d.id === "ultrafiltration_unit"
              ? uf(s)
              : d.id === "uv_disinfection_unit"
                ? uv(s)
                : d.id === "ozone_generator"
                  ? ozone(s)
                  : chemicalSkid(d, s);
  return svg`<g class="realistic-treatment ${on ? "treatment-operating" : ""} treatment-phase-${phase} ${phase === "backwash" ? "treatment-backwashing" : ""} ${s.alert ? "treatment-fault" : ""}" data-treatment-device=${d.id} data-treatment-phase=${phase} data-treatment-flow=${s.flow ?? "unknown"} data-treatment-delivery=${s.deliveryRate ?? "unknown"} style="--treatment-stroke-period:${(s.deliveryRate ?? 0) > 0 ? 3.6 / s.deliveryRate! : 2}s" transform="translate(140 137) scale(.94) translate(-140 -128)">${drawing}</g>`;
}
