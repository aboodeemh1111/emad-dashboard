import { css } from "lit";

export const physicalLightingStyles = css`
  .realistic-lighting {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .lt-aluminum,
  .lt-nickel {
    --water-metal-top: color-mix(in srgb, #e5e9e9 70%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #829495 50%, var(--iso-metal));
  }
  .lt-ceramic,
  .lt-opal {
    --water-metal-top: var(--iso-top);
    --water-metal-side: color-mix(
      in srgb,
      var(--iso-top) 70%,
      var(--iso-metal)
    );
  }
  .lt-dark,
  .lt-contact {
    --water-metal-top: var(--iso-dark);
    --water-metal-side: var(--iso-outline);
  }
  .lt-emitter-shell {
    --water-metal-top: color-mix(
      in srgb,
      var(--fixture-color) calc(var(--fixture-level) * 75%),
      var(--iso-top)
    );
    --water-metal-side: color-mix(
      in srgb,
      var(--fixture-color) calc(var(--fixture-level) * 60%),
      var(--iso-metal)
    );
  }
  .lt-emitter,
  .lt-white-emitter {
    fill: color-mix(
      in srgb,
      var(--fixture-color) calc(var(--fixture-level) * 100%),
      var(--iso-metal)
    );
    stroke: color-mix(in srgb, var(--iso-outline) 30%, var(--iso-top));
    stroke-width: 0.4;
    transition: fill 0.25s linear;
  }
  .lt-white-emitter {
    fill: color-mix(
      in srgb,
      #fff5df calc(var(--white-level) * var(--fixture-level) * 100%),
      var(--iso-metal)
    );
  }
  .lt-diffuser,
  .lt-sensor-diffuser {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .lt-diffuser.lt-emitter {
    fill: color-mix(
      in srgb,
      var(--fixture-color) calc(var(--fixture-level) * 70%),
      var(--iso-top)
    );
  }
  .lt-reflector {
    fill: color-mix(in srgb, #c4cfd0 50%, var(--iso-top));
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .lt-lens {
    fill: color-mix(in srgb, #bcdae1 20%, var(--iso-top));
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .lt-fin,
  .lt-seam,
  .lt-thread,
  .lt-heat-seam {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .lt-spring {
    fill: none;
    stroke: var(--iso-metal);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lt-cable {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lt-screw circle {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lt-screw path {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .lt-copper {
    fill: #b69b6b;
    stroke: var(--iso-outline);
    stroke-width: 0.35;
  }
  .lt-copper-coil {
    --water-metal-top: #bf9768;
    --water-metal-side: #896441;
  }
  .lt-pcb .iso-top {
    fill: #ebddad;
  }
  .lt-cut-mark {
    fill: none;
    stroke: #8a7545;
    stroke-width: 0.55;
    stroke-dasharray: 1 1;
  }
  .lt-led-package {
    fill: #e3dfc5;
    stroke: var(--iso-outline);
    stroke-width: 0.4;
  }
  .lt-reel-hole,
  .lt-wire-port,
  .lt-xlr {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .lt-pin {
    fill: #ad9b70;
    stroke: none;
  }
  .lt-reel {
    --water-metal-top: var(--iso-metal);
    --water-metal-side: var(--iso-dark);
  }
  .lt-driver-case .iso-front,
  .lt-driver-case .iso-side,
  .lt-flood-case .iso-front,
  .lt-flood-case .iso-side {
    fill: color-mix(in srgb, var(--iso-dark) 65%, var(--iso-metal));
  }
  .lt-terminal .iso-top,
  .lt-terminal .iso-front,
  .lt-terminal .iso-side {
    fill: var(--iso-metal);
  }
  .lt-terminal-green .iso-top,
  .lt-terminal-green .iso-front,
  .lt-terminal-green .iso-side {
    fill: color-mix(in srgb, #699a84 65%, var(--iso-metal));
  }
  .lt-relay-shell {
    opacity: 0.2;
  }
  .lt-armature,
  .lt-contact-fixed,
  .lt-contact-blade {
    fill: none;
    stroke: #ad9469;
    stroke-width: 1.9;
    stroke-linecap: round;
  }
  .lt-status-on {
    fill: #6cb594;
    stroke: var(--iso-top);
    stroke-width: 0.6;
  }
  .lt-status-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lt-slider-track {
    fill: var(--iso-dark);
    stroke: var(--iso-dark);
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .lt-button-mark,
  .lt-screen-mark {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .lt-panel-screen {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lt-channel-on {
    fill: color-mix(in srgb, #6eab91 65%, var(--iso-top));
    stroke: var(--iso-metal);
    stroke-width: 0.5;
  }
  .lt-channel-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lt-yoke {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 3.5;
    stroke-linejoin: round;
  }
  .lt-beam,
  .lt-light-pool {
    fill: var(--fixture-color);
    fill-opacity: var(--fixture-glow);
    stroke: none;
  }
  .lt-battery-cutaway {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lt-battery-mark {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.85;
  }
  .lt-test-button {
    fill: var(--iso-dark);
    stroke: var(--iso-top);
    stroke-width: 0.5;
  }
  .lt-exit-lit {
    fill: #388463;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .lt-exit-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .lt-egress-pictogram {
    fill: none;
    stroke: #edf8ee;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lt-sensor-dome {
    --water-metal-top: #dfe9e9;
    --water-metal-side: #99b8bb;
  }
  .realistic-lighting * {
    vector-effect: non-scaling-stroke;
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-lighting * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
