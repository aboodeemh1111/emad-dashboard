import { svg } from "lit";
import type { SVGTemplateResult } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import { isCleaning, cleaningRobot, cleaningRoute } from "./cleaning-model";
import {
  box,
  cylinder,
  display,
  line3,
  pipe,
  polygon3,
  project,
  circleFace,
} from "./isometric-primitives";
import type { Point3 } from "./isometric-primitives";
import { fluidTube } from "./physical-water";

interface Pose {
  x: number;
  y: number;
  heading: number;
}
function frame(pose: Pose = { x: 0, y: 0, heading: 0 }) {
  const a = (pose.heading * Math.PI) / 180;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  const point = ([x, y, z]: Point3): Point3 => [
    pose.x + x * c - y * sn,
    pose.y + x * sn + y * c,
    z,
  ];
  const front = (
    x: number,
    y: number,
    z: number,
    content: SVGTemplateResult,
    angle = 0,
  ) => {
    const [px, py] = project(point([x, y, z]));
    const r = ((pose.heading + angle) * Math.PI) / 180;
    if (angle === 0 && Math.cos(r) - Math.sin(r) < -0.001) return svg``;
    return svg`<g transform="matrix(${0.92 * (Math.cos(r) - Math.sin(r))} ${0.46 * (Math.cos(r) + Math.sin(r))} 0 -1 ${px} ${py})">${content}</g>`;
  };
  const b = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    cls = "",
  ) => {
    const faces: { n: readonly [number, number]; p: Point3[] }[] = [
      {
        n: [1, 0],
        p: [
          [x + w, y, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x + w, y, z + h],
        ],
      },
      {
        n: [0, 1],
        p: [
          [x, y + d, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ],
      },
      {
        n: [-1, 0],
        p: [
          [x, y + d, z],
          [x, y, z],
          [x, y, z + h],
          [x, y + d, z + h],
        ],
      },
      {
        n: [0, -1],
        p: [
          [x + w, y, z],
          [x, y, z],
          [x, y, z + h],
          [x + w, y, z + h],
        ],
      },
    ];
    return svg`<g class="iso-box ${cls}">${faces
      .filter((f) => f.n[0] * (c + sn) + f.n[1] * (c - sn) > 0)
      .map((f) =>
        polygon3(
          f.p.map((p) => point(p)),
          f.n[0] ? "iso-side" : "iso-front",
        ),
      )}${polygon3(
      (
        [
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ] as Point3[]
      ).map(point),
      "iso-top",
    )}</g>`;
  };
  const cy = (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    cls = "",
    fill?: number,
  ) => {
    const p = point([x, y, z]);
    return cylinder(p[0], p[1], p[2], r, h, cls, fill);
  };
  const ln = (p: readonly Point3[], cls = "cl-line") =>
    line3(p.map(point), cls);
  const top = (x: number, y: number, z: number, content: SVGTemplateResult) => {
    const [px, py] = project(point([x, y, z]));
    return svg`<g transform="matrix(${0.92 * (c - sn)} ${0.46 * (c + sn)} ${-0.92 * (sn + c)} ${0.46 * (c - sn)} ${px} ${py})">${content}</g>`;
  };
  return { point, front, b, cy, ln, top };
}
const staticFrame = frame();
const front = staticFrame.front;
const top = staticFrame.top;
const led = (x: number, y: number, z: number, on: boolean, cls = "") => {
  const [px, py] = project([x, y, z]);
  return svg`<circle class="cl-led ${on ? "cl-lit" : ""} ${cls}" cx=${px} cy=${py} r="1.7"/>`;
};
function inset(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  content: SVGTemplateResult,
  id: string,
) {
  return svg`<defs><clipPath id=${id}>${polygon3([
    [x, y, z],
    [x + w, y, z],
    [x + w, y, z + h],
    [x, y, z + h],
  ])}</clipPath></defs>${front(x, y, z, svg`<rect class="cl-inner" width=${w} height=${h}/>`)}<g clip-path="url(#${id})">${content}</g>`;
}
function hatch(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  opening: number,
  glass = false,
) {
  return front(
    x,
    y,
    z,
    svg`<g class="cl-hinged-door" data-angle=${opening * 0.9}>${glass ? svg`<path class="cl-door-skin" fill-rule="evenodd" d="M0 0H${w}V${h}H0ZM5 5V${h - 5}H${w - 5}V5Z"/><rect class="cl-clear-guard" x="5" y="5" width=${w - 10} height=${h - 10}/>` : svg`<rect class="cl-door-skin" width=${w} height=${h} rx="1"/>`}<path class="cl-handle" d="M${w - 6} ${h * 0.35}v${h * 0.28}"/><path class="cl-gasket" d="M2 2H${w - 2}V${h - 2}H2Z"/></g>`,
    opening * 0.9,
  );
}
function rotor(
  tools: ReturnType<typeof frame>,
  x: number,
  y: number,
  z: number,
  r: number,
  running: boolean,
  mop = false,
) {
  return tools.top(
    x,
    y,
    z,
    svg`<g class="cl-brush ${running ? "cl-brush-turn" : ""}">${mop ? svg`<circle class="cl-mop-pad" r=${r}/>${[0, 45, 90, 135].map((a) => svg`<path class="cl-pad-rib" transform="rotate(${a})" d="M${-r + 2} 0H${r - 2}"/>`)}` : [0, 120, 240].map((a) => svg`<path class="cl-bristle" transform="rotate(${a})" d="M0 0L${r} 0m-2-2 2 2-2 2"/>`)}<circle class="cl-brush-hub" r="2"/></g>`,
  );
}
function wheels(t: ReturnType<typeof frame>, running: boolean, w = 37, d = 28) {
  return svg`${[-w / 2, w / 2].flatMap((x) => [-d / 2, d / 2].map((y) => t.front(x, y, 7, svg`<circle class="cl-tire" r="7"/><g class="cl-wheel-rotor ${running ? "cl-wheel-turn" : ""}"><circle class="cl-rim" r="4"/>${[0, 60, 120].map((a) => svg`<path class="cl-spoke" transform="rotate(${a})" d="M-3 0H3"/>`)}</g>`, 90)))}`;
}
function roundRobot(s: DeviceVisualState, pose: Pose, mop = false) {
  const t = frame(pose);
  const clean = s.active && s.processPhase === "cleaning";
  const moving =
    s.active &&
    ["cleaning", "returning", "docking", "aligning"].includes(
      s.processPhase ?? "",
    );
  return svg`${mop ? svg`${rotor(t, -9, 12, 3, 8, clean, true)}${rotor(t, 9, 12, 3, 8, clean, true)}` : rotor(t, 19, 10, 3, 10, clean)}${wheels(t, moving, 31, 18)}${t.cy(0, 0, 8, 20, 13, "cl-robot-shell")}${t.cy(0, 0, 20, 19, 2, "cl-robot-lid")}${t.cy(0, -3, 22, 6, 5, "cl-lidar")}${t.cy(0, -3, 27, 6, 1, "cl-lidar-cap")}${t.top(0, 9, 22.5, svg`<path class="cl-button" d="M-3 0H3m-3-3v6"/><circle class="cl-status-ring ${s.active ? "cl-status-on" : ""}" r="5"/>`)}${t.front(-8, 19.4, 13, svg`<rect class="cl-bumper" width="16" height="4" rx="2"/><circle class="cl-optic" cx="3" cy="2" r="1.2"/><circle class="cl-optic" cx="13" cy="2" r="1.2"/>`)}${
    mop
      ? t.front(9, 15, 18, svg`<path class="cl-water-window" d="M0 0h6v4H0Z"/>`)
      : t.ln(
          [
            [-13, -10, 22],
            [13, -10, 22],
          ],
          "cl-seam",
        )
  }`;
}
function serviceRobot(d: CatalogDevice, s: DeviceVisualState, pose: Pose) {
  const t = frame(pose);
  const moving =
    s.active && !["charging", "paused"].includes(s.processPhase ?? "");
  const delivery = d.id === "delivery_robot";
  const scrub = d.id === "floor_scrubber";
  const security = d.id === "security_robot";
  const height = delivery ? 70 : scrub ? 41 : security ? 68 : 27;
  const chassis = svg`${wheels(t, moving, 43, 31)}${t.b(-19, -19, 8, 38, 38, 4, "cl-bumper-case")}${security ? t.cy(0, 0, 9, 20, 57, "cl-security-shell") : t.b(-22, -18, 10, 44, 36, height, "cl-service-shell")}`;
  if (scrub) {
    return svg`${rotor(t, -12, 23, 3, 10, s.active && s.processPhase === "cleaning", true)}${rotor(t, 12, 23, 3, 10, s.active && s.processPhase === "cleaning", true)}${chassis}${t.b(-18, -12, 43, 15, 23, 15, "cl-clean-tank")}${t.b(3, -12, 43, 15, 23, 15, "cl-recovery-tank")}${t.cy(-11, -2, 58, 4, 2, "cl-tank-cap")}${t.cy(10, -2, 58, 4, 2, "cl-tank-cap")}${t.ln(
      [
        [-23, -26, 5],
        [-12, -30, 4],
        [12, -30, 4],
        [23, -26, 5],
      ],
      "cl-squeegee",
    )}${t.ln(
      [
        [16, -8, 40],
        [22, -14, 20],
        [16, -28, 7],
      ],
      "cl-recovery-hose",
    )}${t.ln(
      [
        [-18, -17, 43],
        [-18, -24, 69],
        [18, -24, 69],
        [18, -17, 43],
      ],
      "cl-push-handle",
    )}${t.b(-11, -25, 64, 22, 5, 8, "cl-console")}${t.cy(0, 11, 59, 5, 5, "cl-lidar")}`;
  }
  if (delivery) {
    const slot =
      s.metric === "cl_slot_2" ? 1 : s.metric === "cl_slot_3" ? 2 : 0;
    return svg`${chassis}${[0, 1, 2].map((i) => svg`${t.front(-19, 18.4, 16 + i * 17, svg`<rect class="cl-inner" width="38" height="15"/>`)}${i === slot && s.position > 5 ? t.b(-14, 8, 18 + i * 17, 25, 10, 8, "cl-parcel") : svg``}${t.front(-20, 19, 15 + i * 17, svg`<rect class="cl-door-skin" width="40" height="16"/><path class="cl-handle" d="M32 6h4"/><circle class="cl-lock-dot" cx="5" cy="8" r="1.3"/>`, i === slot ? s.position * 0.85 : 0)}`)}${t.front(-13, 18.6, 69, svg`<rect class="iso-screen" width="26" height="8"/><text class="screen-label" transform="scale(1 -1)" x="13" y="-4">${Math.round(s.processProgress ?? 0)}%</text>`)}${t.cy(0, 0, 81, 6, 4, "cl-lidar")}`;
  }
  if (security) {
    return svg`${chassis}${t.cy(0, 0, 66, 19, 4, "cl-security-collar")}${t.cy(0, 0, 70, 15, 11, "cl-camera-dome")}${t.front(-12, 14.5, 72, svg`<rect class="cl-sensor-mask" width="24" height="7" rx="3"/><circle class="cl-lens" cx="6" cy="3.5" r="2.8"/><circle class="cl-lens" cx="18" cy="3.5" r="2.8"/>`)}${t.cy(0, 0, 82, 9, 3, "cl-lidar")}${t.top(0, 0, 85, svg`<circle class="cl-scan-ring ${s.active && s.processPhase === "patrolling" ? "cl-scanning" : ""}" r="8"/>`)}${t.front(-4, 20, 42, svg`<rect class="iso-screen" width="8" height="13"/><circle class="cl-stop-button" cx="4" cy="-5" r="2.5"/>`)}`;
  }
  return svg`${chassis}${t.b(-10, -7, 36, 20, 14, 17, "cl-camera-case")}${t.front(0, 7.4, 45, svg`<circle class="cl-camera-rim" r="7"/><circle class="cl-lens" r="5"/><circle class="cl-lens-glint" cx="-1.5" cy="2" r="1.4"/>`)}${t.ln(
    [
      [17, -12, 38],
      [17, -12, 71],
    ],
    "cl-antenna",
  )}${t.cy(-13, -7, 38, 4, 7, "cl-lidar")}${t.front(-17, 18.5, 22, svg`<path class="cl-inspection-lamp ${s.active && s.processPhase === "inspecting" ? "cl-lamp-on" : ""}" d="M0 0h8v3H0Z"/>`)}`;
}
function robotScene(d: CatalogDevice, s: DeviceVisualState) {
  const dock = d.id === "robot_docking_station";
  const windowBot = d.id === "window_cleaning_robot";
  const progress = s.processProgress ?? 0;
  if (windowBot) {
    const x = s.example ? s.pan : 0;
    const z = 54 + (s.example ? s.tilt : 0);
    const on = s.active && s.processPhase === "cleaning";
    const anchor = project([-46, -4, 97]);
    const end = project([x, 9, z + 13]);
    return svg`${box(-56, -8, 0, 112, 5, 101, "cl-window-frame")}${front(-52, -2.5, 7, svg`<rect class="cl-window-pane" width="104" height="89"/><path class="cl-reflection" d="M8 5L94 82m-75-77 78 72"/>`)}${
      s.example
        ? line3(
            Array.from({ length: 41 }, (_, i) => {
              const p = cleaningRoute(i * 2.5, s.mode);
              return [p.x, -1, 54 + p.y] as Point3;
            }),
            "cl-window-route",
          )
        : svg``
    }${[-12, 12].map((xx) => front(x + xx, 0, z, svg`<circle class="cl-suction-gasket" r="12"/><g class="cl-window-pad ${on ? "cl-pad-turn" : ""}"><circle class="cl-mop-pad" r="10"/><path class="cl-pad-rib" d="M-8 0H8M0-8V8"/></g>`))}${box(x - 22, 2, z - 11, 44, 12, 23, "cl-window-robot")}${front(x - 9, 14.4, z - 3, svg`<path class="cl-handle" d="M0 0v10h18V0"/><circle class="cl-led ${on ? "cl-lit" : ""}" cx="9" cy="-3" r="2"/>`)}<path class="cl-tether" d="M${anchor[0]} ${anchor[1]}Q${(anchor[0] + end[0]) / 2 - 13} ${end[1] + 14} ${end[0]} ${end[1]}"/>${circleFace(-46, -1, 97, 3, "cl-anchor")}`;
  }
  const pose = s.example
    ? { x: s.pan, y: s.tilt, heading: s.speed }
    : { x: 0, y: 0, heading: 0 };
  if (dock) {
    return svg`${box(-24, -37, 0, 48, 69, 3, "cl-dock-pad")}${box(-24, -37, 3, 48, 26, 72, "cl-dock-tower")}${box(-18, -34, 45, 36, 20, 28, "cl-dock-tank")}${line3(
      [
        [-14, -11, 70],
        [14, -11, 70],
      ],
      "cl-tank-handle",
    )}${front(-16, -10.5, 25, svg`<rect class="cl-dock-grille" width="32" height="13"/>${[0, 1, 2, 3].map((i) => svg`<path class="cl-vent" d="M3 ${3 + i * 2}h26"/>`)}`)}${[-12, 12].map((x) => box(x - 3, -10, 8, 6, 3, 4, "cl-charge-contact"))}${roundRobot({ ...s, processPhase: s.processPhase === "docking" ? "returning" : s.processPhase }, pose)}${led(18, -10, 58, s.active && s.processPhase === "charging")}${display(-13, -10.4, 60, 26, 8, s.hasTelemetry ? `${Math.round(s.value)}%` : "—")}`;
  }
  const track = Array.from({ length: 81 }, (_, i) => {
    const p = cleaningRoute(i * 1.25, s.mode);
    const v = project([p.x, p.y, 1]);
    return `${i ? "L" : "M"}${v[0]} ${v[1]}`;
  }).join(" ");
  return svg`${
    s.example
      ? svg`<path class="cl-route" d=${track}/><path class="cl-route-swept ${["robot_mop", "floor_scrubber"].includes(d.id) ? "cl-wet-trail" : ""}" pathLength="100" stroke-dasharray="${progress} 100" d=${track}/>${
          d.id === "robot_vacuum"
            ? Array.from({ length: 9 }, (_, i) => {
                const p = cleaningRoute((i + 1) * 10, s.mode);
                return progress < (i + 1) * 10
                  ? top(
                      p.x,
                      p.y,
                      1,
                      svg`<path class="cl-debris" d="M-1 0l2-1 1 2-2 1Z"/>`,
                    )
                  : svg``;
              })
            : svg``
        }${box(-39, -28, 0, 30, 14, 15, "cl-small-dock")}${[-29, -18].map((x) => box(x, -13, 2, 3, 2, 2, "cl-charge-contact"))}`
      : svg``
  }${["robot_vacuum", "robot_mop"].includes(d.id) ? roundRobot(s, pose, d.id === "robot_mop") : serviceRobot(d, s, pose)}`;
}
function trash(level: number, y = 16) {
  return svg`${Array.from({ length: 12 }, (_, i) => {
    const x = -20 + (i % 4) * 13;
    const z = 8 + level * 0.45 - 9 - (2 - Math.floor(i / 4)) * 1.5;
    return svg`${box(x, y - (i % 3) * 8, z, 10, 8, 5, i % 2 ? "cl-cardboard" : "cl-waste-piece")}${polygon3(
      [
        [x, y, z + 5],
        [x + 3, y + 3, z + 9],
        [x + 9, y + 6, z + 5],
      ],
      "cl-crumple",
    )}`;
  })}`;
}
function waste(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const sensor = d.id === "waste_fill_level_sensor";
  const compactor = d.id === "waste_compactor";
  const chute = d.id === "waste_chute_controller";
  const level = s.hasLevel ? s.level : 0;
  if (compactor) {
    const z = 70 - s.speed * 0.45;
    return svg`${box(-37, -25, 0, 74, 50, 96, "cl-steel-cabinet")}${inset(
      -30,
      25.2,
      8,
      60,
      79,
      svg`${box(-27, -13, 6, 54, 36, 2, "cl-chamber-floor")}${trash(level, 20)}${box(-27, -15, z, 54, 38, 5, "cl-press-platen")}${cylinder(0, 0, z + 5, 2.5, 80 - z - 5, "cl-piston-rod")}${cylinder(0, 0, 79, 7, 13, "cl-hydraulic-cylinder")}${pipe(
        [
          [-4, 0, 90],
          [-18, 0, 90],
          [-18, 0, 75],
        ],
        false,
        2,
      )}`,
      id + "-press",
    )}${hatch(-32, 25.8, 8, 64, 53, s.position, true)}${display(-20, 26, 88, 30, 8, s.hasLevel ? `${Math.round(level)}%` : "—")}${led(24, 26, 89, s.active)}${box(-33, -20, -2, 9, 40, 3, "cl-foot")}${box(24, -20, -2, 9, 40, 3, "cl-foot")}`;
  }
  if (chute) {
    const a = (s.position * 0.85 * Math.PI) / 180;
    const dy = 37 * Math.sin(a);
    const dz = 37 * Math.cos(a);
    return svg`${cylinder(0, -6, 4, 17, 92, "cl-chute-duct")}${box(-35, -20, 40, 70, 40, 53, "cl-steel-cabinet")}${inset(-26, 20.3, 45, 52, 40, svg``, id + "-hopper")}${polygon3(
      [
        [-29, 22, 44],
        [29, 22, 44],
        [29, 22 + dy, 44 + dz],
        [-29, 22 + dy, 44 + dz],
      ],
      "cl-chute-hatch",
    )}${line3(
      [
        [-12, 23 + dy, 39 + dz],
        [12, 23 + dy, 39 + dz],
      ],
      "cl-handle",
    )}${front(-9, 12, 8, svg`<rect class="cl-chute-window" width="18" height="27"/>`)}${s.active && s.processPhase === "cycling" ? svg`<g class="cl-chute-drop">${[0, 1, 2].map((i) => svg`<g style="--cl-delay:${i * -0.5}s">${box(-7, 6, 35, 9, 8, 7, "cl-waste-piece")}</g>`)}</g>` : svg``}${display(-20, 20.5, 84, 26, 6, s.hasTelemetry ? `${Math.round(s.processProgress ?? 0)}%` : "—")}${led(22, 21, 87, s.active)}`;
  }
  const mouth = polygon3(
    [
      [-25, -18, 58],
      [25, -18, 58],
      [25, 18, 58],
      [-25, 18, 58],
    ],
    "cl-inner",
  );
  const bin = svg`${box(-29, -22, 3, 58, 44, 54, "cl-bin-body")}${
    s.hasLevel
      ? inset(
          -20,
          22.5,
          13,
          40,
          32,
          svg`${trash(level, 18)}${line3(
            [
              [-20, 23, 8 + level * 0.45],
              [20, 23, 8 + level * 0.45],
            ],
            "cl-fill-line",
          )}`,
          id + "-waste",
        )
      : front(
          -18,
          22.4,
          20,
          svg`<path class="cl-unknown-mark" d="M0 0l36 24m-36 0L36 0"/>`,
        )
  }<defs><clipPath id="${id}-bin-mouth">${mouth}</clipPath></defs>${mouth}<g clip-path="url(#${id}-bin-mouth)">${s.hasLevel ? trash(level, 14) : svg``}</g>${[-24, 24].map((x) => circleFace(x, 20, 4, 5, "cl-tire"))}${display(-13, 23, 48, 26, 7, s.hasLevel ? `${Math.round(level)}%` : "—")}`;
  if (sensor) {
    const surface = 8 + level * 0.45;
    return svg`${bin}${box(-8, -6, 75, 16, 12, 7, "cl-ultrasonic-head")}${[-4, 4].map((x) => cylinder(x, 0, 72, 2.5, 3, "cl-transducer"))}${line3(
      [
        [-16, -14, 58],
        [-16, -14, 88],
        [0, -14, 88],
        [0, 0, 83],
      ],
      "cl-sensor-bracket",
    )}${
      s.hasLevel
        ? svg`${line3(
            [
              [0, 0, 72],
              [-15, 18, surface],
              [15, 18, surface],
              [0, 0, 72],
            ],
            "cl-ultrasonic-cone",
          )}${s.active ? top(0, 10, surface, svg`<g class="cl-sonar-pulse"><ellipse rx="16" ry="10"/></g>`) : svg``}`
        : svg``
    }`;
  }
  const a = (s.position * 0.9 * Math.PI) / 180;
  return svg`${bin}${polygon3(
    [
      [-31, -24, 59],
      [31, -24, 59],
      [31, -24 + 46 * Math.cos(a), 59 + 46 * Math.sin(a)],
      [-31, -24 + 46 * Math.cos(a), 59 + 46 * Math.sin(a)],
    ],
    "cl-bin-lid",
  )}${line3(
    [
      [-10, -24 + 35 * Math.cos(a), 59 + 35 * Math.sin(a)],
      [10, -24 + 35 * Math.cos(a), 59 + 35 * Math.sin(a)],
    ],
    "cl-handle",
  )}${box(-9, 23, 4, 18, 7, 3, "cl-pedal")}${front(15, 23, 43, svg`<rect class="cl-sensor-mask" width="5" height="3"/>`)}`;
}
function dispensers(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const paper = d.id === "paper_dispenser_monitor";
  const p = s.processProgress ?? 0;
  const feed =
    s.active && ["feeding", "tearing"].includes(s.processPhase ?? "");
  const on = s.active && s.processPhase === "dispensing";
  const level = s.hasLevel ? s.level : 0;
  if (paper) {
    const length = feed ? 6 + Math.min(p, 65) * 0.3 : 7;
    return svg`${box(-30, -15, 7, 60, 30, 67, "cl-dispenser-case")}${inset(-24, 15.5, 25, 48, 42, svg`${fluidTube("x", [0, 0, 48], -20, 20, 14, "cl-paper-roll")}${fluidTube("x", [0, 0, 48], -21, 21, 4, "cl-paper-core")}`, id + "-paper")}${front(-25, 16, 25, svg`<rect class="cl-frosted-window" width="50" height="43"/><path class="cl-reflection" d="M3 4l38 31"/>`)}${box(-22, 14, 20, 44, 4, 3, "cl-paper-slot")}${front(-18, 18.3, 20 - length, svg`<g class="cl-paper-tail ${feed && p >= 65 ? "cl-paper-tear" : ""}"><path class="cl-paper-sheet" d="M0 0h36v${length}H0Z"/><path class="cl-perforation" d="M1 ${length - 4}h34"/></g>`)}${display(-13, 16, 10, 26, 7, s.hasLevel ? `${Math.round(level)}%` : "—")}${led(23, 16, 15, feed)}`;
  }
  const plunger = on ? Math.sin(Math.min(1, p / 45) * Math.PI) * 3 : 0;
  return svg`${box(-22, -15, 12, 44, 30, 65, "cl-dispenser-case")}${inset(-14, 15.5, 30, 28, 34, svg`${box(-12, -4, 31, 24, 18, 31, "cl-soap-cartridge")}${box(-11, 0, 31, 22, 15, (31 * level) / 100, "cl-soap-level")}`, id + "-soap")}${front(-15, 16, 29, svg`<rect class="cl-frosted-window" width="30" height="36"/>`)}${box(-9, 3, 20 - plunger, 18, 14, 6, "cl-soap-pump")}${pipe(
    [
      [0, 12, 24 - plunger],
      [0, 25, 24 - plunger],
      [0, 25, 17 - plunger],
    ],
    false,
    3,
  )}${on ? svg`<g class="cl-soap-drop">${cylinder(0, 25, 12, 1.5, 3, "cl-soap-bead")}</g>` : svg``}${front(-9, 16.5, 69, svg`<rect class="cl-sensor-mask" width="18" height="4"/>`)}${display(-11, 16.5, 13, 22, 6, s.hasLevel ? `${Math.round(level)}%` : "—")}`;
}
function bowlWater(
  x: number,
  y: number,
  z: number,
  r: number,
  on: boolean,
  id: string,
) {
  return top(
    x,
    y,
    z,
    svg`<defs><clipPath id=${id}><ellipse rx=${r} ry=${r * 0.8}/></clipPath></defs><ellipse class="cl-bowl-water" rx=${r} ry=${r * 0.8}/><g clip-path="url(#${id})" class="cl-flush-swirl ${on ? "cl-swirling" : ""}"><path class="cl-water-swirl" d="M${-r + 2} 0Q0 ${-r} ${r - 2} 0T0 ${r * 0.4}Q${-r * 0.5} 0 0-2"/></g><ellipse class="cl-drain" rx="3" ry="2"/>`,
  );
}
function toiletLid(position: number) {
  const a = (position * 0.9 * Math.PI) / 180;
  const [px, py] = project([0, -19, 37]);
  return svg`<g class="cl-toilet-lid" transform="matrix(.92 .46 ${-0.92 * Math.cos(a)} ${0.46 * Math.cos(a) - Math.sin(a)} ${px} ${py})"><ellipse class="cl-lid-skin" cx="0" cy="19" rx="23" ry="25"/><ellipse class="cl-lid-seam" cx="0" cy="19" rx="20" ry="22"/></g>`;
}
function washroom(d: CatalogDevice, s: DeviceVisualState, id: string) {
  const flowing = s.active && s.processPhase === "flowing";
  const flush = s.active && s.processPhase === "flushing";
  if (d.id === "smart_tap") {
    return svg`${cylinder(0, 16, 0, 32, 10, "cl-basin-body")}${top(0, 16, 11, svg`<ellipse class="cl-ceramic" rx="43" ry="27"/><ellipse class="cl-basin-interior" rx="34" ry="20"/>`)}${flowing ? bowlWater(0, 16, 11.2, 15, true, id + "-basin") : top(0, 16, 11.2, svg`<ellipse class="cl-drain" rx="3" ry="2"/>`)}${cylinder(0, -12, 12, 4, 39, "cl-chrome")}${pipe(
      [
        [0, -12, 49],
        [0, -12, 62],
        [0, 18, 62],
        [0, 18, 51],
      ],
      false,
      6,
    )}${cylinder(0, 18, 49, 3.5, 4, "cl-aerator")}${front(-3, -8, 33, svg`<rect class="cl-sensor-mask" width="6" height="4"/>`)}${
      flowing
        ? svg`${line3(
            [
              [0, 18, 49],
              [0, 18, s.period === "cl_hand_present" ? 17 : 12],
            ],
            "cl-tap-stream",
          )}${s.example && s.period === "cl_hand_present" ? top(0, 18, 15, svg`<path class="cl-example-hand" d="M-17-5l12 1 6-4q3-2 3 1l-1 4 7-4q4-2 4 1L7 0l8-3q4-1 2 2L8 5q-3 4-12 2l-13-2Z"/>`) : svg``}`
        : svg``
    }`;
  }
  if (d.id === "smart_urinal") {
    return svg`${box(-23, -10, 12, 46, 15, 64, "cl-wall-mount")}${front(-22, 8, 13, svg`<path class="cl-urinal-shell" d="M0 60Q22 70 44 60L40 12Q36-3 22 0 8-3 4 12Z"/><path class="cl-urinal-interior" d="M7 52Q22 57 37 52L33 15Q22 4 11 15Z"/><ellipse class="cl-drain" cx="22" cy="14" rx="4" ry="2"/>${flush ? svg`<path class="cl-urinal-film" d="M9 48Q22 42 35 48M12 43L18 18m14 25-6-25M22 44v-25"/>` : svg``}<rect class="cl-sensor-mask" x="15" y="58" width="14" height="4"/>`)}${pipe(
      [
        [0, -4, 76],
        [0, -4, 89],
        [0, 8, 89],
      ],
      false,
      3,
    )}${cylinder(0, 8, 85, 5, 6, "cl-flush-valve")}`;
  }
  return svg`${box(-24, -38, 10, 48, 22, 55, "cl-cistern")}${s.hasLevel ? front(-14, -15.3, 27, svg`<rect class="cl-level-window" width="28" height="29"/><rect class="cl-cistern-water" x="1" y="1" width="26" height=${s.level * 0.27}/>`) : svg``}${cylinder(0, -27, 66, 5, 1.5, "cl-flush-button")}${s.position > 15 ? toiletLid(s.position) : svg``}${cylinder(0, 0, 0, 15, 19, "cl-toilet-pedestal")}${cylinder(0, 0, 18, 28, 17, "cl-porcelain-bowl")}${top(0, 0, 36, svg`<ellipse class="cl-seat" rx="30" ry="24"/><ellipse class="cl-bowl-interior" rx="22" ry="17"/>`)}${bowlWater(0, 0, 36.3, 18, flush, id + "-bowl")}${box(22, -7, 27, 7, 23, 7, "cl-washlet-control")}${s.position <= 15 ? toiletLid(s.position) : svg``}${pipe(
    [
      [-17, -31, 11],
      [-30, -31, 11],
      [-30, -31, 1],
    ],
    false,
    3,
  )}`;
}
export function cleaningVisual(
  d: CatalogDevice,
  s: DeviceVisualState,
  instanceId: string,
) {
  if (!isCleaning(d)) return undefined;
  const id = `cl-${instanceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const drawing = cleaningRobot(d)
    ? robotScene(d, s)
    : [
          "smart_waste_bin",
          "waste_fill_level_sensor",
          "waste_compactor",
          "waste_chute_controller",
        ].includes(d.id)
      ? waste(d, s, id)
      : ["soap_dispenser_monitor", "paper_dispenser_monitor"].includes(d.id)
        ? dispensers(d, s, id)
        : washroom(d, s, id);
  return svg`<g class="realistic-cleaning ${s.available ? "" : "cl-unavailable"}" data-cleaning-device=${d.id} data-phase=${s.processPhase ?? "unknown"} data-operating=${s.active} data-heading=${s.speed} data-opening=${s.position} data-progress=${s.processProgress ?? 0}>${cleaningRobot(d) && d.id !== "window_cleaning_robot" ? svg`<g transform="translate(140 128) scale(1.2) translate(-140 -128)">${drawing}</g>` : drawing}</g>`;
}
