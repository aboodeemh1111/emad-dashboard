import { css } from "lit";

export const physicalTreatmentStyles = css`
  .realistic-treatment {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .treatment-frp {
    --water-metal-top: color-mix(in srgb, #b7c9c2 48%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #6a9283 35%, var(--iso-metal));
  }
  .treatment-ro-vessel {
    --water-metal-top: color-mix(in srgb, #dedbd0 45%, var(--iso-top));
    --water-metal-side: var(--iso-metal);
  }
  .treatment-brine-tank {
    --water-metal-top: var(--iso-top);
    --water-metal-side: color-mix(in srgb, #8d9aa2 50%, var(--iso-metal));
  }
  .treatment-control-head .iso-front,
  .treatment-control-head .iso-side,
  .treatment-control-panel .iso-front,
  .treatment-control-panel .iso-side,
  .treatment-ballast .iso-front,
  .treatment-ballast .iso-side,
  .treatment-transmitter .iso-front {
    fill: var(--iso-dark);
  }
  .treatment-control-head .iso-top,
  .treatment-control-panel .iso-top {
    fill: color-mix(in srgb, var(--device-accent) 30%, var(--iso-metal));
  }
  .treatment-foot .iso-front,
  .treatment-foot .iso-top,
  .treatment-rack .iso-front,
  .treatment-rack .iso-side,
  .treatment-skid .iso-front,
  .treatment-skid .iso-top {
    fill: var(--iso-metal);
  }
  .treatment-media {
    stroke: var(--iso-outline);
    stroke-width: 0.55;
  }
  .treatment-resin {
    fill: color-mix(in srgb, #c6a373 60%, var(--iso-front));
  }
  .treatment-sand {
    fill: color-mix(in srgb, #d1bd8b 65%, var(--iso-front));
  }
  .treatment-carbon {
    fill: color-mix(in srgb, #344b47 85%, var(--iso-metal));
  }
  .treatment-resin-grain {
    fill: #8e6844;
    stroke: none;
  }
  .treatment-sand-grain {
    fill: #9b8457;
    stroke: none;
  }
  .treatment-carbon-grain {
    fill: #152825;
    stroke: none;
  }
  .treatment-riser .iso-front,
  .treatment-riser .iso-top {
    fill: var(--iso-metal);
  }
  .treatment-salt-window .iso-front {
    fill: var(--iso-dark);
  }
  .treatment-operating.treatment-backwashing .treatment-grain {
    animation: treatment-fluidization 1.8s ease-in-out infinite alternate;
  }
  @keyframes treatment-fluidization {
    to {
      transform: translateY(-1.2px);
    }
  }
  .treatment-salt {
    fill: var(--iso-top);
    stroke: var(--iso-metal);
    stroke-width: 0.35;
  }
  .treatment-salt .iso-front,
  .treatment-salt .iso-top {
    fill: var(--iso-top);
  }
  .treatment-brine-lid .iso-top,
  .treatment-filter-cap .iso-top {
    fill: var(--iso-dark);
  }
  .treatment-filter-bowl .iso-front {
    fill: color-mix(in srgb, #b2d1d5 30%, var(--iso-front));
  }
  .treatment-bowl-window,
  .treatment-membrane-cutaway,
  .treatment-fiber-window {
    fill: color-mix(in srgb, #d9ece9 35%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .treatment-pleat,
  .treatment-carbon-pleat,
  .treatment-hollow-fiber,
  .treatment-membrane-layer {
    fill: none;
    stroke: #b6ab89;
    stroke-width: 0.75;
  }
  .treatment-carbon-pleat {
    stroke: var(--iso-dark);
    stroke-width: 1.2;
  }
  .treatment-hollow-fiber {
    stroke: var(--iso-metal);
    stroke-width: 0.8;
  }
  .treatment-membrane-layer {
    stroke: #90aaa4;
    stroke-width: 0.5;
  }
  .treatment-uf-module .iso-front {
    fill: var(--iso-front);
  }
  .treatment-uf-clamp .iso-front,
  .treatment-vessel-strap .iso-front {
    fill: var(--iso-metal);
  }
  .treatment-hp-pump .iso-front,
  .treatment-hp-motor .iso-front {
    fill: var(--device-accent);
  }
  .treatment-brine .flow-path,
  .treatment-concentrate .flow-path {
    stroke: #ad8c52;
  }
  .treatment-permeate .flow-path {
    stroke: #4caaa9;
  }
  .treatment-drain .flow-path {
    stroke: #7c9694;
  }
  .treatment-gas .flow-path {
    stroke: #8b94b4;
  }
  .treatment-backwashing .treatment-bed-flow .flow-path,
  .treatment-backwashing .treatment-feed .flow-path,
  .treatment-backwashing .treatment-permeate .flow-path,
  .treatment-phase-refill .treatment-brine .flow-path {
    animation-direction: reverse;
  }
  .treatment-uv-window {
    fill: color-mix(in srgb, #8e86a8 17%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .treatment-uv-lamp-on,
  .treatment-uv-lamp-off {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
  }
  .treatment-uv-lamp-on {
    stroke: #9c8cc4;
  }
  .treatment-uv-lamp-off {
    stroke: var(--iso-metal);
  }
  .treatment-phase-warming .treatment-uv-lamp-on {
    opacity: 0.4;
  }
  .treatment-fault .treatment-uv-lamp-on {
    stroke: var(--iso-dark);
  }
  .treatment-dose-drive .iso-front {
    fill: color-mix(in srgb, var(--device-accent) 48%, var(--iso-front));
  }
  .treatment-dose-drive .iso-side {
    fill: color-mix(in srgb, var(--device-accent) 32%, var(--iso-dark));
  }
  .treatment-dose-head {
    --water-metal-top: color-mix(in srgb, #b4b49d 30%, var(--iso-top));
    --water-metal-side: var(--iso-metal);
  }
  .treatment-dosing .treatment-dose-plunger {
    animation: treatment-stroke var(--treatment-stroke-period, 1.8s) linear
      infinite;
  }
  .treatment-chemical-discharge .flow-path,
  .treatment-chemical-suction .flow-path {
    stroke: #bd9f67;
    animation: treatment-metering-pulse var(--treatment-stroke-period, 1.8s)
      linear infinite;
  }
  .treatment-chemical-tank {
    --water-metal-top: color-mix(in srgb, #d3d5c8 40%, var(--iso-top));
    --water-metal-side: var(--iso-metal);
  }
  .treatment-chemical-lid .iso-top {
    fill: var(--iso-dark);
  }
  .treatment-level-window {
    fill: var(--iso-dark);
    stroke: var(--iso-metal);
    stroke-width: 0.5;
  }
  .treatment-chemical-liquid {
    fill: #c7b574;
    stroke: none;
  }
  .treatment-contact-window,
  .treatment-optical-window,
  .treatment-analyzer-window {
    fill: color-mix(in srgb, #acc9ce 18%, var(--card-background-color));
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .treatment-gas-bubble {
    fill: color-mix(in srgb, #c4d1e9 70%, transparent);
    stroke: #7e95aa;
    stroke-width: 0.6;
  }
  .treatment-contact-bubbles {
    animation: treatment-bubble-rise 2s linear infinite;
  }
  .treatment-ozone-cabinet .iso-front,
  .treatment-analyzer-cabinet .iso-front {
    fill: var(--iso-metal);
  }
  .treatment-vent {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1;
  }
  .treatment-optical-path {
    fill: none;
    stroke: #8aacaf;
    stroke-width: 1;
    opacity: 0.35;
  }
  .treatment-operating .treatment-optical-path {
    animation: treatment-optical-read 1.2s ease-in-out infinite;
  }
  .treatment-optical-emitter .iso-front,
  .treatment-optical-detector .iso-front {
    fill: var(--iso-dark);
  }
  .treatment-optical-probe .iso-front,
  .treatment-probe-body .iso-front {
    fill: var(--iso-metal);
  }
  .treatment-probe-thread {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .treatment-probe-connector .iso-front,
  .treatment-probe-connector .iso-top,
  .treatment-oxygen-cap .iso-front,
  .treatment-oxygen-cap .iso-top {
    fill: var(--iso-dark);
  }
  .treatment-ph-glass .iso-front {
    fill: color-mix(in srgb, #b7d8c6 30%, transparent);
  }
  .treatment-ph-bulb {
    --water-metal-top: color-mix(in srgb, #b1d2bf 55%, var(--iso-top));
    --water-metal-side: #6c9586;
  }
  .treatment-reference-junction {
    fill: #ccbd98;
    stroke: var(--iso-outline);
    stroke-width: 0.4;
  }
  .treatment-orp-tip .iso-front,
  .treatment-ec-electrode .iso-front {
    fill: var(--iso-metal);
  }
  .treatment-platinum-ring .iso-front,
  .treatment-platinum-ring .iso-top {
    fill: #d8dadd;
  }
  .treatment-luminescent-spot {
    fill: #547caa;
    stroke: #bfd3e3;
    stroke-width: 0.6;
  }
  .treatment-toroid {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .treatment-toroid-hole {
    fill: var(--card-background-color);
    stroke: var(--iso-metal);
    stroke-width: 0.7;
  }
  .treatment-membrane-face {
    fill: #d8d9cc;
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .treatment-chlorine-membrane .iso-front {
    fill: var(--iso-dark);
  }
  .treatment-chlorine-flow-cell .iso-front {
    fill: color-mix(in srgb, #b6d4da 20%, transparent);
  }
  .treatment-reagent-bottle .iso-front {
    fill: color-mix(in srgb, #bdc59d 45%, var(--iso-front));
  }
  .treatment-reagent-cap .iso-top {
    fill: var(--iso-dark);
  }
  .treatment-sample-tube {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .treatment-reagent-pulse {
    fill: none;
    stroke: #bc99b0;
    stroke-width: 1.4;
    stroke-dasharray: 2 5;
    animation: liquid-flow 1.2s linear infinite;
  }
  @keyframes treatment-stroke {
    0%,
    25%,
    100% {
      transform: translate(0, 0);
    }
    35%,
    65% {
      transform: translate(1.84px, 0.92px);
    }
  }
  @keyframes treatment-metering-pulse {
    0%,
    25%,
    100% {
      stroke-dashoffset: 0;
      opacity: 0.15;
    }
    35%,
    65% {
      stroke-dashoffset: -12;
      opacity: 1;
    }
  }
  @keyframes treatment-bubble-rise {
    0% {
      transform: translateY(4px);
      opacity: 0.2;
    }
    50% {
      opacity: 0.9;
    }
    100% {
      transform: translateY(-5px);
      opacity: 0;
    }
  }
  @keyframes treatment-optical-read {
    50% {
      opacity: 0.75;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-treatment * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
