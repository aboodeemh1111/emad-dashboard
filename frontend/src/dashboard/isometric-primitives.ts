import { svg } from "lit";

export type Point3 = readonly [number, number, number];
export const project = ([x, y, z]: Point3): [number, number] => [
  140 + (x - y) * 0.92,
  128 + (x + y) * 0.46 - z,
];
const point = (p: Point3) =>
  project(p)
    .map((v) => Number(v.toFixed(2)))
    .join(",");
export const line3 = (points: readonly Point3[], cls = "iso-line") =>
  svg`<polyline class=${cls} points=${points.map(point).join(" ")}/>`;
export const polygon3 = (
  points: readonly Point3[],
  cls = "iso-front",
  style = "",
) =>
  svg`<polygon class=${cls} style=${style} points=${points.map(point).join(" ")}/>`;
export function box(
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  cls = "",
) {
  return svg`<g class="iso-box ${cls}">${polygon3(
    [
      [x + w, y, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x + w, y, z + h],
    ],
    "iso-side",
  )}${polygon3(
    [
      [x, y + d, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x, y + d, z + h],
    ],
    "iso-front",
  )}${polygon3(
    [
      [x, y, z + h],
      [x + w, y, z + h],
      [x + w, y + d, z + h],
      [x, y + d, z + h],
    ],
    "iso-top",
  )}</g>`;
}
export function cylinder(
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  cls = "",
  fill?: number,
) {
  const [cx, by] = project([x, y, z]);
  const [, ty] = project([x, y, z + h]);
  const rx = r * 1.3;
  const ry = r * 0.65;
  const liquid =
    fill === undefined ? undefined : Math.max(0, Math.min(1, fill));
  return svg`<g class="iso-cylinder ${cls}"><path class="iso-front" d="M${cx - rx} ${ty}a${rx} ${ry} 0 0 0 ${rx * 2} 0v${h}a${rx} ${ry} 0 0 1 ${-rx * 2} 0Z"/>
 ${liquid !== undefined ? svg`<path class="iso-liquid" style="transform:scaleY(${liquid});transform-origin:${cx}px ${by}px" d="M${cx - rx + 2} ${ty}a${rx - 2} ${ry - 1} 0 0 0 ${(rx - 2) * 2} 0V${by - 2}a${rx - 2} ${ry - 1} 0 0 1 ${-(rx - 2) * 2} 0Z"/><g class="liquid-level" style="transform:translateY(${h * (1 - liquid)}px)"><ellipse class="iso-water-surface" cx=${cx} cy=${ty} rx=${rx - 2} ry=${ry - 1}/><path class="water-ripple" d="M${cx - rx * 0.65} ${ty + 1}q${rx * 0.65} 4 ${rx * 1.3} 0"/></g>` : svg``}
 <ellipse class="iso-top tank-rim" cx=${cx} cy=${ty} rx=${rx} ry=${ry}/><path class="iso-seam" d="M${cx - rx} ${by}a${rx} ${ry} 0 0 0 ${rx * 2} 0"/></g>`;
}
export function pipe(points: readonly Point3[], flow = false, width = 8) {
  const pts = points.map(point).join(" ");
  return svg`<g class="iso-pipe"><polyline class="pipe-edge" points=${pts} style="stroke-width:${width + 2}px"/><polyline class="pipe-body" points=${pts} style="stroke-width:${width}px"/>${flow ? svg`<polyline class="flow-path" points=${pts}/>` : svg``}</g>`;
}
export function circleFace(
  x: number,
  y: number,
  z: number,
  r: number,
  cls = "iso-dark",
) {
  const [px, py] = project([x, y, z]);
  return svg`<g transform="matrix(.92 .46 0 -1 ${px} ${py})"><circle class=${cls} r=${r}/></g>`;
}
export function fan(
  x: number,
  y: number,
  z: number,
  r: number,
  active: boolean,
  speed = 50,
) {
  const [px, py] = project([x, y, z]);
  return svg`<g class="fan-housing" transform="matrix(.92 .46 0 -1 ${px} ${py})"><circle class="iso-dark" r=${r}/><circle class="fan-rim" r=${r * 0.9}/><g class="fan-rotor ${active ? "spinning" : ""}" style="--spin-duration:${Math.max(0.5, 4 - speed * 0.034)}s">${[0, 120, 240].map((angle) => svg`<path class="fan-blade" transform="rotate(${angle})" d="M0 0Q${r * 0.1} ${r} ${r * 0.65} ${r * 0.55}Q${r} ${r * 0.12} 0 0"/>`)}</g><circle class="iso-metal" r=${r * 0.14}/></g>`;
}
export function topFan(
  x: number,
  y: number,
  z: number,
  r: number,
  active: boolean,
  speed = 50,
) {
  const [px, py] = project([x, y, z]);
  return svg`<g transform="matrix(.92 .46 -.92 .46 ${px} ${py})"><circle class="iso-dark" r=${r}/><g class="fan-rotor ${active ? "spinning" : ""}" style="--spin-duration:${Math.max(0.5, 4 - speed * 0.034)}s">${[0, 90, 180, 270].map((angle) => svg`<path class="fan-blade" transform="rotate(${angle})" d="M0 0Q${r * 0.2} ${r} ${r * 0.8} ${r * 0.4}L${r * 0.7} 0Z"/>`)}</g><circle class="iso-metal" r="2"/></g>`;
}
export function grille(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  count = 6,
) {
  return svg`<g>${Array.from({ length: count }, (_, i) =>
    line3(
      [
        [x, y, z + (i * h) / count],
        [x + w, y, z + (i * h) / count],
      ],
      "iso-grille",
    ),
  )}</g>`;
}
export function display(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  label: string,
) {
  const [px, py] = project([x + w / 2, y, z + h / 2]);
  return svg`<g class="physical-display ${/[0-9]/.test(label) ? "numeric-display" : ""}">${polygon3(
    [
      [x, y, z],
      [x + w, y, z],
      [x + w, y, z + h],
      [x, y, z + h],
    ],
    "iso-screen",
  )}<text class="screen-label" x=${px} y=${py + 2} transform="rotate(26.565 ${px} ${py})">${label}</text></g>`;
}
export function ports(
  x: number,
  y: number,
  z: number,
  count: number,
  size = 5,
) {
  return svg`<g class="port-bank">${Array.from(
    { length: count },
    (_, i) =>
      svg`${polygon3(
        [
          [x + i * (size + 3), y, z],
          [x + i * (size + 3) + size, y, z],
          [x + i * (size + 3) + size, y, z + size],
          [x + i * (size + 3), y, z + size],
        ],
        "iso-port",
      )}<circle class="port-led blink-led" cx=${project([x + i * (size + 3) + size / 2, y, z - 3])[0]} cy=${project([x + i * (size + 3) + size / 2, y, z - 3])[1]} r="1"/>`,
  )}</g>`;
}
export function wheel(x: number, y: number, z: number, r = 6) {
  return svg`${circleFace(x, y, z, r, "iso-rubber")}${circleFace(x, y + 0.1, z, r * 0.4, "iso-metal")}`;
}
export function gauge(
  x: number,
  y: number,
  z: number,
  r: number,
  value: number,
) {
  const [px, py] = project([x, y, z]);
  const angle =
    ((Math.max(0, Math.min(100, value)) * 2.4 - 210) * Math.PI) / 180;
  return svg`<g transform="matrix(.92 .46 0 -1 ${px} ${py})"><circle class="gauge-face" r=${r}/><path class="gauge-scale" d="M${-r * 0.75} ${-r * 0.4}A${r * 0.85} ${r * 0.85} 0 1 0 ${r * 0.75} ${-r * 0.4}"/><line class="gauge-needle" x1="0" y1="0" x2=${Math.cos(angle) * r * 0.65} y2=${Math.sin(angle) * r * 0.65}/><circle class="iso-accent" r="1.5"/></g>`;
}
export function antenna(x: number, y: number, z: number, h = 26) {
  return svg`${cylinder(x, y, z, 2, h, "antenna")}${line3(
    [
      [x, y, z + h],
      [x + 3, y, z + h + 8],
    ],
    "antenna-tip",
  )}`;
}
export function coil(x: number, y: number, z: number, w: number, count = 5) {
  return svg`<g class="coil">${Array.from({ length: count }, (_, i) =>
    pipe(
      [
        [x + (i * w) / count, y, z],
        [x + (i * w) / count, y + 20, z],
        [x + ((i + 0.7) * w) / count, y + 20, z],
        [x + ((i + 0.7) * w) / count, y, z],
      ],
      false,
      2,
    ),
  )}</g>`;
}
