import { svg } from "lit";
import type { SVGTemplateResult } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import { isAppliance } from "./appliance-model";
import {
  box,
  cylinder,
  display,
  fan,
  grille,
  line3,
  pipe,
  polygon3,
  project,
  topFan,
} from "./isometric-primitives";

const front = (
  x: number,
  y: number,
  z: number,
  content: SVGTemplateResult,
  angle = 0,
) => {
  const a = (angle * Math.PI) / 180;
  const [px, py] = project([x, y, z]);
  return svg`<g transform="matrix(${0.92 * (Math.cos(a) - Math.sin(a))} ${0.46 * (Math.cos(a) + Math.sin(a))} 0 -1 ${px} ${py})">${content}</g>`;
};
// Clip inset hardware to its physical cabinet opening; shelves never paint over side walls.
const aperture = (
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  content: SVGTemplateResult,
  id: string,
) =>
  svg`<defs><clipPath id=${id}>${polygon3([
    [x, y, z],
    [x + w, y, z],
    [x + w, y, z + h],
    [x, y, z + h],
  ])}</clipPath></defs>${front(x, y, z, svg`<rect class="ap-inner-back" width=${w} height=${h}/>`)}<g class="ap-inset" clip-path="url(#${id})">${content}</g>`;

const feet = (w = 56, d = 40) =>
  svg`${[-1, 1].flatMap((x) => [-1, 1].map((y) => cylinder(x * (w / 2 - 5), y * (d / 2 - 4), 0, 3, 5, "ap-foot")))}`;
const vent = (x: number, y: number, z: number, w: number, h: number) =>
  svg`<g class="ap-vent">${grille(x, y, z, w, h, 8)}</g>`;
const led = (x: number, y: number, z: number, on: boolean) => {
  const [px, py] = project([x, y, z]);
  return svg`<circle class="ap-led ${on ? "ap-lit" : ""}" cx=${px} cy=${py} r="1.4"/>`;
};
const steam = (x: number, y: number, z: number, on: boolean) => {
  const [px, py] = project([x, y, z]);
  return svg`<g class="ap-steam ${on ? "ap-emitting" : ""}" transform="translate(${px} ${py})">${[-5, 0, 5].map((n, i) => svg`<path style="--ap-delay:${i * -0.7}s" d="M${n} 0q-5-6 0-12t0-13"/>`)}</g>`;
};
const air = (
  x: number,
  y: number,
  z: number,
  w: number,
  on: boolean,
  cold = false,
) =>
  svg`<g class="ap-air ${on ? "ap-airflow" : ""} ${cold ? "ap-cold-air" : ""}">${[
    0, 1, 2,
  ].map((i) =>
    line3(
      [
        [x + (i * w) / 3, y, z],
        [x + (i * w) / 3 + 2, y + 10, z - 5],
        [x + (i * w) / 3, y + 24, z - 11],
      ],
      "ap-air-line",
    ),
  )}</g>`;
const shelf = (x: number, y: number, z: number, w: number, depth = 22) =>
  svg`${box(x, y, z, w, depth, 1.5, "ap-shelf")}${[0, 1, 2, 3, 4].map((i) =>
    line3(
      [
        [x + (i * w) / 5, y, z + 2],
        [x + (i * w) / 5, y + depth, z + 2],
      ],
      "ap-wire",
    ),
  )}`;
function hingedDoor(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  opening: number,
  glass = false,
  seam = false,
  readout?: string,
) {
  return front(
    x,
    y,
    z,
    svg`<g class="ap-hinged-door ${glass ? "ap-glass-door" : ""}" data-door-angle=${opening * 0.95}><rect class="ap-door-skin" width=${w} height=${h} rx="1.5"/><rect class="ap-gasket" x="2" y="2" width=${w - 4} height=${h - 4} rx="1"/>${glass ? svg`<rect class="ap-glass" x="4" y="5" width=${w - 8} height=${h - 10}/><path class="ap-reflection" d="M6 ${h - 8}L${w - 9} 12m-4 ${h - 24}L${w - 6} 16"/>` : svg``}${seam ? svg`<path class="ap-seam" d="M2 ${h * 0.69}h${w - 4}"/>` : svg``}${readout === undefined ? svg`` : svg`<rect class="iso-screen" x="7" y=${h - 21} width=${Math.min(30, w - 14)} height="9"/><text class="screen-label" transform="scale(1 -1)" x=${7 + Math.min(30, w - 14) / 2} y=${-(h - 16)}>${readout}</text>`}<path class="ap-handle" d="M${w - 7} ${h * 0.28}v${h * 0.28}"/><rect class="ap-hinge" x="-1" y="8" width="2" height="7"/><rect class="ap-hinge" x="-1" y=${h - 15} width="2" height="7"/></g>`,
    opening * 0.95,
  );
}
const baseCabinet = (w: number, depth: number, h: number) =>
  svg`${feet(w, depth)}${box(-w / 2, -depth / 2, 4, w, depth, h, "ap-cabinet")}`;
function laundry(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const washer = d.id === "washing_machine";
  const run = s.active;
  const phase = s.processPhase;
  const spinning = run && phase === "spinning";
  const tumbling =
    run &&
    ["washing", "rinsing", "tumbling", "drying", "cooldown"].includes(
      phase ?? "",
    );
  const water = washer && (s.example ? s.level : s.hasLevel ? s.level : 0);
  const drum = svg`<circle class="ap-gasket-fill" r="23"/><circle class="ap-drum-metal" r="19.5"/><g clip-path="url(#${id}-drum)"><g class="ap-drum-rotor ${spinning ? "ap-spin" : tumbling ? "ap-tumble" : ""}">${Array.from(
    { length: 36 },
    (_, i) => {
      const a = (i * Math.PI) / 18;
      return svg`<circle class="ap-perforation" cx=${Math.cos(a) * 17.4} cy=${Math.sin(a) * 17.4} r=".65"/>`;
    },
  )}${[0, 120, 240].map((a) => svg`<path class="ap-drum-paddle" transform="rotate(${a})" d="M-2 13L-1 19h3l1-6Z"/>`)}<g class="ap-laundry"><path class="ap-cloth ap-cloth-mint" d="M-13-12q9-5 15 2L6-1 0 6l-13-2Z"/><path class="ap-cloth ap-cloth-cream" d="M0-14l10 4 5 12L5 8-2 0Z"/><path class="ap-cloth ap-cloth-blue" d="M-13 1l9-3 8 9-1 8-14-3Z"/></g></g>${water ? svg`<path class="ap-wash-water" d="M-20-20h40v${Math.min(20, water * 0.55)}h-40Z"/><g class="ap-suds">${[-13, -7, 0, 7, 13].map((x, i) => svg`<circle cx=${x} cy=${-18 + water * 0.55 + (i % 2)} r="2"/>`)}</g>` : svg``}</g><circle class="ap-porthole-glass" r="20.3"/><path class="ap-reflection" d="M-14 8q2 9 11 10"/>`;
  return svg`<defs><clipPath id="${id}-drum"><circle r="19"/></clipPath></defs>${pipe(
    [
      [-22, -18, 19],
      [-35, -20, 19],
      [-35, -22, 40],
    ],
    false,
    3,
  )}${baseCabinet(60, 43, 79)}${front(0, 22, 40, drum)}${display(-6, 22, 67, 23, 9, `${Math.round(s.processProgress ?? 0)}%`)}${front(-27, 22, 68, svg`<rect class="ap-drawer" width="17" height="10"/><path class="ap-seam" d="M3 5h10"/>`)}${cylinder(21, 19, 77, 4, 2, "ap-dial")}${vent(-24, 22.6, 8, 48, 6)}${washer ? svg`` : svg`${air(31, 0, 35, 8, run)}${front(-25, 22.8, 13, svg`<rect class="ap-lint-filter" width="12" height="4"/>`)}`}${s.position > 0 ? front(-23, 23, 40, svg`<circle class="ap-gasket-fill" cx="23" r="23"/><circle class="ap-porthole-glass" cx="23" r="19"/><path class="ap-handle" d="M41-5v10"/>`, s.position * 0.95) : front(0, 23, 40, svg`<circle class="ap-door-ring" r="24"/><path class="ap-handle" d="M21-5v10"/>`)}${led(23, 23, 70, run)}${washer && s.level > 0 ? front(-23, 23, 60, svg`<rect class="ap-lock-led" width="3" height="3"/>`) : svg``}`;
}
function dishwashing(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const commercial = d.id === "commercial_warewasher";
  const spray =
    s.active && ["washing", "rinsing"].includes(s.processPhase ?? "");
  const width = 65;
  const content = svg`${box(-27, -13, 15, 54, 30, 51, "ap-cavity")}${[22, 45].map((z) => svg`${shelf(-25, -8, z, 50, 26)}${[-17, -7, 3, 13].map((x) => front(x, 15, z + 10, svg`<ellipse class="ap-plate" rx="3.2" ry="9"/><ellipse class="ap-plate-edge" rx="2" ry="7"/>`))}`)}${(() => {
    const [px, py] = project([0, 4, 18]);
    return svg`<g transform="matrix(.92 .46 -.92 .46 ${px} ${py})"><g class="ap-spray-arm ${spray ? "ap-arm-turn" : ""}"><rect class="ap-arm-metal" x="-21" y="-2" width="42" height="4" rx="2"/>${[-16, -8, 8, 16].map((x) => svg`<circle class="ap-nozzle" cx=${x} cy="0" r=".75"/>`)}<circle class="ap-arm-hub" r="3"/></g></g>`;
  })()}<g class="ap-spray ${spray ? "ap-spraying" : ""}">${Array.from(
    { length: 7 },
    (_, i) =>
      line3(
        [
          [-21 + i * 7, 8, 19],
          [-22 + i * 7, 10, 35],
          [-25 + i * 7, 11, 44],
        ],
        "ap-spray-line",
      ),
  )}</g>`;
  if (commercial) {
    return svg`${feet(65, 48)}${box(-32, -24, 4, 64, 48, 22, "ap-stainless")}${box(-32, -24, 26, 5, 48, 65, "ap-post")}${box(27, -24, 26, 5, 48, 65, "ap-post")}${content}${box(-32, -24, 26 + s.position * 0.22, 64, 48, 56, "ap-hood-shell")}${line3(
      [
        [-25, 27, 37 + s.position * 0.22],
        [25, 27, 37 + s.position * 0.22],
      ],
      "ap-handle",
    )}${display(-20, 24.2, 10, 30, 10, `${Math.round(s.processProgress ?? 0)}%`)}${steam(4, 7, 62, s.open && (s.processProgress ?? 0) > 85)}${pipe(
      [
        [28, -20, 10],
        [39, -20, 10],
        [39, -20, 37],
      ],
      false,
      3,
    )}`;
  }
  const angle = (s.position * 0.9 * Math.PI) / 180;
  const depth = 52 * Math.sin(angle);
  const height = 52 * Math.cos(angle);
  return svg`${baseCabinet(width, 44, 77)}${aperture(-28, 22.5, 13, 56, 52, content, id + "-wash-inset")}${polygon3(
    [
      [-29, 23, 12],
      [29, 23, 12],
      [29, 23 + depth, 12 + height],
      [-29, 23 + depth, 12 + height],
    ],
    "ap-dishwasher-door",
  )}${line3(
    [
      [-20, 24 + depth, 7 + height],
      [20, 24 + depth, 7 + height],
    ],
    "ap-handle",
  )}${s.position > 30 ? shelf(-23, 24 + depth * 0.2, 13 + height * 0.3, 46, 16) : svg``}${display(-24, 22.5, 68, 35, 9, `${Math.round(s.processProgress ?? 0)}%`)}${vent(-24, 22.5, 6, 48, 3)}`;
}
function refrigeration(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const chest = d.id === "freezer";
  const room = d.id === "cold_room_controller";
  const displayCase = d.id === "refrigerated_display_case";
  const blast = d.id === "blast_chiller";
  const w = room ? 86 : displayCase ? 96 : 60;
  const depth = room ? 64 : 42;
  const h = chest ? 48 : 92;
  const cooling = s.active && s.processPhase === "cooling";
  const readout =
    s.temperature === undefined ? "—" : `${Math.round(s.temperature)}°`;
  if (chest) {
    const a = (s.position * 0.9 * Math.PI) / 180;
    const y = -25;
    return svg`${baseCabinet(80, 50, 42)}<defs><clipPath id="${id}-chest-inset">${polygon3(
      [
        [-35, -20, 47],
        [35, -20, 47],
        [35, 20, 47],
        [-35, 20, 47],
      ],
    )}</clipPath></defs><g clip-path="url(#${id}-chest-inset)">${box(-35, -19, 12, 70, 37, 28, "ap-cold-cavity")}${shelf(-31, -11, 27, 62, 22)}${[-19, 5, 23].map((x) => box(x, 1, 29, 12, 13, 8, "ap-frozen-pack"))}</g>${polygon3(
      [
        [-40, y, 49],
        [40, y, 49],
        [40, y + 50 * Math.cos(a), 49 + 50 * Math.sin(a)],
        [-40, y + 50 * Math.cos(a), 49 + 50 * Math.sin(a)],
      ],
      "ap-freezer-lid",
    )}${line3(
      [
        [-12, y + 49 * Math.cos(a), 49 + 49 * Math.sin(a)],
        [12, y + 49 * Math.cos(a), 49 + 49 * Math.sin(a)],
      ],
      "ap-handle",
    )}${display(-30, 25.5, 27, 23, 9, readout)}${vent(8, 25.5, 10, 25, 12)}${air(21, 28, 31, 9, cooling, true)}`;
  }
  return svg`${baseCabinet(w, depth, h)}${
    room
      ? svg`${[-30, -10, 10, 30].map((x) =>
          line3(
            [
              [x, -depth / 2, h + 4],
              [x, depth / 2, h + 4],
            ],
            "ap-panel-seam",
          ),
        )}`
      : svg``
  }${aperture(-w / 2 + 5, depth / 2 + 0.1, 12, w - 10, h - 16, svg`${box(-w / 2 + 5, -depth / 2 + 5, 12, w - 10, depth - 7, h - 16, "ap-cold-cavity")}${[23, 44, 65].map((z, i) => svg`${shelf(-w / 2 + 8, -6, z, w - 16, depth / 2 + 3)}${blast ? box(-w / 2 + 10, -4, z + 2, w - 20, 19, 2, "ap-tray") : room ? box(-w / 2 + 12, -3, z + 2, 17, 18, 12, "ap-crate") : displayCase ? [-32, -16, 0, 16, 32].map((x) => svg`${cylinder(x, 11, z + 2, 3.5, 12, "ap-bottle")}${cylinder(x, 11, z + 14, 2, 3, "ap-bottle-cap")}`) : [-12, 9].map((x) => box(x, 6, z + 2, 12, 12, 10, i % 2 ? "ap-carton" : "ap-produce"))}`)}${blast || room ? svg`${fan(0, depth / 2 - 4, 79, 9, cooling, 65)}${vent(-w / 2 + 10, depth / 2 - 3, 75, 15, 10)}` : svg``}`, id + "-cold-inset")}${displayCase ? svg`${hingedDoor(-w / 2 + 3, depth / 2 + 0.8, 16, (w - 6) / 2, h - 21, s.position, true)}${hingedDoor(0, depth / 2 + 0.5, 16, (w - 6) / 2, h - 21, 0, true)}` : hingedDoor(-w / 2 + 3, depth / 2 + 0.8, 10, w - 6, h - 9, s.position, false, !room && !blast, readout)}${displayCase ? display(-18, depth / 2 + 2, 84, 27, 8, readout) : svg``}${vent(-w / 2 + 7, depth / 2 + 1, 6, w - 14, 3)}${air(-w / 2 + 13, depth / 2 - 1, 75, w - 26, cooling, true)}${blast ? svg`${cylinder(-23, 18, 2, 3, 3, "ap-caster")}${cylinder(23, 18, 2, 3, 3, "ap-caster")}` : svg``}`;
}
function iceMachine(s: DeviceVisualState, id: string) {
  const p = s.processProgress ?? 0;
  const harvest = s.active && s.processPhase === "harvesting";
  return svg`${baseCabinet(68, 46, 82)}${aperture(-28, 23.2, 16, 56, 55, svg`${box(-28, -14, 16, 56, 32, 53, "ap-cavity")}${box(-25, -12, 49, 50, 4, 21, "ap-evaporator")}${Array.from({ length: 18 }, (_, i) => box(-23 + (i % 6) * 8, -6, 51 + Math.floor(i / 6) * 6, 6, 5, 4, "ap-ice-crystal"))}${Array.from({ length: 12 }, (_, i) => box(-23 + (i % 6) * 8, 10, 17 + Math.floor(i / 6) * 6, 6, 6, 5, "ap-ice-cube"))}<g class="ap-harvest ${harvest ? "ap-dropping" : ""}">${[-15, -3, 11].map((x, i) => svg`<g style="--ap-delay:${i * -0.25}s">${box(x, 9, 48, 7, 7, 6, "ap-ice-cube")}</g>`)}</g>`, id + "-ice-inset")}${front(-29, 23.5, 16, svg`<path class="ap-bin-window" d="M0 0h58v26H0Z"/><path class="ap-reflection" d="M4 4l17 17"/>`)}${(() => {
    const a = (s.position * 0.85 * Math.PI) / 180;
    const y = 24 + 12 * Math.sin(a);
    const z = 55 - 12 * Math.cos(a);
    return svg`${polygon3(
      [
        [-30, y, z],
        [30, y, z],
        [30, 24, 55],
        [-30, 24, 55],
      ],
      "ap-bin-flap",
    )}${line3(
      [
        [-13, y, z + 3],
        [13, y, z + 3],
      ],
      "ap-handle",
    )}`;
  })()}${vent(-27, 24, 7, 54, 7)}${display(-25, 24, 74, 37, 9, `${Math.round(p)}%`)}${led(24, 24, 78, s.active)}`;
}
function cooking(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const micro = d.id === "microwave_oven";
  const fryer = d.id === "air_fryer";
  const on = s.active;
  const heat = s.heating;
  if (fryer) {
    return svg`${baseCabinet(56, 42, 65)}${aperture(-23, 21.3, 13, 46, 34, svg`${fan(0, 18, 43, 11, on, 65)}`, id + "-fryer-inset")}${box(-24, 13 + s.position * 0.26, 10, 48, 12, 27, "ap-fryer-basket")}${shelf(-20, 16 + s.position * 0.26, 32, 40, 9)}${[-12, 0, 12].map((x) => box(x, 20 + s.position * 0.26, 34, 7, 5, 3, "ap-food"))}${polygon3(
      [
        [-25, 26 + s.position * 0.26, 10],
        [25, 26 + s.position * 0.26, 10],
        [25, 26 + s.position * 0.26, 45],
        [-25, 26 + s.position * 0.26, 45],
      ],
      "ap-fryer-front",
    )}${line3(
      [
        [-10, 27 + s.position * 0.26, 24],
        [10, 27 + s.position * 0.26, 24],
      ],
      "ap-handle",
    )}${vent(-19, 22, 7, 38, 3)}${display(-17, 22, 54, 31, 8, s.temperature === undefined ? "—" : `${Math.round(s.temperature)}°`)}${air(28, 1, 44, 8, on)}${led(21, 22, 58, !!heat)}`;
  }
  const w = micro ? 85 : 66;
  const h = micro ? 53 : 76;
  const frontY = 24;
  return svg`${baseCabinet(w, 48, h)}${aperture(
    -w / 2 + 5,
    24.2,
    14,
    w - (micro ? 25 : 10),
    h - 28,
    svg`${box(-w / 2 + 6, -15, 15, w - (micro ? 26 : 12), 37, h - 30, "ap-oven-cavity")}${
      micro
        ? svg`${cylinder(-9, 8, 18, 20, 1.5, "ap-turntable")}${(() => {
            const [px, py] = project([-9, 8, 20]);
            return svg`<g transform="matrix(.92 .46 -.92 .46 ${px} ${py})"><g class="ap-turntable-rotor ${on ? "ap-turntable-moving" : ""}"><circle class="ap-turntable-plate" r="16"/><ellipse class="ap-food" cx="4" cy="2" rx="7" ry="5"/><circle class="ap-turntable-mark" cx="-11" cy="3" r="1"/></g></g>`;
          })()}${front(-9, 8, 22, svg`<ellipse class="ap-food" rx="8" ry="3"/>`)}${vent(17, 18, 25, 5, 17)}`
        : svg`${shelf(-26, -6, 24, 52, 25)}${shelf(-26, -6, 39, 52, 25)}${fan(0, 20, 47, 10, on, 55)}<g class="ap-element ${heat ? "ap-heating" : ""}">${line3(
            [
              [-23, 4, 62],
              [-23, 17, 62],
              [0, 17, 62],
              [0, 4, 62],
              [23, 4, 62],
              [23, 17, 62],
            ],
            "ap-element-line",
          )}</g>`
    }`,
    id + "-cook-inset",
  )}${
    micro
      ? hingedDoor(
          -w / 2 + 3,
          frontY + 0.8,
          12,
          w - 24,
          h - 15,
          s.position,
          true,
        )
      : svg`${(() => {
          const a = (s.position * 0.9 * Math.PI) / 180;
          return polygon3(
            [
              [-29, frontY + 0.8, 11],
              [29, frontY + 0.8, 11],
              [29, frontY + 54 * Math.sin(a), 11 + 54 * Math.cos(a)],
              [-29, frontY + 54 * Math.sin(a), 11 + 54 * Math.cos(a)],
            ],
            "ap-oven-door",
          );
        })()}${s.position < 2 ? front(-24, frontY + 1, 18, svg`<rect class="ap-oven-window ${on ? "ap-cavity-lit" : ""}" width="48" height="40"/><path class="ap-reflection" d="M4 4l32 29"/><path class="ap-handle" d="M0 47h48"/>`) : svg``}`
  }${display(micro ? 24 : -20, frontY + 1, micro ? 32 : 68, micro ? 14 : 30, 8, micro ? (s.example || s.valueUnit === "W" ? `${Math.round(s.value)}W` : "—") : s.temperature === undefined ? "—" : `${Math.round(s.temperature)}°`)}${micro ? front(31, frontY + 1, 22, svg`<circle class="ap-dial" r="4"/>`) : front(23, frontY + 1, 72, svg`<circle class="ap-dial" r="4"/>`)}${vent(-w / 2 + 7, frontY + 1, 7, w - 14, 3)}${led(micro ? 31 : 23, frontY + 1, micro ? 14 : 64, on)}`;
}
function hob(s: DeviceVisualState) {
  const present = s.example
    ? s.period !== "ap_pan_absent"
    : s.mode !== "ap_pan_absent";
  return svg`${box(-49, -33, 4, 98, 66, 5, "ap-hob-glass")}${[-25, 24].flatMap(
    (x) =>
      [-16, 15].map(
        (y) =>
          svg`${cylinder(x, y, 10, 13, 0, "ap-zone")}${line3(
            [
              [x - 3, y, 10],
              [x + 3, y, 10],
            ],
            "ap-zone-mark",
          )}${line3(
            [
              [x, y - 3, 10],
              [x, y + 3, 10],
            ],
            "ap-zone-mark",
          )}`,
      ),
  )}${
    present
      ? svg`${cylinder(-25, 15, 10, 15, 12, "ap-pan")}${cylinder(-25, 15, 23, 14, 0, "ap-pan-liquid")}${pipe(
          [
            [-11, 15, 18],
            [10, 15, 18],
          ],
          false,
          3,
        )}${steam(-25, 15, 25, s.active && s.speed > 0)}`
      : svg``
  }${display(20, 33.2, 5, 19, 5, s.active ? `${s.speed}` : "0")}${led(43, 33.2, 7, s.active)}`;
}
function hood(s: DeviceVisualState) {
  return svg`${box(-15, -19, 64, 30, 26, 40, "ap-stainless")}${polygon3(
    [
      [-16, -20, 73],
      [16, -20, 73],
      [49, 21, 47],
      [-49, 21, 47],
    ],
    "ap-hood-canopy",
  )}${box(-49, -23, 43, 98, 48, 5, "ap-stainless")}${[-30, -10, 10, 30].map(
    (x) =>
      svg`${line3(
        [
          [x, -15, 42],
          [x, 17, 42],
        ],
        "ap-baffle",
      )}${line3(
        [
          [x + 4, -15, 42],
          [x + 4, 17, 42],
        ],
        "ap-baffle",
      )}`,
  )}${topFan(0, 0, 45, 11, s.active, s.speed)}${front(-7, 25, 44, svg`<rect class="ap-lamp ${s.example ? (s.tilt ? "ap-lamp-on" : "") : ""}" width="14" height="3"/>`)}<g class="ap-air ${s.active ? "ap-airflow" : ""}">${[
    -25, 0, 25,
  ].map((x) =>
    line3(
      [
        [x, 5, 13],
        [x, 5, 30],
        [x * 0.3, 0, 44],
      ],
      "ap-air-line",
    ),
  )}</g>${
    s.example && s.tilt
      ? polygon3(
          [
            [-28, 19, 42],
            [28, 19, 42],
            [48, 39, 6],
            [-48, 39, 6],
          ],
          "ap-task-light",
        )
      : svg``
  }${display(26, 25.5, 44, 14, 4, s.active ? `${Math.round(s.speed)}%` : "0")}`;
}
function kettle(s: DeviceVisualState, id: string) {
  const hot =
    (s.valueUnit === "°F"
      ? (((s.temperature ?? 0) - 32) * 5) / 9
      : (s.temperature ?? 0)) >= 90;
  const boil = s.active && s.heating && hot;
  const fill = s.hasLevel ? s.level : 0;
  return svg`<defs><clipPath id="${id}-kettle"><rect x="-24" y="-57" width="48" height="48" rx="8"/></clipPath></defs>${cylinder(0, 0, 2, 28, 5, "ap-kettle-base")}${cylinder(0, 0, 8, 24, 46, "ap-kettle-glass")}${cylinder(0, 0, 8, 23, 44, "ap-kettle-water", fill / 100)}${cylinder(0, 0, 8, 24, 7, "ap-stainless")}${cylinder(0, 0, 54, 24, 5, "ap-kettle-lid")}${pipe(
    [
      [24, 0, 46],
      [38, 0, 46],
      [38, 0, 17],
      [24, 0, 17],
    ],
    false,
    5,
  )}${polygon3(
    [
      [-23, -1, 41],
      [-37, -1, 53],
      [-30, -1, 52],
      [-20, -1, 49],
    ],
    "ap-kettle-spout",
  )}${front(-4, 23, 20, svg`${[0, 1, 2, 3].map((i) => svg`<path class="ap-level-mark" d="M0 ${i * 7}h5"/>`)}`)}${boil ? front(0, 22, 26, svg`<g class="ap-bubbles">${[-12, -4, 4, 12].map((x, i) => svg`<circle cx=${x} cy="0" r="1.3" style="--ap-delay:${i * -0.2}s"/>`)}</g>`) : svg``}${steam(-34, 0, 53, hot && s.active)}${display(-14, 20, 3, 27, 5, s.temperature === undefined ? "—" : `${Math.round(s.temperature)}°`)}${led(22, 15, 7, s.active)}`;
}
function cup(x: number, y: number, z: number, fill: number, coffee = false) {
  return svg`${cylinder(x, y, z, 9, 14, "ap-cup")}${cylinder(x, y, z + 1, 8, 12, coffee ? "ap-coffee-fill" : "ap-water-fill", fill / 100)}${cylinder(x, y, z + 14, 9, 0, "ap-cup-rim")}${pipe(
    [
      [x + 8, y, z + 12],
      [x + 13, y, z + 12],
      [x + 13, y, z + 4],
      [x + 8, y, z + 4],
    ],
    false,
    1.5,
  )}`;
}
function dispensers(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const coffee = d.id === "coffee_machine";
  const vending = d.id === "vending_machine";
  const p = s.processProgress ?? 0;
  const tap = coffee
    ? 0
    : s.metric === "ap_hot"
      ? 9
      : s.metric === "ap_ambient"
        ? 0
        : -9;
  if (vending) {
    const selected =
      s.metric === "ap_product_b" ? 1 : s.metric === "ap_product_c" ? 2 : 0;
    const release = s.active && s.processPhase === "releasing";
    const drop = release ? Math.min(1, Math.max(0, (p - 45) / 25)) : 0;
    return svg`${baseCabinet(75, 43, 99)}${aperture(-32, 21.5, 27, 46, 68, svg`${box(-32, -14, 27, 45, 34, 68, "ap-cavity")}${[36, 58, 80].map((z, row) => svg`${shelf(-29, -5, z, 40, 22)}${[0, 1, 2].map((col) => svg`${box(-26 + col * 12, 8, z + 2, 8, 8, 12, row % 2 ? "ap-product-mint" : "ap-product-cream")}${front(-22 + col * 12, 20, z + 4, svg`<g class="ap-vend-coil ${release && col === selected && row === 0 ? "ap-vend-turn" : ""}"><path d="M-3-2q6-6 6 0t-6 0t6 0"/></g>`)}`)}`)}`, id + "-vend-inset")}${front(-32, 22, 27, svg`<rect class="ap-vending-glass" width="46" height="68"/><path class="ap-reflection" d="M4 3l34 58"/>`)}${display(19, 22, 77, 13, 12, `${selected + 1}`)}${front(21, 22, 55, svg`${Array.from({ length: 9 }, (_, i) => svg`<rect class="ap-key" x=${(i % 3) * 4} y=${Math.floor(i / 3) * 4} width="2.5" height="2.5"/>`)}`)}${front(-28, 23, 10, svg`<rect class="ap-pickup" width="39" height="12"/><path class="ap-handle" d="M8 10h23"/>`)}${release ? box(-26 + selected * 12, 24, 32 - drop * 20, 8, 8, 12, "ap-vend-drop") : svg``}${s.processPhase === "pickup" || s.processPhase === "complete" ? box(-16, 24, 12, 8, 8, 12, "ap-product-mint") : svg``}${vent(18, 23, 10, 15, 20)}`;
  }
  const pouring =
    s.active && ["brewing", "dispensing"].includes(s.processPhase ?? "");
  const filled = s.example ? s.floor : 0;
  return svg`${baseCabinet(coffee ? 62 : 48, 40, coffee ? 68 : 89)}${
    coffee
      ? svg`${cylinder(-10, -4, 72, 12, 10, "ap-bean-hopper")}${[-15, -8, -3].map((x) => cylinder(x, -4, 74, 2, 2, "ap-bean"))}${cylinder(-10, -4, 82, 12, 2, "ap-hopper-lid")}${aperture(-25, 20.2, 16, 50, 31, svg``, id + "-coffee-inset")}${cylinder(-3, 15, 45, 10, 6, "ap-group-head")}${pipe(
          [
            [5, 20, 44],
            [25, 20, 44],
          ],
          false,
          3,
        )}${pipe(
          [
            [21, 19, 46],
            [27, 24, 28],
          ],
          false,
          2,
        )}${display(-22, 20.5, 57, 28, 8, `${Math.round(p)}%`)}`
      : svg`${cylinder(0, -1, 94, 14, 28, "ap-water-bottle", s.hasLevel ? s.level / 100 : 0)}${cylinder(0, -1, 89, 6, 6, "ap-bottle-neck")}${aperture(-18, 20.2, 23, 36, 32, svg``, id + "-water-inset")}${[
          -9, 0, 9,
        ].map(
          (x, i) =>
            svg`${pipe(
              [
                [x, 16, 54],
                [x, 23, 54],
                [x, 23, 48],
              ],
              false,
              2,
            )}${led(x, 17, 60, ["ap_cold", "ap_ambient", "ap_hot"].includes(s.metric ?? "") && i === (s.metric === "ap_hot" ? 2 : s.metric === "ap_ambient" ? 1 : 0))}`,
        )}`
  }${box(-23, 16, 9, 46, 19, 3, "ap-drip-tray")}${vent(-18, 34.5, 10, 36, 2)}${cup(tap, 24, 13, filled, coffee)}${
    pouring
      ? line3(
          [
            [tap, 24, coffee ? 42 : 49],
            [tap, 24, 27],
          ],
          coffee ? "ap-coffee-stream" : "ap-water-stream",
        )
      : svg``
  }${coffee ? steam(0, 24, 27, pouring) : svg``}${vent(-20, 21, 4, 40, 3)}`;
}
export function realisticApplianceVisual(
  d: CatalogDevice,
  s: DeviceVisualState,
  instanceId: string,
) {
  if (!isAppliance(d)) return undefined;
  const id = `ap-${instanceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const drawing = ["washing_machine", "clothes_dryer"].includes(d.id)
    ? laundry(d, s, id)
    : ["dishwasher", "commercial_warewasher"].includes(d.id)
      ? dishwashing(d, s, id)
      : [
            "refrigerator",
            "freezer",
            "cold_room_controller",
            "refrigerated_display_case",
            "blast_chiller",
          ].includes(d.id)
        ? refrigeration(d, s, id)
        : d.id === "ice_machine"
          ? iceMachine(s, id)
          : ["oven", "microwave_oven", "air_fryer"].includes(d.id)
            ? cooking(d, s, id)
            : d.id === "induction_hob"
              ? hob(s)
              : d.id === "smart_cooker_hood"
                ? hood(s)
                : d.id === "smart_kettle"
                  ? kettle(s, id)
                  : dispensers(d, s, id);
  return svg`<g transform="translate(140 105) scale(1.12) translate(-140 -105)" class="realistic-appliances ${s.available ? "" : "ap-unavailable"}" data-appliance-device=${d.id} data-phase=${s.processPhase ?? "unknown"} data-operating=${s.active} data-door-position=${s.position}>${drawing}</g>`;
}
