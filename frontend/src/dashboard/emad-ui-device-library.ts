import { customElement } from "../platform/element";
import { mdiArrowLeft, mdiPlus, mdiMagnify } from "@mdi/js";
import { css, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { fireEvent } from "../platform/runtime";
import type { LocalizeFunc } from "../platform/types";
import type { DashboardTextKey } from "./dashboard-model";
import {
  DEVICE_CATALOG,
  DEVICE_CATEGORIES,
  categoryNameKey,
  filterCatalog,
} from "./device-catalog";
import { FAMILY_ICONS } from "./catalog-visuals";
import "./emad-ui-catalog-device";
import "../platform/ui";

const PAGE_SIZE = 12;
@customElement("emad-ui-device-library")
export class EmadDeviceLibrary extends LitElement {
  @property({ attribute: false }) public localize!: LocalizeFunc<string>;
  @property() public language = "en";
  @property({ type: Boolean, attribute: "can-edit" }) public canEdit = false;
  @state() private _search = "";
  @state() private _category = "";
  @state() private _page = 0;
  private _t = (key: DashboardTextKey) =>
    this.localize(`ui.panel.emad-dashboard.${key}`);
  private _searchInput(event: Event) {
    this._search = (event.currentTarget as HTMLInputElement).value;
    this._page = 0;
  }
  private _choose(event: Event) {
    this._category =
      (event.currentTarget as HTMLElement).dataset.category || "";
    this._page = 0;
  }
  private _select(event: Event) {
    this._category = (event.currentTarget as HTMLSelectElement).value;
    this._page = 0;
  }
  private _back() {
    fireEvent(this, "emad-catalog-back");
  }
  private _add(event: Event) {
    fireEvent(this, "emad-catalog-add", {
      deviceType: (event.currentTarget as HTMLElement).dataset.type!,
    });
  }
  private _system() {
    fireEvent(this, "emad-catalog-system", { category: this._category });
  }
  private _previous() {
    this._page = Math.max(0, this._page - 1);
  }
  private _next() {
    this._page++;
  }
  protected render() {
    let results = filterCatalog(this._category, this._search, this._t);
    if (!this._category && !this._search.trim()) {
      const featured = [
        "thermostat",
        "rgb_light",
        "booster_pump",
        "water_tank",
        "motorized_ball_valve",
        "electricity_meter",
        "smart_lock",
        "ip_camera",
        "solar_inverter",
        "ceiling_fan",
        "fire_alarm_control_panel",
        "server",
      ];
      results = [
        ...featured.map((id) => DEVICE_CATALOG.find((item) => item.id === id)!),
        ...results.filter((item) => !featured.includes(item.id)),
      ];
    }
    const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    const page = Math.min(this._page, pages - 1);
    return html`<section class="library">
      <div class="library-heading">
        <div>
          <button class="back" @click=${this._back}>
            <emad-ui-svg-icon .path=${mdiArrowLeft}></emad-ui-svg-icon
            >${this._t("catalog_back")}
          </button>
          <p class="eyebrow">${this._t("product")}</p>
          <h2>${this._t("catalog")}</h2>
          <p class="intro">${this._t("catalog_hint")}</p>
        </div>
        <div class="totals">
          <strong
            >${new Intl.NumberFormat(this.language).format(DEVICE_CATALOG.length)}</strong
          ><span
            >${this._t("catalog_results")} ·
            ${new Intl.NumberFormat(this.language).format(DEVICE_CATEGORIES.length)}
            ${this._t("catalog_categories")}</span
          >
        </div>
      </div>
      <div class="library-layout">
        <aside aria-label=${this._t("catalog_categories")}>
          <button
            class=${!this._category ? "chosen" : ""}
            data-category=""
            @click=${this._choose}
            aria-pressed=${!this._category}
          >
            ${this._t("catalog_all")}<span
              >${DEVICE_CATALOG.length}</span
            ></button
          >${DEVICE_CATEGORIES.map((category) => html`<button class=${category === this._category ? "chosen" : ""} data-category=${category} @click=${this._choose} aria-pressed=${category === this._category}><emad-ui-svg-icon .path=${FAMILY_ICONS[DEVICE_CATALOG.find((item) => item.category === category)!.family]}></emad-ui-svg-icon><span class="category-name">${this._t(categoryNameKey(category))}</span><span>${DEVICE_CATALOG.filter((item) => item.category === category).length}</span></button>`)}
        </aside>
        <div class="results">
          <div class="filters">
            <label class="search"
              ><emad-ui-svg-icon .path=${mdiMagnify}></emad-ui-svg-icon
              ><input
                type="search"
                aria-label=${this._t("catalog_search")}
                placeholder=${this._t("catalog_search")}
                .value=${this._search}
                @input=${this._searchInput} /></label
            ><label class="mobile-category"
              >${this._t("catalog_categories")}<select
                .value=${this._category}
                @change=${this._select}
              >
                <option value="">${this._t("catalog_all")}</option>
                ${DEVICE_CATEGORIES.map((category) => html`<option value=${category}>${this._t(categoryNameKey(category))}</option>`)}
              </select></label
            >
          </div>
          <div class="result-heading">
            <div>
              <h3>
                ${this._category ? this._t(categoryNameKey(this._category)) : this._t("catalog_all")}
              </h3>
              <p role="status">
                ${new Intl.NumberFormat(this.language).format(results.length)}
                ${this._t("catalog_results")}
              </p>
            </div>
            ${this.canEdit && this._category ? html`<button class="system-add" @click=${this._system}><emad-ui-svg-icon .path=${mdiPlus}></emad-ui-svg-icon>${this._t("catalog_category_view")}</button>` : nothing}
          </div>
          <div class="device-grid">
            ${repeat(
              results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
              (item) => item.id,
              (item) =>
                html`<article
                  class="library-card"
                  data-type=${item.id}
                  data-category=${item.category}
                >
                  <emad-ui-catalog-device
                    library-preview
                    .card=${{ id: item.id, kind: "device" as const, deviceType: item.id, x: 0, y: 0, w: 384, h: 720 }}
                    .localize=${this.localize}
                    .language=${this.language}
                    dir=${this.language === "ar" ? "rtl" : "ltr"}
                  ></emad-ui-catalog-device
                  >${this.canEdit ? html`<button class="add" data-type=${item.id} @click=${this._add}><emad-ui-svg-icon .path=${mdiPlus}></emad-ui-svg-icon>${this._t("catalog_add")}</button>` : nothing}
                </article>`,
            )}
          </div>
          ${!results.length ? html`<div class="no-results">${this._t("no_devices")}</div>` : nothing}
          <div class="pagination">
            <button ?disabled=${page === 0} @click=${this._previous}>
              ${this._t("catalog_previous")}</button
            ><span
              >${this._t("catalog_page")}
              ${new Intl.NumberFormat(this.language).format(page + 1)} /
              ${new Intl.NumberFormat(this.language).format(pages)}</span
            ><button ?disabled=${page >= pages - 1} @click=${this._next}>
              ${this._t("catalog_next")}
            </button>
          </div>
        </div>
      </div>
    </section>`;
  }
  static styles = css`
    :host {
      display: block;
      color: var(--primary-text-color, #18221d);
      --catalog-mint: #69e1b7;
      --catalog-line: var(--divider-color, #dfe6e1);
    }
    * {
      box-sizing: border-box;
    }
    button,
    input,
    select {
      font: inherit;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-height: 40px;
      font-size: 11px;
      border: 1px solid var(--catalog-line);
      background: var(--card-background-color, #fff);
      color: inherit;
      padding: 8px 12px;
      border-radius: 6px 2px 6px 2px;
      cursor: pointer;
      transition:
        background 0.2s,
        transform 0.2s;
    }
    button:hover {
      background: color-mix(
        in srgb,
        var(--catalog-mint) 15%,
        var(--card-background-color, #fff)
      );
      transform: translateY(-1px);
    }
    button:active {
      transform: translateY(1px);
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
      transform: none;
    }
    button:focus-visible,
    input:focus-visible,
    select:focus-visible {
      outline: 3px solid var(--catalog-mint);
      outline-offset: 3px;
    }
    emad-ui-svg-icon {
      --mdc-icon-size: 18px;
      flex-shrink: 0;
    }
    .library-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      margin: 20px 0 28px;
    }
    .back {
      border: 0;
      background: transparent;
      padding-inline-start: 0;
      margin-bottom: 24px;
      color: var(--secondary-text-color);
    }
    h2 {
      font-size: 38px;
      font-weight: 500;
      letter-spacing: -1.5px;
      line-height: 1.15;
      margin: 9px 0 12px;
    }
    .eyebrow {
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin: 0;
    }
    .intro {
      font-size: 12px;
      line-height: 1.7;
      max-width: 430px;
      color: var(--secondary-text-color);
      margin: 0;
    }
    .totals {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 24px;
      border-inline-start: 1px solid var(--catalog-line);
      min-width: 180px;
    }
    .totals strong {
      font-size: 55px;
      font-weight: 400;
      letter-spacing: -3px;
    }
    .totals span {
      font-size: 10px;
      color: var(--secondary-text-color);
    }
    .library-layout {
      display: grid;
      grid-template-columns: 224px minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }
    aside {
      position: sticky;
      top: 12px;
      max-height: 80vh;
      overflow: auto;
      border-top: 1px solid var(--catalog-line);
      padding-top: 10px;
    }
    aside button {
      display: flex;
      justify-content: flex-start;
      width: 100%;
      border-color: transparent;
      background: transparent;
      min-height: 44px;
      padding: 8px;
      font-size: 10px;
      text-align: start;
    }
    aside .chosen {
      background: color-mix(
        in srgb,
        var(--catalog-mint) 16%,
        var(--card-background-color, #fff)
      );
      border-inline-start: 3px solid var(--catalog-mint);
      color: var(--primary-text-color);
    }
    aside button > span:last-child {
      margin-inline-start: auto;
      font-size: 9px;
      color: var(--secondary-text-color);
    }
    aside .category-name {
      flex: 1;
      line-height: 1.5;
    }
    aside emad-ui-svg-icon {
      --mdc-icon-size: 16px;
      opacity: 0.7;
    }
    .results {
      min-width: 0;
    }
    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 22px;
    }
    .search {
      display: flex;
      align-items: center;
      width: 100%;
      border: 1px solid var(--catalog-line);
      background: var(--card-background-color, #fff);
      gap: 10px;
      padding: 0 14px;
      min-height: 48px;
      border-radius: 8px 2px 8px 2px;
    }
    .search emad-ui-svg-icon {
      color: var(--secondary-text-color);
    }
    input {
      width: 100%;
      min-width: 0;
      border: 0;
      background: transparent;
      color: inherit;
      min-height: 46px;
      font-size: 12px;
    }
    .mobile-category {
      display: none;
    }
    .result-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    h3 {
      font-size: 19px;
      line-height: 1.4;
      font-weight: 500;
      margin: 0;
    }
    .result-heading p {
      font-size: 10px;
      color: var(--secondary-text-color);
      margin: 6px 0 0;
    }
    .system-add {
      font-size: 10px;
      max-width: 220px;
      text-align: start;
      flex-shrink: 0;
    }
    .device-grid {
      display: grid;
      align-items: start;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
    }
    .library-card {
      position: relative;
      min-width: 0;
      border: 1px solid var(--catalog-line);
      border-radius: 14px 3px 14px 3px;
      background: var(--card-background-color, #fff);
      box-shadow: 6px 6px 0
        color-mix(in srgb, var(--catalog-mint) 17%, transparent);
      transition:
        transform 0.22s ease,
        box-shadow 0.22s ease;
      overflow: hidden;
    }
    .library-card:hover {
      transform: translateY(-3px);
      box-shadow: 7px 10px 0
        color-mix(in srgb, var(--catalog-mint) 22%, transparent);
    }
    emad-ui-catalog-device {
      height: 688px;
      display: block;
    }
    .library-card[data-category="cleaning"],
    .library-card[data-category="appliances"],
    .library-card[data-category="pool"] {
      align-self: start;
    }
    .library-card[data-category="cleaning"] emad-ui-catalog-device,
    .library-card[data-category="appliances"] emad-ui-catalog-device,
    .library-card[data-category="pool"] emad-ui-catalog-device,
    .library-card[data-type="streetlight"] emad-ui-catalog-device,
    .library-card[data-type="exit_sign"] emad-ui-catalog-device {
      height: auto;
    }
    .add {
      width: 100%;
      border: 0;
      border-top: 1px solid var(--catalog-line);
      border-radius: 0;
      min-height: 44px;
      background: color-mix(
        in srgb,
        var(--catalog-mint) 12%,
        var(--card-background-color, #fff)
      );
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      margin: 28px 0;
    }
    .pagination span {
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .no-results {
      padding: 60px;
      text-align: center;
      font-size: 14px;
      color: var(--secondary-text-color);
    }
    @media (max-width: 1100px) {
      .device-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .library-layout {
        grid-template-columns: 200px minmax(0, 1fr);
        gap: 22px;
      }
    }
    @media (max-width: 800px) {
      .library-layout {
        grid-template-columns: 1fr;
      }
      aside {
        display: none;
      }
      .filters {
        flex-direction: column;
      }
      .mobile-category {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 11px;
      }
      .mobile-category select {
        min-width: 0;
        flex: 1;
        min-height: 40px;
        background: var(--card-background-color, #fff);
        color: inherit;
        border: 1px solid var(--catalog-line);
        border-radius: 5px;
        padding: 8px;
        font-size: 11px;
      }
      .totals {
        min-width: 130px;
        padding: 14px;
      }
      .totals strong {
        font-size: 40px;
      }
      .system-add {
        max-width: 180px;
      }
      .library-heading {
        margin-top: 0;
      }
      h2 {
        font-size: 32px;
      }
      .intro {
        max-width: 320px;
      }
    }
    @media (max-width: 550px) {
      .device-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .library-heading {
        align-items: flex-start;
        gap: 12px;
      }
      .totals {
        min-width: 75px;
        padding: 10px;
      }
      .totals strong {
        font-size: 32px;
      }
      .totals span {
        font-size: 8px;
        line-height: 1.5;
      }
      .result-heading {
        align-items: flex-start;
        flex-direction: column;
      }
      .system-add {
        max-width: 100%;
      }
      .back {
        font-size: 10px;
        padding-inline-end: 0;
      }
      .library-card {
        box-shadow: 4px 4px 0
          color-mix(in srgb, var(--catalog-mint) 17%, transparent);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
  `;
}
declare global {
  interface HASSDomEvents {
    "emad-catalog-back": undefined;
    "emad-catalog-add": { deviceType: string };
    "emad-catalog-system": { category: string };
  }
  interface HTMLElementTagNameMap {
    "emad-ui-device-library": EmadDeviceLibrary;
  }
}
