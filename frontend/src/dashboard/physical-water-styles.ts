import { css } from "lit";

export const physicalWaterStyles = css`
  .realistic-water {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .water-metal-surface {
    fill: color-mix(
      in srgb,
      var(--water-metal-top) var(--water-face-light),
      var(--water-metal-side)
    );
    stroke: none;
  }
  .water-end-face {
    fill: var(--water-metal-top);
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .water-bronze {
    --water-metal-top: color-mix(in srgb, #d1b47a 65%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #8e7449 55%, var(--iso-metal));
  }
  .water-motor-case,
  .water-pump-cast {
    --water-metal-top: color-mix(
      in srgb,
      var(--device-accent) 42%,
      var(--iso-front)
    );
    --water-metal-side: color-mix(
      in srgb,
      var(--device-accent) 35%,
      var(--iso-dark)
    );
  }
  .water-stainless {
    --water-metal-top: color-mix(in srgb, #e3edf0 70%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #8aadb4 50%, var(--iso-metal));
  }
  .water-vessel-shell {
    --water-metal-top: color-mix(in srgb, #467c8b 58%, var(--iso-front));
    --water-metal-side: color-mix(in srgb, #315861 72%, var(--iso-metal));
  }
  .water-enamel,
  .water-tank-shell {
    --water-metal-top: var(--iso-top);
    --water-metal-side: color-mix(
      in srgb,
      var(--iso-metal) 65%,
      var(--card-background-color)
    );
  }
  .water-skid .iso-top,
  .water-foot .iso-top,
  .water-foot .iso-front {
    fill: var(--iso-metal);
  }
  .water-controller .iso-front,
  .water-controller .iso-side,
  .water-terminal .iso-front,
  .water-terminal .iso-top,
  .water-terminal .iso-side {
    fill: var(--iso-dark);
  }
  .water-head-cover,
  .water-flange-face {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .water-port {
    fill: var(--iso-dark);
    stroke: var(--iso-top);
    stroke-width: 1.4;
  }
  .water-bolt {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .water-body-contour,
  .water-seam,
  .water-level-tick,
  .water-direction-mark {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .water-motor-fin,
  .water-tie-rod {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1;
    opacity: 0.7;
  }
  .water-intake-slot {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1.8;
  }
  .water-power-cable,
  .water-float-tether,
  .water-float-cable {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1.8;
    stroke-linejoin: round;
  }
  .water-safety-rope {
    fill: none;
    stroke: color-mix(in srgb, #a88d6e 65%, var(--iso-outline));
    stroke-width: 0.8;
  }
  .water-coupling {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .water-coupling-groove {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1.5;
  }
  .water-coupling-guard .iso-front,
  .water-coupling-guard .iso-top,
  .water-coupling-guard .iso-side {
    fill: color-mix(in srgb, var(--iso-front) 15%, transparent);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .water-shaft-rotation {
    transform-origin: 0 0;
  }
  .water-submersible-rotating,
  .water-motor-running .water-shaft-rotation {
    animation: physical-spin var(--water-rotation, 1s) linear infinite;
  }
  .water-run-led {
    fill: var(--device-accent);
    stroke: var(--iso-top);
    stroke-width: 0.6;
  }
  .water-idle-led {
    fill: var(--iso-dark);
    stroke: var(--iso-metal);
    stroke-width: 0.6;
  }
  .water-operating .water-run-led {
    animation: water-running 2s ease-in-out infinite;
  }
  .water-cutaway {
    fill: color-mix(in srgb, #e8f5f5 30%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .water-liquid-body {
    fill: color-mix(in srgb, #4aabc0 58%, var(--iso-front));
    stroke: #519baa;
    stroke-width: 0.5;
  }
  .water-level-line {
    fill: none;
    stroke: #d7f6f4;
    stroke-width: 1;
  }
  .water-air-chamber {
    fill: color-mix(in srgb, #b9c9d5 32%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .water-diaphragm {
    fill: var(--iso-dark);
    stroke: var(--iso-metal);
    stroke-width: 0.8;
  }
  .water-float-shell {
    fill: color-mix(in srgb, #dbb566 78%, var(--iso-top));
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .water-float-seam {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .water-counterweight .iso-front,
  .water-counterweight .iso-top {
    fill: var(--iso-dark);
  }
  .water-thermal-window {
    fill: color-mix(in srgb, #b3d6dc 30%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .water-element-hot {
    fill: none;
    stroke: #db9564;
    stroke-width: 3;
    animation: water-heating 2s ease-in-out infinite;
  }
  .water-convection {
    fill: none;
    stroke: #d5a17c;
    stroke-width: 1;
    stroke-dasharray: 4 5;
    animation: water-convection 2.8s linear infinite;
  }
  .water-hot-port .iso-top,
  .water-hot-port .iso-front {
    fill: #b77969;
  }
  .water-cold-port .iso-top,
  .water-cold-port .iso-front {
    fill: #6496b0;
  }
  .water-transmitter .iso-front,
  .water-meter-register .iso-front {
    fill: color-mix(in srgb, var(--device-accent) 25%, var(--iso-front));
  }
  .water-meter-lid .iso-top {
    fill: color-mix(in srgb, var(--iso-metal) 45%, var(--iso-top));
  }
  .water-electrode .iso-front,
  .water-electrode .iso-top {
    fill: var(--iso-metal);
  }
  .water-leak-puck .iso-front,
  .water-leak-puck .iso-top {
    fill: var(--iso-top);
  }
  .water-sensing-cable {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 3.4;
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-dasharray: 2.5 1;
  }
  .water-leak-puddle {
    fill: color-mix(in srgb, #54a8bd 28%, transparent);
    stroke: #65a2ae;
    stroke-width: 0.6;
    animation: water-wet 2.6s ease-in-out infinite;
  }
  .water-alarm-led {
    fill: #d46750;
    stroke: var(--iso-top);
    stroke-width: 0.6;
  }
  @keyframes water-running {
    50% {
      opacity: 0.5;
    }
  }
  @keyframes water-heating {
    50% {
      stroke: #e8b380;
    }
  }
  @keyframes water-convection {
    to {
      stroke-dashoffset: 18;
    }
  }
  @keyframes water-wet {
    50% {
      opacity: 0.65;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-water * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
