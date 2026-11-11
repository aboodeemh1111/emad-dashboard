import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import type { Point3 } from "./isometric-primitives";
import { box, cylinder, line3, pipe, polygon3 } from "./isometric-primitives";

type Pose = (point: Point3) => Point3;
const SEGMENTS = 32;
const identity: Pose = (point) => point;
const add = (a: Point3, b: Point3): Point3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
const subtract = (a: Point3, b: Point3): Point3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point3, b: Point3): Point3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const average = (points: readonly Point3[]): Point3 =>
  points
    .reduce<Point3>((sum, p) => add(sum, p), [0, 0, 0])
    .map((value) => value / points.length) as [number, number, number];
const view: Point3 = [1, 1, 0.92];

/** Rotate the optical assembly around its fixed physical joint, before projection. */
function aim(center: Point3, pan: number, tilt: number): Pose {
  const yaw = (pan * Math.PI) / 180;
  const pitch = (tilt * Math.PI) / 180;
  return ([x, y, z]) => {
    const py = y * Math.cos(pitch) - z * Math.sin(pitch);
    const pz = y * Math.sin(pitch) + z * Math.cos(pitch);
    return add(center, [
      x * Math.cos(yaw) + py * Math.sin(yaw),
      -x * Math.sin(yaw) + py * Math.cos(yaw),
      pz,
    ]);
  };
}

function surface(
  rings: Point3[][],
  cls: string,
  wrap = true,
  frontOnly = false,
) {
  const faces: { points: Point3[]; depth: number; light: number }[] = [];
  for (let row = 0; row < rings.length - 1; row++) {
    const center = average([...rings[row], ...rings[row + 1]]);
    for (let col = 0; col < rings[row].length - (wrap ? 0 : 1); col++) {
      const next = (col + 1) % rings[row].length;
      const points = [
        rings[row][col],
        rings[row][next],
        rings[row + 1][next],
        rings[row + 1][col],
      ];
      let normal = cross(
        subtract(points[1], points[0]),
        subtract(points[3], points[0]),
      );
      if (dot(normal, subtract(average(points), center)) < 0) {
        normal = normal.map((value) => -value) as [number, number, number];
      }
      if (frontOnly && dot(normal, view) <= 0) continue;
      const magnitude = Math.hypot(...normal) || 1;
      const light = Math.round(
        22 + 68 * Math.max(0, dot(normal, [-0.25, -0.35, 0.9]) / magnitude),
      );
      faces.push({ points, depth: dot(average(points), view), light });
    }
  }
  faces.sort((a, b) => a.depth - b.depth);
  return svg`<g class=${cls}>${faces.map((face) => polygon3(face.points, "camera-surface", `--camera-surface-light:${face.light}%`))}</g>`;
}

function ringY(
  y: number,
  rx: number,
  rz: number,
  pose: Pose = identity,
  count = SEGMENTS,
  start = 0,
  span = Math.PI * 2,
) {
  return Array.from({ length: count }, (_, i) => {
    const theta =
      start + (i * span) / (span === Math.PI * 2 ? count : count - 1);
    return pose([rx * Math.cos(theta), y, rz * Math.sin(theta)]);
  });
}
function ringZ(z: number, radius: number, center: Point3 = [0, 0, 0]) {
  return Array.from({ length: SEGMENTS }, (_, i) =>
    add(center, [
      radius * Math.cos((i * Math.PI * 2) / SEGMENTS),
      radius * Math.sin((i * Math.PI * 2) / SEGMENTS),
      z,
    ]),
  );
}
function disc(center: Point3, radius: number, pose: Pose, cls: string) {
  return polygon3(
    Array.from({ length: SEGMENTS }, (_, i) =>
      pose(
        add(center, [
          radius * Math.cos((i * Math.PI * 2) / SEGMENTS),
          0,
          radius * Math.sin((i * Math.PI * 2) / SEGMENTS),
        ]),
      ),
    ),
    cls,
  );
}
function lens(
  x: number,
  y: number,
  z: number,
  r: number,
  pose: Pose,
  thermal = false,
) {
  return svg`<g class="cctv-lens-assembly">
    ${disc([x, y, z], r + 1.3, pose, "cctv-lens-bezel")}
    ${disc([x, y + 0.15, z], r, pose, "cctv-lens-rim")}
    ${disc([x, y + 0.3, z], r * 0.76, pose, thermal ? "cctv-thermal-optic" : "cctv-lens-coating")}
    ${disc([x, y + 0.45, z], r * 0.49, pose, "cctv-optical-ring")}
    ${disc([x, y + 0.6, z], r * 0.3, pose, "cctv-aperture")}
    ${disc([x - r * 0.27, y + 0.75, z + r * 0.28], r * 0.18, pose, "cctv-glass-highlight")}
    ${disc([x + r * 0.24, y + 0.75, z - r * 0.25], r * 0.08, pose, "cctv-glass-highlight")}
  </g>`;
}

function bulletCamera(device: CatalogDevice, state: DeviceVisualState) {
  const lpr = device.id === "license_plate_recognition_camera";
  const thermal = device.id === "thermal_camera";
  const rx = lpr ? 19 : thermal ? 18 : 14;
  const rz = thermal ? 14 : lpr ? 13 : 14;
  const length = lpr ? 76 : thermal ? 58 : 62;
  const pose = aim([0, -3, 68], 0, -12);
  const joint = pose([0, -length * 0.28, -rz - 2]);
  const front = length / 2;
  const active = state.active && state.available;
  const opticVisible =
    dot(subtract(pose([0, 1, 0]), pose([0, 0, 0])), view) > 0;
  const rings = [
    [-length / 2 - 2, 0.02],
    [-length / 2, 0.78],
    [-length / 2 + 4, 1],
    [front - 4, 1],
    [front, 0.94],
  ].map(([y, scale]) => ringY(y, rx * scale, rz * scale, pose));
  return svg`<g class="realistic-cctv ${lpr ? "lpr-camera" : thermal ? "thermal-camera" : "bullet-camera"} ${active ? "camera-live" : ""}" data-camera-type=${device.id} transform="translate(140 163) scale(1.1) translate(-140 -128)">
    ${box(-10, -47, 52, 20, 5, 34, "cctv-mount-plate")}
    ${[
      [-6, 57],
      [6, 80],
    ].map(([x, z]) => disc([x, -41.8, z], 1.3, identity, "cctv-mount-screw"))}
    ${pipe([[0, -42, 65], [0, -29, 51], joint], false, 6)}
    ${cylinder(joint[0], joint[1], joint[2] - 3, 5, 7, "cctv-ball-joint")}
    <g class="camera-optical-head">
      ${surface(rings, "cctv-body-surface")}
      ${[-0.78, 2.36].map((angle) =>
        line3(
          [
            [-length / 2, 0.78],
            [-length / 2 + 4, 1],
            [front - 4, 1],
            [front, 0.94],
          ].map(([y, scale]) =>
            pose([
              rx * scale * Math.cos(angle),
              y,
              rz * scale * Math.sin(angle),
            ]),
          ),
          "cctv-body-contour",
        ),
      )}
      ${polygon3(ringY(front + 0.1, rx * 0.94, rz * 0.94, pose), "cctv-front-gasket")}
      ${line3(ringY(-length / 2 + 4, rx + 0.15, rz + 0.15, pose, 17, -Math.PI / 4, Math.PI), "cctv-body-seam")}
      ${
        opticVisible
          ? svg`
        ${
          thermal
            ? svg`${lens(-6, front + 0.3, 0, 8.1, pose, true)}${lens(10, front + 0.3, 0, 4.1, pose)}`
            : lpr
              ? svg`
          ${polygon3(
            (
              [
                [-15, front + 0.25, -8],
                [-3, front + 0.25, -8],
                [-3, front + 0.25, 8],
                [-15, front + 0.25, 8],
              ] as const
            ).map((point) => pose(point)),
            "cctv-ir-window",
          )}
          ${[-11, -6].flatMap((x) => [-4, 4].map((z) => disc([x, front + 0.4, z], 1.6, pose, "cctv-ir-emitter")))}
          ${lens(7, front + 0.3, 0, 7, pose)}
        `
              : svg`
          ${lens(0, front + 0.3, 0, 7.4, pose)}
          ${[0, 60, 120, 180, 240, 300].map((angle) => disc([10.8 * Math.cos((angle * Math.PI) / 180), front + 0.4, 10.8 * Math.sin((angle * Math.PI) / 180)], 1.3, pose, "cctv-ir-emitter"))}
        `
        }
        ${disc([lpr ? 15 : 9, front + 0.8, -9], 0.9, pose, "cctv-status-led")}
      `
          : svg``
      }
      ${surface(
        [-length / 2, front + 5, front + 7].map((y, index) =>
          ringY(
            y,
            rx * (index === 2 ? 1.05 : 1.1),
            rz * (index === 2 ? 1.05 : 1.1),
            pose,
            19,
            0,
            Math.PI,
          ),
        ),
        "cctv-sunshield",
        false,
      )}
      ${line3(ringY(front + 7, rx * 1.05, rz * 1.05, pose, 19, 0, Math.PI), "cctv-visor-edge")}
      ${[-1, 1].map((side) => line3([pose([side * rx * 1.1, -length / 2, 0]), pose([side * rx * 1.1, front + 5, 0]), pose([side * rx * 1.05, front + 7, 0])], "cctv-visor-edge"))}
    </g>
  </g>`;
}

function ptzCamera(state: DeviceVisualState) {
  const active = state.active && state.available;
  const pan = Number.isFinite(state.pan)
    ? Math.max(-180, Math.min(180, state.pan))
    : 0;
  const tilt = Number.isFinite(state.tilt)
    ? Math.max(-80, Math.min(80, state.tilt))
    : 0;
  const pose = aim([0, 5, 65.5], pan, tilt - 18);
  const opticVisible =
    dot(subtract(pose([0, 1, 0]), pose([0, 0, 0])), view) > 0;
  const ball = Array.from({ length: 13 }, (_, i) => {
    const latitude = -Math.PI / 2 + (i * Math.PI) / 12;
    return Array.from({ length: SEGMENTS }, (_segment, j) =>
      pose([
        13.5 * Math.cos(latitude) * Math.cos((j * Math.PI * 2) / SEGMENTS),
        13.5 * Math.cos(latitude) * Math.sin((j * Math.PI * 2) / SEGMENTS),
        13.5 * Math.sin(latitude),
      ]),
    );
  });
  const hood = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.acos(7 / 27)) / 11;
    return ringZ(78 + 20 * Math.sin(angle), 27 * Math.cos(angle), [0, 5, 0]);
  });
  const bubble = Array.from({ length: 14 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 26;
    return ringZ(
      75.5 + 26 * Math.sin(angle),
      Math.max(0.01, 25.5 * Math.cos(angle)),
      [0, 5, 0],
    );
  });
  return svg`<g class="realistic-cctv ptz-dome-camera ${active ? "camera-live" : ""}" data-camera-type="ptz_camera" transform="translate(140 163) scale(1.1) translate(-140 -128)">
    ${box(-10, -43, 81, 20, 5, 33, "cctv-mount-plate")}
    ${[
      [-6, 86],
      [6, 108],
    ].map(([x, z]) => disc([x, -37.8, z], 1.3, identity, "cctv-mount-screw"))}
    ${pipe(
      [
        [0, -38, 104],
        [0, -5, 104],
        [0, 5, 101],
      ],
      false,
      7,
    )}
    ${cylinder(0, 5, 96, 7, 7, "cctv-pendant-coupler")}
    <g class="camera-gimbal" data-pan=${pan} data-tilt=${tilt}>
      ${surface(ball, "cctv-gimbal-surface")}
      ${
        opticVisible
          ? svg`
        ${surface(
          [
            [9, 7.2],
            [12.2, 7.2],
          ].map(([y, r]) => ringY(y, r, r, pose)),
          "cctv-lens-barrel",
        )}
        ${lens(0, 12.4, 0, 6.5, pose)}
      `
          : svg``
      }
      ${line3([pose([-13, 0, 0]), pose([-15, 0, 0]), pose([-15, 0, 10])], "cctv-gimbal-axle")}
    </g>
    ${surface(bubble, "cctv-dome-glass", true, true)}
    ${line3(
      [
        [0, 28.3, 62],
        [-5, 27, 57],
        [-8, 23, 53],
      ],
      "cctv-dome-highlight",
    )}
    ${[12, 28].map((index) =>
      line3(
        bubble.map((ring) => ring[index]),
        "cctv-dome-outline",
      ),
    )}
    ${surface([ringZ(75, 27.5, [0, 5, 0]), ringZ(78, 27.5, [0, 5, 0])], "cctv-dome-rim-surface")}
    ${surface(hood, "cctv-weather-cap")}
    ${[12, 28].map((index) =>
      line3(
        hood.map((ring) => ring[index]),
        "cctv-cap-outline",
      ),
    )}
    ${disc([0, 31.7, 82], 1.2, identity, "cctv-status-led")}
    ${line3(ringZ(81, 27.2, [0, 5, 0]).slice(0, 17), "cctv-cap-seam")}
  </g>`;
}

export function cameraVisual(device: CatalogDevice, state: DeviceVisualState) {
  return device.id === "ptz_camera"
    ? ptzCamera(state)
    : bulletCamera(device, state);
}
