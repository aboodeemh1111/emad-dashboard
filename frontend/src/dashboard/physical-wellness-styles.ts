import { css } from "lit";

export const physicalWellnessStyles = css`
  :host([library-preview]) .device-element[data-category="pool"] {
    height: auto;
    overflow: visible;
  }
  .device-element[data-category="pool"] .iso-scene {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 280/190;
    max-block-size: 290px;
    flex-shrink: 0;
  }
  .device-element[data-category="pool"]
    :is(button, input[type="range"], input[type="color"], .swatch) {
    min-block-size: 44px;
  }
  .device-element[data-category="pool"] .swatch {
    min-inline-size: 44px;
    border-radius: 50%;
  }
  .device-element[data-category="pool"] input[type="color"] {
    min-inline-size: 44px;
  }
  .device-element[data-category="pool"] .colors {
    flex-wrap: wrap;
  }
  .realistic-wellness {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
    --wl-water: #56adbc;
    --wl-steel: color-mix(in srgb, #a8b8b7 55%, var(--iso-metal));
  }
  .realistic-wellness * {
    vector-effect: non-scaling-stroke;
  }
  .wl-equipment-pad :is(.iso-front, .iso-side),
  .wl-room-plinth :is(.iso-front, .iso-side) {
    fill: color-mix(in srgb, #aab4ae 65%, var(--iso-metal));
    stroke-width: 0.6;
  }
  .wl-equipment-pad .iso-top,
  .wl-room-plinth .iso-top {
    fill: color-mix(in srgb, #dce4dd 70%, var(--iso-top));
  }
  .wl-motor,
  .wl-volute,
  .wl-strainer-case {
    --water-metal-top: color-mix(in srgb, #557b76 45%, var(--iso-metal));
    --water-metal-side: color-mix(in srgb, #263c3d 65%, var(--iso-dark));
  }
  .wl-stainless,
  .wl-end-flange,
  .wl-cover-motor,
  .wl-electrode-connector,
  .wl-sauna-cage {
    --water-metal-top: color-mix(in srgb, #d7e0dc 75%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #7e9292 65%, var(--iso-metal));
  }
  .wl-pvc,
  .wl-union-nut {
    --water-metal-top: color-mix(in srgb, #eaefeb 85%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #a5b5b3 65%, var(--iso-metal));
  }
  .wl-union-nut {
    --water-metal-side: color-mix(in srgb, #728786 65%, var(--iso-metal));
  }
  .wl-lid-lock,
  .wl-multiport,
  .wl-filter-foot {
    --water-metal-top: color-mix(in srgb, #61706c 50%, var(--iso-metal));
    --water-metal-side: color-mix(in srgb, #2a3836 75%, var(--iso-dark));
  }
  .wl-fiberglass {
    --water-metal-top: color-mix(in srgb, #d9d1b0 65%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #999a7f 65%, var(--iso-metal));
  }
  .wl-cell-transparent {
    --water-metal-top: color-mix(in srgb, #99d6dc 35%, transparent);
    --water-metal-side: color-mix(in srgb, #9ac6ce 30%, transparent);
  }
  .wl-strainer-window,
  .wl-clear-lid {
    fill: color-mix(in srgb, #a2d9df 28%, transparent);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wl-basket-mesh {
    fill: none;
    stroke: color-mix(in srgb, #bbb6a3 70%, var(--iso-top));
    stroke-width: 0.8;
  }
  .wl-cooling-fin,
  .wl-coil-fin {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.65;
    opacity: 0.65;
  }
  .wl-cable {
    fill: none;
    stroke: color-mix(in srgb, #344c49 65%, var(--iso-dark));
    stroke-width: 1.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .wl-pump-feet .iso-top,
  .wl-pump-feet .iso-front {
    fill: var(--iso-dark);
  }
  .wl-screw circle,
  .wl-chrome-face {
    fill: color-mix(in srgb, #d0dcd9 70%, var(--iso-top));
    stroke: var(--iso-outline);
    stroke-width: 0.55;
  }
  .wl-screw path {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .wl-fan-recess {
    fill: color-mix(in srgb, #32494b 70%, var(--iso-dark));
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wl-fan-blade {
    fill: color-mix(in srgb, #90a6a5 65%, var(--iso-metal));
    stroke: var(--iso-outline);
    stroke-width: 0.4;
  }
  .wl-fan-guard {
    fill: none;
    stroke: color-mix(in srgb, #c1cdca 70%, var(--iso-metal));
    stroke-width: 0.55;
  }
  .wl-rotor,
  .wl-dose-rotor,
  .wl-cover-spindle {
    transform-origin: 0 0;
  }
  .wl-spinning {
    animation: wl-rotation var(--wl-cycle, 1.25s) linear infinite;
  }
  .wl-cover-turning {
    animation: wl-rotation 1.8s linear infinite;
    animation-direction: var(--wl-cover-direction, normal);
  }
  .wl-control-box :is(.iso-front, .iso-top, .iso-side),
  .wl-drive-housing :is(.iso-front, .iso-top, .iso-side) {
    fill: color-mix(in srgb, #344a47 65%, var(--iso-dark));
    stroke-width: 0.6;
  }
  .wl-controller-screen polygon {
    fill: #1d3935;
    stroke: #8caaa2;
    stroke-width: 0.5;
  }
  .wl-controller-screen .screen-label {
    fill: #dbede3;
    font-size: 6px;
    font-weight: 500;
  }
  .wl-control-key {
    fill: color-mix(in srgb, #becdc5 70%, var(--iso-top));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .wl-led-on {
    fill: #78c4a2;
    stroke: var(--iso-top);
    stroke-width: 0.45;
  }
  .wl-led-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .wl-gauge-face {
    fill: color-mix(in srgb, #f3f0e5 80%, var(--iso-top));
  }
  .wl-gauge-tick {
    fill: none;
    stroke: #687773;
    stroke-width: 0.55;
  }
  .wl-gauge-needle {
    fill: none;
    stroke: #b06d53;
    stroke-width: 1;
  }
  .wl-flowline {
    fill: none;
    stroke: #7bc9cf;
    stroke-width: 1.4;
    stroke-dasharray: 2 7;
    stroke-linecap: round;
    animation: wl-flow var(--wl-flow-speed, 1.2s) linear infinite;
  }
  .wl-plumbing .pipe-body {
    stroke: color-mix(in srgb, #d8e3de 80%, var(--iso-metal));
  }
  .wl-plumbing .pipe-edge {
    stroke: color-mix(in srgb, #697d75 65%, var(--iso-outline));
  }
  .wl-filter-cutaway,
  .wl-heater-cutaway {
    fill: color-mix(in srgb, #cde5df 35%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .wl-sand-bed {
    fill: #c4b38c;
    stroke: #b5a981;
    stroke-width: 0.45;
  }
  .wl-sand-grain {
    fill: #e2d2a7;
    stroke: none;
  }
  .wl-filter-riser {
    fill: none;
    stroke: color-mix(in srgb, #d8ded4 80%, var(--iso-top));
    stroke-width: 2.5;
  }
  .wl-valve-ring,
  .wl-roll-spiral {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wl-handle {
    fill: color-mix(in srgb, #314945 65%, var(--iso-dark));
    stroke: var(--iso-outline);
    stroke-width: 0.55;
  }
  .wl-heat-pump-case :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #e4e9e4 80%, var(--iso-top));
    stroke-width: 0.7;
  }
  .wl-heat-pump-case .iso-side {
    fill: color-mix(in srgb, #829e9c 55%, var(--iso-metal));
    stroke-width: 0.7;
  }
  .wl-element-on {
    fill: none;
    stroke: #bc8b60;
    stroke-width: 1.6;
  }
  .wl-element-off {
    fill: none;
    stroke: var(--iso-metal);
    stroke-width: 1.6;
  }
  .wl-air-wisp {
    fill: none;
    stroke: var(--wl-water);
    stroke-opacity: 0.3;
    stroke-width: 1.2;
    stroke-dasharray: 3 9;
    animation: wl-flow 1.6s linear infinite;
  }
  .wl-panel-backplate :is(.iso-front, .iso-side, .iso-top),
  .wl-dosing-panel :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #dfe9e3 75%, var(--iso-top));
    stroke-width: 0.7;
  }
  .wl-dosing-panel .iso-side {
    fill: var(--iso-metal);
  }
  .wl-electrode {
    fill: color-mix(in srgb, #809a9c 65%, var(--iso-metal));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .wl-rising-bubble {
    fill: #e1f5ed;
    fill-opacity: 0.65;
    stroke: none;
    animation: wl-bubble 1.8s linear infinite;
    animation-delay: var(--wl-delay, 0s);
  }
  .wl-dose-pump-case {
    fill: color-mix(in srgb, #71979a 55%, var(--iso-metal));
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .wl-acid-line {
    --wl-chemical: #c6af7a;
  }
  .wl-sanitizer-line {
    --wl-chemical: #7db6c5;
  }
  .wl-peristaltic-tube {
    fill: none;
    stroke: var(--wl-chemical);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .wl-roller-arm {
    fill: none;
    stroke: #d4deda;
    stroke-width: 3;
  }
  .wl-dose-roller {
    fill: #c7d4ce;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wl-chemical-tube {
    fill: none;
    stroke: var(--wl-chemical);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .wl-suction-foot,
  .wl-injection-valve {
    --water-metal-top: var(--iso-metal);
    --water-metal-side: var(--iso-dark);
  }
  .wl-pool-foundation :is(.iso-front, .iso-side) {
    fill: color-mix(in srgb, #b9c8c0 65%, var(--iso-metal));
    stroke-width: 0.5;
  }
  .wl-pool-foundation .iso-top {
    fill: color-mix(in srgb, #dce7df 65%, var(--iso-top));
  }
  .wl-pool-tile :is(.iso-front, .iso-top, .iso-side),
  .wl-room-tile :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #bdd7d2 70%, var(--iso-top));
    stroke-width: 0.6;
  }
  .wl-pool-floor {
    fill: color-mix(in srgb, #a8ccd0 55%, var(--iso-top));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .wl-tile-joint {
    fill: none;
    stroke: color-mix(in srgb, #789a98 45%, var(--iso-metal));
    stroke-width: 0.45;
    opacity: 0.65;
  }
  .wl-water-depth {
    fill: #4e9dad;
    fill-opacity: 0.42;
    stroke: #539fa9;
    stroke-opacity: 0.3;
    stroke-width: 0.6;
  }
  .wl-water-surface {
    stroke: #82c3c9;
    stroke-width: 0.55;
  }
  .wl-unknown-water {
    fill: color-mix(in srgb, var(--iso-metal) 25%, transparent);
    stroke: var(--iso-outline);
    stroke-dasharray: 2 3;
    stroke-width: 0.6;
  }
  .wl-water-glint {
    fill: none;
    stroke: #d8f3ed;
    stroke-width: 0.65;
    stroke-opacity: 0.55;
    animation: wl-water 4s ease-in-out infinite alternate;
    animation-delay: var(--wl-delay, 0s);
  }
  .wl-pool-concrete :is(.iso-front, .iso-side, .iso-top) {
    fill: color-mix(in srgb, #cbd8cf 78%, var(--iso-metal));
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .wl-pool-cutaway :is(.iso-front, .iso-side, .iso-top) {
    fill: color-mix(in srgb, #a3c9c6 14%, transparent);
    stroke: color-mix(in srgb, #679b9b 60%, var(--iso-outline));
    stroke-width: 0.6;
  }
  .wl-pool-coping :is(.iso-front, .iso-top),
  .wl-cover-slat :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #e6ece2 85%, var(--iso-top));
    stroke-width: 0.6;
  }
  .wl-pool-coping .iso-side,
  .wl-cover-slat .iso-side {
    fill: color-mix(in srgb, #b1c5bd 65%, var(--iso-metal));
    stroke-width: 0.55;
  }
  .wl-cover-slat .iso-top {
    fill: color-mix(in srgb, #bdd4cd 35%, var(--iso-top));
  }
  .wl-cover-leading-edge,
  .wl-cover-support {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .wl-cover-support :is(.iso-front, .iso-top, .iso-side) {
    fill: var(--wl-steel);
    stroke-width: 0.55;
  }
  .wl-cover-roll {
    --water-metal-top: color-mix(in srgb, #d2e2d8 75%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #91ada2 70%, var(--iso-metal));
  }
  .wl-probe-head :is(.iso-top, .iso-front) {
    fill: var(--iso-top);
    stroke-width: 0.7;
  }
  .wl-level-electrode {
    fill: none;
    stroke: var(--wl-steel);
    stroke-width: 1.7;
  }
  .wl-skimmer :is(.iso-front, .iso-top) {
    fill: var(--iso-top);
    stroke-width: 0.5;
  }
  .wl-skimmer-mouth {
    fill: color-mix(in srgb, #2b5656 60%, var(--iso-dark));
    stroke: none;
  }
  .wl-pool-light-ring {
    fill: #b5ccca;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wl-pool-light-glass {
    fill: color-mix(in srgb, #8bb6bf 40%, var(--iso-metal));
    stroke: var(--iso-top);
    stroke-width: 0.5;
  }
  .wl-pool-led {
    fill: color-mix(in srgb, var(--wl-light-color) 35%, white);
    stroke: var(--iso-top);
    stroke-width: 0.7;
    filter: drop-shadow(0 0 2px var(--wl-light-color));
  }
  .wl-lit-caustic {
    fill: none;
    stroke: var(--wl-light-color);
    stroke-opacity: 0.4;
    stroke-width: 1.4;
    animation: wl-water 3.6s ease-in-out infinite alternate;
  }
  .wl-spa-skirt :is(.iso-front, .iso-side) {
    fill: color-mix(in srgb, #7d958a 65%, var(--iso-metal));
    stroke-width: 0.7;
  }
  .wl-spa-skirt .iso-top {
    fill: var(--iso-top);
  }
  .wl-spa-panel-joint {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.5;
    stroke-opacity: 0.5;
  }
  .wl-spa-headrest :is(.iso-front, .iso-top, .iso-side) {
    fill: color-mix(in srgb, #647c77 55%, var(--iso-dark));
    stroke-width: 0.5;
  }
  .wl-spa-step :is(.iso-front, .iso-top),
  .wl-spa-jet {
    fill: var(--wl-steel);
    stroke-width: 0.5;
  }
  .wl-spa-bubble {
    fill: #e7f5ed;
    fill-opacity: 0.3;
    stroke: #e1f7f3;
    stroke-width: 0.65;
    animation: wl-surface-bubble 2s ease-out infinite;
    animation-delay: var(--wl-delay, 0s);
    transform-box: fill-box;
    transform-origin: center;
  }
  .wl-fountain-stone {
    --water-metal-top: color-mix(in srgb, #d8dace 70%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #9ca99c 65%, var(--iso-metal));
  }
  .wl-fountain-water {
    fill: color-mix(in srgb, #70b8c5 60%, var(--iso-top));
    stroke: #6ab4bd;
    stroke-width: 0.6;
  }
  .wl-submersible-pump {
    --water-metal-top: #637d7a;
    --water-metal-side: #3c5555;
  }
  .wl-fountain-nozzle {
    --water-metal-top: #cbddd7;
    --water-metal-side: #8ca8a3;
  }
  .wl-intake-slot {
    fill: none;
    stroke: #bfd4cd;
    stroke-width: 0.65;
  }
  .wl-jet-body {
    fill: none;
    stroke: #72c5d0;
    stroke-width: 2.6;
    stroke-opacity: 0.8;
    stroke-linecap: round;
  }
  .wl-jet-sparkle {
    fill: none;
    stroke: #e5f7ed;
    stroke-width: 1.3;
    stroke-dasharray: 1 7;
    stroke-linecap: round;
    animation: wl-jet-flow var(--wl-flow-speed, 1s) linear infinite;
  }
  .wl-splash-ripple {
    fill: none;
    stroke: #d1f2ee;
    stroke-width: 0.7;
    opacity: 0.6;
    animation: wl-ripple 2s ease-out infinite;
    animation-delay: var(--wl-delay, 0s);
  }
  .wl-wood-wall :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #d9bb91 70%, var(--iso-top));
    stroke-width: 0.6;
  }
  .wl-wood-wall .iso-side {
    fill: color-mix(in srgb, #b99b74 65%, var(--iso-metal));
    stroke-width: 0.6;
  }
  .wl-wood-bench :is(.iso-front, .iso-top),
  .wl-wood-step :is(.iso-front, .iso-top),
  .wl-bench-leg :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #d6bd96 78%, var(--iso-top));
    stroke-width: 0.5;
  }
  .wl-wood-bench .iso-side,
  .wl-wood-step .iso-side {
    fill: color-mix(in srgb, #b49770 70%, var(--iso-metal));
    stroke-width: 0.5;
  }
  .wl-wood-joint {
    fill: none;
    stroke: #a68e6b;
    stroke-width: 0.45;
    stroke-opacity: 0.65;
  }
  .wl-tile-bench :is(.iso-front, .iso-top),
  .wl-tile-bench .iso-side {
    fill: color-mix(in srgb, #bdcfca 75%, var(--iso-top));
    stroke-width: 0.6;
  }
  .wl-sauna-stone {
    fill: color-mix(in srgb, #777e73 80%, var(--iso-metal));
    stroke: #505d53;
    stroke-width: 0.45;
  }
  .wl-heater-mesh {
    fill: none;
    stroke: #b6c5bd;
    stroke-width: 0.7;
  }
  .wl-heat-wisp {
    fill: none;
    stroke: #bc946b;
    stroke-opacity: 0.35;
    stroke-width: 1.1;
    animation: wl-convection 2.8s ease-out infinite;
    animation-delay: var(--wl-delay, 0s);
  }
  .wl-steam-wisp {
    fill: none;
    stroke: color-mix(in srgb, #c1dfd9 65%, var(--iso-top));
    stroke-width: 5;
    stroke-linecap: round;
    opacity: 0.35;
    filter: blur(1.5px);
    animation: wl-steam 3.5s ease-out infinite;
    animation-delay: var(--wl-delay, 0s);
  }
  .wl-steam-nozzle,
  .wl-room-probe {
    fill: var(--wl-steel);
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .wl-steam-port {
    fill: #6c9998;
    stroke: none;
  }
  .wl-condensation {
    fill: #c0e1df;
    fill-opacity: 0.5;
    stroke: #9bc5c4;
    stroke-width: 0.4;
  }
  .wl-glass-door-edge {
    fill: color-mix(in srgb, #b3dbdf 20%, transparent);
    stroke: #9bcdcf;
    stroke-width: 1;
  }
  .wl-door-handle,
  .wl-door-threshold {
    fill: none;
    stroke: var(--wl-steel);
    stroke-width: 1.3;
  }
  .wl-unknown .wl-controller-screen .screen-label {
    opacity: 0.65;
  }
  @keyframes wl-rotation {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes wl-flow {
    to {
      stroke-dashoffset: -18;
    }
  }
  @keyframes wl-jet-flow {
    to {
      stroke-dashoffset: -32;
    }
  }
  @keyframes wl-bubble {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    25% {
      opacity: 0.7;
    }
    to {
      transform: translateY(-8px);
      opacity: 0;
    }
  }
  @keyframes wl-water {
    to {
      transform: translate(3px, 1px);
      stroke-opacity: 0.25;
    }
  }
  @keyframes wl-surface-bubble {
    from {
      transform: scale(0.35);
      opacity: 0.2;
    }
    45% {
      opacity: 0.8;
    }
    to {
      transform: scale(1.4);
      opacity: 0;
    }
  }
  @keyframes wl-ripple {
    from {
      transform: scale(0.35);
      opacity: 0.8;
    }
    to {
      transform: scale(1.3);
      opacity: 0;
    }
  }
  @keyframes wl-convection {
    from {
      transform: translateY(2px);
      opacity: 0;
    }
    35% {
      opacity: 0.5;
    }
    to {
      transform: translateY(-9px);
      opacity: 0;
    }
  }
  @keyframes wl-steam {
    from {
      transform: translate(0, 4px) scale(0.75);
      opacity: 0;
    }
    35% {
      opacity: 0.45;
    }
    to {
      transform: translate(-5px, -16px) scale(1.35);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-wellness * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
