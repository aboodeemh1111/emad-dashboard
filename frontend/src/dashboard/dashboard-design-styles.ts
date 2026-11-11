import { css } from "lit";

/** Shared isometric geometry and motion; colors stay compatible with the controller theme. */
export const dashboardIsometricStyles = css`
  .dashboard {
    --emad-cut: 18px;
    --emad-shape: polygon(
      0 0,
      calc(100% - 18px) 0,
      100% 18px,
      100% 100%,
      18px 100%,
      0 calc(100% - 18px)
    );
    --emad-shape-small: polygon(
      0 0,
      calc(100% - 7px) 0,
      100% 7px,
      100% 100%,
      7px 100%,
      0 calc(100% - 7px)
    );
    --emad-depth-x: 4px;
    --emad-depth: color-mix(
      in srgb,
      var(--emad-mint) 24%,
      var(--primary-background-color, #edf3ec)
    );
    --emad-surface: var(--card-background-color, #fff);
    --emad-duration: var(--ha-animation-duration-normal, 220ms);
    padding-block-start: 22px;
  }
  .dashboard[dir="rtl"] {
    --emad-shape: polygon(
      18px 0,
      100% 0,
      100% calc(100% - 18px),
      calc(100% - 18px) 100%,
      0 100%,
      0 18px
    );
    --emad-shape-small: polygon(
      7px 0,
      100% 0,
      100% calc(100% - 7px),
      calc(100% - 7px) 100%,
      0 100%,
      0 7px
    );
    --emad-depth-x: -4px;
  }
  .topbar {
    padding-block-end: 20px;
    border: 0;
  }
  .brand-icon {
    display: grid;
    place-items: center;
    inline-size: 48px;
    block-size: 48px;
    padding: 4px;
    clip-path: var(--emad-shape-small);
  }
  .brand-icon emad-ui-logo {
    inline-size: 42px;
    block-size: 42px;
  }
  .top-actions > button,
  .edit-bar > button,
  .widget-types > button,
  .fill-room,
  .editor-section > button {
    border-radius: 0;
    clip-path: var(--emad-shape-small);
    transition:
      transform var(--emad-duration) ease,
      background var(--emad-duration) ease;
  }
  button:not(:disabled):active {
    transform: translateY(2px) scale(0.98);
  }
  .intro {
    position: relative;
    isolation: isolate;
    padding: 30px 34px;
    min-block-size: 180px;
    margin: 6px 0 30px;
    color: #f2f6ef;
    background: transparent;
    display: flex;
    overflow: visible;
  }
  .intro::before,
  .intro::after {
    content: "";
    position: absolute;
    inset: 0;
    clip-path: var(--emad-shape);
    pointer-events: none;
    z-index: -1;
  }
  .intro::before {
    background: #0f3829;
    transform: translate(var(--emad-depth-x), 7px);
  }
  .intro::after {
    background:
      radial-gradient(ellipse at 86% 90%, #2c513d 0%, transparent 55%), #192c22;
    border: 1px solid #355442;
  }
  .intro-copy {
    position: relative;
    z-index: 1;
    max-inline-size: 62%;
  }
  .intro .eyebrow {
    color: #9ec9b3;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .intro .eyebrow::before {
    content: "";
    inline-size: 18px;
    block-size: 2px;
    background: var(--emad-mint);
  }
  .intro h2 {
    color: #f7f6f0;
    font-size: 36px;
    letter-spacing: -1.2px;
    margin-block: 10px;
  }
  .intro p:not(.eyebrow) {
    color: #b6c8bb;
    max-inline-size: 440px;
  }
  .intro .date {
    color: #c4d5c8;
    position: absolute;
    inset-block-start: 24px;
    inset-inline-end: 28px;
    z-index: 1;
    font-size: 10px;
  }
  .intro emad-ui-isometric-scene {
    position: absolute;
    inline-size: 310px;
    block-size: 200px;
    inset-inline-end: 18px;
    inset-block-end: -6px;
    pointer-events: none;
    opacity: 0.95;
    transition: transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .intro:hover emad-ui-isometric-scene {
    transform: translateY(-5px);
  }
  nav {
    gap: 10px;
    padding-block-end: 26px;
  }
  nav button {
    border-radius: 0;
    border-color: var(--emad-line);
    background: var(--emad-surface);
    clip-path: var(--emad-shape-small);
    padding-inline: 18px;
    transition:
      background var(--emad-duration) ease,
      transform var(--emad-duration) ease;
  }
  nav .selected-view {
    background: #1b3d2d;
    border-color: #1b3d2d;
    color: #e9fff4;
  }
  nav .selected-view span {
    background: #6be1b725;
    color: var(--emad-mint);
  }
  nav button:not(:disabled):hover {
    transform: translateY(-2px);
  }
  .canvas {
    padding-block-end: 8px;
  }
  .card {
    isolation: isolate;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
    animation: card-reveal 400ms ease both;
  }
  .card::before,
  .card::after {
    content: "";
    position: absolute;
    inset: 0;
    clip-path: var(--emad-shape);
    pointer-events: none;
  }
  .card::before {
    background: var(--emad-depth);
    transform: translate(var(--emad-depth-x), 6px);
    z-index: -2;
    transition:
      transform 220ms ease,
      background 220ms ease;
  }
  .card::after {
    background: var(--emad-line);
    z-index: -1;
  }
  .card:hover {
    transform: translateY(-3px);
    z-index: 1;
  }
  .card:hover::before {
    transform: translate(var(--emad-depth-x), 9px);
    background: color-mix(
      in srgb,
      var(--emad-mint) 36%,
      var(--primary-background-color)
    );
  }
  .card.selected {
    outline: 0;
  }
  .card.selected::after,
  .card:focus-within::after {
    background: var(--emad-mint);
  }
  .card-toolbar {
    border-radius: 0;
    clip-path: var(--emad-shape-small);
    inset-block-start: 8px;
    inset-inline-end: 9px;
    padding: 3px 8px;
    box-shadow: none;
    border-color: var(--emad-line);
  }
  .editing .card {
    animation: none;
  }
  .editing .card:hover {
    transform: none;
  }
  .editing .card-toolbar button {
    border-radius: 2px;
  }
  .resize {
    inset-block-end: 3px;
    inset-inline-end: 4px;
    color: #4a8d70;
  }
  aside {
    border-radius: 0;
    border: 0;
    clip-path: var(--emad-shape);
    box-shadow: 4px 6px 0 var(--emad-depth);
    background: var(--emad-surface);
  }
  .editor-heading {
    background: color-mix(in srgb, var(--emad-mint) 8%, var(--emad-surface));
    border-block-end: 1px solid var(--emad-line);
    padding-block: 22px;
  }
  .editor-section input,
  .editor-section select,
  .editor-section textarea {
    border-radius: 2px;
  }
  .edit-bar {
    border-radius: 0;
    clip-path: polygon(
      0 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% 100%,
      12px 100%,
      0 calc(100% - 12px)
    );
  }
  .empty {
    border-radius: 0;
    border-style: solid;
    clip-path: var(--emad-shape);
    background: color-mix(in srgb, var(--emad-mint) 4%, var(--emad-surface));
  }
  .empty-icon {
    border-radius: 0;
    clip-path: var(--emad-shape);
  }
  .page-footer {
    padding-block-start: 20px;
  }
  .page-footer span:first-child {
    letter-spacing: -0.5px;
  }
  @keyframes card-reveal {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (max-width: 750px) {
    .intro {
      min-block-size: 178px;
      padding: 24px;
    }
    .intro-copy {
      max-inline-size: 70%;
    }
    .intro h2 {
      font-size: 28px;
    }
    .intro emad-ui-isometric-scene {
      inline-size: 210px;
      block-size: 150px;
      inset-inline-end: 0;
      opacity: 0.35;
    }
    .intro p:not(.eyebrow) {
      max-inline-size: 230px;
    }
    .top-actions {
      gap: 6px;
    }
    .brand-icon {
      display: none;
    }
    .mobile {
      padding-inline-end: 4px;
    }
    .mobile .card {
      margin-block-end: 3px;
    }
    .mobile .card:hover {
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .card,
    .card::before,
    .intro emad-ui-isometric-scene,
    nav button,
    .top-actions > button,
    .edit-bar > button {
      animation: none;
      transition: none;
    }
    .card:hover,
    .intro:hover emad-ui-isometric-scene,
    nav button:hover {
      transform: none;
    }
  }
`;

export const deviceControlStyles = css`
  :host {
    box-sizing: border-box;
    display: block;
    position: relative;
    inline-size: calc(100% - 2px);
    block-size: calc(100% - 2px);
    margin: 1px;
    clip-path: var(
      --emad-shape,
      polygon(
        0 0,
        calc(100% - 18px) 0,
        100% 18px,
        100% 100%,
        18px 100%,
        0 calc(100% - 18px)
      )
    );
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #181715);
    --accent: var(--control-accent, #43b78b);
    --control-line: var(
      --emad-line,
      color-mix(in srgb, var(--primary-text-color) 13%, transparent)
    );
    --control-surface: var(--card-background-color, #fff);
    --control-muted: var(--secondary-text-color, #6c796f);
    --control-track: color-mix(
      in srgb,
      var(--primary-text-color) 10%,
      var(--control-surface)
    );
    --control-shape: polygon(
      0 0,
      calc(100% - 6px) 0,
      100% 6px,
      100% 100%,
      6px 100%,
      0 calc(100% - 6px)
    );
  }
  * {
    box-sizing: border-box;
  }
  button,
  input,
  select {
    font: inherit;
  }
  button,
  select {
    min-block-size: 38px;
    border: 1px solid var(--control-line);
    border-radius: 3px;
    color: inherit;
    background: var(--control-surface);
    padding: 8px 12px;
    cursor: pointer;
  }
  button {
    transition:
      transform 170ms cubic-bezier(0.2, 0.8, 0.2, 1),
      background 200ms ease,
      border-color 200ms ease,
      box-shadow 200ms ease;
  }
  button:not(:disabled):hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--accent) 12%, transparent);
  }
  button:not(:disabled):active {
    transform: translateY(1px) scale(0.96);
    box-shadow: none;
  }
  button:disabled,
  select:disabled,
  input:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--emad-mint, #69e1b7);
    outline-offset: 3px;
  }
  button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #102a20;
  }
  .device {
    --accent: var(--control-accent, #43b78b);
    position: relative;
    isolation: isolate;
    block-size: 100%;
    display: flex;
    flex-direction: column;
    padding: 18px;
    gap: 12px;
  }
  .device-glow {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0;
    background: radial-gradient(
      ellipse at 65% -20%,
      color-mix(
        in srgb,
        var(--ambient-color, var(--control-accent)) 13%,
        transparent
      ),
      transparent 65%
    );
    transition:
      opacity 500ms ease,
      background 500ms ease;
  }
  .is-active .device-glow {
    opacity: 1;
  }
  header {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    flex-shrink: 0;
  }
  .icon {
    display: grid;
    place-items: center;
    inline-size: 31px;
    block-size: 33px;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
    clip-path: var(--control-shape);
  }
  .icon emad-ui-svg-icon {
    --mdc-icon-size: 17px;
  }
  .identity {
    min-inline-size: 0;
    flex: 1;
    padding-block-start: 2px;
  }
  .device-name {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }
  h2 {
    font-size: 13px;
    line-height: 1.35;
    font-weight: 650;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-inline-size: 100%;
    letter-spacing: -0.15px;
  }
  p {
    margin: 4px 0;
  }
  .identity p {
    font-size: 10px;
    color: var(--control-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .type-badge {
    display: inline-flex;
    align-items: center;
    font-size: 8px;
    font-weight: 600;
    color: #966513;
    background: #e8aa231a;
    padding: 3px 5px;
    border: 1px solid #e8aa2333;
    border-radius: 2px;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .connection {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 8px;
    font-weight: 500;
    color: var(--control-muted);
    padding: 4px 5px;
    background: var(--control-track);
    border-radius: 2px;
    white-space: nowrap;
  }
  .connection i {
    inline-size: 4px;
    block-size: 4px;
    border-radius: 50%;
    background: var(--warning-color, #d9a251);
  }
  .connection.online {
    background: #37a47610;
    color: var(--success-color, #2d8a62);
  }
  .connection.online i {
    background: #42ad7d;
  }
  .power {
    display: grid;
    place-items: center;
    inline-size: 31px;
    block-size: 31px;
    min-block-size: 31px;
    border-radius: 50%;
    padding: 6px;
    color: var(--control-muted);
  }
  .power emad-ui-svg-icon {
    --mdc-icon-size: 15px;
  }
  .power.active {
    color: #17372a;
    background: var(--accent);
    box-shadow: 0 3px 10px color-mix(in srgb, var(--accent) 22%, transparent);
    border-color: var(--accent);
  }
  .device-body {
    flex: 1;
    min-block-size: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--control-line) transparent;
  }
  .device-body > * {
    flex-shrink: 0;
  }
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-block-start: 9px;
    border-block-start: 1px solid var(--control-line);
    flex-shrink: 0;
  }
  .state {
    font-size: 10px;
    color: var(--control-muted);
    display: flex;
    align-items: center;
    gap: 5px;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .state > i {
    inline-size: 4px;
    block-size: 4px;
    background: var(--control-muted);
    opacity: 0.4;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .state > i.active {
    background: var(--accent);
    opacity: 1;
  }
  .details {
    min-block-size: 26px;
    padding: 2px 0 2px 8px;
    border: 0;
    background: transparent;
    font-size: 10px;
    color: var(--control-muted);
    white-space: nowrap;
  }
  .details:not(:disabled):hover {
    box-shadow: none;
    color: var(--primary-text-color);
  }
  .eyebrow {
    text-transform: uppercase;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 1.2px;
    color: var(--control-muted);
  }
  .control-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--control-muted);
  }
  .control-label > span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .control-label emad-ui-svg-icon {
    --mdc-icon-size: 13px;
  }
  .control-label b {
    font-size: 11px;
    color: var(--primary-text-color);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .range-label {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .range-track {
    display: flex;
    align-items: center;
    gap: 8px;
    min-block-size: 26px;
    unicode-bidi: isolate;
  }
  .range-track small {
    font-size: 8px;
    color: var(--control-muted);
    font-variant-numeric: tabular-nums;
    min-inline-size: 20px;
  }
  .range-track small:last-child {
    text-align: end;
  }
  input[type="range"] {
    appearance: none;
    -webkit-appearance: none;
    inline-size: 100%;
    min-inline-size: 0;
    block-size: 6px;
    border-radius: 6px;
    background: linear-gradient(
      to right,
      var(--accent) 0 var(--range-progress),
      var(--control-track) var(--range-progress) 100%
    );
    cursor: pointer;
    margin: 9px 0;
    outline-offset: 7px;
  }
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    inline-size: 14px;
    block-size: 14px;
    background: var(--accent);
    border: 2px solid var(--control-surface);
    border-radius: 50%;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 55%, transparent);
    transition:
      transform 180ms ease,
      box-shadow 180ms ease;
  }
  input[type="range"]::-moz-range-thumb {
    inline-size: 11px;
    block-size: 11px;
    background: var(--accent);
    border: 2px solid var(--control-surface);
    border-radius: 50%;
  }
  input[type="range"]:not(:disabled):hover::-webkit-slider-thumb {
    transform: scale(1.22);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent);
  }
  .warmth-range input[type="range"] {
    background: linear-gradient(
      to right,
      #ffb74d,
      #ffd54f,
      #fff9c4,
      #e1f5fe,
      #b3e5fc
    );
  }
  .lighting-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 4px 0 7px;
  }
  .light-orb {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 70px;
    block-size: 70px;
    color: var(--accent);
  }
  .light-orb > emad-ui-svg-icon {
    --mdc-icon-size: 46px;
    z-index: 1;
    transition: color 400ms ease;
  }
  .light-orb > i {
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--accent) 17%, transparent),
      transparent 70%
    );
    transform: scale(0.5);
    opacity: 0;
    transition:
      transform 450ms ease,
      opacity 450ms ease;
  }
  .is-active .light-orb > i {
    opacity: 1;
    transform: scale(1.5);
    animation: light-glow 4s ease-in-out infinite;
  }
  .light-reading {
    font-size: 36px;
    font-weight: 600;
    letter-spacing: -1.5px;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }
  .light-reading small {
    font-size: 14px;
    color: var(--control-muted);
    margin-inline-start: 3px;
  }
  .palette-control {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .swatches {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 5px;
  }
  .swatches > button,
  .custom-color {
    position: relative;
    min-block-size: 27px;
    block-size: 27px;
    inline-size: 100%;
    padding: 0;
    border: 1px solid var(--control-line);
    border-radius: 4px;
    background: var(--swatch);
  }
  .swatches > button.chosen {
    outline: 2px solid #e8aa23;
    outline-offset: 2px;
  }
  .custom-color {
    display: grid;
    place-items: center;
    overflow: hidden;
    color: #435c4c;
    border-style: dashed;
  }
  .custom-color input {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .custom-color emad-ui-svg-icon {
    --mdc-icon-size: 14px;
    pointer-events: none;
    color: #15362c;
  }
  .temperature {
    text-align: center;
    padding: 0 0 2px;
  }
  .temperature-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }
  .temperature-value {
    color: var(--accent);
    font-size: 44px;
    font-weight: 600;
    letter-spacing: -2.4px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: color 350ms ease;
  }
  .temperature-value small {
    font-size: 21px;
    font-weight: 400;
    color: var(--control-muted);
  }
  .temperature p {
    font-size: 10px;
    color: var(--control-muted);
    margin: 4px 0 0;
    line-height: 1.2;
  }
  .mode-glyph {
    --mdc-icon-size: 24px;
    color: var(--accent);
  }
  .is-active .mode-glyph[data-mode="cool"],
  .is-active .mode-glyph[data-mode="auto"],
  .is-active .mode-glyph[data-mode="heat_cool"] {
    animation: spin 10s linear infinite;
  }
  .is-active .mode-glyph[data-mode="heat"] {
    animation: heat-flicker 1.6s ease-in-out infinite;
  }
  .is-active .mode-glyph[data-mode="dry"] {
    animation: float 3s ease-in-out infinite;
  }
  .temperature-adjust {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 10px;
    color: var(--control-muted);
  }
  .temperature-adjust > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .temperature-adjust button {
    inline-size: 27px;
    block-size: 27px;
    min-block-size: 27px;
    padding: 0;
    font-size: 18px;
  }
  .temperature-adjust bdi {
    color: var(--primary-text-color);
    font-weight: 600;
    font-size: 11px;
    min-inline-size: 28px;
    text-align: center;
  }
  .choice-control {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .choices {
    display: flex;
    gap: 4px;
  }
  .choices button {
    min-inline-size: 0;
    flex: 1;
    padding: 5px 2px;
    min-block-size: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: color-mix(
      in srgb,
      var(--primary-background-color) 70%,
      var(--control-surface)
    );
    border: 1px solid var(--control-line);
    font-size: 9px;
    font-weight: 500;
  }
  .mode-choices button {
    flex-direction: column;
    gap: 5px;
    min-block-size: 45px;
  }
  .mode-choices emad-ui-svg-icon {
    --mdc-icon-size: 15px;
    color: var(--control-muted);
  }
  .choices button.active {
    background: color-mix(in srgb, var(--accent) 9%, var(--control-surface));
    border-color: var(--accent);
    color: var(--accent);
  }
  .mode-choices button.active emad-ui-svg-icon {
    color: var(--mode-color);
  }
  .fan-choices button {
    padding: 4px 2px;
    flex-direction: column;
    min-block-size: 38px;
  }
  .fan-choices button.active {
    color: #fff;
    background: color-mix(in srgb, var(--accent) 82%, #14291e);
  }
  .speed-bars {
    display: flex;
    align-items: end;
    gap: 2px;
    block-size: 13px;
  }
  .speed-bars i {
    inline-size: 3px;
    block-size: var(--bar-height);
    background: currentColor;
    opacity: 0.22;
  }
  .speed-bars i.lit {
    opacity: 0.8;
  }
  .select-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: var(--control-muted);
  }
  select {
    font-size: 10px;
    max-inline-size: 65%;
    padding: 7px;
    min-block-size: 34px;
  }
  .actions {
    display: flex;
    gap: 6px;
  }
  .actions button {
    flex: 1;
    min-inline-size: 0;
    font-size: 11px;
    font-weight: 500;
    padding: 8px 6px;
    clip-path: var(--control-shape);
    border-radius: 0;
  }
  .actions .active {
    color: #fff;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 10px 0;
  }
  .hero > emad-ui-svg-icon {
    --mdc-icon-size: 52px;
    color: var(--accent);
  }
  .blind-scene {
    padding: 8px 0 16px;
    display: grid;
    place-items: center;
  }
  .blind-art {
    position: relative;
    inline-size: 90px;
    block-size: 96px;
    border: 5px solid
      color-mix(in srgb, var(--accent) 35%, var(--control-surface));
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--accent) 7%, var(--control-surface)),
      color-mix(in srgb, var(--accent) 17%, var(--control-surface))
    );
    transform: skewY(-6deg);
    box-shadow: 6px 6px 0 color-mix(in srgb, var(--accent) 18%, transparent);
  }
  .blind-art .slats {
    position: absolute;
    inset: 0 0 auto;
    block-size: calc(100% - var(--opening));
    background: repeating-linear-gradient(
      to bottom,
      color-mix(in srgb, var(--accent) 75%, var(--control-surface)) 0 6px,
      var(--accent) 6px 8px
    );
    box-shadow: 0 2px 1px #0001;
    transition: block-size 700ms cubic-bezier(0.2, 0.75, 0.2, 1);
  }
  .blind-art > i {
    position: absolute;
    inset: 0 45% 0;
    inline-size: 1px;
    background: var(--accent);
    opacity: 0.2;
  }
  .fan-scene {
    display: grid;
    place-items: center;
    position: relative;
    inline-size: 104px;
    block-size: 116px;
    margin: 3px auto 10px;
    color: var(--accent);
  }
  .fan-scene > emad-ui-svg-icon {
    --mdc-icon-size: 66px;
    z-index: 1;
  }
  .fan-ring {
    position: absolute;
    inset: 5px 2px 20px;
    border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
    border-radius: 50%;
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--accent) 5%, transparent),
      inset 0 0 0 7px color-mix(in srgb, var(--accent) 4%, transparent);
  }
  .fan-scene > span {
    position: absolute;
    inline-size: 44px;
    block-size: 7px;
    inset-block-end: 1px;
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    transform: skewX(-30deg);
  }
  .spinning {
    animation: spin var(--fan-duration, 3s) linear infinite;
  }
  .door-scene {
    display: flex;
    justify-content: center;
    color: var(--accent);
  }
  .door-visual {
    inline-size: 170px;
    block-size: 123px;
  }
  .door-leaf {
    transform-origin: 89px 81px;
    transition: transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1);
    transform: skewY(0);
  }
  .door-open .door-leaf {
    transform: translateX(11px) skewY(12deg) scaleX(0.6);
  }
  .shackle {
    transform: translateY(-5px) rotate(-8deg);
    transform-origin: 22px 13px;
    transition: transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .door-locked .shackle {
    transform: translateY(0) rotate(0);
  }
  .door-status {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
    font-size: 10px;
    color: var(--control-muted);
  }
  .state-pill {
    padding: 5px 9px;
    color: #b27d26;
    background: #e4ae2f14;
    border: 1px solid #d2a54e33;
    border-radius: 3px;
    font-weight: 600;
  }
  .state-pill.secured {
    color: #2b976a;
    background: #30ad7410;
    border-color: #30ad7433;
  }
  .confirm-unlock {
    background: #fff2d5;
    color: #8c5715;
    border-color: #d9aa54;
  }
  .media-art {
    display: flex;
    align-items: center;
    gap: 18px;
    min-block-size: 119px;
    padding: 12px 4px 4px;
  }
  .media-copy {
    min-inline-size: 0;
  }
  .media-copy b {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    display: block;
  }
  .media-copy p {
    font-size: 10px;
    line-height: 1.5;
    color: var(--control-muted);
  }
  .speaker-scene {
    position: relative;
    flex-shrink: 0;
    inline-size: 72px;
    block-size: 92px;
  }
  .speaker-box {
    position: absolute;
    inline-size: 45px;
    block-size: 75px;
    inset: 6px auto auto 4px;
    background: color-mix(in srgb, var(--accent) 20%, var(--control-surface));
    border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
    transform: skewY(6deg);
    box-shadow: 7px -4px 0
      color-mix(in srgb, var(--accent) 43%, var(--control-surface));
  }
  .speaker-tweeter {
    position: absolute;
    inset-block-start: 10px;
    inset-inline-start: 15px;
    inline-size: 13px;
    block-size: 13px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: inset 0 0 0 3px
      color-mix(in srgb, var(--control-surface) 45%, transparent);
  }
  .speaker-cone {
    position: absolute;
    inset-block-start: 32px;
    inset-inline-start: 8px;
    inline-size: 27px;
    block-size: 27px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--accent) 17%, var(--control-surface));
  }
  .speaker-cone > i {
    inline-size: 13px;
    block-size: 13px;
    background: var(--accent);
    border-radius: 50%;
  }
  .speaker-led {
    position: absolute;
    inset-block-end: 5px;
    inset-inline-start: 20px;
    inline-size: 3px;
    block-size: 3px;
    background: var(--accent);
    border-radius: 50%;
  }
  .equalizer {
    position: absolute;
    display: flex;
    align-items: end;
    gap: 2px;
    inset-block-end: -1px;
    inset-inline-start: 4px;
    block-size: 10px;
  }
  .equalizer i {
    inline-size: 4px;
    block-size: 6px;
    background: var(--accent);
    opacity: 0.3;
    transform-origin: bottom;
  }
  .playing .speaker-cone > i {
    animation: speaker-beat 1.5s ease-in-out infinite;
  }
  .playing .equalizer i {
    opacity: 0.6;
    animation: equalize calc(650ms + var(--n) * 110ms) ease-in-out infinite
      alternate;
    animation-delay: calc(var(--n) * -90ms);
  }
  .media-actions {
    justify-content: center;
  }
  .vacuum-scene {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  .vacuum-visual {
    inline-size: 166px;
    block-size: 110px;
    color: var(--accent);
  }
  .battery-readout {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 9px;
    color: var(--control-muted);
  }
  .battery-readout bdi {
    font-size: 21px;
    font-weight: 600;
    color: var(--primary-text-color);
  }
  .cleaning .robot {
    animation: robot-clean 4s ease-in-out infinite;
  }
  .cleaning .robot-brush {
    animation: spin 1.5s linear infinite;
  }
  .switch-hero {
    position: relative;
    min-block-size: 155px;
  }
  .switch-stage {
    position: absolute;
    inline-size: 110px;
    block-size: 60px;
    inset-block-start: 65px;
    background: color-mix(in srgb, var(--accent) 7%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
    transform: rotate(-30deg) skewX(30deg);
  }
  .large-power {
    position: relative;
    inline-size: 76px;
    block-size: 76px;
    border-radius: 50%;
    background: var(--control-surface);
    box-shadow: 4px 5px 0 var(--control-track);
  }
  .large-power emad-ui-svg-icon {
    --mdc-icon-size: 32px;
  }
  .large-power.active {
    box-shadow:
      4px 5px 0 color-mix(in srgb, var(--accent) 25%, var(--control-surface)),
      0 0 24px color-mix(in srgb, var(--accent) 15%, transparent);
  }
  .switch-hero > p {
    font-size: 11px;
    color: var(--control-muted);
    z-index: 1;
  }
  .readout {
    font-size: 48px;
    line-height: 1.15;
    letter-spacing: -1.8px;
    font-weight: 600;
    text-align: center;
    padding: 18px 0;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .readout.small {
    font-size: 28px;
    letter-spacing: -0.5px;
  }
  .readout small {
    font-size: 17px;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--control-muted);
  }
  .weather {
    flex-direction: row;
    padding: 18px 0;
  }
  .weather > emad-ui-svg-icon {
    color: #e8b54b;
    --mdc-icon-size: 58px;
  }
  .sunny > emad-ui-svg-icon {
    animation: weather-sway 7s ease-in-out infinite;
  }
  .weather-metrics {
    display: flex;
    justify-content: space-around;
    gap: 14px;
    padding: 8px;
    border: 1px solid var(--control-line);
    background: color-mix(in srgb, var(--accent) 3%, transparent);
    font-size: 10px;
    color: var(--control-muted);
  }
  .weather-metrics b {
    display: block;
    color: var(--primary-text-color);
    font-size: 14px;
    margin-block-start: 6px;
    font-weight: 500;
  }
  .offline-visual {
    min-block-size: 116px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--control-muted);
    opacity: 0.45;
  }
  .offline-visual emad-ui-svg-icon {
    --mdc-icon-size: 36px;
  }
  .offline-visual > span {
    font-size: 30px;
  }
  .center {
    text-align: center;
  }
  .muted {
    color: var(--control-muted);
    font-size: 11px;
  }
  .camera-preview {
    text-align: center;
  }
  .camera-preview emad-ui-camera {
    display: block;
    inline-size: 100%;
    aspect-ratio: 16/9;
    margin-block-end: 12px;
    overflow: hidden;
    clip-path: var(--control-shape);
  }
  .clock,
  .note {
    position: relative;
    padding: 28px;
    block-size: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }
  .clock::after {
    content: "";
    position: absolute;
    inline-size: 140px;
    block-size: 90px;
    inset-inline-end: -28px;
    inset-block-end: -6px;
    border: 1px solid #69e1b728;
    box-shadow: inset 0 0 0 12px #69e1b707;
    transform: rotate(-30deg) skewX(30deg);
    pointer-events: none;
  }
  .time {
    font-size: 57px;
    line-height: 1.25;
    letter-spacing: -2.5px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .clock > p:not(.eyebrow) {
    font-size: 11px;
    color: var(--control-muted);
    margin-block-start: 8px;
  }
  .clock-line {
    inline-size: 38px;
    block-size: 3px;
    background: var(--emad-mint, #69e1b7);
    margin-block-start: 20px;
  }
  .note h2 {
    font-size: 24px;
    white-space: normal;
    margin-block: 12px;
  }
  .note > p:last-child {
    font-size: 13px;
    color: var(--control-muted);
    line-height: 1.8;
    white-space: pre-wrap;
    overflow: auto;
  }
  .error {
    font-size: 11px;
    color: var(--error-color);
    padding: 7px;
    background: color-mix(in srgb, var(--error-color) 6%, transparent);
    border-inline-start: 2px solid var(--error-color);
    margin: 0;
  }
  .is-busy .state > i {
    animation: busy-pulse 800ms ease-in-out infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes light-glow {
    50% {
      transform: scale(1.8);
      opacity: 0.7;
    }
  }
  @keyframes heat-flicker {
    50% {
      transform: translateY(-2px) scale(1.1);
      opacity: 0.75;
    }
  }
  @keyframes float {
    50% {
      transform: translateY(-3px);
    }
  }
  @keyframes speaker-beat {
    50% {
      transform: scale(0.8);
    }
  }
  @keyframes equalize {
    from {
      transform: scaleY(0.35);
    }
    to {
      transform: scaleY(1.6);
    }
  }
  @keyframes robot-clean {
    50% {
      transform: translateX(5px);
    }
  }
  @keyframes weather-sway {
    50% {
      transform: rotate(7deg);
    }
  }
  @keyframes busy-pulse {
    50% {
      opacity: 0.25;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
    button:not(:disabled):hover,
    button:not(:disabled):active {
      transform: none;
    }
  }
`;
