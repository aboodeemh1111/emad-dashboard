import { css } from "lit";

export const physicalWeatherStyles = css`
  .realistic-weather {
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .wx-metal {
    --water-metal-top: color-mix(in srgb, #e5ebec 70%, var(--iso-top));
    --water-metal-side: color-mix(in srgb, #77949a 45%, var(--iso-metal));
  }
  .wx-white,
  .wx-snow {
    --water-metal-top: var(--iso-top);
    --water-metal-side: color-mix(
      in srgb,
      var(--iso-metal) 30%,
      var(--iso-top)
    );
  }
  .wx-dark,
  .wx-probe {
    --water-metal-top: var(--iso-dark);
    --water-metal-side: var(--iso-outline);
  }
  .wx-cup-surface,
  .wx-vane-tail,
  .wx-bucket {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.65;
    stroke-linejoin: round;
  }
  .wx-cup-interior {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wx-cup-rim,
  .wx-lip,
  .wx-strainer-ring {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1;
  }
  .wx-cup-shade {
    fill: none;
    stroke: var(--iso-metal);
    stroke-width: 0.5;
  }
  .wx-cable {
    fill: none;
    stroke: var(--iso-dark);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .wx-screw {
    fill: var(--iso-dark);
    stroke: var(--iso-top);
    stroke-width: 0.4;
  }
  .wx-compass,
  .wx-tick,
  .wx-vent,
  .wx-bucket-seam {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 0.7;
  }
  .wx-cardinal {
    fill: var(--secondary-text-color);
    font-size: 5px;
    text-anchor: middle;
  }
  .wx-arrowhead,
  .wx-transducer,
  .wx-rain-board {
    fill: var(--iso-dark);
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .wx-mesh {
    fill: none;
    stroke: var(--iso-metal);
    stroke-width: 0.6;
  }
  .wx-funnel-inside,
  .wx-dial {
    fill: var(--iso-top);
    stroke: var(--iso-outline);
    stroke-width: 0.8;
  }
  .wx-needle {
    stroke: var(--device-accent);
    stroke-width: 1.4;
  }
  .wx-bearing {
    fill: var(--iso-outline);
    stroke: var(--iso-top);
    stroke-width: 0.6;
  }
  .wx-gauge-wall {
    fill: var(--iso-metal);
    stroke: none;
  }
  .wx-cutaway {
    opacity: 0.19;
    --water-metal-top: var(--iso-top);
    --water-metal-side: var(--iso-metal);
  }
  .wx-optical-glass {
    opacity: 0.35;
    --water-metal-top: #dceff6;
    --water-metal-side: #7eafb9;
  }
  .wx-diffuser {
    --water-metal-top: #e7f2f4;
    --water-metal-side: #afc5c9;
  }
  .wx-rain-electrode {
    fill: none;
    stroke: #bbad76;
    stroke-width: 0.85;
  }
  .wx-raindrop,
  .wx-drain-flow {
    fill: none;
    stroke: #549daf;
    stroke-width: 1.5;
    stroke-linecap: round;
  }
  .wx-water {
    fill: #529eaf;
    fill-opacity: 0.3;
    stroke: #659eaa;
    stroke-width: 0.5;
  }
  .wx-water-ripple {
    fill: none;
    stroke: #d6edf2;
    stroke-width: 0.7;
  }
  .wx-droplet {
    fill: #75bccb;
    fill-opacity: 0.8;
    stroke: #e2f2f3;
    stroke-width: 0.5;
  }
  .wx-led-off {
    fill: var(--iso-metal);
    stroke: var(--iso-outline);
    stroke-width: 0.5;
  }
  .wx-led-on {
    fill: #6cb89b;
    stroke: var(--iso-top);
    stroke-width: 0.5;
  }
  .wx-level-bubble {
    fill: #9fc697;
    stroke: var(--iso-outline);
    stroke-width: 0.6;
  }
  .wx-ice {
    fill: none;
    stroke: #b2d7e6;
    stroke-width: 1;
    stroke-linecap: round;
  }
  .wx-ground .iso-top,
  .wx-roof .iso-top,
  .wx-surface .iso-top {
    fill: color-mix(
      in srgb,
      var(--iso-metal) 25%,
      var(--card-background-color)
    );
  }
  .wx-strainer-rib {
    fill: none;
    stroke: var(--iso-outline);
    stroke-width: 1.5;
  }
  .wx-drain-outlet {
    --water-metal-top: var(--iso-dark);
    --water-metal-side: var(--iso-metal);
  }
  .wx-vane-unknown,
  .wx-unknown .wx-cup-rotor {
    opacity: 0.4;
  }
  .wx-unknown .wx-dial {
    opacity: 0.6;
  }
  .realistic-weather * {
    vector-effect: non-scaling-stroke;
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-weather * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
