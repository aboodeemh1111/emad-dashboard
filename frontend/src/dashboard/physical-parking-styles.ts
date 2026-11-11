import { css } from "lit";

export const physicalParkingStyles = css`
  .parking-road .iso-top {
    fill: color-mix(in srgb, #82918b 11%, var(--card-background-color));
    stroke: var(--iso-metal);
    stroke-width: 0.55;
  }
  .parking-road .iso-front,
  .parking-road .iso-side {
    fill: var(--iso-metal);
    stroke-width: 0.5;
  }
  .parking-lane-mark,
  .parking-bay-line {
    fill: none;
    stroke: color-mix(in srgb, var(--primary-text-color) 28%, transparent);
    stroke-width: 1.2;
  }
  .parking-foot .iso-top,
  .parking-ground-collar .iso-top,
  .parking-ground-collar .iso-front,
  .parking-cap .iso-top,
  .parking-speed-cap .iso-top,
  .parking-wheel {
    fill: var(--iso-metal);
  }
  .parking-bolt,
  .parking-terminal-screw {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .parking-keyhole,
  .parking-rubber .iso-top,
  .parking-rubber .iso-front,
  .parking-end-cap .iso-front,
  .parking-end-cap .iso-side,
  .parking-tire {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .parking-service-door .iso-front {
    fill: color-mix(in srgb, var(--iso-metal) 36%, var(--iso-front));
    stroke-width: 0.6;
  }
  .parking-door-seam,
  .parking-vent,
  .parking-speaker-slot,
  .parking-radar-seam,
  .parking-door-slat {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .parking-boom-shell .iso-top,
  .parking-boom-shell .iso-front,
  .parking-boom-shell .iso-side {
    fill: var(--iso-top);
    stroke-width: 0.65;
  }
  .parking-reflector .iso-front,
  .parking-reflector .iso-side,
  .parking-reflector .iso-top,
  .parking-reflector {
    fill: #ce6f59;
    stroke: color-mix(in srgb, #ce6f59 70%, var(--iso-outline));
    stroke-width: 0.4;
  }
  .parking-safety-edge {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1.5;
  }
  .parking-hub,
  .parking-roller,
  .parking-drive-gear {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .parking-optic,
  .parking-radome .iso-front,
  .parking-radome,
  .parking-reader-top {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .parking-led-red {
    fill: #c66d59;
    stroke: #954f40;
    stroke-width: 0.45;
  }
  .parking-led-green {
    fill: #63b68d;
    stroke: #3b755c;
    stroke-width: 0.45;
  }
  .parking-led-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .parking-blocked-beam {
    fill: none;
    stroke: #c66d59;
    stroke-width: 0.6;
    stroke-dasharray: 2 3;
  }
  .parking-gate-frame .iso-front,
  .parking-gate-frame .iso-top,
  .parking-gate-post .iso-front,
  .parking-gate-post .iso-side {
    fill: var(--iso-metal);
  }
  .parking-gate-infill {
    fill: color-mix(
      in srgb,
      var(--iso-front) 65%,
      var(--card-background-color)
    );
    stroke-width: 0.4;
    stroke: var(--iso-outline);
  }
  .parking-gate-picket {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1.1;
  }
  .parking-rack .iso-front,
  .parking-rack-tooth .iso-front {
    fill: var(--iso-dark);
    stroke-width: 0.3;
  }
  .parking-retro-band .iso-front,
  .parking-retro-band .iso-top {
    fill: var(--iso-top);
    stroke-width: 0.4;
  }
  .parking-bollard-ring .iso-front,
  .parking-bollard-ring .iso-top {
    fill: #ce6f59;
    stroke-width: 0.4;
  }
  .parking-bollard-steel .iso-front {
    fill: var(--iso-metal);
  }
  .parking-bollard-cap .iso-top {
    fill: var(--iso-top);
  }
  .parking-bollard-steel {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .parking-folding-hoop .pipe-body {
    stroke: #c7ad65;
  }
  .parking-folding-hoop .pipe-edge {
    stroke: var(--iso-outline);
    stroke-width: 7;
  }
  .parking-lock-plate .iso-front,
  .parking-lock-plate .iso-top {
    fill: #c7ad65;
  }
  .parking-lock-drive .iso-front,
  .parking-lock-drive .iso-top {
    fill: var(--iso-metal);
  }
  .parking-tripod .pipe-body {
    stroke: var(--iso-metal);
  }
  .parking-tripod .pipe-edge {
    stroke-width: 5;
  }
  .parking-turnstile-body .iso-front,
  .parking-turnstile-body .iso-side,
  .parking-speed-pedestal .iso-front,
  .parking-speed-pedestal .iso-side {
    fill: var(--iso-metal);
  }
  .parking-glass-leaf .iso-front,
  .parking-glass-leaf .iso-top,
  .parking-glass-leaf .iso-side {
    fill: color-mix(in srgb, #8bb9b3 27%, transparent);
    stroke: color-mix(in srgb, #6c9a92 70%, var(--iso-outline));
    stroke-width: 0.7;
  }
  .parking-example-car {
    opacity: 0.58;
  }
  .parking-car-body .iso-front,
  .parking-car-body .iso-side,
  .parking-car-roof {
    fill: color-mix(in srgb, #92aaa6 32%, var(--iso-front));
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .parking-car-glass {
    fill: color-mix(in srgb, #426b70 38%, var(--iso-side));
    stroke: var(--iso-outline);
    stroke-width: 0.55;
  }
  .parking-headlamp .iso-front {
    fill: #efe4b9;
  }
  .parking-inductive-loop,
  .parking-loop-tail {
    fill: none;
    stroke: #a78a60;
    stroke-width: 1.35;
  }
  .parking-loop-module .iso-front,
  .parking-controller-case .iso-front {
    fill: var(--iso-metal);
  }
  .parking-terminal-strip .iso-front,
  .parking-terminal-strip .iso-top {
    fill: #87a98b;
    stroke-width: 0.4;
  }
  .parking-terminal-strip .iso-side {
    stroke-width: 0.4;
  }
  .parking-detection-zone {
    fill: color-mix(in srgb, var(--device-accent) 5%, transparent);
    stroke: color-mix(in srgb, var(--device-accent) 30%, transparent);
    stroke-width: 0.55;
    stroke-dasharray: 2 3;
  }
  .parking-puck-lid .iso-top {
    fill: var(--iso-dark);
  }
  .parking-ticket-body .iso-front,
  .parking-payment-body .iso-front {
    fill: var(--iso-metal);
  }
  .parking-kiosk-canopy .iso-top,
  .parking-kiosk-canopy .iso-front {
    fill: var(--iso-dark);
  }
  .parking-ticket-slot .iso-front,
  .parking-card-reader .iso-front,
  .parking-keypad .iso-front,
  .parking-barcode-scanner .iso-front {
    fill: var(--iso-dark);
    stroke-width: 0.5;
  }
  .parking-ticket-button {
    fill: var(--device-accent);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .parking-contactless {
    fill: none;
    stroke: #b4ccc1;
    stroke-width: 0.8;
    stroke-dasharray: 4 1;
  }
  .parking-keypad-dot {
    fill: var(--iso-top);
    stroke: none;
  }
  .parking-scanner-glass {
    fill: none;
    stroke: #c77d66;
    stroke-width: 1;
  }
  .parking-paper {
    fill: #f4f1e7;
    stroke: #a9aca3;
    stroke-width: 0.6;
  }
  .parking-ticket-barcode {
    fill: none;
    stroke: #35483e;
    stroke-width: 0.65;
  }
  .parking-tag-antenna {
    fill: none;
    stroke: #bfa473;
    stroke-width: 0.65;
  }
  .parking-example-tag .iso-front {
    fill: var(--iso-top);
  }
  .parking-sign-case .iso-front,
  .parking-sign-case .iso-side,
  .parking-sign-screen {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .parking-sign-screen {
    stroke-width: 0.4;
  }
  .parking-led-arrow {
    fill: none;
    stroke: #6cbd98;
    stroke-width: 2.8;
    stroke-dasharray: 1 2;
  }
  .parking-stop-cross {
    fill: none;
    stroke: #c66d59;
    stroke-width: 2.5;
  }
  .telemetry-unknown .parking-leveler-deck,
  .telemetry-unknown .parking-leveler-lip {
    opacity: 0.3;
  }
  .parking-full-mark {
    fill: none;
    stroke: #c66d59;
    stroke-width: 0.6;
  }
  .parking-indicator-housing .iso-front,
  .parking-indicator-transducer .iso-front,
  .parking-indicator-transducer .iso-top {
    fill: var(--iso-dark);
  }
  .parking-light-green .iso-front,
  .parking-light-green .iso-top {
    fill: #73b38a;
    stroke-width: 0.4;
  }
  .parking-light-red .iso-front,
  .parking-light-red .iso-top {
    fill: #cf7966;
    stroke-width: 0.4;
  }
  .parking-light-blue .iso-front,
  .parking-light-blue .iso-top {
    fill: #759dc3;
    stroke-width: 0.4;
  }
  .parking-light-off .iso-front,
  .parking-light-off .iso-top {
    fill: var(--iso-metal);
  }
  .parking-dock-concrete .iso-front,
  .parking-dock-wall .iso-front {
    fill: color-mix(in srgb, #b2b4aa 20%, var(--iso-front));
  }
  .parking-dock-door .iso-front {
    fill: var(--iso-metal);
    stroke-width: 0.7;
  }
  .parking-dock-pit .iso-top,
  .parking-dock-bumper .iso-front,
  .parking-dock-bumper .iso-side {
    fill: var(--iso-dark);
  }
  .parking-hazard-mark {
    fill: none;
    stroke: #baa260;
    stroke-width: 1.4;
  }
  .parking-deck-steel .iso-top,
  .parking-lip-steel .iso-top {
    fill: var(--iso-metal);
  }
  .parking-deck-tread {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .parking-example-trailer .iso-front {
    fill: color-mix(in srgb, #93aaa7 30%, var(--iso-front));
  }
  .parking-trailer-edge {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .parking-position-unknown .parking-boom,
  .parking-position-unknown .parking-sliding-leaf,
  .parking-position-unknown .parking-bollard-shaft,
  .parking-position-unknown .parking-folding-hoop,
  .parking-position-unknown .parking-tripod,
  .parking-position-unknown .parking-swing-leaf {
    opacity: 0.3;
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-parking * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
