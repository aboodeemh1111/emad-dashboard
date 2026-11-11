import { customElement } from "./element";
/** Small private UI elements. Never register or bundle Home Assistant's ha-* elements. */
import { css, html, LitElement, nothing } from "lit";
import type { PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { mdiMenu, mdiHomeOutline, mdiVideoOutline } from "@mdi/js";
import { fireEvent } from "./runtime";
import type { CameraEntity, HomeAssistant, NativeCard } from "./types";

@customElement("emad-ui-svg-icon")
export class EmadSvgIcon extends LitElement {
  @property() public path = "";
  protected render() {
    return html`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d=${this.path}></path>
    </svg>`;
  }
  static styles = css`
    :host {
      display: inline-flex;
      inline-size: var(--mdc-icon-size, 24px);
      block-size: var(--mdc-icon-size, 24px);
      flex-shrink: 0;
      vertical-align: middle;
    }
    svg {
      inline-size: 100%;
      block-size: 100%;
      fill: currentColor;
    }
  `;
}

@customElement("emad-ui-menu-button")
export class EmadMenuButton extends LitElement {
  @property() public label = "";
  protected render() {
    return html`<button
      aria-label=${this.label}
      @click=${() => fireEvent(this, "hass-toggle-menu")}
    >
      <emad-ui-svg-icon .path=${mdiMenu}></emad-ui-svg-icon>
    </button>`;
  }
  static styles = css`
    :host {
      display: inline-flex;
    }
    button {
      display: grid;
      place-items: center;
      min-width: 48px;
      min-height: 48px;
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 3px solid var(--emad-mint, #69e1b7);
      outline-offset: -3px;
    }
  `;
}

@customElement("emad-ui-logo")
export class EmadLogo extends LitElement {
  protected render() {
    return html`<emad-ui-svg-icon .path=${mdiHomeOutline}></emad-ui-svg-icon>`;
  }
  static styles = css`
    :host {
      display: inline-flex;
      --mdc-icon-size: 30px;
      color: var(--emad-mint, #69e1b7);
    }
  `;
}

@customElement("emad-ui-alert")
export class EmadAlert extends LitElement {
  @property({ attribute: "alert-type" }) public alertType = "error";
  protected render() {
    return html`<div role=${this.alertType === "error" ? "alert" : "status"}>
      <slot></slot>
    </div>`;
  }
  static styles = css`
    :host {
      display: block;
    }
    div {
      padding: 14px 16px;
      line-height: 1.5;
      border: 1px solid var(--divider-color, #dce6e0);
      border-inline-start: 4px solid var(--warning-color, #d6a15f);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #181715);
    }
  `;
}

@customElement("emad-ui-spinner")
export class EmadSpinner extends LitElement {
  protected render() {
    return html`<span role="progressbar"></span>`;
  }
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    span {
      inline-size: 28px;
      block-size: 28px;
      border: 3px solid var(--divider-color, #dce6e0);
      border-block-start-color: var(--emad-mint, #409778);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      span {
        animation: none;
      }
    }
  `;
}

/** Camera transport remains Home Assistant's authenticated native picture card. */
@customElement("emad-ui-camera")
export class EmadCamera extends LitElement {
  @property({ attribute: false }) public stateObj?: CameraEntity;
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ type: Boolean }) public muted = true;
  @property({ type: Boolean }) public controls = true;
  @property() public fitMode = "contain";
  @state() private _card?: NativeCard;
  @state() private _failed = false;
  @state() private _snapshot = false;
  @state() private _imageFailed = false;
  private _loading = false;
  private _generation = 0;
  protected updated(changed: PropertyValues) {
    const old = changed.get("stateObj") as CameraEntity | undefined;
    if (
      changed.has("stateObj") &&
      old?.entity_id !== this.stateObj?.entity_id
    ) {
      this._generation++;
      this._card = undefined;
      this._loading = false;
      this._failed = false;
      this._snapshot = false;
      this._imageFailed = false;
    }
    if (this._card && this.hass) this._card.hass = this.hass;
    void this._load();
  }
  private async _load() {
    if (this._loading || this._card || !this.hass || !this.stateObj) return;
    this._loading = true;
    const generation = this._generation;
    try {
      if (!window.loadCardHelpers)
        throw new Error("Native card helper unavailable");
      const helpers = await window.loadCardHelpers();
      if (generation !== this._generation || !this.isConnected) return;
      const card = helpers.createCardElement({
        type: "picture-entity",
        entity: this.stateObj.entity_id,
        camera_view: "live",
        show_name: false,
        show_state: false,
        aspect_ratio: "16:9",
      });
      card.hass = this.hass;
      this._card = card;
      this._failed = false;
    } catch {
      if (generation === this._generation) this._failed = true;
    } finally {
      if (generation === this._generation) this._loading = false;
    }
  }
  public connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
  }
  public disconnectedCallback() {
    super.disconnectedCallback();
    this._generation++;
    this._loading = false;
    this._card = undefined;
  }
  protected render() {
    if (this._card) return this._card;
    // entity_picture contains Home Assistant's scoped camera access token. Keep it
    // on the same-origin camera proxy; no login token or host internals are needed.
    const picture = this.stateObj?.attributes.entity_picture;
    const source =
      typeof picture === "string" &&
      /^\/api\/camera_proxy\/[^/?]+\?/.test(picture)
        ? this._snapshot
          ? picture
          : picture.replace("/api/camera_proxy/", "/api/camera_proxy_stream/")
        : undefined;
    return html`<div>
      ${
        source && !this._imageFailed
          ? html`<img
              src=${source}
              alt=${this.stateObj?.attributes.friendly_name ?? this.stateObj?.entity_id ?? ""}
              @error=${() => {
                if (this._snapshot) this._imageFailed = true;
                else this._snapshot = true;
              }}
            />`
          : html`<emad-ui-svg-icon .path=${mdiVideoOutline}></emad-ui-svg-icon
              >${this._failed ? this.hass?.localize("ui.panel.emad-dashboard.unavailable") : nothing}`
      }
      ${this.controls && this.stateObj ? html`<button @click=${() => fireEvent(this, "hass-more-info", { entityId: this.stateObj!.entity_id })}>${this.hass?.localize("ui.panel.emad-dashboard.details")}</button>` : nothing}
    </div>`;
  }
  static styles = css`
    :host {
      display: block;
      min-inline-size: 0;
      inline-size: 100%;
    }
    div {
      display: grid;
      place-items: center;
      min-height: 120px;
      color: var(--secondary-text-color, #6d796e);
    }
    img {
      display: block;
      inline-size: 100%;
      object-fit: contain;
      aspect-ratio: 16/9;
    }
    button {
      font: inherit;
      color: inherit;
      background: transparent;
      border: 1px solid var(--divider-color, #dce6e0);
      min-block-size: 48px;
      padding: 8px 16px;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 3px solid var(--emad-mint, #69e1b7);
    }
    * {
      max-inline-size: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "emad-ui-svg-icon": EmadSvgIcon;
    "emad-ui-menu-button": EmadMenuButton;
    "emad-ui-logo": EmadLogo;
    "emad-ui-alert": EmadAlert;
    "emad-ui-spinner": EmadSpinner;
    "emad-ui-camera": EmadCamera;
  }
}
