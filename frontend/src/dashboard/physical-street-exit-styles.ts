import { css } from "lit";

export const physicalStreetExitStyles = css`
  .device-element[data-device-type="streetlight"] .iso-scene,
  .device-element[data-device-type="exit_sign"] .iso-scene {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 280/190;
    max-block-size: 280px;
  }
  .device-element[data-device-type="streetlight"] .specific-controls button,
  .device-element[data-device-type="exit_sign"] .specific-controls button {
    min-block-size: 44px;
  }
  :host([library-preview]) .device-element[data-device-type="streetlight"],
  :host([library-preview]) .device-element[data-device-type="exit_sign"] {
    height: auto;
    overflow: visible;
  }
  .device-element[data-device-type="streetlight"] footer button,
  .device-element[data-device-type="exit_sign"] footer button,
  .device-element[data-device-type="streetlight"] input[type="range"],
  .device-element[data-device-type="exit_sign"] input[type="range"] {
    min-block-size: 44px;
  }
  .streetlight-assembly {
    --street-metal-top: color-mix(in srgb, #aebbc0 65%, var(--iso-top));
    --street-metal-side: color-mix(in srgb, #52646c 60%, var(--iso-metal));
  }
  .street-cast-top {
    fill: var(--street-metal-top);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
    stroke-linejoin: round;
  }
  .street-cast-side {
    fill: var(--street-metal-side);
    stroke: none;
  }
  .street-upper-casting {
    --street-metal-top: color-mix(in srgb, #92a0a6 55%, var(--iso-top));
    --street-metal-side: color-mix(in srgb, #5d717b 60%, var(--iso-metal));
  }
  .street-asphalt {
    fill: color-mix(in srgb, #626b6c 82%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-opacity: 0.2;
    stroke-width: 0.5;
  }
  .street-night .street-asphalt {
    fill: color-mix(in srgb, #252d31 90%, var(--card-background-color));
  }
  .street-pavement {
    fill: color-mix(in srgb, #a4aca9 65%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-opacity: 0.2;
    stroke-width: 0.5;
  }
  .street-night .street-pavement {
    fill: color-mix(in srgb, #485452 75%, var(--card-background-color));
  }
  .street-curb .iso-top,
  .street-curb .iso-front,
  .street-curb .iso-side {
    fill: color-mix(in srgb, #bec6c2 70%, var(--iso-metal));
    stroke-width: 0.4;
  }
  .street-paving-joint {
    fill: none;
    stroke: var(--iso-outline);
    stroke-opacity: 0.3;
    stroke-width: 0.5;
  }
  .street-lane-mark {
    fill: none;
    stroke: #d6dbd5;
    stroke-opacity: 0.55;
    stroke-width: 1.7;
  }
  .street-night .street-lane-mark {
    stroke-opacity: 0.3;
  }
  .street-galvanized {
    --water-metal-top: color-mix(in srgb, #d8e0e1 70%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #718b93 50%, var(--iso-metal));
  }
  .street-concrete {
    --street-metal-top: color-mix(in srgb, #abb2af 70%, var(--iso-top));
    --street-metal-side: color-mix(in srgb, #6c7b79 65%, var(--iso-metal));
  }
  .street-baseplate {
    --street-metal-top: var(--iso-metal);
    --street-metal-side: var(--iso-outline);
  }
  .public-light-screw circle {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .public-light-screw path {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .street-access-door {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .street-pole-seam,
  .street-cover-seam,
  .street-extrusion-seam,
  .street-driver-hatch,
  .street-hinge-mark,
  .street-door-slot {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.55;
  }
  .street-flat-glass {
    fill: color-mix(in srgb, #d0e2e6 65%, var(--iso-metal));
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .street-glass-gasket {
    fill: none;
    stroke: #536668;
    stroke-width: 0.9;
  }
  .street-tir-optic {
    fill: color-mix(
      in srgb,
      var(--fixture-color) calc(var(--fixture-level) * 70%),
      var(--iso-metal)
    );
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .street-optic-halo,
  .street-optic-rim {
    fill: none;
    stroke: var(--fixture-color);
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .street-optic-halo {
    stroke-width: 6;
    stroke-opacity: 0.65;
  }
  .street-optic-rim {
    stroke: color-mix(in srgb, var(--fixture-color) 60%, white);
    stroke-width: 1.6;
  }
  .street-road-illumination,
  .street-source-glow,
  .street-optic-edge {
    pointer-events: none;
  }
  .street-photocell {
    --water-metal-top: var(--iso-dark);
    --water-metal-side: var(--iso-metal);
  }
  .street-photocell-dome {
    --water-metal-top: #bcc9c9;
    --water-metal-side: #6f898e;
  }
  .street-photocell-seam {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .exit-led-extrusion .iso-front,
  .exit-led-extrusion .iso-top,
  .exit-ceiling-canopy .iso-top {
    fill: color-mix(in srgb, #d7e0e0 65%, var(--iso-top));
  }
  .exit-endcap .iso-front,
  .exit-endcap .iso-top,
  .exit-endcap .iso-side {
    fill: var(--iso-metal);
  }
  .exit-suspension {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .exit-acrylic-edge {
    fill: #8bc5b2;
    fill-opacity: 0.55;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .exit-panel-unlit {
    fill: color-mix(in srgb, #164b38 60%, var(--iso-dark));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .exit-panel-border {
    fill: none;
    stroke: #f2f6ef;
    stroke-width: 0.55;
    opacity: 0.8;
  }
  .exit-pictogram {
    fill: #f5f9ef;
    stroke: none;
  }
  .exit-door-opening {
    fill: #1a734a;
  }
  .exit-direction-arrow {
    fill: none;
    stroke: #f5f9ef;
    stroke-width: 5;
    stroke-linecap: square;
    stroke-linejoin: miter;
  }
  .exit-unlit .exit-pictogram,
  .exit-unlit .exit-panel-border {
    opacity: 0.38;
  }
  .exit-output-unknown .exit-pictogram,
  .exit-output-unknown .exit-panel-border {
    opacity: 0.2;
  }
  .exit-top-light-guide {
    fill: none;
    stroke: #d8ffe9;
    stroke-width: 0.8;
  }
  .exit-bottom-edge {
    fill: none;
    stroke: #b7e1ce;
    stroke-opacity: 0.6;
    stroke-width: 0.6;
  }
  .exit-extrusion-seam {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.55;
  }
  .exit-charge-indicator {
    fill: #75bc91;
    stroke: var(--iso-top);
    stroke-width: 0.45;
  }
  .exit-backup-indicator {
    fill: #e3b45c;
    stroke: var(--iso-top);
    stroke-width: 0.45;
  }
  .exit-indicator-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .exit-test-plunger {
    fill: var(--iso-dark);
    stroke: var(--iso-top);
    stroke-width: 0.5;
  }
  :host([dir="rtl"]) .exit-pictogram {
    transform: translateX(112px) scaleX(-1);
  }
  .streetlight-assembly *,
  .exit-sign-assembly * {
    vector-effect: non-scaling-stroke;
  }
  @media (max-width: 480px) {
    .device-element[data-device-type="streetlight"] .iso-scene,
    .device-element[data-device-type="exit_sign"] .iso-scene {
      max-block-size: 240px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .streetlight-assembly *,
    .exit-sign-assembly * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
