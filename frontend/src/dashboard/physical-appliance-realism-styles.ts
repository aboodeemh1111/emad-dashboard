import { css } from "lit";

export const physicalApplianceRealismStyles = css`
  :host([library-preview]) .device-element[data-category="appliances"] {
    height: auto;
    overflow: visible;
  }
  .device-element[data-category="appliances"] .iso-scene {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 280/190;
    max-block-size: 290px;
    flex-shrink: 0;
  }
  .device-element[data-category="appliances"] :is(button, input[type="range"]) {
    min-block-size: 44px;
  }
  .realistic-appliances {
    --ap-ink: color-mix(in srgb, #28463f 75%, var(--iso-outline));
    --ap-steel: color-mix(in srgb, #a2b8b3 66%, var(--iso-metal));
    --ap-white: color-mix(in srgb, #f0f4ee 85%, var(--iso-top));
    --ap-dark: color-mix(in srgb, #243d3a 80%, var(--iso-dark));
    --ap-water: #70b7c4;
  }
  .realistic-appliances * {
    vector-effect: non-scaling-stroke;
  }
  .realistic-appliances :is(.iso-front, .iso-side, .iso-top) {
    stroke: var(--ap-ink);
    stroke-width: 0.8;
    stroke-linejoin: round;
  }
  .ap-cabinet .iso-front {
    fill: var(--ap-white);
  }
  .ap-cabinet .iso-side {
    fill: color-mix(in srgb, var(--ap-steel) 60%, var(--iso-side));
  }
  .ap-cabinet .iso-top {
    fill: color-mix(in srgb, #fff 70%, var(--iso-top));
  }
  .realistic-appliances
    :is(
      .ap-stainless,
      .ap-hood-shell,
      .ap-post,
      .ap-shelf,
      .ap-tray,
      .ap-evaporator,
      .ap-group-head,
      .ap-drip-tray,
      .ap-pan
    )
    .iso-front {
    fill: var(--ap-steel);
  }
  .realistic-appliances
    :is(
      .ap-stainless,
      .ap-hood-shell,
      .ap-post,
      .ap-shelf,
      .ap-tray,
      .ap-evaporator,
      .ap-group-head,
      .ap-drip-tray,
      .ap-pan
    )
    .iso-top {
    fill: color-mix(in srgb, #eef5f0 70%, var(--ap-steel));
  }
  .realistic-appliances
    :is(
      .ap-stainless,
      .ap-hood-shell,
      .ap-post,
      .ap-shelf,
      .ap-tray,
      .ap-evaporator,
      .ap-group-head,
      .ap-drip-tray,
      .ap-pan
    )
    .iso-side {
    fill: color-mix(in srgb, #5f7874 65%, var(--ap-steel));
  }
  .realistic-appliances
    :is(.ap-foot, .ap-caster, .ap-lint-filter)
    :is(.iso-front, .iso-top, .iso-side) {
    fill: var(--ap-dark);
  }
  .realistic-appliances
    :is(.ap-cavity, .ap-oven-cavity, .ap-coffee-recess, .ap-dispenser-recess)
    :is(.iso-front, .iso-side, .iso-top) {
    fill: var(--ap-dark);
  }
  .ap-cold-cavity .iso-front {
    fill: color-mix(in srgb, #a1c5bc 70%, var(--iso-side));
  }
  .ap-cold-cavity .iso-side {
    fill: #8aaea6;
  }
  .ap-cold-cavity .iso-top {
    fill: #d3e1d9;
  }
  .realistic-appliances
    :is(
      .ap-door-skin,
      .ap-dishwasher-door,
      .ap-freezer-lid,
      .ap-hood-canopy,
      .ap-bin-flap
    ) {
    fill: var(--ap-white);
    stroke: var(--ap-ink);
    stroke-width: 1;
    stroke-linejoin: round;
  }
  .ap-glass-door .ap-door-skin {
    fill: color-mix(in srgb, #8cbbb3 12%, transparent);
  }
  .ap-arm-metal,
  .ap-arm-hub {
    fill: var(--ap-steel);
    stroke: var(--ap-ink);
    stroke-width: 0.6;
  }
  .ap-nozzle {
    fill: var(--ap-dark);
    stroke: none;
  }
  .ap-arm-turn {
    animation: ap-rotate 2.5s linear infinite;
    transform-origin: 0 0;
  }
  .ap-fryer-front {
    fill: var(--ap-dark);
    stroke: var(--ap-ink);
    stroke-width: 0.9;
  }
  .ap-inner-back {
    fill: var(--ap-dark);
    stroke: var(--ap-ink);
    stroke-width: 0.7;
  }
  .ap-gasket {
    fill: none;
    stroke: var(--ap-steel);
    stroke-width: 1.7;
  }
  .realistic-appliances :is(.ap-handle, .ap-baffle) {
    fill: none;
    stroke: var(--ap-ink);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .realistic-appliances
    :is(.ap-seam, .ap-panel-seam, .ap-wire, .ap-level-mark) {
    fill: none;
    stroke: var(--ap-ink);
    stroke-width: 0.65;
    opacity: 0.65;
  }
  .ap-hinge {
    fill: var(--ap-steel);
    stroke: var(--ap-ink);
    stroke-width: 0.6;
  }
  .realistic-appliances
    :is(.ap-glass, .ap-vending-glass, .ap-porthole-glass, .ap-bin-window) {
    fill: color-mix(in srgb, #96c8c4 18%, transparent);
    stroke: var(--ap-ink);
    stroke-width: 0.8;
  }
  .ap-reflection {
    fill: none;
    stroke: #f6fffc;
    stroke-width: 1.8;
    stroke-linecap: round;
    opacity: 0.65;
  }
  .ap-gasket-fill {
    fill: #384c49;
    stroke: var(--ap-steel);
    stroke-width: 2.5;
  }
  .ap-drum-metal {
    fill: #77958f;
    stroke: #c7d8d1;
    stroke-width: 1;
  }
  .ap-perforation {
    fill: #304e49;
    stroke: none;
  }
  .ap-drum-paddle {
    fill: #cbdad2;
    stroke: #4f6e65;
    stroke-width: 0.6;
  }
  .ap-door-ring {
    fill: none;
    stroke: #e6eee8;
    stroke-width: 3.5;
  }
  .ap-cloth {
    stroke: #4e6c62;
    stroke-width: 0.65;
  }
  .ap-cloth-mint {
    fill: #8dbbab;
  }
  .ap-cloth-cream {
    fill: #e8d8b8;
  }
  .ap-cloth-blue {
    fill: #79a5ad;
  }
  .ap-wash-water {
    fill: #56abc1;
    opacity: 0.48;
    stroke: none;
  }
  .ap-suds {
    fill: #ecfaf6;
    opacity: 0.8;
  }
  .ap-drawer {
    fill: var(--ap-white);
    stroke: var(--ap-ink);
    stroke-width: 0.7;
  }
  .ap-dial {
    fill: var(--ap-steel);
    stroke: var(--ap-ink);
    stroke-width: 1;
  }
  .ap-drum-rotor {
    transform-box: fill-box;
    transform-origin: center;
  }
  .ap-tumble {
    animation: ap-tumble 4.2s ease-in-out infinite;
  }
  .ap-spin {
    animation: ap-rotate 0.65s linear infinite;
  }
  .realistic-appliances :is(.ap-plate, .ap-cup) {
    fill: #e8eee4;
    stroke: var(--ap-ink);
    stroke-width: 0.8;
  }
  .ap-plate-edge {
    fill: none;
    stroke: #a7c3b9;
    stroke-width: 0.6;
  }
  .ap-spray {
    opacity: 0;
  }
  .ap-spraying {
    opacity: 0.75;
  }
  .ap-spray-line {
    fill: none;
    stroke: #8cced2;
    stroke-width: 1;
    stroke-dasharray: 1 4;
    animation: ap-fluid 0.75s linear infinite;
  }
  .ap-air {
    opacity: 0;
  }
  .ap-airflow {
    opacity: 0.48;
  }
  .ap-air-line {
    fill: none;
    stroke: #72a99b;
    stroke-width: 1.1;
    stroke-dasharray: 5 6;
    animation: ap-fluid 1.8s linear infinite;
  }
  .ap-cold-air .ap-air-line {
    stroke: #75bbc7;
  }
  .ap-steam {
    opacity: 0;
  }
  .ap-steam.ap-emitting {
    opacity: 0.5;
  }
  .ap-steam path {
    fill: none;
    stroke: #b6cfc5;
    stroke-width: 1.2;
    stroke-linecap: round;
    animation: ap-steam 2.2s ease-out infinite;
  }
  .realistic-appliances
    :is(.ap-ice-cube, .ap-ice-crystal)
    :is(.iso-front, .iso-top, .iso-side) {
    fill: color-mix(in srgb, #bde2e3 70%, var(--iso-top));
    stroke: #75afb2;
    stroke-width: 0.55;
  }
  .ap-harvest {
    opacity: 0;
  }
  .ap-harvest.ap-dropping {
    opacity: 0.9;
  }
  .ap-dropping > g {
    animation: ap-ice-drop 1.1s ease-in infinite;
  }
  .ap-element-line {
    fill: none;
    stroke: #7f7565;
    stroke-width: 1.8;
  }
  .ap-heating .ap-element-line {
    stroke: #d38a50;
    filter: drop-shadow(0 0 2px #d79a60);
  }
  .ap-oven-door {
    fill: color-mix(in srgb, #29413d 75%, transparent);
    stroke: var(--ap-ink);
    stroke-width: 1.2;
  }
  .ap-oven-window {
    fill: color-mix(in srgb, #172f2b 65%, transparent);
    stroke: #769389;
    stroke-width: 0.7;
  }
  .ap-cavity-lit {
    fill: color-mix(in srgb, #bd965a 30%, transparent);
  }
  .realistic-appliances
    :is(.ap-hob-glass, .ap-turntable)
    :is(.iso-front, .iso-side, .iso-top) {
    fill: #2d4540;
    stroke: #567367;
  }
  .realistic-appliances .ap-zone :is(.iso-front, .iso-top) {
    fill: none;
    stroke: #83a098;
    stroke-width: 0.7;
  }
  .ap-zone-mark {
    stroke: #a7b9a9;
    stroke-width: 0.7;
  }
  .ap-pan-liquid .iso-top {
    fill: #a3b9a5;
    stroke: #4a655b;
  }
  .realistic-appliances .ap-fryer-basket :is(.iso-front, .iso-side, .iso-top) {
    fill: var(--ap-dark);
    stroke: #758d81;
  }
  .realistic-appliances .ap-food :is(.iso-front, .iso-side, .iso-top),
  .realistic-appliances .ap-food {
    fill: #c6a577;
    stroke: #927a55;
    stroke-width: 0.65;
  }
  .ap-lamp {
    fill: #9fb6a4;
    stroke: #4e6f5d;
    stroke-width: 0.6;
  }
  .ap-lamp-on {
    fill: #f4e9b6;
    filter: drop-shadow(0 0 3px #dacb85);
  }
  .ap-task-light {
    fill: #dfd39b;
    opacity: 0.16;
    stroke: none;
  }
  .realistic-appliances
    :is(.ap-kettle-glass, .ap-water-bottle)
    :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #a8d2cf 22%, transparent);
    stroke: #678e87;
    stroke-width: 0.9;
  }
  .realistic-appliances
    :is(.ap-kettle-water, .ap-water-bottle, .ap-water-fill)
    .iso-liquid {
    fill: #83c6cc;
    opacity: 0.6;
  }
  .realistic-appliances :is(.ap-kettle-water, .ap-water-fill) .iso-front,
  .realistic-appliances :is(.ap-kettle-water, .ap-water-fill) .iso-top {
    fill: transparent;
    stroke: none;
  }
  .realistic-appliances
    :is(.ap-kettle-lid, .ap-kettle-base)
    :is(.iso-front, .iso-top),
  .ap-kettle-spout {
    fill: var(--ap-steel);
    stroke: var(--ap-ink);
    stroke-width: 0.8;
  }
  .ap-bubbles circle {
    fill: #d5f5f1;
    stroke: #7bb4bd;
    stroke-width: 0.6;
    animation: ap-bubble 0.9s ease-out infinite;
  }
  .realistic-appliances .ap-coffee-fill .iso-liquid {
    fill: #6b4d36;
    opacity: 0.9;
  }
  .realistic-appliances .ap-coffee-fill :is(.iso-front, .iso-top) {
    fill: transparent;
    stroke: none;
  }
  .ap-cup-rim .iso-top {
    fill: none;
    stroke: #e9f4ec;
    stroke-width: 1.6;
  }
  .ap-coffee-stream,
  .ap-water-stream {
    fill: none;
    stroke: #77563c;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-dasharray: 4 1;
    animation: ap-fluid 0.6s linear infinite;
  }
  .ap-water-stream {
    stroke: #83cbd0;
  }
  .realistic-appliances .ap-bean-hopper :is(.iso-front, .iso-top) {
    fill: color-mix(in srgb, #b4c9ba 30%, transparent);
    stroke: #587362;
  }
  .realistic-appliances .ap-bean :is(.iso-front, .iso-top) {
    fill: #6c5740;
    stroke: none;
  }
  .ap-hopper-lid .iso-top {
    fill: var(--ap-dark);
  }
  .realistic-appliances
    :is(
      .ap-bottle,
      .ap-bottle-cap,
      .ap-carton,
      .ap-crate,
      .ap-produce,
      .ap-frozen-pack,
      .ap-product-mint,
      .ap-product-cream,
      .ap-vend-drop
    )
    :is(.iso-front, .iso-top, .iso-side) {
    fill: #a6c4ad;
    stroke: #64816a;
    stroke-width: 0.65;
  }
  .realistic-appliances
    :is(.ap-product-cream, .ap-carton, .ap-frozen-pack)
    :is(.iso-front, .iso-top, .iso-side) {
    fill: #dfd5b1;
    stroke: #9c9275;
  }
  .ap-vend-coil path {
    fill: none;
    stroke: #b7c7b7;
    stroke-width: 1;
  }
  .ap-vend-turn {
    animation: ap-rotate 0.7s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .ap-pickup {
    fill: var(--ap-dark);
    stroke: #788e7f;
    stroke-width: 1;
  }
  .ap-key {
    fill: var(--ap-steel);
    stroke: var(--ap-ink);
    stroke-width: 0.5;
  }
  .ap-led {
    fill: #7f978a;
    stroke: none;
  }
  .ap-led.ap-lit,
  .ap-lock-led {
    fill: #79b997;
    filter: drop-shadow(0 0 1px #7cc49d);
  }
  .ap-unavailable {
    opacity: 0.5;
  }
  .realistic-appliances:not([data-operating="true"])
    :is(.ap-spray-line, .ap-air-line, .ap-steam path) {
    animation-play-state: paused;
  }
  .ap-turntable-moving {
    animation: ap-rotate 6s linear infinite;
    transform-origin: 0 0;
  }
  .ap-turntable-plate {
    fill: #b5d3c7;
    fill-opacity: 0.4;
    stroke: #9db9ad;
    stroke-width: 0.8;
  }
  .ap-turntable-mark {
    fill: #708e80;
  }
  .realistic-appliances
    :is(.ap-steam path, .ap-bubbles circle, .ap-dropping > g) {
    animation-delay: var(--ap-delay, 0s);
  }
  @keyframes ap-rotate {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes ap-tumble {
    0%,
    8% {
      transform: rotate(-35deg);
    }
    42%,
    58% {
      transform: rotate(155deg);
    }
    92%,
    100% {
      transform: rotate(-35deg);
    }
  }
  @keyframes ap-fluid {
    to {
      stroke-dashoffset: -22;
    }
  }
  @keyframes ap-steam {
    0% {
      opacity: 0;
      transform: translateY(3px);
    }
    30% {
      opacity: 0.8;
    }
    100% {
      opacity: 0;
      transform: translateY(-8px);
    }
  }
  @keyframes ap-ice-drop {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translate(0, 25px);
      opacity: 0;
    }
  }
  @keyframes ap-bubble {
    from {
      transform: translateY(0);
      opacity: 0;
    }
    35% {
      opacity: 1;
    }
    to {
      transform: translateY(-17px);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .realistic-appliances * {
      animation: none !important;
      transition: none !important;
    }
  }
`;
