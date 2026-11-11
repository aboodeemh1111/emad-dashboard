import { customElement } from "../platform/element";
import {
  mdiLightbulbOutline,
  mdiSnowflake,
  mdiFire,
  mdiRefresh,
  mdiWeatherWindy,
  mdiPaletteOutline,
  mdiBrightness6,
  mdiThermometer,
  mdiThermostat,
  mdiPower,
  mdiBlindsHorizontal,
  mdiFan,
  mdiLockOutline,
  mdiRobotVacuum,
  mdiSpeaker,
  mdiWaterPercent,
  mdiGauge,
  mdiWeatherPartlyCloudy,
  mdiVideoOutline,
  mdiShieldHomeOutline,
  mdiFlashOutline,
  mdiTuneVariant,
  mdiAccountOutline,
} from "@mdi/js";
import type { HassEntity } from "home-assistant-js-websocket";
import { css, html, LitElement, nothing } from "lit";
import type { PropertyValues } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { property, state } from "lit/decorators.js";
import {
  responsiveControlStyles,
  responsiveNativeStyles,
} from "./responsive-card-styles";
import { deviceControlStyles } from "./dashboard-design-styles";
import { doorVisual, vacuumVisual, speakerVisual } from "./device-visuals";
import { supportsFeature } from "../platform/runtime";
import { fireEvent } from "../platform/runtime";
import type { LocalizeFunc } from "../platform/types";
import "../platform/ui";
import "../platform/ui";
import type { CameraEntity } from "../platform/types";
import type { HomeAssistant } from "../platform/types";
import {
  powerCommand,
  supportsEntityService,
  stringOptions,
} from "./home-assistant-compat";
import type {
  DashboardCard,
  DeviceCommand,
  DashboardTextKey,
} from "./dashboard-model";
import { domainOf, isAvailable } from "./dashboard-model";

const ICONS: Record<string, string> = {
  light: mdiLightbulbOutline,
  climate: mdiThermostat,
  switch: mdiPower,
  input_boolean: mdiPower,
  cover: mdiBlindsHorizontal,
  fan: mdiFan,
  lock: mdiLockOutline,
  vacuum: mdiRobotVacuum,
  media_player: mdiSpeaker,
  humidifier: mdiWaterPercent,
  water_heater: mdiThermostat,
  weather: mdiWeatherPartlyCloudy,
  camera: mdiVideoOutline,
  alarm_control_panel: mdiShieldHomeOutline,
  scene: mdiFlashOutline,
  script: mdiFlashOutline,
  person: mdiAccountOutline,
  device_tracker: mdiAccountOutline,
  number: mdiTuneVariant,
  input_number: mdiTuneVariant,
  select: mdiTuneVariant,
  input_select: mdiTuneVariant,
};

const MODES: Record<
  string,
  { icon: string; color: string; label: DashboardTextKey }
> = {
  cool: { icon: mdiSnowflake, color: "#3b82f6", label: "cool" },
  heat: { icon: mdiFire, color: "#ef6b51", label: "heat" },
  fan_only: { icon: mdiWeatherWindy, color: "#35b48c", label: "fan_only" },
  auto: { icon: mdiRefresh, color: "#9b7ee8", label: "auto" },
  heat_cool: { icon: mdiRefresh, color: "#9b7ee8", label: "heat_cool" },
  dry: { icon: mdiWaterPercent, color: "#22abc3", label: "dry" },
  off: { icon: mdiPower, color: "#84948a", label: "off" },
};
const COLORS = [
  "#FFC107",
  "#FFFFFF",
  "#4FC3F7",
  "#81C784",
  "#FF6B6B",
  "#FFA726",
  "#BA68C8",
  "#64B5F6",
];

@customElement("emad-ui-device")
export class EmadDashboardDevice extends LitElement {
  @property({ type: Boolean, attribute: "controls-only", reflect: true })
  public controlsOnly = false;
  @property({ attribute: false }) public card!: DashboardCard;
  @property({ attribute: false }) public entity?: HassEntity;
  @property({ attribute: false }) public cameraHass?: HomeAssistant;
  @property({ attribute: false }) public localize!: LocalizeFunc<string>;
  @property({ attribute: false }) public formatState: (
    entity: HassEntity,
  ) => string = (entity) => entity.state;
  @property({ attribute: false }) public services?: HomeAssistant["services"];
  @property({ attribute: "temperature-unit" }) public temperatureUnit = "°C";
  @property() public area = "";
  @property() public language = "en";
  @property({ type: Boolean }) public disabled = false;
  @property({ type: Boolean }) public busy = false;
  @property() public error = "";
  @property({ attribute: false }) public now = new Date();
  @state() private _unlockUntil = 0;
  @state() private _rangePreview: Record<string, number> = {};

  protected willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (
      changed.has("entity") &&
      (changed.get("entity") as HassEntity | undefined)?.entity_id !==
        this.entity?.entity_id
    ) {
      this._unlockUntil = 0;
    }
    if (
      changed.has("entity") ||
      changed.has("error") ||
      changed.has("disabled")
    ) {
      this._rangePreview = {};
    }
  }
  private _optionLabel(option: string, domain: string) {
    const speeds: Record<string, DashboardTextKey> = {
      low: "fan_low",
      medium: "fan_medium",
      high: "fan_high",
    };
    if (speeds[option]) return this._t(speeds[option]);
    return (
      (domain === "climate" && MODES[option]
        ? this._t(MODES[option].label)
        : this.localize(
            `component.${domain}.entity_component._.state.${option}`,
          )) || option.replaceAll("_", " ")
    );
  }
  private _tone(domain: string, entity?: HassEntity): string {
    if (domain === "climate") {
      return MODES[entity?.state || "off"]?.color || "#3b82f6";
    }
    if (domain === "light") {
      const rgb: unknown = entity?.attributes.rgb_color;
      if (
        Array.isArray(rgb) &&
        rgb.length >= 3 &&
        rgb
          .slice(0, 3)
          .every((value) => typeof value === "number" && Number.isFinite(value))
      ) {
        return `rgb(${rgb
          .slice(0, 3)
          .map((value: number) => Math.round(Math.max(0, Math.min(255, value))))
          .join(",")})`;
      }
      return "#e8aa23";
    }
    return "#43b78b";
  }
  private _rgbHex(): string {
    const rgb: unknown = this.entity?.attributes.rgb_color;
    return Array.isArray(rgb) &&
      rgb.length >= 3 &&
      rgb
        .slice(0, 3)
        .every((value) => typeof value === "number" && Number.isFinite(value))
      ? `#${rgb
          .slice(0, 3)
          .map((value: number) =>
            Math.round(Math.max(0, Math.min(255, value)))
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")}`
      : "#FFC107";
  }
  private _customColor(event: Event) {
    const hex = (event.currentTarget as HTMLInputElement).value;
    this._send("turn_on", {
      rgb_color: [1, 3, 5].map((index) =>
        Number.parseInt(hex.slice(index, index + 2), 16),
      ),
    });
  }
  private _supportsService(service: string) {
    return (
      !!this.entity &&
      supportsEntityService(this.entity, service) &&
      (!this.services ||
        !!this.services[domainOf(this.entity.entity_id)]?.[service])
    );
  }
  private _power(domain: string, entity?: HassEntity) {
    if (
      !entity ||
      !["light", "climate", "fan", "humidifier", "media_player"].includes(
        domain,
      )
    ) {
      return nothing;
    }
    const command = powerCommand(entity);
    if (!command) return nothing;
    const on = !["off", "standby"].includes(entity.state);
    return html`<button
      class="power ${on ? "active" : ""}"
      aria-label=${this._t("power")}
      aria-pressed=${on}
      ?disabled=${this.disabled || this.busy || !isAvailable(entity) || !this._supportsService(command.service)}
      @click=${this._toggle}
    >
      <emad-ui-svg-icon .path=${mdiPower}></emad-ui-svg-icon>
    </button>`;
  }
  private _choices(
    label: string,
    current: unknown,
    options: unknown,
    service: string,
    field: string,
    mode = false,
  ) {
    options = stringOptions(options);
    if (
      !Array.isArray(options) ||
      !options.length ||
      !this._supportsService(service)
    ) {
      return nothing;
    }
    const domain = domainOf(this.card.entity || "");
    return html`<div class="choice-control">
      <div class="control-label">
        <span>${label}</span
        >${!mode ? html`<b>${typeof current === "string" ? this._optionLabel(current, domain) : "—"}</b>` : nothing}
      </div>
      <div
        class="choices ${mode ? "mode-choices" : "fan-choices"}"
        role="group"
        aria-label=${label}
      >
        ${options.map(
          (option: string, index) =>
            html`<button
              class=${current === option ? "active" : ""}
              aria-label=${this._optionLabel(option, domain)}
              aria-pressed=${current === option}
              data-service=${service}
              data-payload=${JSON.stringify({ [field]: option })}
              style=${styleMap({ "--mode-color": MODES[option]?.color || "var(--control-accent)" })}
              ?disabled=${this.disabled || this.busy || !isAvailable(this.entity) || !this._supportsService(service)}
              @click=${this._commandClick}
            >
              ${mode ? html`<emad-ui-svg-icon .path=${MODES[option]?.icon || mdiTuneVariant}></emad-ui-svg-icon>` : html`<span class="speed-bars" aria-hidden="true">${[0, 1, 2, 3, 4].map((n) => html`<i class=${n <= Math.round((index / Math.max(1, options.length - 1)) * 4) ? "lit" : ""} style=${`--bar-height:${5 + n * 2}px`}></i>`)}</span>`}<span
                >${this._optionLabel(option, domain)}</span
              >
            </button>`,
        )}
      </div>
    </div>`;
  }

  private _t(key: DashboardTextKey) {
    return this.localize(`ui.panel.emad-dashboard.${key}`);
  }
  private _send(service: string, data?: Record<string, unknown>) {
    if (
      this.disabled ||
      this.busy ||
      !isAvailable(this.entity) ||
      !this.card.entity
    ) {
      return;
    }
    if (
      domainOf(this.card.entity) === "lock" &&
      this.entity?.attributes.code_format
    ) {
      this._details();
      return;
    }
    if (!this._supportsService(service)) return;
    fireEvent(this, "emad-device-command", {
      entity: this.card.entity,
      service,
      data,
    } satisfies DeviceCommand);
  }
  private _details() {
    if (this.card.entity) {
      fireEvent(this, "hass-more-info", { entityId: this.card.entity });
    }
  }
  private _button(
    label: string,
    service: string,
    data?: Record<string, unknown>,
    active = false,
    ariaLabel = label,
  ) {
    return html`<button
      class=${active ? "active" : ""}
      aria-label=${ariaLabel}
      ?disabled=${this.disabled || this.busy || !isAvailable(this.entity) || !this._supportsService(service)}
      data-service=${service}
      data-payload=${JSON.stringify(data ?? {})}
      @click=${this._commandClick}
    >
      ${label}
    </button>`;
  }
  private _range(
    label: string,
    value: unknown,
    min: number,
    max: number,
    step: number,
    service: string,
    field: string,
    unit = "",
  ) {
    const numeric = typeof value === "number" && Number.isFinite(value);
    const displayed = this._rangePreview[field] ?? (numeric ? value : min);
    const progress =
      max > min
        ? Math.min(100, Math.max(0, ((displayed - min) / (max - min)) * 100))
        : 0;
    const warmth = field === "color_temp_kelvin";
    const icon = warmth
      ? mdiThermometer
      : field === "brightness_pct"
        ? mdiBrightness6
        : mdiTuneVariant;
    return html`<label
      class="range-label ${warmth ? "warmth-range" : ""}"
      style=${styleMap({ "--range-progress": `${progress}%` })}
    >
      ${
        field !== "temperature"
          ? html`<span class="control-label"
              ><span
                ><emad-ui-svg-icon .path=${icon}></emad-ui-svg-icon
                >${label}</span
              ><b
                ><bdi
                  >${numeric || this._rangePreview[field] !== undefined ? `${displayed}${unit}` : "—"}</bdi
                ></b
              ></span
            >`
          : nothing
      }
      <span class="range-track" dir="ltr"
        ><small>${warmth ? `${min}K` : min}</small
        ><input
          aria-label=${label}
          type="range"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(displayed)}
          ?disabled=${this.disabled || this.busy || !isAvailable(this.entity) || !this._supportsService(service) || !Number.isFinite(min) || !Number.isFinite(max) || min >= max || !Number.isFinite(step) || step <= 0}
          data-service=${service}
          data-field=${field}
          @input=${this._rangeInput}
          @change=${this._rangeChange}
        /><small>${warmth ? `${max}K` : `${max}${unit}`}</small></span
      >
    </label>`;
  }
  private _rangeInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    this._rangePreview = {
      ...this._rangePreview,
      [target.dataset.field!]: Number(target.value),
    };
  }
  private _select(
    label: string,
    value: unknown,
    options: unknown,
    service: string,
    field: string,
  ) {
    options = stringOptions(options);
    if (
      !Array.isArray(options) ||
      !options.length ||
      !this._supportsService(service)
    ) {
      return nothing;
    }
    return html`<label class="select-label"
      >${label}<select
        aria-label=${label}
        .value=${String(value ?? "")}
        ?disabled=${this.disabled || this.busy || !isAvailable(this.entity) || !this._supportsService(service)}
        data-service=${service}
        data-field=${field}
        @change=${this._selectChange}
      >
        <option value="" disabled>—</option>
        ${options.map((option: string) => html`<option value=${option} .selected=${value === option}>${this.localize(`component.${domainOf(this.entity!.entity_id)}.entity_component._.state.${option}`) || option}</option>`)}
      </select></label
    >`;
  }
  private _commandClick(event: Event) {
    const target = event.currentTarget as HTMLButtonElement;
    this._send(target.dataset.service!, JSON.parse(target.dataset.payload!));
  }
  private _rangeChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    this._send(target.dataset.service!, {
      [target.dataset.field!]: Number(target.value),
    });
  }
  private _selectChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    this._send(target.dataset.service!, {
      [target.dataset.field!]: target.value,
    });
  }
  private _toggle() {
    const command = this.entity && powerCommand(this.entity);
    if (command) this._send(command.service, command.data);
  }
  private _color(event: Event) {
    this._send("turn_on", {
      rgb_color: [1, 3, 5].map((index) =>
        Number.parseInt(
          (event.currentTarget as HTMLButtonElement).dataset.color!.slice(
            index,
            index + 2,
          ),
          16,
        ),
      ),
    });
  }
  private _unlock() {
    if (this._unlockUntil > Date.now()) {
      this._send("unlock");
      this._unlockUntil = 0;
    } else this._unlockUntil = Date.now() + 5000;
  }
  protected render() {
    const card = this.card;
    if (card.kind === "clock") {
      return html`<div
        class="clock"
        tabindex="0"
        role="region"
        aria-label=${this._t("local_time")}
      >
        <p class="eyebrow">${this._t("local_time")}</p>
        <div class="time">
          ${this.now.toLocaleTimeString(this.language, { hour: "2-digit", minute: "2-digit" })}
        </div>
        <p>
          ${this.now.toLocaleDateString(this.language, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <span class="clock-line"></span>
      </div>`;
    }
    if (card.kind === "text") {
      return html`<div
        class="note"
        tabindex="0"
        role="region"
        aria-label=${card.title || this._t("note")}
      >
        <p class="eyebrow">${this._t("note")}</p>
        <h2>${card.title || this._t("welcome")}</h2>
        <p>${card.text || this._t("note_hint")}</p>
      </div>`;
    }
    const entity = this.entity;
    const domain = domainOf(card.entity || "");
    const available = isAvailable(entity);
    const entityState = entity?.state;
    const attributes = entity?.attributes ?? {};
    const active =
      available &&
      !["off", "idle", "closed", "locked", "standby", "docked"].includes(
        entityState!,
      );
    if (this.controlsOnly) {
      return html`<div
        class="native-controls"
        style=${styleMap({ "--control-accent": this._tone(domain, entity), "--ambient-color": this._tone(domain, entity) })}
      >
        ${available ? html`${this._power(domain, entity)}${this._controls(domain, entity!)}` : nothing}
        ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
      </div>`;
    }
    const lightType =
      domain === "light"
        ? attributes.supported_color_modes?.some((mode: string) =>
            ["rgb", "rgbw", "rgbww", "xy", "hs"].includes(mode),
          )
          ? "light_rgb"
          : attributes.supported_color_modes?.includes("color_temp")
            ? "light_tunable"
            : attributes.supported_color_modes?.includes("brightness")
              ? "light_dimmable"
              : "light_basic"
        : undefined;
    return html`<div
      class="device ${active ? "is-active" : ""} ${this.busy ? "is-busy" : ""}"
      data-domain=${domain}
      data-state=${entityState || "missing"}
      style=${styleMap({ "--control-accent": domain === "light" ? "#e8aa23" : this._tone(domain, entity), "--ambient-color": this._tone(domain, entity) })}
      aria-busy=${this.busy}
      tabindex="0"
      role="region"
      aria-label=${card.title || attributes.friendly_name || card.entity || this._t("details")}
    >
      <div class="device-glow" aria-hidden="true"></div>
      <header>
        <span class="icon"
          ><emad-ui-svg-icon
            .path=${ICONS[domain] || mdiGauge}
          ></emad-ui-svg-icon
        ></span>
        <div class="identity">
          <div class="device-name">
            <h2>${card.title || attributes.friendly_name || card.entity}</h2>
            ${lightType ? html`<span class="type-badge">${this._t(lightType)}</span>` : nothing}
          </div>
          <p>${this.area || this._t("unassigned")}</p>
        </div>
        <div class="header-actions">
          <span
            class="connection ${available ? "online" : ""}"
            title=${this._t(available ? "online" : "unavailable")}
            ><i></i>${this._t(available ? "online" : "unavailable")}</span
          >${this._power(domain, entity)}
        </div>
      </header>
      <div class="device-body">
        ${
          available
            ? this._controls(domain, entity!)
            : html`<div class="offline-visual">
                  <emad-ui-svg-icon
                    .path=${ICONS[domain] || mdiGauge}
                  ></emad-ui-svg-icon
                  ><span>—</span>
                </div>
                <p class="center muted">
                  ${this._t(entity ? "unavailable" : "missing")}
                </p>`
        }
      </div>
      <footer>
        <span class="state"
          ><i class=${active ? "active" : ""}></i
          >${this.busy ? this._t("sending") : entity ? this.formatState(entity) : this._t("missing")}</span
        ><button class="details" @click=${this._details} ?disabled=${!entity}>
          ${this._t("details")} ↗
        </button>
      </footer>
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
    </div>`;
  }
  private _controls(domain: string, entity: HassEntity) {
    const a = entity.attributes;
    const supports = (flag: number) => supportsFeature(entity, flag);
    const t = (key: DashboardTextKey) => this._t(key);
    switch (domain) {
      case "light": {
        const chosenColor =
          Array.isArray(a.rgb_color) && a.rgb_color.length >= 3
            ? this._rgbHex().toUpperCase()
            : undefined;
        const brightness =
          entity.state === "off"
            ? 0
            : typeof a.brightness === "number"
              ? Math.round(a.brightness / 2.55)
              : undefined;
        const dimmable =
          Array.isArray(a.supported_color_modes) &&
          a.supported_color_modes.some(
            (mode: string) => !["onoff", "unknown"].includes(mode),
          );
        const rgb = a.supported_color_modes?.some((mode: string) =>
          ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(mode),
        );
        return html`<div class="lighting-summary">
            <span class="light-orb" aria-hidden="true"
              ><emad-ui-svg-icon .path=${mdiLightbulbOutline}></emad-ui-svg-icon
              ><i></i
            ></span>
            <div>
              <span class="eyebrow"
                >${t(dimmable ? "brightness" : "power")}</span
              >
              <div class="light-reading">
                ${dimmable ? html`${this._rangePreview.brightness_pct ?? brightness ?? "—"}<small>%</small>` : this.formatState(entity)}
              </div>
            </div>
          </div>
          ${dimmable ? this._range(t("brightness"), brightness, 0, 100, 1, "turn_on", "brightness_pct", "%") : nothing}
          ${a.supported_color_modes?.includes("color_temp") && a.min_color_temp_kelvin && a.max_color_temp_kelvin ? this._range(t("warmth"), a.color_temp_kelvin, a.min_color_temp_kelvin, a.max_color_temp_kelvin, 50, "turn_on", "color_temp_kelvin", " K") : nothing}
          ${
            rgb
              ? html`<div class="palette-control">
                  <span class="control-label"
                    ><span
                      ><emad-ui-svg-icon
                        .path=${mdiPaletteOutline}
                      ></emad-ui-svg-icon
                      >${t("color")}</span
                    ></span
                  >
                  <div class="swatches">
                    ${COLORS.map((hex) => html`<button aria-label=${`${t("color")} ${hex}`} aria-pressed=${chosenColor === hex} class=${chosenColor === hex ? "chosen" : ""} style=${styleMap({ "--swatch": hex })} data-color=${hex} ?disabled=${this.disabled || this.busy || !this._supportsService("turn_on")} @click=${this._color}></button>`)}<label
                      class="custom-color"
                      style=${styleMap({ "--swatch": this._rgbHex() })}
                      ><input
                        type="color"
                        aria-label=${t("custom_color")}
                        .value=${this._rgbHex()}
                        ?disabled=${this.disabled || this.busy || !this._supportsService("turn_on")}
                        @change=${this._customColor} /><emad-ui-svg-icon
                        .path=${mdiPaletteOutline}
                      ></emad-ui-svg-icon
                    ></label>
                  </div>
                </div>`
              : nothing
          }`;
      }
      case "climate": {
        const mode = MODES[entity.state] || MODES.off;
        return html`<div class="temperature">
            <div class="temperature-main">
              <span class="temperature-value"
                ><bdi
                  >${typeof a.temperature === "number" ? (this._rangePreview.temperature ?? a.temperature) : typeof a.target_temp_low === "number" && typeof a.target_temp_high === "number" ? `${this._rangePreview.target_temp_low ?? a.target_temp_low}–${this._rangePreview.target_temp_high ?? a.target_temp_high}` : "—"}<small
                    >${this.temperatureUnit}</small
                  ></bdi
                ></span
              ><emad-ui-svg-icon
                class="mode-glyph"
                data-mode=${entity.state}
                .path=${mode.icon}
              ></emad-ui-svg-icon>
            </div>
            <p>
              ${t("current_temperature")}
              <bdi>${a.current_temperature ?? "—"}${this.temperatureUnit}</bdi>
            </p>
          </div>
          ${
            supports(1) && typeof a.temperature === "number"
              ? html`<div class="temperature-adjust">
                    <span>${t("target_temperature")}</span>
                    <div>
                      ${this._button("−", "set_temperature", { temperature: Math.max(a.min_temp ?? 7, a.temperature - (a.target_temp_step ?? 0.5)) }, false, t("decrease_temperature"))}<bdi>${this._rangePreview.temperature ?? a.temperature}${this.temperatureUnit}</bdi>${this._button("+", "set_temperature", { temperature: Math.min(a.max_temp ?? 35, a.temperature + (a.target_temp_step ?? 0.5)) }, false, t("increase_temperature"))}
                    </div>
                  </div>
                  ${this._range(t("temperature"), a.temperature, a.min_temp ?? 7, a.max_temp ?? 35, a.target_temp_step ?? 0.5, "set_temperature", "temperature", this.temperatureUnit)}`
              : nothing
          }
          ${
            supports(2) &&
            typeof a.target_temp_low === "number" &&
            typeof a.target_temp_high === "number"
              ? html` ${this._range(t("ha_target_low"), a.target_temp_low, a.min_temp, Math.min(a.max_temp, a.target_temp_high), a.target_temp_step ?? 0.5, "set_temperature", "target_temp_low", this.temperatureUnit)}
                ${this._range(t("ha_target_high"), a.target_temp_high, Math.max(a.min_temp, a.target_temp_low), a.max_temp, a.target_temp_step ?? 0.5, "set_temperature", "target_temp_high", this.temperatureUnit)}`
              : nothing
          }
          ${supports(4) ? this._range(t("target_humidity"), a.humidity, a.min_humidity ?? 0, a.max_humidity ?? 100, a.target_humidity_step ?? 1, "set_humidity", "humidity", "%") : nothing}
          ${this._choices(t("mode"), entity.state, a.hvac_modes, "set_hvac_mode", "hvac_mode", true)}
          ${this._choices(t("fan_speed"), a.fan_mode, a.fan_modes, "set_fan_mode", "fan_mode")}
          ${this._select(t("ha_preset"), a.preset_mode, a.preset_modes, "set_preset_mode", "preset_mode")}
          ${this._select(t("ha_swing"), a.swing_mode, a.swing_modes, "set_swing_mode", "swing_mode")}
          ${this._select(t("ha_horizontal_swing"), a.swing_horizontal_mode, a.swing_horizontal_modes, "set_swing_horizontal_mode", "swing_horizontal_mode")}`;
      }
      case "cover":
      case "valve":
        return html`<div class="blind-scene" aria-hidden="true">
            <div
              class="blind-art"
              style=${styleMap({ "--opening": `${typeof a.current_position === "number" ? Math.max(0, Math.min(100, a.current_position)) : 0}%` })}
            >
              <div class="slats"></div>
              <i></i>
            </div>
          </div>
          <div class="actions">
            ${supports(1) ? this._button(t("open"), domain === "cover" ? "open_cover" : "open_valve") : nothing}${supports(8) ? this._button(t("stop"), domain === "cover" ? "stop_cover" : "stop_valve") : nothing}${supports(2) ? this._button(t("close"), domain === "cover" ? "close_cover" : "close_valve") : nothing}
          </div>
          ${supports(4) ? this._range(t("position"), a.current_position, 0, 100, 1, domain === "cover" ? "set_cover_position" : "set_valve_position", "position", "%") : nothing}${
            domain === "cover"
              ? html`<div class="actions">
                    ${supports(16) ? this._button(t("ha_tilt_open"), "open_cover_tilt") : nothing}
                    ${supports(64) ? this._button(t("ha_tilt_stop"), "stop_cover_tilt") : nothing}
                    ${supports(32) ? this._button(t("ha_tilt_close"), "close_cover_tilt") : nothing}
                  </div>
                  ${supports(128) ? this._range(t("ha_tilt_position"), a.current_tilt_position, 0, 100, 1, "set_cover_tilt_position", "tilt_position", "%") : nothing}`
              : nothing
          }`;
      case "fan":
        return html`<div
            class="fan-scene"
            style=${styleMap({ "--fan-duration": `${typeof a.percentage === "number" ? Math.max(0.6, 4 - a.percentage * 0.032) : 3}s` })}
            aria-hidden="true"
          >
            <div class="fan-ring"></div>
            <emad-ui-svg-icon
              class=${entity.state === "on" ? "spinning" : ""}
              .path=${mdiFan}
            ></emad-ui-svg-icon
            ><span></span>
          </div>
          ${supports(1) ? this._range(t("fan_speed"), a.percentage, 0, 100, a.percentage_step ?? 1, "set_percentage", "percentage", "%") : nothing}${this._select(t("mode"), a.preset_mode, a.preset_modes, "set_preset_mode", "preset_mode")}${supports(4) ? this._select(t("ha_direction"), a.direction, ["forward", "reverse"], "set_direction", "direction") : nothing}${supports(2) && typeof a.oscillating === "boolean" ? this._button(t("oscillate"), "oscillate", { oscillating: !a.oscillating }, a.oscillating) : nothing}`;
      case "lock":
        if (a.code_format) {
          return html`<div class="readout small">
              ${this.formatState(entity)}
            </div>
            <button @click=${this._details}>${t("security_controls")}</button>`;
        }
        return html`<div class="door-scene">
            ${doorVisual(entity.state === "open" || a.door_state === "open", entity.state === "locked")}
          </div>
          <div class="door-status">
            <span
              class="state-pill ${entity.state === "locked" ? "secured" : ""}"
              >${this.formatState(entity)}</span
            >${a.battery_level != null ? html`<span>${t("battery")} <bdi>${a.battery_level}%</bdi></span>` : nothing}
          </div>
          <div class="actions">
            ${entity.state === "locked" ? html`<button class=${this._unlockUntil > Date.now() ? "confirm-unlock" : ""} ?disabled=${this.disabled || this.busy} @click=${this._unlock}>${t(this._unlockUntil > Date.now() ? "confirm_unlock" : "unlock")}</button>` : this._button(t("lock"), "lock")}
          </div>`;
      case "media_player":
        return html`<div class="media-art">
            ${speakerVisual(entity.state === "playing")}
            <div class="media-copy">
              <b>${a.media_title || this.formatState(entity)}</b>
              <p>${a.media_artist || a.source || ""}</p>
            </div>
          </div>
          <div class="actions media-actions">
            ${supports(16) ? this._button(t("previous_track"), "media_previous_track") : nothing}${supports(16384) && entity.state !== "playing" ? this._button(t("play"), "media_play", undefined, true) : supports(1) && entity.state === "playing" ? this._button(t("pause"), "media_pause", undefined, true) : nothing}${supports(32) ? this._button(t("next_track"), "media_next_track") : nothing}${supports(4096) ? this._button(t("stop"), "media_stop") : nothing}${supports(8) && typeof a.is_volume_muted === "boolean" ? this._button(t("ha_mute"), "volume_mute", { is_volume_muted: !a.is_volume_muted }, a.is_volume_muted) : nothing}
          </div>
          ${supports(4) ? this._range(t("volume"), typeof a.volume_level === "number" ? Math.round(a.volume_level * 100) : undefined, 0, 100, 1, "volume_set", "volume_level", "%") : nothing}${this._select(t("source"), a.source, supports(2048) ? a.source_list : [], "select_source", "source")}`;
      case "vacuum":
        return html`<div class="vacuum-scene">
            ${vacuumVisual(entity.state === "cleaning")}<span
              class="battery-readout"
              >${t("battery")}
              <bdi
                >${a.battery_level != null ? `${a.battery_level}%` : "—"}</bdi
              ></span
            >
          </div>
          <div class="actions">
            ${supports(8192) ? this._button(t("start"), "start", undefined, entity.state === "cleaning") : nothing}${supports(4) ? this._button(t("pause"), "pause") : nothing}${supports(16) ? this._button(t("dock"), "return_to_base") : nothing}${supports(8) ? this._button(t("stop"), "stop") : nothing}${supports(512) ? this._button(t("ha_locate"), "locate") : nothing}${!supports(8192) && supports(1) ? this._button(t("turn_on"), "turn_on") : nothing}${supports(2) ? this._button(t("turn_off"), "turn_off") : nothing}
          </div>
          ${this._select(t("fan_speed"), a.fan_speed, supports(32) ? a.fan_speed_list : [], "set_fan_speed", "fan_speed")}`;
      case "humidifier":
        return html`<div class="readout">
            ${a.current_humidity ?? "—"}<small>%</small>
          </div>
          ${this._range(t("target_humidity"), a.humidity, a.min_humidity ?? 0, a.max_humidity ?? 100, 1, "set_humidity", "humidity", "%")}${this._select(t("mode"), a.mode, a.available_modes, "set_mode", "mode")}`;
      case "water_heater":
        return html`<div class="readout">
            ${a.current_temperature ?? "—"}<small
              >${this.temperatureUnit}</small
            >
          </div>
          ${supports(1) ? this._range(t("target_temperature"), a.temperature, a.min_temp ?? 7, a.max_temp ?? 75, a.target_temp_step ?? 1, "set_temperature", "temperature", this.temperatureUnit) : nothing}${this._select(t("mode"), a.operation_mode ?? entity.state, a.operation_list, "set_operation_mode", "operation_mode")}${supports(4) && ["on", "off"].includes(a.away_mode) ? this._button(t("ha_away"), "set_away_mode", { away_mode: a.away_mode !== "on" }, a.away_mode === "on") : nothing}`;
      case "number":
      case "input_number":
        return html`<div class="readout">
            ${entity.state}<small>${a.unit_of_measurement || ""}</small>
          </div>
          ${this._range(t("value"), Number(entity.state), a.min ?? 0, a.max ?? 100, a.step ?? 1, "set_value", "value")}`;
      case "select":
      case "input_select":
        return html`<div class="readout small">${this.formatState(entity)}</div>
          ${this._select(t("option"), entity.state, a.options, "select_option", "option")}`;
      case "switch":
      case "input_boolean":
        return html`<div class="hero switch-hero">
          <div class="switch-stage" aria-hidden="true"></div>
          <button
            class="large-power ${entity.state === "on" ? "active" : ""}"
            aria-label=${t("power")}
            ?disabled=${this.disabled || this.busy || !this._supportsService(entity.state === "on" ? "turn_off" : "turn_on")}
            @click=${this._toggle}
          >
            <emad-ui-svg-icon .path=${mdiPower}></emad-ui-svg-icon>
          </button>
          <p>${this.formatState(entity)}</p>
        </div>`;
      case "scene":
      case "script":
      case "button":
      case "input_button":
        return html`<div class="hero">
          <emad-ui-svg-icon .path=${mdiFlashOutline}></emad-ui-svg-icon
          >${this._button(t(domain.endsWith("button") ? "press" : "activate"), domain.endsWith("button") ? "press" : "turn_on")}
        </div>`;
      case "weather":
        return html`<div
            class="hero weather ${entity.state === "sunny" ? "sunny" : ""}"
          >
            <emad-ui-svg-icon
              .path=${mdiWeatherPartlyCloudy}
            ></emad-ui-svg-icon>
            <div class="readout">
              ${a.temperature ?? "—"}<small>${a.temperature_unit || ""}</small>
            </div>
          </div>
          <div class="weather-metrics">
            <span>${t("humidity")}<b>${a.humidity ?? "—"}%</b></span
            ><span
              >${t("wind")}<b
                >${a.wind_speed ?? "—"} ${a.wind_speed_unit || ""}</b
              ></span
            >
          </div>`;
      case "camera":
        return html`<div class="camera-preview">
          <emad-ui-camera
            .stateObj=${entity as CameraEntity}
            .hass=${this.cameraHass}
            muted
            controls
            .fitMode=${"contain"}
          ></emad-ui-camera
          ><button @click=${this._details}>${t("open_camera")}</button>
        </div>`;
      case "alarm_control_panel":
        return html`<div class="hero">
          <emad-ui-svg-icon .path=${mdiShieldHomeOutline}></emad-ui-svg-icon
          ><b>${this.formatState(entity)}</b
          ><button @click=${this._details}>${t("security_controls")}</button>
        </div>`;
      default:
        return html`<div
          class="readout ${["binary_sensor", "person", "device_tracker"].includes(domain) ? "small" : ""}"
        >
          ${this.formatState(entity)}
        </div>`;
    }
  }
  static styles = [
    deviceControlStyles,
    css`
      :host([controls-only]) {
        height: auto;
        padding: 0;
        overflow: visible;
        min-height: 0;
      }
      .native-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
      }
      :host([controls-only]) .blind-scene,
      :host([controls-only]) .fan-scene,
      :host([controls-only]) .door-scene,
      :host([controls-only]) .vacuum-scene,
      :host([controls-only]) .switch-stage,
      :host([controls-only]) .climate-hero,
      :host([controls-only]) .light-reading,
      :host([controls-only]) .readout,
      :host([controls-only]) .hero > emad-ui-svg-icon {
        display: none;
      }
      :host([controls-only]) .hero {
        min-height: 0;
        padding: 0;
        gap: 8px;
      }
      :host([controls-only]) .large-power {
        width: 48px;
        height: 48px;
      }
      :host([controls-only]) .power {
        align-self: flex-end;
      }
      :host([controls-only]) .mode-choices {
        gap: 5px;
      }
      :host([controls-only]) .camera-preview {
        height: 160px;
      }
      :host([controls-only]) .actions {
        margin-top: 0;
      }
    `,
    responsiveControlStyles,
    responsiveNativeStyles,
  ];
}

declare global {
  interface HASSDomEvents {
    "emad-device-command": DeviceCommand;
  }
  interface HTMLElementTagNameMap {
    "emad-ui-device": EmadDashboardDevice;
  }
}
