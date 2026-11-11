import { customElement } from "./platform/element";
import { css, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { HomeAssistant, PanelInfo, Route } from "./platform/types";
import { panelHass } from "./localize";
import fontFaces from "./font-faces.json";
import "./dashboard/emad-dashboard-view";

let fontsStarted = false;
function loadFonts() {
  if (fontsStarted || typeof FontFace === "undefined") return;
  fontsStarted = true;
  for (const face of fontFaces) {
    const family =
      face.family === "Space Grotesk"
        ? "Emad Dashboard Sans"
        : "Emad Dashboard Arabic";
    const font = new FontFace(
      family,
      `url(${new URL(/* @vite-ignore */ `./fonts/${face.file}`, import.meta.url).href})`,
      {
        weight: face.weight || "400",
        display: "swap",
        ...(face.unicodeRange ? { unicodeRange: face.unicodeRange } : {}),
      },
    );
    void font
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => undefined);
  }
}

/** Public Home Assistant custom-panel element. No host frontend replacement. */
@customElement("emad-dashboard-panel")
export class EmadDashboardPanel extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ attribute: false }) public panel: PanelInfo = {};
  @property({ attribute: false }) public route: Route = {
    prefix: "/emad-dashboard",
    path: "",
  };
  @property({ type: Boolean }) public narrow = false;
  public connectedCallback() {
    super.connectedCallback();
    loadFonts();
  }
  protected render() {
    return this.hass
      ? html`<emad-dashboard-view
          .hass=${panelHass(this.hass)}
          .panel=${this.panel}
          .route=${this.route}
          .narrow=${this.narrow}
        ></emad-dashboard-view>`
      : nothing;
  }
  static styles = css`
    :host {
      display: block;
      block-size: 100%;
      min-block-size: 0;
      --ha-font-family-body:
        "Emad Dashboard Sans", "Emad Dashboard Arabic", Arial, sans-serif;
      font-family: var(--ha-font-family-body);
    }
    emad-dashboard-view {
      display: block;
      block-size: 100%;
      min-block-size: 0;
    }
  `;
}
declare global {
  interface HTMLElementTagNameMap {
    "emad-dashboard-panel": EmadDashboardPanel;
  }
}
