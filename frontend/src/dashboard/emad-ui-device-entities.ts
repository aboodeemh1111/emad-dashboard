import { customElement } from "../platform/element";
import type { HassEntity } from "home-assistant-js-websocket";
import { css, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { LocalizeFunc } from "../platform/types";
import { fireEvent } from "../platform/runtime";
import type { HomeAssistant } from "../platform/types";
import type { DashboardCard, DashboardTextKey } from "./dashboard-model";
import { domainOf } from "./dashboard-model";
import { responsiveControlStyles } from "./responsive-card-styles";
import "./emad-ui-device";

const CONTROL_DOMAINS = new Set([
  "light",
  "climate",
  "switch",
  "input_boolean",
  "cover",
  "fan",
  "lock",
  "vacuum",
  "media_player",
  "humidifier",
  "water_heater",
  "valve",
  "scene",
  "script",
  "button",
  "input_button",
  "number",
  "input_number",
  "select",
  "input_select",
]);

/** Native entities of one explicitly selected Home Assistant device. */
@customElement("emad-ui-device-entities")
export class EmadDeviceEntities extends LitElement {
  @property({ attribute: false }) public entities: readonly HassEntity[] = [];
  @property({ attribute: false }) public card!: DashboardCard;
  @property({ attribute: false }) public localize!: LocalizeFunc<string>;
  @property({ attribute: false }) public formatState: (
    entity: HassEntity,
  ) => string = (entity) => entity.state;
  @property({ attribute: false }) public services?: HomeAssistant["services"];
  @property({ attribute: false }) public busy: ReadonlySet<string> = new Set();
  @property({ attribute: false }) public errors: Readonly<
    Record<string, string>
  > = {};
  @property({ type: Boolean }) public disabled = false;
  @property({ type: Boolean, attribute: "read-only" }) public readOnly = false;
  @property() public language = "en";
  @property({ attribute: "temperature-unit" }) public temperatureUnit = "°C";

  @state() private _expanded = false;
  private _toggle(event: Event) {
    this._expanded = (event.currentTarget as HTMLDetailsElement).open;
  }
  private _t(key: DashboardTextKey, values?: Record<string, string | number>) {
    return this.localize(`ui.panel.emad-dashboard.${key}`, values);
  }
  private _details(event: Event) {
    fireEvent(this, "hass-more-info", {
      entityId: (event.currentTarget as HTMLElement).dataset.entity!,
    });
  }
  protected render() {
    if (!this.entities.length) return nothing;
    return html`<details @toggle=${this._toggle}>
      <summary>
        ${this._t("ha_device_entities", { count: this.entities.length })}
      </summary>
      <div class="entities">
        ${
          this._expanded
            ? repeat(
                this.entities,
                (entity) => entity.entity_id,
                (entity) =>
                  html`<section
                    aria-label=${entity.attributes.friendly_name || entity.entity_id}
                  >
                    <header>
                      <h4>
                        ${entity.attributes.friendly_name || entity.entity_id}
                      </h4>
                      <p><bdi>${this.formatState(entity)}</bdi></p>
                    </header>
                    ${
                      !this.readOnly &&
                      CONTROL_DOMAINS.has(domainOf(entity.entity_id))
                        ? html`<emad-ui-device
                            controls-only
                            .card=${{ ...this.card, entity: entity.entity_id, deviceType: undefined }}
                            .entity=${entity}
                            .localize=${this.localize}
                            .formatState=${this.formatState}
                            .services=${this.services}
                            .temperatureUnit=${this.temperatureUnit}
                            .language=${this.language}
                            .disabled=${this.disabled}
                            .busy=${this.busy.has(entity.entity_id)}
                            .error=${this.errors[entity.entity_id] || ""}
                          ></emad-ui-device>`
                        : nothing
                    }
                    <button
                      data-entity=${entity.entity_id}
                      @click=${this._details}
                    >
                      ${this._t("details")} ↗
                    </button>
                  </section>`,
              )
            : nothing
        }
      </div>
    </details>`;
  }
  static styles = [
    css`
      :host {
        display: block;
        min-width: 0;
      }
      details {
        border-block-start: 1px solid var(--emad-line, #dce6e0);
        padding-block-start: 10px;
      }
      summary {
        min-block-size: 48px;
        align-content: center;
        cursor: pointer;
        font-size: calc(14px * var(--emad-ui-text-scale, 1));
        overflow-wrap: anywhere;
      }
      summary:focus-visible {
        outline: 3px solid var(--emad-mint, #69e1b7);
        outline-offset: -3px;
      }
      .entities {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
      }
      section {
        min-width: 0;
        padding: 12px;
        border: 1px solid var(--emad-line, #dce6e0);
        border-radius: 4px;
      }
      h4,
      p {
        margin: 0 0 8px;
        overflow-wrap: anywhere;
        line-height: 1.5;
        font-size: calc(14px * var(--emad-ui-text-scale, 1));
      }
      p {
        color: var(--secondary-text-color, #708075);
      }
      button {
        background: transparent;
        border: 1px solid var(--emad-line, #dce6e0);
        color: inherit;
        font: inherit;
        padding: 8px;
        margin-block-start: 8px;
        cursor: pointer;
      }
      @container emad-device (min-width:800px) {
        .entities {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
    responsiveControlStyles,
  ];
}
declare global {
  interface HTMLElementTagNameMap {
    "emad-ui-device-entities": EmadDeviceEntities;
  }
}
