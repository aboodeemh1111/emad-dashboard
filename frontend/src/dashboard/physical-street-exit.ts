import { svg } from "lit";
import type {
  DeviceVisualState,
  ExitSignDirection,
} from "./device-visual-state";
import {
  box,
  circleFace,
  line3,
  pipe,
  polygon3,
  project,
  type Point3,
} from "./isometric-primitives";
import { fluidShell, fluidTube, fluidBand } from "./physical-water";

function planeRect(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  r = 3,
): Point3[] {
  const corners: [[number, number], number][] = [
    [[x + r, y + r], Math.PI],
    [[x + w - r, y + r], Math.PI * 1.5],
    [[x + w - r, y + d - r], 0],
    [[x + r, y + d - r], Math.PI * 0.5],
  ];
  return corners.flatMap(([[cx, cy], a]) =>
    Array.from(
      { length: 5 },
      (_, i) =>
        [
          cx + Math.cos(a + (i * Math.PI) / 8) * r,
          cy + Math.sin(a + (i * Math.PI) / 8) * r,
          z,
        ] as Point3,
    ),
  );
}
function loft(low: Point3[], high: Point3[], cls: string) {
  return svg`<g class=${cls}>${low.map((p, i) => polygon3([p, low[(i + 1) % low.length], high[(i + 1) % low.length], high[i]], "street-cast-side"))}${polygon3(high, "street-cast-top")}</g>`;
}
const screw = (p: Point3, r = 1.2) => {
  const [x, y] = project(p);
  return svg`<g class="public-light-screw"><circle cx=${x} cy=${y} r=${r}/><path d=${`M${x - r * 0.6} ${y - r * 0.25}l${r * 1.2} ${r * 0.5}`}/></g>`;
};
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
const output = (s: DeviceVisualState) =>
  (s.hasLightOutput ?? s.hasTelemetry) &&
  s.available &&
  Number.isFinite(s.level)
    ? Math.max(0, Math.min(100, s.level)) / 100
    : 0;

export function streetlightVisual(s: DeviceVisualState, id: string) {
  const level = output(s);
  // Illustrative perceptual output, not a lux or electrical-power estimate.
  // Power/feedback gates the output; `active` only schedules transitions.
  const emission = Math.sqrt(level);
  const night = s.lightEnvironment === "night";
  const roadId = `${id}-road-surface`;
  const glowId = `${id}-optic-glow`;
  const road: Point3[] = [
    [-70, -2, -0.5],
    [73, -2, -0.5],
    [73, 48, -0.5],
    [-70, 48, -0.5],
  ];
  const headMount: Point3 = [8, -12, 106];
  const headScale = 0.6;
  const opticCenter: Point3 = [34.5, -11, 106];
  // The footprint follows the same scaled optics as the visible luminaire,
  // then throws forward across the curb onto the receiving road plane.
  const poolCenter = [
    headMount[0] + (opticCenter[0] - headMount[0]) * headScale,
    headMount[1] + (opticCenter[1] - headMount[1]) * headScale + 29,
  ];
  const opticalRim: Point3[] = [
    [10, 2.6, 105.4],
    [59, 2.6, 105.4],
    [63, -1.4, 105.4],
    [63, -19, 105.4],
  ];
  const poolId = `${id}-road-pool`;
  const lensId = `${id}-road-lens`;
  const pole: [number, number] = [-32, -12];
  const arm = Array.from({ length: 17 }, (_, i) => {
    const a = Math.PI - (i * Math.PI) / 32;
    return [-20 + 12 * Math.cos(a), -12, 94 + 12 * Math.sin(a)] as Point3;
  });
  const plinth = planeRect(-45, -23, 0, 26, 22, 2);
  const base = planeRect(-42, -21, 2.8, 20, 18, 2);
  const glass = planeRect(6, -24, 106, 57, 26, 4);
  const apron = planeRect(4, -26, 107, 60, 29, 5);
  const body = planeRect(4, -25, 112, 59, 27, 5);
  const crown = planeRect(8, -23, 115, 50, 22, 5);
  const [poolX, poolY] = project([0, 0, -0.5]);
  const [headX, headY] = project(headMount);
  return svg`<g class="streetlight-assembly ${night ? "street-night" : "street-day"}" data-output-known=${s.hasLightOutput ?? s.hasTelemetry} data-output=${level.toFixed(3)} data-environment=${s.lightEnvironment ?? "neutral"}>
 <defs>
 <clipPath id=${roadId} clipPathUnits="userSpaceOnUse">${polygon3(road)}</clipPath>
 <filter id=${glowId} x="-30%" y="-100%" width="160%" height="300%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.5"/></filter>
 <radialGradient id=${poolId} cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="var(--fixture-color)" stop-opacity=".94"/><stop offset=".22" stop-color="var(--fixture-color)" stop-opacity=".82"/><stop offset=".5" stop-color="var(--fixture-color)" stop-opacity=".5"/><stop offset=".78" stop-color="var(--fixture-color)" stop-opacity=".16"/><stop offset="1" stop-color="var(--fixture-color)" stop-opacity="0"/></radialGradient>
 <linearGradient id=${lensId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--fixture-color)"/><stop offset=".5" stop-color="color-mix(in srgb, var(--fixture-color) 35%, white)"/><stop offset="1" stop-color="var(--fixture-color)"/></linearGradient></defs>
 <g class="street-context">${polygon3(road, "street-asphalt")}${polygon3(
   [
     [-70, -30, 0],
     [73, -30, 0],
     [73, -2, 0],
     [-70, -2, 0],
   ],
   "street-pavement",
 )}${box(-70, -3, 0, 143, 2.5, 1.5, "street-curb")}${[-58, -29, 0, 29, 58].map(
   (x) =>
     line3(
       [
         [x, -29, 0.1],
         [x, -3, 0.1],
       ],
       "street-paving-joint",
     ),
 )}${[-57, -22, 13, 48].map((x) =>
   line3(
     [
       [x, 29, -0.3],
       [x + 16, 29, -0.3],
     ],
     "street-lane-mark",
   ),
 )}</g>
 <g class="street-road-illumination" clip-path=${`url(#${roadId})`}><g class="street-light-pool" data-intensity=${level.toFixed(3)} opacity=${emission * (night ? 1 : 0.78)} transform=${`matrix(.92 .46 -.92 .46 ${poolX} ${poolY})`}><ellipse cx=${poolCenter[0]} cy=${poolCenter[1]} rx="69" ry="34" fill=${`url(#${poolId})`}/><ellipse cx=${poolCenter[0] + 3} cy=${poolCenter[1] + 1} rx="36" ry="19" fill=${`url(#${poolId})`} opacity=".52"/></g></g>
 <g class="street-foundation">${loft(
   plinth,
   plinth.map(([x, y]) => [x, y, 2.5] as Point3),
   "street-concrete",
 )}${loft(
   base,
   base.map(([x, y]) => [x, y, 4.2] as Point3),
   "street-baseplate",
 )}${[
   [-39, -18],
   [-25, -18],
   [-39, -7],
   [-25, -7],
 ].map(
   ([x, y]) =>
     svg`${fluidTube("z", [x, y, 0], 4.2, 6, 1.9, "lt-nickel")}${fluidTube("z", [x, y, 0], 6, 8, 1.1, "lt-nickel")}${screw([x, y, 8], 0.9)}`,
 )}</g>
 ${fluidShell(
   "z",
   [pole[0], pole[1], 0],
   [
     [4.2, 4],
     [10, 3.8],
     [94, 2.1],
   ],
   "street-galvanized",
 )}${fluidBand(pole[0], pole[1], 10, 3.8, "street-pole-seam")}${pane(-34, -8.3, 14, 4, 17, "street-access-door")}${screw([-32, -8.1, 17], 0.6)}${line3(
   [
     [-32, -8, 28],
     [-32, -8, 30],
   ],
   "street-door-slot",
 )}${pipe(arm, false, 3.4)}${pipe(
   [
     [-20, -12, 106],
     [8, -12, 106],
   ],
   false,
   3.4,
 )}<g class="street-luminaire" transform=${`translate(${headX} ${headY}) scale(${headScale}) translate(${-headX} ${-headY})`}> ${fluidTube("x", [0, -12, 106], 0, 11, 3.7, "street-spigot")}${screw([7, -8.2, 107.5], 0.8)}
 <g class="street-optical-tray">${polygon3(glass, "street-flat-glass")}${line3([...glass, glass[0]], "street-glass-gasket")}${Array.from(
   { length: 10 },
   (_, i) => {
     const x = 12 + (i % 5) * 9.7;
     const y = i < 5 ? -17 : -7;
     return polygon3(planeRect(x, y, 105.7, 6.5, 5, 1.7), "street-tir-optic");
   },
 )}</g>
 ${loft(apron, body, "street-lower-casting")}${loft(body, crown, "street-upper-casting")}${line3([...body, body[0]], "street-cover-seam")}${line3(
   [
     [21, -22, 114.2],
     [21, -2, 114.2],
   ],
   "street-driver-hatch",
 )}${line3(
   [
     [9, -18, 115.3],
     [16, -18, 115.3],
     [16, -10, 115.3],
   ],
   "street-hinge-mark",
 )}${[33, 49].map((x) => svg`${box(x, 1.5, 108.2, 3, 1.8, 2, "street-latch")}${screw([x + 1.5, 3.4, 109.3], 0.6)}`)}
 <g class="street-source-glow" opacity=${emission} filter=${`url(#${glowId})`}>${line3(opticalRim, "street-optic-halo")}</g>
 <g class="street-optic-edge" data-emitter-intensity=${level.toFixed(3)} opacity=${emission}><g fill=${`url(#${lensId})`}>${pane(10, 2.6, 104.6, 49, 2, "street-emitting-glass")}</g>${line3(opticalRim, "street-optic-rim")}</g>
 ${fluidTube("z", [13, -13, 0], 115, 117, 3.1, "street-photocell")}${fluidShell(
   "z",
   [13, -13, 0],
   [
     [117, 3.4],
     [120, 2.5],
     [120.5, 0.1],
   ],
   "street-photocell-dome",
 )}${line3(
   [
     [10, -12, 116],
     [16, -12, 116],
   ],
   "street-photocell-seam",
 )}
</g>
 </g>`;
}

const arrowPath = (d: ExitSignDirection) =>
  d === "left"
    ? "M104 27H81m8-8-8 8 8 8"
    : d === "right"
      ? "M79 27h23m-8-8 8 8-8 8"
      : d === "up"
        ? "M91 39V15m-8 8 8-8 8 8"
        : "M91 14v25m-8-8 8 8 8-8";
export function exitSignVisual(s: DeviceVisualState, id: string) {
  const level = output(s);
  const known = s.hasLightOutput ?? s.hasTelemetry;
  const direction = s.exitDirection;
  const lit = level > 0;
  const panelId = `${id}-exit-panel`;
  const haloId = `${id}-exit-halo`;
  const [x, y] = project([-56, 5.2, 84]);
  const [haloX, haloY] = project([0, 6, 56]);
  const mains = s.mode === "light_mains";
  const backup = s.mode === "light_backup";
  const pressing = s.processPhase === "test" && (s.processProgress ?? 100) < 12;
  return svg`<g class="exit-sign-assembly ${lit ? "exit-illuminated" : "exit-unlit"} ${known ? "exit-output-known" : "exit-output-unknown"}" data-output-known=${known} data-output=${level.toFixed(3)} data-direction=${direction ?? "unknown"}>
 <defs><linearGradient id=${panelId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#21784d"/><stop offset=".5" stop-color="#168252"/><stop offset="1" stop-color="#176d46"/></linearGradient><radialGradient id=${haloId}><stop offset="0" stop-color="#88e5b8" stop-opacity=".18"/><stop offset=".65" stop-color="#88e5b8" stop-opacity=".06"/><stop offset="1" stop-color="#88e5b8" stop-opacity="0"/></radialGradient></defs>
 <ellipse class="exit-light-spill" cx=${haloX} cy=${haloY} rx="79" ry="53" fill=${`url(#${haloId})`} opacity=${level}/>
 ${box(-41, -11, 110, 82, 19, 4, "exit-ceiling-canopy")}${[-34, 34].map((v) => svg`${screw([v, 3, 114], 1)}${fluidTube("z", [v, 0, 0], 91, 110, 1.1, "exit-suspension")}${fluidTube("z", [v, 0, 0], 89, 93, 2, "lt-nickel")}`)}
 ${box(-60, -4, 84, 120, 9, 8, "exit-led-extrusion")}${line3(
   [
     [-57, 5.2, 86],
     [57, 5.2, 86],
   ],
   "exit-extrusion-seam",
 )}${[-55, 55].map((v) => screw([v, 5.4, 88], 0.8))}${box(-61, -4, 84, 2, 9, 8, "exit-endcap")}${box(59, -4, 84, 2, 9, 8, "exit-endcap")}
 ${pane(-57, 2.8, 28, 114, 56, "exit-acrylic-edge")}${pane(-56, 4.8, 29, 112, 55, "exit-panel-unlit")}
 <g transform=${`matrix(.92 .46 0 1 ${x} ${y})`}>
 <rect class="exit-panel-light" x="0" y="0" width="112" height="55" rx="1" fill=${`url(#${panelId})`} opacity=${level}/>
 <rect class="exit-panel-border" x="2" y="2" width="108" height="51" rx=".6"/>
 <g class="exit-pictogram"><g class="exit-egress-symbol" transform=${direction === "right" ? "translate(79 0) scale(-1 1)" : ""}><g class="exit-door-symbol"><path d="M8 47V8h24v39H8Z"/><path class="exit-door-opening" d="M12 43V12h16v31Z"/></g><g class="exit-running-person" transform="translate(100 0) scale(-1 1)"><circle cx="51" cy="11" r="4.1"/><path d="m44 18 10-2 9 7 8 1-1 5-10-1-7-5-2 10 11 9-3 5-15-12 1-8-7 8-9 1v-5l7-1 8-12Z"/><path d="m45 33 5 4-7 11H32v-5h8Z"/></g></g>${direction ? svg`<path class="exit-direction-arrow" data-direction=${direction} d=${arrowPath(direction)}/>` : svg``}</g>
 <path class="exit-top-light-guide" d="M2 1H110" opacity=${level}/>
 </g>
 ${line3(
   [
     [-57, 5.2, 29],
     [57, 5.2, 29],
   ],
   "exit-bottom-edge",
 )}${circleFace(43, 5.4, 88, 1.1, s.example || s.hasTelemetry ? (mains ? "exit-charge-indicator" : backup ? "exit-backup-indicator" : "exit-indicator-off") : "exit-indicator-off")}${circleFace(50, 5.5 - (pressing ? 0.7 : 0), 88, 1.4, "exit-test-plunger")}
 </g>`;
}
