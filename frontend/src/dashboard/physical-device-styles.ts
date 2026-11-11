import { css } from "lit";

export const physicalDeviceStyles = css`
  .iso-scene {
    width: 100%;
    height: 192px;
    overflow: visible;
    --iso-outline: color-mix(
      in srgb,
      var(--primary-text-color, #20362b) 62%,
      var(--device-accent)
    );
    --iso-front: color-mix(
      in srgb,
      var(--card-background-color, #fff) 92%,
      var(--device-accent)
    );
    --iso-side: color-mix(
      in srgb,
      var(--card-background-color, #fff) 69%,
      var(--device-accent)
    );
    --iso-top: color-mix(
      in srgb,
      var(--card-background-color, #fff) 97%,
      var(--device-accent)
    );
    --iso-metal: color-mix(
      in srgb,
      var(--card-background-color, #fff) 74%,
      #71857b
    );
    --iso-dark: color-mix(
      in srgb,
      #18362a 80%,
      var(--card-background-color, #fff)
    );
  }
  .iso-scene path,
  .iso-scene polygon,
  .iso-scene ellipse,
  .iso-scene circle,
  .iso-scene line,
  .iso-scene polyline {
    vector-effect: non-scaling-stroke;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .device-shadow {
    fill: color-mix(in srgb, #18362a 8%, transparent);
  }
  .floor-grid {
    fill: none;
    stroke: color-mix(in srgb, var(--device-accent) 12%, transparent);
    stroke-width: 0.6;
  }
  .iso-front {
    fill: var(--iso-front);
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .iso-side {
    fill: var(--iso-side);
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .iso-top {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .iso-metal,
  .gauge-face,
  .dial-ring,
  .door-rim,
  .reflector {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .iso-dark,
  .iso-port,
  .iso-screen,
  .camera-lens,
  .speaker-grille,
  .card-slot,
  .sensor-lens,
  .microphone-grille,
  .charger-socket,
  .iso-rubber,
  .finger-pad,
  .outlet,
  .robot-compartment {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .iso-open {
    fill: var(--card-background-color, #fff);
    stroke: var(--iso-outline);
  }
  .screen-label {
    fill: #a1e7c9;
    stroke: none;
    font-family: var(--ha-font-family-body, sans-serif);
    font-size: 6px;
    text-anchor: middle;
    dominant-baseline: middle;
    letter-spacing: 0.2px;
  }
  .iso-line,
  .iso-seam,
  .iso-grille,
  .iso-vents,
  .gauge-scale,
  .probe-rod,
  .ladder,
  .support-wire,
  .iso-grille-face,
  .door-handle,
  .gate-bar,
  .antenna-tip,
  .sensor-cable,
  .power-cable,
  .door-seam,
  .curtain-fold,
  .fingerprint-ridge,
  .sensor-beam,
  .strain-trace,
  .soil-trace,
  .rain-track,
  .fence-wire,
  .wall-crack,
  .detector-vent,
  .lens-facet,
  .clock-hand,
  .sounder-ring,
  .soil-prong,
  .gauge-needle,
  .valve-stem {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1.2;
  }
  .gauge-needle,
  .clock-hand {
    stroke: var(--device-accent);
    stroke-width: 2;
  }
  .gauge-scale {
    opacity: 0.4;
  }
  .pipe-edge {
    fill: none;
    stroke: var(--iso-outline);
  }
  .pipe-body {
    fill: none;
    stroke: var(--iso-metal);
  }
  .flow-path {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 2.5;
    stroke-dasharray: 4 9;
    animation: liquid-flow 1.2s linear infinite;
  }
  .fan-rim {
    fill: none;
    stroke: #8da79b;
    stroke-width: 0.8;
  }
  .fan-blade,
  .ceiling-blade,
  .turbine-blade,
  .iso-accent,
  .accent-part .iso-front,
  .accent-part .iso-top,
  .status-led,
  .port-led,
  .probe-tip,
  .level-signal,
  .board-trace {
    fill: var(--device-accent);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .fan-rotor {
    transform-origin: 0 0;
  }
  .spinning {
    animation: physical-spin var(--spin-duration, 3s) linear infinite;
  }
  .spinning {
    animation-direction: var(--spin-direction, normal);
  }
  .ceiling-rotor {
    transform-origin: 140px 77px;
  }
  .iso-scene:not(.active) .spinning,
  .iso-scene:not(.active) .flow-path {
    animation: none;
  }
  .iso-liquid,
  .pool-water,
  .bowl-water,
  .leak-puddle {
    fill: color-mix(in srgb, var(--device-accent) 54%, transparent);
    stroke: var(--device-accent);
    stroke-width: 0.7;
  }
  .iso-water-surface {
    fill: color-mix(
      in srgb,
      var(--device-accent) 75%,
      var(--card-background-color)
    );
    stroke: var(--device-accent);
    stroke-width: 0.7;
  }
  .water-ripple {
    fill: none;
    stroke: var(--card-background-color, #fff);
    stroke-width: 1.2;
    animation: water-wave 2.5s ease-in-out infinite;
  }
  .liquid-level {
    transition: transform 0.35s ease;
  }
  .tank-shell .iso-front {
    fill: color-mix(in srgb, var(--iso-front) 42%, transparent);
  }
  .light-emitter,
  .light-emitter .iso-front,
  .light-emitter .iso-top,
  .light-emitter .iso-side,
  .bulb-glass {
    fill: color-mix(
      in srgb,
      var(--light-color, #ffd16b) calc(var(--light-opacity, 0.7) * 100%),
      var(--iso-front)
    );
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .active .light-emitter {
    filter: drop-shadow(
      0 0 8px color-mix(in srgb, var(--light-color, #ffd16b) 52%, transparent)
    );
  }
  .bulb-filament {
    fill: none;
    stroke: var(--light-color, #ffd16b);
    stroke-width: 2;
  }
  .rgb-band {
    fill: none;
    stroke: #a98acf;
    stroke-width: 4;
  }
  .warm-band {
    fill: none;
    stroke: #e0aa5e;
    stroke-width: 4;
  }
  .window-glass,
  .window-leaf .iso-front,
  .sash-glass,
  .display-glass,
  .drum-glass,
  .oven-glass .iso-front,
  .reservoir-window,
  .smart-glass,
  .window-leaf .iso-top {
    fill: color-mix(in srgb, #7bc2d8 19%, var(--card-background-color, #fff));
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .tint-pane {
    fill: color-mix(
      in srgb,
      #244e57 calc(var(--light-opacity, 0.7) * 100%),
      transparent
    );
    stroke: var(--iso-outline);
  }
  .camera-fov,
  .projector-beam {
    fill: color-mix(in srgb, var(--device-accent) 11%, transparent);
    stroke: color-mix(in srgb, var(--device-accent) 26%, transparent);
    stroke-width: 0.8;
  }
  .thermal-fov {
    fill: color-mix(in srgb, #e6ad60 18%, transparent);
    stroke: #d49454;
    stroke-width: 0.6;
  }
  .thermal-lens {
    fill: #cf8760;
    stroke: var(--iso-outline);
  }
  .camera-dome .iso-front {
    fill: color-mix(in srgb, #254b43 76%, transparent);
  }
  .camera-head,
  .hinged-panel,
  .elevator-door,
  .blind-slat,
  .shutter-slat,
  .damper-blade,
  .raised-lid,
  .latch-bolt,
  .barrier-base,
  .tint-pane {
    transition:
      transform 0.35s ease,
      fill 0.35s ease;
  }
  .blind-slat,
  .shutter-slat,
  .damper-blade {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .curtain-fabric .iso-front,
  .awning-fabric,
  .cover-fabric .iso-front {
    fill: color-mix(
      in srgb,
      var(--device-accent) 22%,
      var(--card-background-color)
    );
    stroke: var(--iso-outline);
  }
  .wood-wall .iso-front,
  .wood-bench .iso-front,
  .wood-floor .iso-top {
    fill: color-mix(in srgb, #c99f74 50%, var(--card-background-color));
    stroke: #866f55;
  }
  .solar-cell {
    fill: #285269;
    stroke: #86b5c8;
    stroke-width: 0.7;
  }
  .solar-frame {
    fill: #c3d6df;
    stroke: var(--iso-outline);
    stroke-width: 1.2;
  }
  .solar-tube {
    fill: #344d54;
    stroke: #aec8d3;
    stroke-width: 1;
  }
  .metal .iso-front,
  .metal .iso-top,
  .metal .iso-side {
    fill: var(--iso-metal);
  }
  .circuit-board .iso-top {
    fill: #397d62;
  }
  .chip .iso-top,
  .component .iso-top {
    fill: #203b32;
  }
  .positive-terminal .iso-top {
    fill: #dc795e;
  }
  .negative-terminal .iso-top {
    fill: #64859b;
  }
  .safety-part .iso-front,
  .safety-part .iso-side,
  .safety-panel .iso-front,
  .safety-panel .iso-side {
    fill: color-mix(in srgb, #dc7862 25%, var(--card-background-color));
  }
  .alarm-led {
    fill: var(--device-accent);
  }
  .alert .alarm-led,
  .alert .status-led {
    fill: #e16b52;
    animation: physical-blink 0.8s ease-in-out infinite;
  }
  .beacon-lens .iso-front {
    fill: color-mix(in srgb, var(--device-accent) 48%, transparent);
  }
  .steam-plume,
  .heat-haze,
  .air-flow,
  .exhaust-puff,
  .radio-wave,
  .sound-wave,
  .beacon-rays,
  .water-stream,
  .coffee-stream,
  .dispense-drop,
  .flush-swirl,
  .screen-content {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 1.5;
    opacity: 0.65;
  }
  .air-flow,
  .water-stream,
  .coffee-stream {
    stroke-dasharray: 5 7;
    animation: liquid-flow 1s linear infinite;
  }
  .steam-plume,
  .heat-haze,
  .exhaust-puff {
    animation: physical-steam 2.5s ease-in-out infinite;
  }
  .radio-wave,
  .sound-wave,
  .beacon-rays {
    animation: physical-signal 2s ease-in-out infinite;
  }
  .audio-bar {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 5;
    transform-origin: 140px 140px;
  }
  .active .audio-bar {
    animation: audio-beat 0.65s ease-in-out infinite alternate;
  }
  .active .blink-led {
    animation: physical-blink 1.8s ease-in-out infinite;
  }
  .speaker-ring {
    fill: var(--device-accent);
  }
  .speaker-fabric .iso-front {
    fill: color-mix(in srgb, #304b40 60%, var(--card-background-color));
  }
  .bin-fill {
    fill: color-mix(in srgb, var(--device-accent) 50%, var(--iso-front));
    stroke: var(--device-accent);
  }
  .iso-scene.unavailable {
    filter: grayscale(1);
    opacity: 0.45;
  }
  .iso-scene.unavailable * {
    animation: none !important;
  }
  .ground-outline,
  .soil-bed {
    fill: color-mix(in srgb, #a68b69 9%, transparent);
    stroke: color-mix(in srgb, #88775f 50%, transparent);
    stroke-dasharray: 3 3;
  }
  .soil-prong {
    stroke-width: 4;
  }
  .probe-rod .iso-front {
    fill: var(--iso-metal);
  }
  .rain-track {
    stroke: #729b87;
    stroke-width: 2;
  }
  .contact-gap {
    stroke: var(--device-accent);
    stroke-dasharray: 2 3;
  }
  .fingerprint-ridge {
    stroke: var(--device-accent);
  }
  .barrier-stripe {
    stroke: #d5846d;
    stroke-width: 5;
  }
  .gate-leaf .iso-front {
    fill: var(--iso-metal);
  }
  .toilet-seat .iso-top,
  .ceramic .iso-top {
    fill: var(--iso-front);
  }
  .urinal-bowl {
    fill: color-mix(in srgb, var(--iso-metal) 30%, var(--iso-front));
    stroke: var(--iso-outline);
  }
  .brush-line {
    fill: none;
    stroke: #668c79;
    stroke-width: 2;
  }
  .heating-ring .iso-top {
    fill: color-mix(in srgb, #d27659 42%, var(--iso-dark));
  }
  .iso-liquid {
    transition: transform 0.45s ease;
  }
  .liquid-level {
    transition: transform 0.45s ease;
  }
  .tank-shell .tank-rim {
    fill: color-mix(in srgb, var(--iso-top) 35%, transparent);
  }
  .blind-slat,
  .shutter-slat {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 0.4s ease;
  }
  .lift-car {
    transition: transform 0.9s ease;
  }
  .elevator-leaf {
    transition: transform 0.4s ease;
  }
  @keyframes physical-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes liquid-flow {
    to {
      stroke-dashoffset: -26;
    }
  }
  @keyframes water-wave {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.85;
    }
  }
  @keyframes physical-steam {
    0%,
    100% {
      opacity: 0.2;
      transform: translateY(0);
    }
    50% {
      opacity: 0.7;
      transform: translateY(-4px);
    }
  }
  @keyframes physical-signal {
    0%,
    100% {
      opacity: 0.15;
    }
    50% {
      opacity: 0.65;
    }
  }
  @keyframes physical-blink {
    0%,
    75%,
    100% {
      opacity: 0.9;
    }
    80%,
    95% {
      opacity: 0.2;
    }
  }
  @keyframes audio-beat {
    from {
      opacity: 0.4;
      stroke-width: 3;
    }
    to {
      opacity: 1;
      stroke-width: 5;
    }
  }
  :host([dir="rtl"]) .iso-scene {
    transform: scaleX(-1);
  }
  :host([dir="rtl"]) .screen-label {
    transform-box: fill-box;
    transform-origin: center;
    scale: -1 1;
  }
  .lift-back-wall,
  .lift-inner-wall {
    fill: color-mix(
      in srgb,
      var(--iso-metal) 73%,
      var(--card-background-color)
    );
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .lift-inner-wall {
    fill: var(--iso-side);
  }
  .lift-cabin-floor {
    fill: color-mix(in srgb, #455752 48%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .lift-ceiling {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .lift-ceiling-light {
    fill: color-mix(in srgb, var(--device-accent) 18%, #fff);
    stroke: var(--iso-metal);
    stroke-width: 0.5;
  }
  .lift-mirror {
    fill: color-mix(in srgb, #c0dcdf 40%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lift-reflection {
    fill: none;
    stroke: var(--iso-top);
    stroke-width: 3;
    opacity: 0.75;
  }
  .lift-jamb .iso-front,
  .lift-header .iso-front,
  .lift-sill .iso-front,
  .lift-side-casing .iso-side {
    fill: var(--iso-metal);
  }
  .lift-roof .iso-top {
    fill: var(--iso-top);
  }
  .lift-jamb .iso-side,
  .lift-header .iso-side {
    fill: color-mix(in srgb, var(--iso-metal) 70%, var(--iso-outline));
  }
  .lift-door-aperture {
    overflow: hidden;
  }
  .lift-door-aperture rect,
  .lift-door-aperture path {
    vector-effect: non-scaling-stroke;
  }
  .lift-steel-panel {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .lift-steel-sheen {
    fill: var(--iso-top);
    opacity: 0.48;
    stroke: none;
  }
  .lift-metal-grain {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.35;
    opacity: 0.25;
  }
  .lift-door-edge {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .lift-freight-panel {
    fill: color-mix(in srgb, var(--iso-metal) 83%, var(--iso-outline));
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .lift-door-rib {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.55;
    opacity: 0.6;
  }
  .lift-door-reinforcement {
    fill: none;
    stroke: var(--iso-top);
    stroke-width: 1.5;
    opacity: 0.6;
  }
  .lift-door-grip {
    fill: var(--iso-dark);
    stroke: var(--iso-top);
    stroke-width: 0.5;
  }
  .lift-track,
  .lift-sill-groove,
  .lift-floor-groove {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lift-floor-groove {
    opacity: 0.4;
  }
  .lift-call-plate {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lift-call-button {
    fill: var(--device-accent);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lift-bumper .iso-front,
  .lift-bumper .iso-side,
  .lift-bumper .iso-top {
    fill: var(--iso-dark);
  }
  .lift-caution {
    fill: #c5aa66;
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lift-position-rail {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.65;
    opacity: 0.5;
  }
  .lift-position-light {
    fill: var(--device-accent);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .lift-door-leaf,
  .lift-platform-gate,
  .lift-vehicle-gate {
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .lift-position-marker,
  .lift-moving-platform {
    transition: transform 0.95s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .lift-guard-glass {
    fill: color-mix(in srgb, var(--device-accent) 12%, transparent);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .lift-guide-rail {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1.5;
  }
  .lift-guide-tower .iso-front,
  .lift-platform-deck .iso-front,
  .lift-platform-console .iso-front {
    fill: var(--iso-metal);
  }
  .lift-access-ramp {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .lift-vehicle-runway .iso-top {
    fill: color-mix(in srgb, var(--iso-dark) 34%, var(--iso-metal));
  }
  .lift-wheelchair-seat .iso-front,
  .lift-wheelchair-seat .iso-top,
  .lift-wheelchair-back .iso-front,
  .lift-wheelchair-back .iso-side {
    fill: var(--iso-dark);
  }
  .lift-vehicle-body .iso-front,
  .lift-vehicle-body .iso-side,
  .lift-vehicle-roof .iso-front {
    fill: color-mix(
      in srgb,
      var(--device-accent) 35%,
      var(--card-background-color)
    );
  }
  .lift-vehicle-glass {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .lift-safety-arm {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 3.5;
  }
  .lift-safety-stripe {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 2;
  }
  .camera-surface {
    fill: color-mix(
      in srgb,
      var(--iso-top) var(--camera-surface-light),
      var(--iso-metal)
    );
    stroke: none;
  }
  .cctv-sunshield .camera-surface {
    fill: color-mix(
      in srgb,
      var(--iso-top) var(--camera-surface-light),
      var(--iso-front)
    );
  }
  .cctv-body-contour,
  .cctv-visor-edge,
  .cctv-cap-outline,
  .cctv-body-seam,
  .cctv-cap-seam {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .cctv-body-seam,
  .cctv-cap-seam {
    stroke-width: 0.45;
    opacity: 0.65;
  }
  .cctv-front-gasket,
  .cctv-lens-bezel {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.75;
  }
  .cctv-lens-rim {
    fill: color-mix(in srgb, var(--iso-dark) 62%, #71858a);
    stroke: var(--iso-metal);
    stroke-width: 0.65;
  }
  .cctv-lens-coating {
    fill: color-mix(in srgb, #23657c 46%, var(--iso-dark));
    stroke: #6a9ba4;
    stroke-width: 0.45;
  }
  .cctv-thermal-optic {
    fill: color-mix(in srgb, #a68659 35%, var(--iso-dark));
    stroke: #c3a36a;
    stroke-width: 0.55;
  }
  .cctv-optical-ring {
    fill: none;
    stroke: color-mix(in srgb, #7ba5aa 65%, var(--iso-dark));
    stroke-width: 0.5;
  }
  .cctv-aperture {
    fill: #102127;
    stroke: none;
  }
  .cctv-glass-highlight {
    fill: #d5f0ee;
    stroke: none;
    opacity: 0.8;
  }
  .cctv-ir-window {
    fill: #243638;
    stroke: var(--iso-metal);
    stroke-width: 0.45;
  }
  .cctv-ir-emitter {
    fill: #bdc9bd;
    stroke: var(--iso-metal);
    stroke-width: 0.4;
  }
  .cctv-status-led {
    fill: var(--device-accent);
    stroke: var(--iso-outline);
    stroke-width: 0.35;
    opacity: 0.25;
  }
  .camera-live .cctv-status-led {
    opacity: 1;
    animation: cctv-online 2.8s ease-in-out infinite;
  }
  .cctv-mount-plate .iso-front {
    fill: var(--iso-metal);
  }
  .cctv-mount-screw {
    fill: var(--iso-outline);
    stroke: var(--iso-top);
    stroke-width: 0.45;
  }
  .cctv-gimbal-surface .camera-surface,
  .cctv-lens-barrel .camera-surface {
    fill: color-mix(in srgb, var(--iso-dark) 84%, var(--iso-metal));
  }
  .cctv-dome-glass .camera-surface {
    fill: #4b7981;
    opacity: 0.18;
    stroke: none;
  }
  .cctv-dome-highlight {
    fill: none;
    stroke: #c1e0e1;
    stroke-width: 2;
    opacity: 0.65;
  }
  .cctv-gimbal-axle {
    fill: none;
    stroke: var(--iso-metal);
    stroke-width: 2.6;
  }
  .cctv-dome-rim .iso-front {
    fill: var(--iso-metal);
  }
  .cctv-dome-rim .iso-top {
    fill: var(--iso-front);
  }
  @keyframes cctv-online {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.55;
    }
  }
  .cctv-dome-rim-surface .camera-surface {
    fill: var(--iso-metal);
  }
  .cctv-dome-outline {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
    opacity: 0.75;
  }
  .valve-metal-face {
    fill: color-mix(
      in srgb,
      var(--valve-surface-top, var(--iso-top)) var(--valve-face-light),
      var(--valve-surface-side, var(--iso-metal))
    );
    stroke: none;
  }
  .valve-brass {
    --valve-surface-top: color-mix(in srgb, #d3bb80 48%, var(--iso-top));
    --valve-surface-side: color-mix(in srgb, #947344 42%, var(--iso-metal));
  }
  .valve-cast {
    --valve-surface-top: var(--iso-front);
    --valve-surface-side: var(--iso-side);
  }
  .valve-flange-face {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .valve-port-bore {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .valve-bolt {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .valve-union-face {
    fill: color-mix(in srgb, #baa06a 45%, var(--iso-metal));
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .valve-butterfly-disc {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.9;
  }
  .valve-actuator-case .iso-front {
    fill: color-mix(in srgb, var(--device-accent) 30%, var(--iso-front));
  }
  .valve-actuator-case .iso-side {
    fill: color-mix(in srgb, var(--device-accent) 38%, var(--iso-metal));
  }
  .valve-actuator-lid .iso-top {
    fill: color-mix(in srgb, var(--device-accent) 42%, var(--iso-top));
  }
  .valve-cable-gland .iso-front,
  .valve-terminal-plug .iso-front,
  .valve-monitor-module .iso-front,
  .valve-coil .iso-front,
  .valve-coil .iso-side,
  .valve-coil .iso-top {
    fill: var(--iso-dark);
  }
  .valve-coil-on .valve-coil .iso-front {
    fill: color-mix(in srgb, var(--device-accent) 42%, var(--iso-dark));
  }
  .valve-dial-face {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .valve-dial-tick {
    fill: none;
    stroke: var(--iso-top);
    stroke-width: 0.7;
  }
  .valve-angle-pointer {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 1.6;
  }
  .valve-override {
    fill: var(--iso-dark);
    stroke: var(--iso-metal);
    stroke-width: 0.8;
  }
  .valve-shaft .iso-front,
  .valve-shaft .iso-side,
  .valve-stem-coupling .iso-front,
  .valve-stem-coupling .iso-top {
    fill: var(--iso-metal);
  }
  .valve-stem-coupling .iso-side {
    fill: var(--device-accent);
  }
  .valve-travel-scale,
  .valve-flow-mark {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .valve-wheel-hoop {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 2.8;
  }
  .valve-setting-knob .iso-front,
  .valve-setting-knob .iso-top {
    fill: var(--iso-dark);
  }
  .valve-knob-rib {
    fill: none;
    stroke: var(--iso-metal);
    stroke-width: 1;
  }
  .valve-test-red .iso-top,
  .valve-reset-button .iso-front,
  .valve-reset-button .iso-top {
    fill: #b77762;
  }
  .valve-test-blue .iso-top {
    fill: #719ba8;
  }
  .valve-monitor-led {
    fill: var(--device-accent);
    stroke: var(--iso-metal);
    stroke-width: 0.4;
  }
  .valve-alarm-led {
    fill: #d46750;
    stroke: var(--iso-metal);
    stroke-width: 0.4;
  }
  .valve-tripped .valve-reset-button .iso-top {
    fill: #d46750;
  }
  .valve-actuating .valve-actuator-lid .iso-front {
    animation: valve-drive 1.2s ease-in-out infinite;
  }
  @keyframes valve-drive {
    0%,
    100% {
      fill: var(--iso-metal);
    }
    50% {
      fill: var(--device-accent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .iso-scene * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
