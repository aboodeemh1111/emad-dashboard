import { svg } from "lit";
import type { CatalogDevice } from "./device-catalog";
import type { DeviceVisualState } from "./device-visual-state";
import {
  box,
  circleFace,
  display,
  line3,
  pipe,
  polygon3,
  project,
  wheel,
} from "./isometric-primitives";

const front = (
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
const deck = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  cls: string,
) =>
  polygon3(
    [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + d, z],
      [x, y + d, z],
    ],
    cls,
  );

/** Door leaves move in the entrance's own x/z plane and stay inside its aperture. */
function doors(
  w: number,
  y: number,
  z: number,
  h: number,
  opening: number,
  mechanism: "center" | "vertical" | "hatch",
) {
  const [px, py] = project([0, y, 0]);
  return svg`<g class="lift-door-plane" transform="matrix(.92 .46 0 -1 ${px} ${py})">
    <svg class="lift-door-aperture" x=${-w / 2} y=${z} width=${w} height=${h} viewBox="${-w / 2} ${z} ${w} ${h}" overflow="hidden">
      ${
        mechanism === "center"
          ? [-1, 1].map((side) => {
              const x = side < 0 ? -w / 2 : 0;
              return svg`<g class="lift-door-leaf" style="transform:translateX(${(side * opening * w) / 2}px)">
          <rect class="lift-steel-panel" x=${x} y=${z} width=${w / 2} height=${h}/>
          <rect class="lift-steel-sheen" x=${x + 3} y=${z + 1} width=${w * 0.12} height=${h - 2}/>
          ${[0.36, 0.7].map((k) => svg`<path class="lift-metal-grain" d="M${x + (w / 2) * k} ${z + 2}v${h - 4}"/>`)}
          <path class="lift-door-edge" d="M${side < 0 ? -0.5 : 0.5} ${z}v${h}"/>
        </g>`;
            })
          : mechanism === "vertical"
            ? [-1, 1].map((side) => {
                const bottom = side < 0 ? z : z + h / 2;
                return svg`<g class="lift-door-leaf freight-door" style="transform:translateY(${(side * opening * h) / 2}px)">
          <rect class="lift-freight-panel" x=${-w / 2} y=${bottom} width=${w} height=${h / 2}/>
          ${[1, 2, 3, 4, 5].map((i) => svg`<path class="lift-door-rib" d="M${-w / 2 + 2} ${bottom + (i * h) / 12}h${w - 4}"/>`)}
          <path class="lift-door-reinforcement" d="M${-w * 0.3} ${bottom + 2}v${h / 2 - 4}m${w * 0.6} 0v${4 - h / 2}"/>
          <rect class="lift-door-grip" x="-7" y=${side < 0 ? z + h / 2 - 5 : z + h / 2 + 3} width="14" height="2" rx="1"/>
        </g>`;
              })
            : svg`<g class="lift-door-leaf" style="transform:translateY(${opening * h}px)">
        <rect class="lift-steel-panel" x=${-w / 2} y=${z} width=${w} height=${h}/>
        <rect class="lift-steel-sheen" x=${-w * 0.3} y=${z + 1} width=${w * 0.2} height=${h - 2}/>
        <rect class="lift-door-grip" x="-9" y=${z + 7} width="18" height="2" rx="1"/>
      </g>`
      }
    </svg>
    <path class="lift-track" d="M${-w / 2} ${z - 0.8}h${w}m${-w} ${h + 2.4}h${w}"/>
  </g>`;
}

function enclosedLift(device: CatalogDevice, state: DeviceVisualState) {
  const service = device.id === "service_elevator";
  const freight = device.id === "freight_elevator";
  const hatch = device.id === "dumbwaiter";
  const w = freight ? 94 : service ? 86 : hatch ? 64 : 76;
  const d = freight ? 62 : service ? 58 : hatch ? 36 : 48;
  const x = -w / 2;
  const back = -d / 2;
  const y = d / 2;
  const sill = hatch ? 49 : 9;
  const top = hatch ? 103 : 111;
  const clear = w - 22;
  const open = state.open ? 1 : 0;
  const floor = Math.max(1, Math.min(hatch ? 4 : 8, state.floor));
  return svg`<g class="realistic-elevator ${freight ? "freight-lift" : service ? "service-lift" : hatch ? "dumbwaiter-lift" : "passenger-lift"}" data-lift-type=${device.id} transform="translate(140 145) scale(.86) translate(-140 -128)">
    ${box(x - 3, back - 3, 0, w + 6, d + 9, 6, "lift-foundation")}
    ${front(x + 4, back + 1, sill, w - 8, top - sill, "lift-back-wall")}
    ${polygon3(
      [
        [x + 4, back + 1, sill],
        [x + 4, y, sill],
        [x + 4, y, top],
        [x + 4, back + 1, top],
      ],
      "lift-inner-wall",
    )}
    ${deck(x + 4, back + 1, sill, w - 8, d - 1, "lift-cabin-floor")}
    ${
      hatch
        ? box(x + 4, back + 2, 74, w - 8, d - 3, 2, "lift-shelf")
        : freight || service
          ? svg`
      ${[35, 57].map((z) => box(x + 5, back + 2, z, w - 10, 2, 4, "lift-bumper"))}
      ${[35, 57].map((z) => box(x + 4, back + 2, z, 2, d - 4, 4, "lift-bumper"))}
      ${Array.from({ length: 7 }, (_, i) =>
        line3(
          [
            [x + 7 + (i * (w - 14)) / 7, back + 3, sill + 0.3],
            [x + 7 + (i * (w - 14)) / 7, y - 1, sill + 0.3],
          ],
          "lift-floor-groove",
        ),
      )}
    `
          : svg`
      ${front(x + 16, back + 1.2, 55, w - 32, 45, "lift-mirror")}
      ${line3(
        [
          [x + 18, back + 1.3, 61],
          [x + 30, back + 1.3, 92],
        ],
        "lift-reflection",
      )}
      ${pipe(
        [
          [x + 8, back + 3, 49],
          [w / 2 - 8, back + 3, 49],
        ],
        false,
        2,
      )}
      ${pipe(
        [
          [x + 6, back + 7, 49],
          [x + 6, y - 5, 49],
        ],
        false,
        2,
      )}
    `
    }
    ${deck(x + 4, back + 1, top, w - 8, d - 1, "lift-ceiling")}
    ${deck(x + 12, back + 8, top - 0.2, w - 24, 3, "lift-ceiling-light")}
    ${deck(x + 12, y - 12, top - 0.2, w - 24, 3, "lift-ceiling-light")}
    ${box(w / 2 - 4, back, sill, 4, d, top - sill, "lift-side-casing")}
    ${hatch ? box(x, back, 6, w, d, sill - 6, "lift-lower-casing") : svg``}
    ${doors(clear, y + 0.7, sill, top - sill, open, freight ? "vertical" : hatch ? "hatch" : "center")}
    ${box(x, y, sill, 11, 5, top - sill, "lift-jamb")}
    ${box(w / 2 - 11, y, sill, 11, 5, top - sill, "lift-jamb")}
    ${box(x, y, top, w, 5, 11, "lift-header")}
    ${box(x, back, top + 11, w, d + 5, 4, "lift-roof")}
    ${box(-clear / 2, y - 0.2, sill - 2, clear, 9, 2, "lift-sill")}
    ${line3(
      [
        [-clear / 2, y + 2, sill + 0.1],
        [clear / 2, y + 2, sill + 0.1],
      ],
      "lift-sill-groove",
    )}
    ${line3(
      [
        [-clear / 2, y + 4, sill + 0.1],
        [clear / 2, y + 4, sill + 0.1],
      ],
      "lift-sill-groove",
    )}
    ${display(-11, y + 5.2, top + 2, 22, 7, String(state.floor))}
    ${front(w / 2 - 8.5, y + 5.1, hatch ? 66 : 50, 6, 23, "lift-call-plate")}
    ${circleFace(w / 2 - 5.5, y + 5.2, hatch ? 82 : 66, 1.6, "lift-call-button")}
    ${circleFace(w / 2 - 5.5, y + 5.2, hatch ? 74 : 58, 1.6, "lift-call-button")}
    ${freight ? [x + 1, w / 2 - 9].map((edge) => front(edge, y + 5.2, sill + 2, 7, 7, "lift-caution")) : svg``}
    ${line3(
      [
        [w / 2 + 0.3, back + 6, 18],
        [w / 2 + 0.3, back + 6, top - 5],
      ],
      "lift-position-rail",
    )}
    <g class="lift-position-marker numeric-display" style="transform:translateY(${-(floor - 1) * ((top - 27) / (hatch ? 3 : 7))}px)">
      ${polygon3(
        [
          [w / 2 + 0.4, back + 3, 18],
          [w / 2 + 0.4, back + 9, 18],
          [w / 2 + 0.4, back + 9, 22],
          [w / 2 + 0.4, back + 3, 22],
        ],
        "lift-position-light",
      )}
    </g>
  </g>`;
}

function accessibleLift(device: CatalogDevice, state: DeviceVisualState) {
  const wheelchair = device.id === "wheelchair_lift";
  const rise = Math.max(0, Math.min(7, state.floor - 1)) * 2.7;
  const open = state.open ? 1 : 0;
  return svg`<g class="realistic-elevator open-platform-lift" data-lift-type=${device.id} transform="translate(140 145) scale(.92) translate(-140 -128)">
    ${box(-44, -30, 0, 88, 60, 5, "lift-foundation")}
    ${box(-42, -28, 5, 9, 56, 97, "lift-guide-tower")}
    ${box(-32, -25, 5, 2, 49, 93, "lift-guide-rail")}
    ${box(-43, -28, 102, 11, 56, 4, "lift-guide-cap")}
    <g class="lift-moving-platform" style="transform:translateY(${-rise}px)">
      ${box(-35, -25, 6, 74, 50, 5, "lift-platform-deck")}
      ${polygon3(
        [
          [-34, -24, 11],
          [38, -24, 11],
          [38, -24, 53],
          [-34, -24, 53],
        ],
        "lift-guard-glass",
      )}
      ${polygon3(
        [
          [38, -24, 11],
          [38, 25, 11],
          [38, 25, 53],
          [38, -24, 53],
        ],
        "lift-guard-glass",
      )}
      ${[-33, 36].map((x) =>
        pipe(
          [
            [x, -23, 12],
            [x, -23, 55],
            [x, 24, 55],
          ],
          false,
          2.4,
        ),
      )}
      ${pipe(
        [
          [-32, -23, 55],
          [37, -23, 55],
        ],
        false,
        2.4,
      )}
      <g class="lift-platform-gate" style="transform:translate(${open * -18}px,${open * 9}px)">
        ${front(-30, 25.6, 13, 63, 38, "lift-guard-glass")}
        ${pipe(
          [
            [-30, 26, 14],
            [-30, 26, 53],
            [33, 26, 53],
            [33, 26, 14],
          ],
          false,
          2.4,
        )}
      </g>
      ${box(-30, -15, 47, 7, 13, 7, "lift-platform-console")}
      ${circleFace(-26, -0.8, 51, 1.4, "status-led")}
      ${
        wheelchair
          ? svg`
        ${wheel(9, -6, 24, 11)}${wheel(9, 13, 24, 11)}
        ${box(-10, -9, 29, 23, 24, 4, "lift-wheelchair-seat")}
        ${box(-10, -10, 32, 4, 25, 23, "lift-wheelchair-back")}
        ${pipe(
          [
            [9, 14, 25],
            [20, 14, 16],
            [28, 14, 16],
          ],
          false,
          2,
        )}
        ${pipe(
          [
            [-7, 15, 43],
            [17, 15, 43],
            [17, 15, 31],
          ],
          false,
          2,
        )}
      `
          : svg``
      }
    </g>
    ${
      wheelchair
        ? polygon3(
            [
              [-32, 27, 5],
              [35, 27, 5],
              [35, 44, 0],
              [-32, 44, 0],
            ],
            "lift-access-ramp",
          )
        : svg``
    }
    ${display(-40, 28.2, 78, 7, 10, String(state.floor))}
  </g>`;
}

function vehicleLift(state: DeviceVisualState) {
  const [gateX, gateY] = project([54, 0, 0]);
  const rise = Math.max(0, Math.min(7, state.floor - 1)) * 3.2;
  return svg`<g class="realistic-elevator vehicle-platform-lift" data-lift-type="vehicle_lift" transform="translate(140 145) scale(.86) translate(-140 -128)">
    ${box(-60, -34, 0, 120, 68, 4, "lift-foundation")}
    ${[-55, 49].flatMap((x) =>
      [-29, 24].map(
        (y) => svg`
      ${box(x, y, 4, 6, 6, 96, "lift-guide-tower")}
      ${line3(
        [
          [x + 3, y + 6.2, 9],
          [x + 3, y + 6.2, 94],
        ],
        "lift-guide-rail",
      )}
      ${box(x - 1, y - 1, 100, 8, 8, 4, "lift-guide-cap")}
    `,
      ),
    )}
    <g class="lift-moving-platform" style="transform:translateY(${-rise}px)">
      ${box(-54, -28, 7, 108, 56, 5, "lift-platform-deck")}
      ${[-22, 12].map((y) => box(-51, y, 12, 102, 10, 2, "lift-vehicle-runway"))}
      ${[-28, 26].map((y) =>
        pipe(
          [
            [-49, y, 14],
            [49, y, 14],
          ],
          false,
          2,
        ),
      )}
      ${box(-33, -18, 21, 67, 36, 13, "lift-vehicle-body")}
      ${box(-11, -17, 34, 30, 34, 14, "lift-vehicle-roof")}
      ${polygon3(
        [
          [19, -16, 35],
          [27, -16, 35],
          [18, -16, 47],
          [-9, -16, 47],
          [-17, -16, 35],
        ],
        "lift-vehicle-glass",
      )}
      ${front(-9, 17.2, 37, 25, 9, "lift-vehicle-glass")}
      ${[-22, 23].map((x) => svg`${wheel(x, -18, 20, 7)}${wheel(x, 18.3, 20, 7)}`)}
      ${front(28, 18.4, 29, 5, 3, "lift-ceiling-light")}
      ${[-27, 23].map((y) => box(52, y, 14, 4, 4, 30, "lift-safety-post"))}
      <g transform="matrix(-.92 .46 0 -1 ${gateX} ${gateY})">
        <g class="lift-vehicle-gate" style="transform:rotate(${state.open ? 90 : 0}deg);transform-origin:-25px 43px">
          <path class="lift-safety-arm" d="M-25 43H25"/>
          ${[-15, -3, 9, 21].map((y) => svg`<path class="lift-safety-stripe" d="M${y} 43h4"/>`)}
        </g>
      </g>
    </g>
    ${[-22, 12].map((y) =>
      polygon3(
        [
          [54, y, 7],
          [72, y, 0],
          [72, y + 10, 0],
          [54, y + 10, 7],
        ],
        "lift-access-ramp",
      ),
    )}
    ${box(54, 19, 35, 8, 10, 26, "lift-platform-console")}
    ${display(55, 29.2, 49, 6, 9, String(state.floor))}
  </g>`;
}

export function elevatorVisual(
  device: CatalogDevice,
  state: DeviceVisualState,
) {
  if (device.id === "vehicle_lift") return vehicleLift(state);
  if (device.id === "platform_lift" || device.id === "wheelchair_lift") {
    return accessibleLift(device, state);
  }
  return enclosedLift(device, state);
}
