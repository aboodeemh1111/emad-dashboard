import { css } from "lit";

/** Shared minimum hit areas apply inside each device's shadow root. */
export const responsiveControlStyles = css`
  :host {
    container-type: inline-size;
    container-name: emad-device;
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
  }
  :host button,
  :host input,
  :host select,
  :host textarea {
    min-block-size: 48px !important;
    min-inline-size: 48px !important;
    max-inline-size: 100%;
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
    line-height: 1.35;
  }
  :host button {
    white-space: normal;
    overflow-wrap: anywhere;
    touch-action: manipulation;
  }
  :host input[type="range"] {
    inline-size: 100%;
    block-size: 48px;
    margin-block: 0;
    background-size: 100% 6px;
    background-position: center;
    background-repeat: no-repeat;
  }
  :host input[type="range"]::-webkit-slider-thumb {
    inline-size: 24px;
    block-size: 24px;
  }
  :host input[type="range"]::-moz-range-thumb {
    inline-size: 22px;
    block-size: 22px;
  }
  :host select,
  :host textarea {
    inline-size: 100%;
    min-width: 0;
  }
  :host button:focus-visible,
  :host input:focus-visible,
  :host select:focus-visible,
  [tabindex="0"]:focus-visible {
    outline: 3px solid var(--device-accent, var(--emad-mint, #69e1b7));
    outline-offset: -3px;
  }
  @media (hover: none) {
    :host button:hover,
    :host button:active {
      transform: none;
    }
  }
`;

export const responsiveCatalogStyles = css`
  :host {
    min-block-size: 0;
    min-inline-size: 0;
  }
  .device-element {
    min-block-size: 0;
    inline-size: 100%;
    padding: 14px;
    gap: 14px;
    overflow: auto;
    overscroll-behavior: auto;
    scrollbar-gutter: stable;
    scroll-padding: 12px;
  }
  .device-element > * {
    flex-shrink: 0;
    min-inline-size: 0;
  }
  .device-element > header {
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .device-element > header > div {
    flex: 1 1 130px;
  }
  .category,
  .status,
  .control-note,
  .example-badge,
  .example-hint,
  .history-chart span,
  .missing {
    font-size: calc(12px * var(--emad-ui-text-scale, 1));
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .category {
    letter-spacing: 0.6px;
  }
  h3 {
    font-size: 18px;
    font-size: calc(clamp(18px, 4.5cqi, 28px) * var(--emad-ui-text-scale, 1));
  }
  .status {
    white-space: normal;
    max-inline-size: 100%;
  }
  .status i {
    flex-shrink: 0;
  }
  .card-content,
  .card-summary,
  .card-controls {
    min-inline-size: 0;
  }
  .card-content,
  .card-summary,
  .card-controls {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .visual-stage {
    min-height: 0;
    min-block-size: 0;
    margin-inline: 0;
  }
  .iso-scene {
    display: block;
    inline-size: 100%;
    height: 180px;
    height: clamp(112px, 48cqi, 300px);
  }
  .primary-reading {
    flex-wrap: wrap;
    align-items: baseline;
    margin-inline: 0;
    gap: 6px 12px;
  }
  .primary-reading > span,
  .primary-reading strong small {
    font-size: calc(13px * var(--emad-ui-text-scale, 1));
  }
  .primary-reading strong {
    max-inline-size: 100%;
    font-size: 28px;
    font-size: calc(clamp(24px, 6cqi, 42px) * var(--emad-ui-text-scale, 1));
  }
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 112px), 1fr));
    gap: 8px;
  }
  .metric-grid span,
  .control-label,
  .range-control,
  .range-control b {
    font-size: calc(13px * var(--emad-ui-text-scale, 1));
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .metric-grid b {
    font-size: calc(16px * var(--emad-ui-text-scale, 1));
  }
  .range-control {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }
  .choices {
    gap: 8px;
  }
  .choices button {
    flex: 1 1 72px;
    padding: 8px;
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
  }
  .device-actions {
    gap: 8px;
  }
  .device-actions button {
    flex: 1 1 88px;
  }
  .colors {
    flex-wrap: wrap;
    gap: 10px;
  }
  .swatch {
    inline-size: 48px;
    block-size: 48px;
    flex: 0 0 48px;
  }
  .swatch input {
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }
  input[type="color"] {
    inline-size: 48px;
    block-size: 48px;
  }
  .floors {
    grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
    gap: 8px;
  }
  .port-map {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
  }
  .port-state {
    height: 36px;
    font-size: calc(12px * var(--emad-ui-text-scale, 1));
  }
  footer {
    flex-wrap: wrap;
    gap: 8px;
  }
  footer button {
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
  }
  .example-hint {
    margin-block: 0;
  }
  emad-ui-device {
    inline-size: 100%;
    min-inline-size: 0;
  }
  @container emad-device (min-width: 560px) {
    .device-element {
      padding: 20px;
    }
    .card-content {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }
    .iso-scene {
      height: clamp(180px, 28cqi, 340px);
    }
  }
  @container emad-slot (max-height: 320px) {
    .iso-scene {
      height: 88px;
    }
    .device-element {
      padding-block: 12px;
    }
  }
`;

export const responsiveNativeStyles = css`
  :host {
    min-block-size: 0;
    min-inline-size: 0;
  }
  .device,
  .clock,
  .note {
    min-block-size: 0;
    overflow: auto;
    overscroll-behavior: auto;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    scroll-padding: 12px;
    padding: 14px;
  }
  .device > *,
  .clock > *,
  .note > * {
    flex-shrink: 0;
    min-inline-size: 0;
  }
  .device-body {
    flex: 1 0 auto;
    overflow: visible;
    min-inline-size: 0;
  }
  .device header {
    flex-wrap: wrap;
    gap: 10px;
  }
  .identity {
    flex: 1 1 120px;
  }
  .device-name {
    flex-wrap: wrap;
  }
  .device-name h2 {
    font-size: calc(17px * var(--emad-ui-text-scale, 1));
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    overflow-wrap: anywhere;
  }
  .identity > p,
  .connection,
  .type-badge,
  .state,
  .muted,
  .eyebrow,
  .switch-hero > p,
  .media-artist,
  .range-track small,
  .weather small {
    font-size: calc(12px * var(--emad-ui-text-scale, 1));
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.5;
  }
  .header-actions {
    flex-wrap: wrap;
    margin-inline-start: auto;
  }
  .connection {
    max-inline-size: 100%;
  }
  .power {
    inline-size: 48px;
    block-size: 48px;
  }
  .power emad-ui-svg-icon {
    --mdc-icon-size: 22px;
  }
  .control-label,
  .control-label b,
  .select-label {
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
    line-height: 1.45;
    flex-wrap: wrap;
  }
  .control-label > span {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
  .range-track {
    min-block-size: 48px;
  }
  .range-track small {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .range-track input {
    flex: 1 1 0;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 72px), 1fr));
    gap: 8px;
  }
  .choices button {
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
    padding: 8px;
  }
  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 88px), 1fr));
    gap: 8px;
  }
  .actions button {
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
  }
  .swatches {
    grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
    gap: 8px;
  }
  .custom-color {
    block-size: 50px;
    min-block-size: 50px;
  }
  .select-label {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  select {
    max-inline-size: 100%;
  }
  .temperature-main,
  .temperature-adjust {
    flex-wrap: wrap;
  }
  .temperature-value {
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    font-size: calc(clamp(24px, 7cqi, 44px) * var(--emad-ui-text-scale, 1));
  }
  .temperature-value small {
    font-size: calc(16px * var(--emad-ui-text-scale, 1));
  }
  .temperature p {
    font-size: calc(13px * var(--emad-ui-text-scale, 1));
  }
  .temperature-adjust {
    font-size: calc(13px * var(--emad-ui-text-scale, 1));
  }
  .temperature-adjust > span {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
  .lighting-summary,
  .weather {
    flex-wrap: wrap;
  }
  .light-reading,
  .target-number,
  .readout {
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    font-size: 32px;
    font-size: calc(clamp(24px, 8cqi, 60px) * var(--emad-ui-text-scale, 1));
  }
  .readout.small {
    font-size: 24px;
    font-size: calc(clamp(20px, 5cqi, 36px) * var(--emad-ui-text-scale, 1));
  }
  .readout small,
  .light-reading small {
    font-size: calc(16px * var(--emad-ui-text-scale, 1));
  }
  .media-title {
    font-size: calc(16px * var(--emad-ui-text-scale, 1));
    white-space: normal;
    overflow: visible;
    overflow-wrap: anywhere;
  }
  .camera-preview,
  emad-ui-camera {
    max-inline-size: 100%;
    min-inline-size: 0;
  }
  footer {
    flex-wrap: wrap;
    margin-block-start: auto;
  }
  footer .state {
    overflow: visible;
    text-overflow: clip;
  }
  .clock {
    isolation: isolate;
    justify-content: flex-start;
    justify-content: safe center;
  }
  .clock::after {
    inset-inline-end: 40px;
    inset-block-end: 20px;
    max-inline-size: calc(100% - 100px);
    z-index: -1;
  }
  .clock .time {
    font-size: 32px;
    font-size: calc(clamp(26px, 11cqi, 72px) * var(--emad-ui-text-scale, 1));
    overflow-wrap: anywhere;
    letter-spacing: -1px;
  }
  .clock > p:not(.eyebrow),
  .note > p:last-child {
    font-size: calc(14px * var(--emad-ui-text-scale, 1));
  }
  .note {
    justify-content: flex-start;
  }
  .note h2 {
    font-size: calc(22px * var(--emad-ui-text-scale, 1));
    overflow-wrap: anywhere;
  }
  :host([controls-only]) {
    block-size: auto;
    height: auto;
    clip-path: none;
  }
  @container emad-device (min-width: 560px) {
    .device {
      padding: 20px;
    }
    .device-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 18px;
      align-content: start;
      align-items: start;
    }
    .device-body > .hero,
    .device-body > .climate-hero,
    .device-body > .temperature,
    .device-body > .lighting-summary,
    .device-body > .readout,
    .device-body > .media-hero,
    .device-body > .camera-preview,
    .device-body > .weather {
      grid-column: 1 / -1;
    }
  }
`;
