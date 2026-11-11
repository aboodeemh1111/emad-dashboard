import { css } from "lit";

export const physicalOccupancyStyles = css`
  .room-context-floor {
    fill: color-mix(in srgb, var(--iso-front) 25%, transparent);
    stroke: var(--iso-metal);
    stroke-width: 0.5;
  }
  .room-ceiling-tile,
  .room-panel-wall {
    fill: color-mix(in srgb, var(--iso-front) 25%, transparent);
    stroke: color-mix(in srgb, var(--iso-outline) 40%, transparent);
    stroke-width: 0.5;
  }
  .room-pir-base .iso-front,
  .room-pir-bezel .iso-front,
  .room-radar-shell .iso-front,
  .room-desk-sensor-case .iso-front {
    fill: var(--iso-top);
  }
  .room-pir-bezel .iso-top {
    fill: var(--iso-metal);
  }
  .room-lens-shell {
    --water-metal-top: color-mix(in srgb, #d5ded5 70%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #8aa395 35%, var(--iso-front));
  }
  .room-fresnel-ring,
  .room-fresnel-facet {
    fill: none;
    stroke: color-mix(in srgb, #759784 60%, var(--iso-outline));
    stroke-width: 0.45;
    opacity: 0.75;
  }
  .room-fastener {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.45;
  }
  .room-led-green {
    fill: #6caf88;
    stroke: #416e53;
    stroke-width: 0.4;
  }
  .room-led-red {
    fill: #ce715b;
    stroke: #985443;
    stroke-width: 0.4;
  }
  .room-led-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.4;
  }
  .room-coverage-guide {
    fill: color-mix(in srgb, var(--device-accent) 3%, transparent);
    stroke: color-mix(in srgb, var(--device-accent) 30%, transparent);
    stroke-width: 0.55;
    stroke-dasharray: 3 3;
  }
  .room-radome {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.65;
  }
  .room-case-seam,
  .room-small-fresnel,
  .room-gateway-vent {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .room-radar-joint .iso-front,
  .room-radar-mount .iso-front,
  .room-radar-mount .iso-top {
    fill: var(--iso-metal);
  }
  .room-example-person {
    opacity: 0.72;
  }
  .room-person-shirt {
    --water-metal-top: #8eafa8;
    --water-metal-side: color-mix(in srgb, #5b8077 60%, var(--iso-front));
  }
  .room-person-head {
    --water-metal-top: #d8c6ad;
    --water-metal-side: #b19a7c;
  }
  .room-example-person .pipe-body {
    stroke: #6d837b;
  }
  .room-example-person .pipe-edge {
    stroke: var(--iso-outline);
    stroke-width: 4;
  }
  .room-door-jamb .iso-front,
  .room-door-lintel .iso-front {
    fill: var(--iso-metal);
  }
  .room-tof-body .iso-front,
  .room-tof-body .iso-side,
  .room-beam-node .iso-front {
    fill: var(--iso-top);
  }
  .room-optic,
  .room-tof-window,
  .room-small-pir-window {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.4;
  }
  .room-beam-guide {
    fill: none;
    stroke: color-mix(in srgb, var(--device-accent) 20%, transparent);
    stroke-width: 0.5;
    stroke-dasharray: 2 3;
  }
  .room-beam-triggered {
    fill: none;
    stroke: #c78d64;
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  .room-counting-line {
    fill: none;
    stroke: var(--device-accent);
    stroke-width: 0.8;
    stroke-dasharray: 3 3;
  }
  .room-desk-top .iso-top {
    fill: color-mix(in srgb, #cebfa0 32%, var(--iso-top));
  }
  .room-furniture-leg .iso-front,
  .room-seat-frame .iso-front,
  .room-bed-base .iso-front {
    fill: var(--iso-metal);
  }
  .room-chair-back .iso-front,
  .room-chair-seat .iso-top,
  .room-chair-seat .iso-front {
    fill: color-mix(in srgb, #8ca39b 22%, var(--iso-front));
  }
  .room-user-body .iso-front,
  .room-user-body .iso-top {
    fill: color-mix(in srgb, #87a79c 50%, var(--iso-front));
  }
  .room-user-head .iso-front,
  .room-user-head .iso-top {
    fill: #c6b294;
  }
  .room-seat-pressure-pad .iso-top,
  .room-bed-pressure-strip .iso-top {
    fill: color-mix(in srgb, #a0bba1 60%, var(--iso-front));
    stroke-width: 0.6;
  }
  .room-seat-pressure-pad .iso-front,
  .room-bed-pressure-strip .iso-front {
    fill: #8aaa8f;
    stroke-width: 0.5;
  }
  .room-pad-electrode {
    fill: none;
    stroke: #637f66;
    stroke-width: 0.55;
  }
  .room-loaded-cushion {
    fill: color-mix(in srgb, #839e91 27%, transparent);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .room-pad-transmitter .iso-front,
  .room-bed-interface .iso-front {
    fill: var(--iso-top);
  }
  .room-bed-headboard .iso-front,
  .room-bed-base .iso-top {
    fill: color-mix(in srgb, #bcab8a 20%, var(--iso-top));
  }
  .room-mattress-cutaway .iso-front,
  .room-mattress-cutaway .iso-side,
  .room-mattress-cutaway .iso-top {
    fill: color-mix(in srgb, #dce5db 15%, transparent);
    stroke-width: 0.6;
  }
  .room-pillow .iso-top,
  .room-pillow .iso-front {
    fill: var(--iso-top);
    stroke-width: 0.6;
  }
  .room-bedding-cutaway {
    fill: color-mix(in srgb, #a9c3bd 15%, transparent);
    stroke: color-mix(in srgb, var(--iso-outline) 40%, transparent);
    stroke-width: 0.5;
    stroke-dasharray: 3 2;
  }
  .room-touch-panel .iso-front,
  .room-touch-panel .iso-side,
  .room-panel-mount .iso-front,
  .room-tablet-screen {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .room-screen-line {
    fill: none;
    stroke: #adc6ba;
    stroke-width: 0.8;
  }
  .room-schedule-slot {
    fill: #526e62;
    stroke: #adc6ba;
    stroke-width: 0.35;
  }
  .room-schedule-selected {
    fill: #ad8068;
    stroke: #d2b79b;
    stroke-width: 0.35;
  }
  .room-status-green .iso-front,
  .room-status-green .iso-top {
    fill: #63b184;
    stroke-width: 0.4;
  }
  .room-status-red .iso-front,
  .room-status-red .iso-top {
    fill: #c9735e;
    stroke-width: 0.4;
  }
  .room-status-off .iso-front,
  .room-status-off .iso-top {
    fill: var(--iso-metal);
    stroke-width: 0.4;
  }
  .room-kiosk-foot .iso-top,
  .room-kiosk-pedestal .iso-front {
    fill: var(--iso-metal);
  }
  .room-kiosk-head .iso-front,
  .room-kiosk-head .iso-side {
    fill: var(--iso-top);
  }
  .room-screen-button {
    fill: #57866c;
    stroke: #a1b9a6;
    stroke-width: 0.3;
  }
  .room-code-scanner .iso-front,
  .room-printer-slot .iso-front,
  .room-tag-id,
  .room-ethernet-port .iso-front,
  .room-dc-port,
  .room-keyhole,
  .room-camera-aperture {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .room-scanner-glass {
    fill: none;
    stroke: #8c9a96;
    stroke-width: 0.8;
  }
  .room-scanner-active {
    fill: none;
    stroke: #ba7765;
    stroke-width: 1.1;
  }
  .room-service-door .iso-front {
    fill: var(--iso-front);
    stroke-width: 0.6;
  }
  .room-paper {
    fill: #f2efe3;
    stroke: #aaa895;
    stroke-width: 0.55;
  }
  .room-issued-paper .iso-screen {
    fill: #f2efe3;
    stroke: none;
  }
  .room-issued-paper .screen-label {
    fill: #334b3e;
    font-size: 3px;
  }
  .room-paper-barcode {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 0.55;
  }
  .room-tag-shell .iso-front,
  .room-tag-face .iso-front {
    fill: var(--iso-top);
  }
  .room-tag-button {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .room-tracking-gateway .iso-front,
  .room-tracking-gateway .iso-top {
    fill: var(--iso-top);
  }
  .room-gateway-antenna .iso-front,
  .room-gateway-antenna .iso-top {
    fill: var(--iso-dark);
  }
  .room-gateway-bracket .iso-front {
    fill: var(--iso-metal);
  }
  .room-port-contact {
    fill: none;
    stroke: #b4a177;
    stroke-width: 0.55;
  }
  .room-call-plate .iso-front {
    fill: var(--iso-top);
  }
  .room-call-button-bezel {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .room-call-red-button {
    fill: #c26d58;
    stroke: #8b503e;
    stroke-width: 0.7;
  }
  .room-assistance-symbol {
    fill: #f6eee1;
    font-size: 11px;
    text-anchor: middle;
    font-family: inherit;
    font-weight: 700;
  }
  .room-call-cord-grip .iso-front,
  .room-call-cord-grip .iso-top {
    fill: #bc7460;
  }
  .telemetry-unknown .room-load-indicator,
  .telemetry-unknown .room-fresnel-lens {
    opacity: 0.55;
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-occupancy * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
