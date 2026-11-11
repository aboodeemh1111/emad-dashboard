import { css } from "lit";

export const physicalCleaningStyles = css`
  :host([library-preview]) .device-element[data-category="cleaning"] {
    height: auto;
    overflow: visible;
  }
  .device-element[data-category="cleaning"] .iso-scene {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 280/190;
    max-block-size: 290px;
    flex-shrink: 0;
  }
  .device-element[data-category="cleaning"] :is(button, input[type="range"]) {
    min-block-size: 44px;
  }
  .realistic-cleaning {
    --cl-ink: var(--iso-outline);
    --cl-white: color-mix(in srgb, #f0f4ec 80%, var(--iso-front));
    --cl-steel: color-mix(in srgb, #aabeb4 65%, var(--iso-metal));
    --cl-dark: color-mix(in srgb, #284239 85%, var(--iso-dark));
    --cl-mint: #89bba6;
    --cl-water: #79bac5;
  }
  .realistic-cleaning * {
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
  }
  .realistic-cleaning :is(.iso-front, .iso-side, .iso-top) {
    stroke: var(--cl-ink);
    stroke-width: 0.8;
  }
  .realistic-cleaning
    :is(
      .cl-robot-shell,
      .cl-robot-lid,
      .cl-service-shell,
      .cl-window-robot,
      .cl-security-shell,
      .cl-security-collar,
      .cl-dispenser-case,
      .cl-dock-tower
    )
    .iso-front {
    fill: var(--cl-white);
  }
  .realistic-cleaning
    :is(
      .cl-robot-shell,
      .cl-service-shell,
      .cl-window-robot,
      .cl-security-shell,
      .cl-dispenser-case,
      .cl-dock-tower
    )
    .iso-side {
    fill: var(--cl-steel);
  }
  .realistic-cleaning
    :is(
      .cl-robot-shell,
      .cl-robot-lid,
      .cl-service-shell,
      .cl-window-robot,
      .cl-security-shell,
      .cl-security-collar,
      .cl-dispenser-case,
      .cl-dock-tower
    )
    .iso-top {
    fill: color-mix(in srgb, #fff 80%, var(--iso-top));
  }
  .realistic-cleaning
    :is(
      .cl-steel-cabinet,
      .cl-chrome,
      .cl-chute-duct,
      .cl-hydraulic-cylinder,
      .cl-piston-rod,
      .cl-console,
      .cl-foot
    )
    .iso-front {
    fill: var(--cl-steel);
  }
  .realistic-cleaning
    :is(
      .cl-steel-cabinet,
      .cl-chrome,
      .cl-chute-duct,
      .cl-hydraulic-cylinder,
      .cl-piston-rod,
      .cl-console,
      .cl-foot
    )
    .iso-side {
    fill: color-mix(in srgb, #637d70 60%, var(--cl-steel));
  }
  .realistic-cleaning
    :is(
      .cl-steel-cabinet,
      .cl-chrome,
      .cl-chute-duct,
      .cl-hydraulic-cylinder,
      .cl-piston-rod,
      .cl-console,
      .cl-foot
    )
    .iso-top {
    fill: color-mix(in srgb, #edf4e9 75%, var(--cl-steel));
  }
  .realistic-cleaning
    :is(
      .cl-small-dock,
      .cl-lidar,
      .cl-lidar-cap,
      .cl-bumper-case,
      .cl-tank-cap,
      .cl-camera-case,
      .cl-camera-dome,
      .cl-paper-slot
    )
    :is(.iso-front, .iso-side, .iso-top) {
    fill: var(--cl-dark);
    stroke: #7b9787;
    stroke-width: 0.65;
  }
  .realistic-cleaning
    :is(.cl-inner, .cl-sensor-mask, .cl-optic, .cl-bumper, .cl-dock-grille) {
    fill: var(--cl-dark);
    stroke: var(--cl-ink);
    stroke-width: 0.7;
  }
  .cl-tire {
    fill: #2e3f35;
    stroke: #708176;
    stroke-width: 1.3;
  }
  .cl-rim {
    fill: var(--cl-steel);
    stroke: #344d3e;
    stroke-width: 0.75;
  }
  .cl-spoke {
    fill: none;
    stroke: #34533f;
    stroke-width: 0.8;
  }
  .cl-wheel-rotor,
  .cl-brush,
  .cl-window-pad {
    transform-origin: 0 0;
  }
  .cl-wheel-turn {
    animation: cl-turn 1.2s linear infinite;
  }
  .cl-brush-turn {
    animation: cl-turn 0.85s linear infinite;
  }
  .cl-pad-turn {
    animation: cl-turn 1.8s linear infinite;
  }
  .cl-bristle {
    fill: none;
    stroke: #4c6d52;
    stroke-width: 1.2;
  }
  .cl-brush-hub {
    fill: #789f87;
    stroke: #4c6d52;
    stroke-width: 0.6;
  }
  .cl-mop-pad {
    fill: #b0c7b8;
    stroke: #6d927d;
    stroke-width: 1.2;
  }
  .cl-pad-rib {
    fill: none;
    stroke: #dce9db;
    stroke-width: 0.7;
  }
  .cl-button {
    fill: none;
    stroke: #5a7f65;
    stroke-width: 1;
  }
  .cl-status-ring {
    fill: none;
    stroke: #b0c4b1;
    stroke-width: 1;
  }
  .cl-status-on {
    stroke: #74b496;
    filter: drop-shadow(0 0 1.5px #81bea1);
  }
  .cl-line,
  .cl-seam,
  .cl-vent {
    fill: none;
    stroke: var(--cl-ink);
    stroke-width: 0.8;
  }
  .cl-vent {
    stroke-width: 1.1;
  }
  .cl-route {
    fill: none;
    stroke: #9bb8aa;
    stroke-width: 0.65;
    stroke-dasharray: 2 3;
    opacity: 0.5;
  }
  .cl-route-swept {
    fill: none;
    stroke: #65a78c;
    stroke-width: 2;
    opacity: 0.5;
  }
  .cl-wet-trail {
    stroke: #7eb5bb;
    stroke-width: 9;
    opacity: 0.18;
  }
  .cl-debris {
    fill: #a29773;
    stroke: #766e50;
    stroke-width: 0.4;
  }
  .realistic-cleaning .cl-clean-tank :is(.iso-front, .iso-top) {
    fill: #b0d7d5;
    fill-opacity: 0.7;
  }
  .realistic-cleaning .cl-recovery-tank :is(.iso-front, .iso-top) {
    fill: #a6b5a2;
  }
  .cl-recovery-hose,
  .cl-push-handle,
  .cl-handle,
  .cl-tank-handle {
    fill: none;
    stroke: var(--cl-ink);
    stroke-width: 2;
    stroke-linecap: round;
  }
  .cl-recovery-hose {
    stroke: #63796b;
    stroke-width: 2.5;
  }
  .cl-squeegee {
    fill: none;
    stroke: #4b6752;
    stroke-width: 4;
    stroke-linecap: round;
  }
  .cl-water-window {
    fill: #9fcdd0;
    stroke: #5c8b86;
    stroke-width: 0.6;
  }
  .cl-door-skin,
  .cl-bin-lid,
  .cl-chute-hatch {
    fill: var(--cl-white);
    stroke: var(--cl-ink);
    stroke-width: 1;
  }
  .cl-clear-guard {
    fill: color-mix(in srgb, #9fc9bc 12%, transparent);
    stroke: #6d8f7d;
    stroke-width: 0.8;
  }
  .cl-gasket {
    fill: none;
    stroke: #849d89;
    stroke-width: 0.7;
  }
  .cl-lock-dot {
    fill: #89b49a;
    stroke: #456b4f;
    stroke-width: 0.5;
  }
  .realistic-cleaning .cl-parcel :is(.iso-front, .iso-side, .iso-top) {
    fill: #d5caa6;
    stroke: #978d68;
    stroke-width: 0.65;
  }
  .cl-camera-rim {
    fill: var(--cl-steel);
    stroke: #395948;
    stroke-width: 1.1;
  }
  .cl-lens {
    fill: #204038;
    stroke: #81a89b;
    stroke-width: 1;
  }
  .cl-lens-glint {
    fill: #accfc4;
    stroke: none;
  }
  .cl-antenna {
    fill: none;
    stroke: #536c5c;
    stroke-width: 2;
    stroke-linecap: round;
  }
  .cl-stop-button {
    fill: #c67e6b;
    stroke: #82564c;
    stroke-width: 0.65;
  }
  .cl-scan-ring {
    fill: none;
    stroke: #7bad98;
    stroke-width: 1;
    stroke-dasharray: 8 11;
  }
  .cl-scanning {
    animation: cl-dash 2.4s linear infinite;
  }
  .cl-inspection-lamp {
    fill: #a9beaa;
    stroke: #5b7662;
    stroke-width: 0.6;
  }
  .cl-lamp-on {
    fill: #ecdfac;
    filter: drop-shadow(0 0 2px #ded5a5);
  }
  .cl-window-frame .iso-front {
    fill: #dce9e0;
  }
  .cl-window-frame .iso-side {
    fill: #a3bdb0;
  }
  .cl-window-frame .iso-top {
    fill: #edf4e9;
  }
  .cl-window-pane {
    fill: color-mix(in srgb, #a3c9c3 26%, transparent);
    stroke: #81a59b;
    stroke-width: 0.8;
  }
  .cl-reflection {
    fill: none;
    stroke: #eef9f0;
    stroke-width: 2;
    opacity: 0.7;
  }
  .cl-window-route {
    fill: none;
    stroke: #8dbbaa;
    stroke-width: 3;
    opacity: 0.18;
  }
  .cl-suction-gasket {
    fill: #55796a;
    stroke: #345347;
    stroke-width: 1.3;
  }
  .cl-tether {
    fill: none;
    stroke: #8c977f;
    stroke-width: 1.4;
    stroke-dasharray: 2 1;
    stroke-linecap: round;
  }
  .cl-anchor {
    fill: var(--cl-steel);
    stroke: var(--cl-ink);
    stroke-width: 1.2;
  }
  .realistic-cleaning
    :is(.cl-dock-pad, .cl-bin-body, .cl-window-frame, .cl-dock-tank)
    .iso-front {
    fill: color-mix(in srgb, #aac7b4 45%, var(--iso-front));
  }
  .realistic-cleaning :is(.cl-dock-pad, .cl-bin-body, .cl-dock-tank) .iso-side {
    fill: #8aa99a;
  }
  .realistic-cleaning :is(.cl-dock-pad, .cl-bin-body, .cl-dock-tank) .iso-top {
    fill: #dbe8da;
  }
  .realistic-cleaning .cl-charge-contact :is(.iso-front, .iso-top, .iso-side) {
    fill: #c0ac69;
    stroke: #8a8155;
    stroke-width: 0.55;
  }
  .cl-led {
    fill: #8caa95;
    stroke: #506e59;
    stroke-width: 0.6;
  }
  .cl-lit {
    fill: #78bd98;
    filter: drop-shadow(0 0 1.5px #86c9a3);
  }
  .realistic-cleaning .cl-waste-piece :is(.iso-front, .iso-top, .iso-side) {
    fill: #9daf95;
    stroke: #6d8265;
    stroke-width: 0.6;
  }
  .realistic-cleaning .cl-cardboard :is(.iso-front, .iso-side, .iso-top) {
    fill: #cec29c;
    stroke: #948866;
    stroke-width: 0.6;
  }
  .cl-crumple {
    fill: #b5bca2;
    stroke: #7d8a6f;
    stroke-width: 0.5;
  }
  .cl-fill-line {
    fill: none;
    stroke: #73a591;
    stroke-width: 1.2;
    stroke-dasharray: 2 2;
  }
  .cl-unknown-mark {
    stroke: #98ad9d;
    stroke-width: 1;
    fill: none;
    stroke-dasharray: 3 3;
  }
  .realistic-cleaning
    :is(.cl-press-platen, .cl-chamber-floor, .cl-soap-pump)
    .iso-front {
    fill: #a4b9aa;
  }
  .realistic-cleaning
    :is(.cl-press-platen, .cl-chamber-floor, .cl-soap-pump)
    .iso-side {
    fill: #6c8775;
  }
  .realistic-cleaning
    :is(.cl-press-platen, .cl-chamber-floor, .cl-soap-pump)
    .iso-top {
    fill: #d7e4d4;
  }
  .realistic-cleaning .cl-pedal :is(.iso-front, .iso-side, .iso-top) {
    fill: #7e9985;
  }
  .cl-chute-window {
    fill: color-mix(in srgb, #405b48 55%, transparent);
    stroke: #688771;
    stroke-width: 0.9;
  }
  .cl-chute-drop > g {
    animation: cl-drop 1.5s ease-in infinite;
    animation-delay: var(--cl-delay, 0s);
  }
  .realistic-cleaning .cl-ultrasonic-head :is(.iso-front, .iso-side, .iso-top) {
    fill: #99b8a9;
  }
  .realistic-cleaning .cl-transducer :is(.iso-front, .iso-top) {
    fill: #3a6057;
  }
  .cl-sensor-bracket {
    fill: none;
    stroke: #829a8a;
    stroke-width: 2;
  }
  .cl-ultrasonic-cone {
    fill: none;
    stroke: #78a7b1;
    stroke-width: 0.7;
    stroke-dasharray: 2 3;
    opacity: 0.5;
  }
  .cl-sonar-pulse ellipse {
    fill: none;
    stroke: #6aaab3;
    stroke-width: 1;
    animation: cl-sonar 1.2s ease-out infinite;
  }
  .cl-frosted-window {
    fill: color-mix(in srgb, #afcbb7 24%, transparent);
    stroke: #88a593;
    stroke-width: 0.8;
  }
  .cl-paper-roll {
    --water-metal-top: #eef0d9;
    --water-metal-side: #b6c2a0;
  }
  .cl-paper-core {
    --water-metal-top: #8c856b;
    --water-metal-side: #706f56;
  }
  .cl-paper-sheet {
    fill: #f3f1dc;
    stroke: #a8b193;
    stroke-width: 0.6;
  }
  .cl-perforation {
    fill: none;
    stroke: #a2ab91;
    stroke-width: 0.65;
    stroke-dasharray: 1 2;
  }
  .cl-paper-tear {
    animation: cl-paper-fall 1.6s ease-in infinite;
  }
  .realistic-cleaning .cl-soap-cartridge :is(.iso-front, .iso-side, .iso-top) {
    fill: #d2ddbb;
  }
  .realistic-cleaning .cl-soap-level :is(.iso-front, .iso-side, .iso-top) {
    fill: #b2c88a;
  }
  .realistic-cleaning .cl-soap-bead :is(.iso-front, .iso-top) {
    fill: #adc88a;
    stroke: #86a165;
    stroke-width: 0.6;
  }
  .cl-soap-drop {
    animation: cl-drop 0.9s ease-in infinite;
  }
  .realistic-cleaning
    :is(
      .cl-cistern,
      .cl-porcelain-bowl,
      .cl-toilet-pedestal,
      .cl-basin-body,
      .cl-wall-mount
    )
    .iso-front {
    fill: var(--cl-white);
  }
  .realistic-cleaning
    :is(
      .cl-cistern,
      .cl-porcelain-bowl,
      .cl-toilet-pedestal,
      .cl-basin-body,
      .cl-wall-mount
    )
    .iso-side {
    fill: color-mix(in srgb, #c5d8cc 70%, var(--iso-side));
  }
  .realistic-cleaning
    :is(
      .cl-cistern,
      .cl-porcelain-bowl,
      .cl-toilet-pedestal,
      .cl-basin-body,
      .cl-wall-mount
    )
    .iso-top {
    fill: #f2f5ec;
  }
  .cl-ceramic,
  .cl-seat,
  .cl-urinal-shell,
  .cl-lid-skin {
    fill: var(--cl-white);
    stroke: var(--cl-ink);
    stroke-width: 1;
  }
  .cl-lid-seam {
    fill: none;
    stroke: #adbcad;
    stroke-width: 0.75;
  }
  .cl-basin-interior,
  .cl-bowl-interior,
  .cl-urinal-interior {
    fill: #b9d0c2;
    stroke: #87a494;
    stroke-width: 0.85;
  }
  .cl-bowl-water {
    fill: #9bcad0;
    fill-opacity: 0.6;
    stroke: #79aab3;
    stroke-width: 0.6;
  }
  .cl-drain {
    fill: #5d8375;
    stroke: #b1c8b9;
    stroke-width: 0.6;
  }
  .cl-water-swirl {
    fill: none;
    stroke: #d4f2ee;
    stroke-width: 2;
    stroke-dasharray: 13 6;
    opacity: 0;
  }
  .cl-swirling .cl-water-swirl {
    opacity: 0.8;
    animation: cl-dash 0.8s linear infinite;
  }
  .cl-level-window {
    fill: #b6c9b4;
    fill-opacity: 0.3;
    stroke: #87a38d;
    stroke-width: 0.7;
  }
  .cl-cistern-water {
    fill: #8abfc6;
    opacity: 0.65;
  }
  .realistic-cleaning
    :is(.cl-flush-button, .cl-washlet-control, .cl-flush-valve, .cl-aerator)
    :is(.iso-front, .iso-side, .iso-top) {
    fill: var(--cl-steel);
  }
  .cl-urinal-film,
  .cl-tap-stream {
    fill: none;
    stroke: #a7dce0;
    stroke-width: 1.5;
    stroke-dasharray: 4 2;
    animation: cl-dash 0.6s linear infinite;
  }
  .cl-tap-stream {
    stroke-width: 2;
  }
  .cl-example-hand {
    fill: #c8bd9c;
    stroke: #9c967b;
    stroke-width: 0.8;
  }
  .cl-unavailable {
    opacity: 0.5;
  }
  @keyframes cl-turn {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes cl-dash {
    to {
      stroke-dashoffset: -38;
    }
  }
  @keyframes cl-drop {
    0% {
      opacity: 0;
      transform: translateY(0);
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translateY(23px);
      opacity: 0;
    }
  }
  @keyframes cl-paper-fall {
    0%,
    15% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(21px);
      opacity: 0;
    }
  }
  @keyframes cl-sonar {
    from {
      transform: scale(0.3);
      opacity: 0.8;
    }
    to {
      transform: scale(1.3);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-cleaning * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
