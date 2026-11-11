import { customElement } from "../platform/element";
import type { HassEntity } from "home-assistant-js-websocket";
import { css, html, LitElement, nothing, svg } from "lit";
import type { PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { HomeAssistant } from "../platform/types";
import "./emad-ui-device-entities";
import { counterpartEntity, supervisoryDevice } from "./home-assistant-compat";
import {
  responsiveControlStyles,
  responsiveCatalogStyles,
} from "./responsive-card-styles";
import { physicalCleaningStyles } from "./physical-cleaning-styles";
import {
  isCleaning,
  cleaningIsMoving,
  advanceCleaningState,
  cleaningRange,
  cleaningChoice,
  cleaningActionLabel,
  cleaningActionDisabled,
  cleaningControlDisabled,
  cleaningVisualState,
  cleaningLive,
  cleaningRemote,
  cleaningSuspend,
} from "./cleaning-model";
import { physicalApplianceRealismStyles } from "./physical-appliance-realism-styles";
import {
  isAppliance,
  applianceIsMoving,
  advanceApplianceState,
  applianceRange,
  applianceChoice,
  applianceActionLabel,
  applianceActionDisabled,
  applianceVisualState,
  applianceLive,
  applianceRemote,
} from "./appliance-model";
import { physicalWellnessStyles } from "./physical-wellness-styles";
import {
  isWellness,
  wellnessIsMoving,
  advanceWellnessState,
  wellnessRange,
  wellnessChoice,
  wellnessActionLabel,
  wellnessActionDisabled,
  wellnessVisualState,
  wellnessLive,
} from "./wellness-model";
import { fireEvent } from "../platform/runtime";
import type { LocalizeFunc } from "../platform/types";
import type { DashboardCard, DashboardTextKey } from "./dashboard-model";
import { isAvailable } from "./dashboard-model";
import {
  catalogDevice,
  categoryNameKey,
  deviceNameKey,
} from "./device-catalog";
import { physicalProfile } from "./device-physical-profiles";
import { catalogVisual } from "./catalog-visuals";
import { physicalDeviceStyles } from "./physical-device-styles";
import {
  actionTextKey,
  deviceInterface,
  entityVisual,
  initialDeviceState,
  optionTextKey,
  previewAction,
  previewVisual,
} from "./device-interface";
import type {
  DeviceAction,
  DeviceControl,
  DeviceMetric,
  DevicePreviewState,
} from "./device-interface";
import {
  advanceValveState,
  valveIsMoving,
  valveRange,
  valveSpec,
} from "./valve-model";
import {
  isWaterDevice,
  waterRemote,
  waterIsMoving,
  advanceWaterState,
  waterRange,
  waterChoice,
  waterVisualState,
} from "./water-model";
import { physicalWaterStyles } from "./physical-water-styles";
import {
  isTreatment,
  treatmentRemote,
  treatmentIsMoving,
  advanceTreatmentState,
  treatmentRange,
  treatmentVisualState,
  TREATMENT_SENSORS,
} from "./treatment-model";
import { physicalTreatmentStyles } from "./physical-treatment-styles";
import {
  isParking,
  parkingRemote,
  parkingIsMoving,
  advanceParkingState,
  parkingRange,
  parkingVisualState,
  parkingActionLabel,
} from "./parking-model";
import { physicalParkingStyles } from "./physical-parking-styles";
import {
  isOccupancy,
  occupancyIsMoving,
  advanceOccupancyState,
  occupancyChoice,
  occupancyVisualState,
  occupancyLive,
  occupancyActionLabel,
  occupancyActionDisabled,
} from "./occupancy-model";
import {
  isWeather,
  weatherIsMoving,
  advanceWeatherState,
  weatherRange,
  weatherChoice,
  weatherActionLabel,
  weatherLive,
  weatherVisualState,
} from "./weather-model";
import {
  isLighting,
  lightingIsMoving,
  advanceLightingState,
  lightingRange,
  lightingChoice,
  lightingActionLabel,
  lightingLive,
  lightingVisualState,
  lightingRemote,
} from "./lighting-model";
import { physicalWeatherStyles } from "./physical-weather-styles";
import { physicalStreetExitStyles } from "./physical-street-exit-styles";
import { physicalLightingStyles } from "./physical-lighting-styles";
import { physicalOccupancyStyles } from "./physical-occupancy-styles";
import "./emad-ui-device";

@customElement("emad-ui-catalog-device")
export class EmadDashboardCatalogDevice extends LitElement {
  @property({ attribute: false }) public card!: DashboardCard;
  @property({ attribute: false }) public entity?: HassEntity;
  @property({ attribute: false }) public cameraHass?: HomeAssistant;
  @property({ attribute: false })
  public relatedEntities: readonly HassEntity[] = [];
  @property({ attribute: false }) public relatedBusy: ReadonlySet<string> =
    new Set();
  @property({ attribute: false }) public relatedErrors: Readonly<
    Record<string, string>
  > = {};
  @property({ attribute: false }) public services?: HomeAssistant["services"];
  @property({ attribute: "temperature-unit" }) public temperatureUnit = "°C";
  @property({ attribute: false }) public localize!: LocalizeFunc<string>;
  @property({ attribute: false }) public formatState = (entity: HassEntity) =>
    entity.state;
  @property() public language = "en";
  @property({ type: Boolean }) public disabled = false;
  @property({ type: Boolean }) public busy = false;
  @property() public error = "";
  @state() private _preview?: DevicePreviewState;
  private _motionFrame?: number;
  private _motionTime?: number;
  private _stopMotion() {
    if (this._motionFrame !== undefined) {
      cancelAnimationFrame(this._motionFrame);
    }
    this._motionFrame = undefined;
    this._motionTime = undefined;
  }
  public disconnectedCallback() {
    super.disconnectedCallback();
    this._stopMotion();
    const device = catalogDevice(this.card?.deviceType);
    if (
      device &&
      this._preview &&
      (cleaningIsMoving(device, this._preview) ||
        applianceIsMoving(device, this._preview) ||
        wellnessIsMoving(device, this._preview) ||
        valveIsMoving(device, this._preview) ||
        waterIsMoving(device, this._preview) ||
        occupancyIsMoving(device, this._preview) ||
        weatherIsMoving(device, this._preview) ||
        lightingIsMoving(device, this._preview) ||
        parkingIsMoving(device, this._preview) ||
        treatmentIsMoving(device, this._preview))
    ) {
      this._preview = {
        ...this._preview,
        active: false,
        ...(isCleaning(device)
          ? { program: cleaningSuspend(this._preview) }
          : {}),
        ...(isAppliance(device) && this._preview.program === "running"
          ? { program: "paused" }
          : {}),
      };
    }
  }
  protected updated() {
    const device = catalogDevice(this.card?.deviceType);
    if (
      !device ||
      !this._preview ||
      !(
        cleaningIsMoving(device, this._preview) ||
        applianceIsMoving(device, this._preview) ||
        wellnessIsMoving(device, this._preview) ||
        valveIsMoving(device, this._preview) ||
        waterIsMoving(device, this._preview) ||
        occupancyIsMoving(device, this._preview) ||
        weatherIsMoving(device, this._preview) ||
        lightingIsMoving(device, this._preview) ||
        parkingIsMoving(device, this._preview) ||
        treatmentIsMoving(device, this._preview)
      ) ||
      this.card.entity ||
      this.disabled ||
      !this.isConnected
    ) {
      this._stopMotion();
      if (
        device &&
        this._preview &&
        this._preview.active &&
        (cleaningIsMoving(device, this._preview) ||
          applianceIsMoving(device, this._preview) ||
          wellnessIsMoving(device, this._preview) ||
          valveIsMoving(device, this._preview) ||
          waterIsMoving(device, this._preview) ||
          occupancyIsMoving(device, this._preview) ||
          weatherIsMoving(device, this._preview) ||
          lightingIsMoving(device, this._preview) ||
          parkingIsMoving(device, this._preview) ||
          treatmentIsMoving(device, this._preview)) &&
        (this.disabled || this.card.entity)
      ) {
        this._preview = {
          ...this._preview,
          active: false,
          ...(isCleaning(device)
            ? { program: cleaningSuspend(this._preview) }
            : {}),
          ...(isAppliance(device) && this._preview.program === "running"
            ? { program: "paused" }
            : {}),
        };
      }
      return;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      this._preview = isCleaning(device)
        ? advanceCleaningState(device, this._preview, 600000)
        : isAppliance(device)
          ? advanceApplianceState(device, this._preview, 600000)
          : isWellness(device)
            ? advanceWellnessState(device, this._preview, 600000)
            : isWeather(device)
              ? advanceWeatherState(device, this._preview, 600000)
              : isLighting(device)
                ? advanceLightingState(device, this._preview, 600000)
                : isOccupancy(device)
                  ? advanceOccupancyState(device, this._preview, 600000)
                  : isParking(device)
                    ? advanceParkingState(device, this._preview, 600000)
                    : isTreatment(device)
                      ? advanceTreatmentState(device, this._preview, 600000)
                      : isWaterDevice(device)
                        ? advanceWaterState(device, this._preview, 600000)
                        : {
                            ...this._preview,
                            position: this._preview.target,
                            open: this._preview.target > 0,
                            active: false,
                          };
      return;
    }
    if (this._motionFrame === undefined) {
      this._motionTime ??= performance.now();
      this._motionFrame = requestAnimationFrame(this._motionTick);
    }
  }
  private _motionTick = (now: number) => {
    this._motionFrame = undefined;
    const device = catalogDevice(this.card?.deviceType);
    if (
      !device ||
      !this._preview ||
      this.card.entity ||
      this.disabled ||
      !this.isConnected
    ) {
      this._stopMotion();
      return;
    }
    const elapsed = Math.max(0, now - (this._motionTime ?? now));
    this._motionTime = now;
    this._preview = isCleaning(device)
      ? advanceCleaningState(device, this._preview, elapsed)
      : isAppliance(device)
        ? advanceApplianceState(device, this._preview, elapsed)
        : isWellness(device)
          ? advanceWellnessState(device, this._preview, elapsed)
          : isWeather(device)
            ? advanceWeatherState(device, this._preview, elapsed)
            : isLighting(device)
              ? advanceLightingState(device, this._preview, elapsed)
              : isOccupancy(device)
                ? advanceOccupancyState(device, this._preview, elapsed)
                : isParking(device)
                  ? advanceParkingState(device, this._preview, elapsed)
                  : isTreatment(device)
                    ? advanceTreatmentState(device, this._preview, elapsed)
                    : isWaterDevice(device)
                      ? advanceWaterState(device, this._preview, elapsed)
                      : advanceValveState(device, this._preview, elapsed);
  };
  private _t = (key: DashboardTextKey) =>
    this.localize(`ui.panel.emad-dashboard.${key}`);
  protected willUpdate(changed: PropertyValues) {
    const d = catalogDevice(this.card?.deviceType);
    if (
      d &&
      (!this._preview ||
        (changed.has("card") &&
          (changed.get("card") as DashboardCard | undefined)?.deviceType !==
            this.card.deviceType))
    ) {
      this._preview = initialDeviceState(d);
    }
  }
  private _reset() {
    const d = catalogDevice(this.card.deviceType);
    if (d && !this.disabled && !this.card.entity) {
      this._preview = initialDeviceState(d);
    }
  }
  private _action(event: Event) {
    if (this.disabled || this.card.entity || !this._preview) return;
    const d = catalogDevice(this.card.deviceType);
    if (d) {
      this._preview = previewAction(
        this._preview,
        (event.currentTarget as HTMLElement).dataset.action as DeviceAction,
        d,
      );
    }
  }
  private _range(event: Event) {
    if (this.disabled || this.card.entity || !this._preview) return;
    const input = event.currentTarget as HTMLInputElement;
    const value = Math.max(
      Number(input.min),
      Math.min(Number(input.max), Number(input.value)),
    );
    if (Number.isFinite(value)) {
      const device = catalogDevice(this.card.deviceType);
      const valveState = device
        ? (cleaningRange(device, this._preview, input.dataset.field!, value) ??
          applianceRange(device, this._preview, input.dataset.field!, value) ??
          wellnessRange(device, this._preview, input.dataset.field!, value) ??
          weatherRange(device, this._preview, input.dataset.field!, value) ??
          lightingRange(device, this._preview, input.dataset.field!, value) ??
          parkingRange(device, this._preview, input.dataset.field!, value) ??
          treatmentRange(device, this._preview, input.dataset.field!, value) ??
          waterRange(device, this._preview, input.dataset.field!, value) ??
          valveRange(device, this._preview, input.dataset.field!, value))
        : undefined;
      this._preview = valveState ?? {
        ...this._preview,
        [input.dataset.field!]: value,
        ...(input.dataset.field === "position" ? { open: value > 0 } : {}),
      };
    }
  }
  private _choice(event: Event) {
    if (this.disabled || this.card.entity || !this._preview) return;
    const b = event.currentTarget as HTMLElement;
    const d = catalogDevice(this.card.deviceType);
    this._preview = (d
      ? (cleaningChoice(d, this._preview, b.dataset.field!, b.dataset.value!) ??
        applianceChoice(d, this._preview, b.dataset.field!, b.dataset.value!) ??
        wellnessChoice(d, this._preview, b.dataset.field!, b.dataset.value!) ??
        weatherChoice(d, this._preview, b.dataset.field!, b.dataset.value!) ??
        lightingChoice(d, this._preview, b.dataset.field!, b.dataset.value!) ??
        occupancyChoice(d, this._preview, b.dataset.field!, b.dataset.value!) ??
        waterChoice(d, this._preview, b.dataset.field!, b.dataset.value!))
      : undefined) ?? { ...this._preview, [b.dataset.field!]: b.dataset.value };
  }
  private _floor(event: Event) {
    if (!this.disabled && !this.card.entity && this._preview) {
      this._preview = {
        ...this._preview,
        floor: Number((event.currentTarget as HTMLElement).dataset.floor),
        active: true,
        open: false,
      };
    }
  }
  private _port(event: Event) {
    if (!this.disabled && !this.card.entity && this._preview) {
      const index = Number((event.currentTarget as HTMLElement).dataset.port);
      if (Number.isInteger(index) && index >= 0 && index < 16) {
        this._preview = {
          ...this._preview,
          channels:
            this._preview.channels +
            (Math.floor(this._preview.channels / 2 ** index) % 2
              ? -(2 ** index)
              : 2 ** index),
        };
      }
    }
  }
  private _color(event: Event) {
    if (!this.disabled && !this.card.entity && this._preview) {
      this._preview = {
        ...this._preview,
        color: (event.currentTarget as HTMLInputElement).value,
      };
    }
  }
  private _details() {
    if (this.entity) {
      fireEvent(this, "hass-more-info", { entityId: this.entity.entity_id });
    }
  }
  private _number(value: number) {
    return new Intl.NumberFormat(this.language, {
      maximumFractionDigits: 2,
    }).format(value);
  }
  private _metricValue(m: DeviceMetric) {
    return typeof m.value === "number"
      ? this._number(m.value)
      : m.value.startsWith("device_") || m.value.startsWith("catalog_")
        ? this._t(m.value as DashboardTextKey)
        : m.value;
  }
  private _actionLabel(action: DeviceAction): string {
    const device = catalogDevice(this.card.deviceType)!;
    const kind = physicalProfile(device).interaction;
    if (this._preview) {
      const specific =
        cleaningActionLabel(device, this._preview, action) ??
        applianceActionLabel(device, this._preview, action) ??
        wellnessActionLabel(device, action) ??
        weatherActionLabel(device, action) ??
        lightingActionLabel(device, this._preview, action);
      if (specific) return this._t(specific);
    }
    if (isOccupancy(device) && this._preview) {
      const label = occupancyActionLabel(device, this._preview, action);
      if (label) return this._t(label);
    }
    if (isParking(device) && this._preview) {
      const label = parkingActionLabel(device, action, this._preview);
      if (label) return this._t(label);
    }
    if (isTreatment(device)) {
      const label =
        action === "resume"
          ? "resume_cycle"
          : action === "flush"
            ? device.id === "water_softener"
              ? "regenerate"
              : device.id === "reverse_osmosis_unit"
                ? "run_flush"
                : "run_backwash"
            : action === "sample"
              ? "analyze_sample"
              : action === "alarm"
                ? "simulate_lamp_fault"
                : action === "restore"
                  ? "clear_fault"
                  : action === "stop" && this._preview?.program !== "service"
                    ? "end_cycle"
                    : undefined;
      if (label) {
        return this._t(`device_treatment_${label}` as DashboardTextKey);
      }
    }
    if (isWaterDevice(device)) {
      const waterLabel =
        action === "alarm"
          ? "simulate_wet"
          : action === "restore"
            ? "simulate_dry"
            : action === "sample"
              ? "flow_ten_seconds"
              : ["water_heater", "calorifier"].includes(device.id) &&
                  ["start", "stop"].includes(action)
                ? action === "start"
                  ? "enable_heat"
                  : "disable_heat"
                : undefined;
      if (waterLabel) {
        return this._t(`device_water_${waterLabel}` as DashboardTextKey);
      }
    }
    const valve = valveSpec(device);
    if (valve?.control === "binary" && ["open", "close"].includes(action)) {
      return this._t(
        action === "open" ? "device_valve_energize" : "device_valve_deenergize",
      );
    }
    if (valve?.control === "safety" && ["alarm", "restore"].includes(action)) {
      return this._t(
        action === "alarm"
          ? "device_valve_simulate_trip"
          : "device_valve_reset_latch",
      );
    }
    if (valve?.control === "safety" && action === "resume") {
      return this._t("device_valve_resume_closure");
    }
    if (valve?.body === "backflow" && action === "alarm") {
      return this._t("device_valve_simulate_reverse");
    }
    const special = (key: string) =>
      this._t(`device_${key}` as DashboardTextKey);
    if (
      ["room_booking_panel", "room_availability_display"].includes(device.id)
    ) {
      return special(action === "open" ? "reserve_room" : "release_room");
    }
    if (device.id === "queue_management_terminal" && action === "sample") {
      return special("next_ticket");
    }
    if (
      ["visitor_kiosk", "visitor_management_terminal"].includes(device.id) &&
      action === "test"
    ) {
      return special("check_in");
    }
    if (kind === "light" && ["start", "stop"].includes(action)) {
      return this._t(action === "start" ? "turn_on" : "turn_off");
    }
    if (
      ["media", "display", "projector"].includes(kind) &&
      ["start", "stop"].includes(action)
    ) {
      return this._t(action === "start" ? "play" : "pause");
    }
    if (kind === "bin" && ["open", "close"].includes(action)) {
      return special(action === "open" ? "open_lid" : "close_lid");
    }
    return this._t(actionTextKey(action));
  }
  private _control(c: DeviceControl) {
    const s = this._preview!;
    switch (c.kind) {
      case "note":
        return html`<p class="control-note">${this._t(c.label)}</p>`;
      case "range":
        return html`<label class="range-control"
          ><span>${this._t(c.label)}</span
          ><b><bdi>${this._number(s[c.field])} ${c.unit}</bdi></b
          ><input
            type="range"
            aria-label=${this._t(c.label)}
            min=${c.min}
            max=${c.max}
            step=${c.step}
            .value=${String(s[c.field])}
            data-field=${c.field}
            ?disabled=${this.disabled || cleaningControlDisabled(catalogDevice(this.card.deviceType)!, s, c.field) || (isAppliance(catalogDevice(this.card.deviceType)!) && s.program === "running" && c.field === "level")}
            @input=${this._range}
        /></label>`;
      case "choices":
        return html`<div>
          <span class="control-label">${this._t(c.label)}</span>
          <div class="choices" role="group" aria-label=${this._t(c.label)}>
            ${c.options.map((o) => html`<button class=${s[c.field] === o ? "selected" : ""} aria-pressed=${s[c.field] === o ? "true" : "false"} data-field=${c.field} data-value=${o} ?disabled=${this.disabled || cleaningControlDisabled(catalogDevice(this.card.deviceType)!, s, c.field) || (isAppliance(catalogDevice(this.card.deviceType)!) && s.program === "running" && c.field !== "period")} @click=${this._choice}>${this._t(optionTextKey(o))}</button>`)}
          </div>
        </div>`;
      case "actions":
        return html`<div class="device-actions">
          ${c.actions.map((a) => html`<button class="action action-${a}" data-action=${a} ?disabled=${this.disabled || cleaningActionDisabled(catalogDevice(this.card.deviceType)!, s, a) || applianceActionDisabled(catalogDevice(this.card.deviceType)!, s, a) || wellnessActionDisabled(catalogDevice(this.card.deviceType)!, s, a) || occupancyActionDisabled(catalogDevice(this.card.deviceType)!, s, a) || (a === "pause" && isParking(catalogDevice(this.card.deviceType)!) && !parkingIsMoving(catalogDevice(this.card.deviceType)!, s)) || (a === "pause" && !!valveSpec(catalogDevice(this.card.deviceType)!) && !valveIsMoving(catalogDevice(this.card.deviceType)!, s))} @click=${this._action}>${this._actionLabel(a)}</button>`)}
        </div>`;
      case "color":
        return html`<div>
          <span class="control-label">${this._t("device_color")}</span>
          <div class="colors">
            ${["#efbf5b", "#f5f1e5", "#7ab4df", "#76c7a0", "#e57f73", "#b19ad8"].map((color) => html`<label class="swatch" style=${styleMap({ background: color })}><input type="radio" name=${this.card.id + "-color"} aria-label=${`${this._t("device_color")} ${color}`} .value=${color} .checked=${s.color === color} ?disabled=${this.disabled} @change=${this._color} /></label>`)}<input
              type="color"
              aria-label=${this._t("custom_color")}
              .value=${s.color}
              ?disabled=${this.disabled}
              @input=${this._color}
            />
          </div>
        </div>`;
      case "floors":
        return html`<div>
          <span class="control-label">${this._t("device_floor_select")}</span>
          <div
            class="floors"
            role="group"
            aria-label=${this._t("device_floor_select")}
          >
            ${Array.from({ length: c.max }, (_, i) => html`<button aria-pressed=${s.floor === i + 1 ? "true" : "false"} class=${s.floor === i + 1 ? "selected" : ""} data-floor=${i + 1} ?disabled=${this.disabled} @click=${this._floor}>${this._number(i + 1)}</button>`)}
          </div>
        </div>`;
      case "ports":
        return html`<div>
          <span class="control-label">${this._t("device_channels")}</span>
          <div class="port-map">
            ${Array.from({ length: c.count }, (_, i) => (c.interactive ? html`<button class="port-state ${Math.floor(s.channels / 2 ** i) % 2 ? "up" : ""}" aria-label=${`${this._t("device_channel")} ${this._number(i + 1)}`} aria-pressed=${Math.floor(s.channels / 2 ** i) % 2 ? "true" : "false"} data-port=${i} ?disabled=${this.disabled} @click=${this._port}><i></i>${this._number(i + 1)}</button>` : html`<span class="port-state ${Math.floor(s.channels / 2 ** i) % 2 ? "up" : ""}"><i></i>${this._number(i + 1)}</span>`))}
          </div>
        </div>`;
    }
    return nothing;
  }
  private _chart() {
    const s = this._preview!;
    const seed = s.period === "week" ? 3 : s.period === "hour" ? 1 : 2;
    const points = Array.from(
      { length: 24 },
      (_, i) =>
        `${i * 10},${24 - Math.sin(i * 0.48 + seed) * 10 - Math.cos(i * 0.91) * 5 - (s.value % 7)}`,
    ).join(" ");
    return html`<div
      class="history-chart"
      aria-label=${this._t("device_history")}
    >
      ${svg`<svg viewBox="0 0 230 48" aria-hidden="true"><path class="chart-grid" d="M0 12h230M0 26h230M0 40h230"/><polyline class="chart-line" points=${points}/></svg>`}<span
        >${this._t(optionTextKey(s.period))}</span
      >
    </div>`;
  }
  protected render() {
    const d = catalogDevice(this.card?.deviceType);
    if (!d || !this._preview) return nothing;
    const profile = physicalProfile(d);
    const model = deviceInterface(d, this._preview);
    const bound = !!this.card.entity || !!this.card.deviceId;
    const baseVisual = occupancyVisualState(
      d,
      parkingVisualState(
        d,
        treatmentVisualState(
          d,
          waterVisualState(
            d,
            bound ? entityVisual(this.entity) : previewVisual(this._preview),
            bound ? undefined : this._preview,
            this.entity,
          ),
          bound ? undefined : this._preview,
          this.entity,
        ),
        bound ? undefined : this._preview,
        this.entity,
      ),
      bound ? undefined : this._preview,
      this.entity,
    );
    const wellnessVisual = wellnessVisualState(
      d,
      weatherVisualState(
        d,
        lightingVisualState(
          d,
          baseVisual,
          bound ? undefined : this._preview,
          this.entity,
        ),
        bound ? undefined : this._preview,
        this.entity,
      ),
      bound ? undefined : this._preview,
      this.entity,
    );
    const applianceVisual = applianceVisualState(
      d,
      wellnessVisual,
      bound ? undefined : this._preview,
      this.entity,
    );
    const visual = cleaningVisualState(
      d,
      applianceVisual,
      bound ? undefined : this._preview,
      this.entity,
    );
    const valve = valveSpec(d);
    const safety =
      ["fire", "medical", "elevator"].includes(profile.interaction) ||
      d.family === "safety";
    const accent = visual.alert
      ? "#d46750"
      : d.family === "light"
        ? "#b68a2d"
        : ["climate", "plant"].includes(d.family)
          ? this._preview.mode === "heat"
            ? "#c67b55"
            : "#508baf"
          : ["tank", "pump", "valve", "quality"].includes(d.family)
            ? "#389caa"
            : "#409778";
    let primary: DeviceMetric = bound
      ? {
          label: "catalog_connected",
          value: this.entity
            ? this.formatState(this.entity)
            : this._t("missing"),
          unit: "",
        }
      : model.primary;
    if (
      bound &&
      (isWaterDevice(d) || isTreatment(d)) &&
      this.entity &&
      this.entity.state.trim() &&
      Number.isFinite(Number(this.entity.state)) &&
      typeof this.entity.attributes.unit_of_measurement === "string"
    ) {
      primary = {
        label: "catalog_connected",
        value: Number(this.entity.state),
        unit: this.entity.attributes.unit_of_measurement,
      };
    }
    if (
      bound &&
      isTreatment(d) &&
      TREATMENT_SENSORS[d.id] &&
      visual.hasTelemetry
    ) {
      primary = {
        label: "catalog_reading",
        value: visual.value,
        unit: visual.valueUnit ?? (d.id === "ph_sensor" ? "pH" : ""),
      };
    }
    if (bound && valve && this.entity) {
      if (
        visual.hasPosition &&
        ["position", "manual"].includes(valve.control)
      ) {
        primary = {
          label: "device_valve_feedback",
          value: visual.position,
          unit: "%",
        };
      } else if (
        Number.isFinite(Number(this.entity.state)) &&
        typeof this.entity.attributes.unit_of_measurement === "string"
      ) {
        primary = {
          label:
            valve.control === "pressure"
              ? "device_outlet_pressure"
              : valve.control === "temperature"
                ? "device_valve_mixed_temperature"
                : "catalog_connected",
          value: Number(this.entity.state),
          unit: this.entity.attributes.unit_of_measurement,
        };
      }
    }
    const actual: DeviceMetric[] = [];
    if (
      bound &&
      this.entity &&
      !isCleaning(d) &&
      !isAppliance(d) &&
      !isWellness(d) &&
      !isTreatment(d) &&
      !isParking(d) &&
      !isOccupancy(d) &&
      !isWeather(d) &&
      !isLighting(d)
    ) {
      for (const [attribute, key, unit] of [
        ["current_temperature", "device_temperature", this.temperatureUnit],
        ["current_position", "device_position", "%"],
        ["target_position", "device_valve_requested", "%"],
        ["battery_level", "device_battery", "%"],
        ["percentage", "device_speed", "%"],
      ] as const) {
        if (
          attribute === "current_position" &&
          valve &&
          visual.hasPosition &&
          primary.unit === "%"
        ) {
          continue;
        }
        const value = this.entity.attributes[attribute];
        if (typeof value === "number") actual.push({ label: key, value, unit });
      }
    }
    if (bound && isTreatment(d) && this.entity && isAvailable(this.entity)) {
      const a = this.entity.attributes;
      if (visual.flow !== undefined) {
        actual.push({
          label: "device_treatment_feed_flow",
          value: visual.flow,
          unit: "m³/h",
        });
      }
      for (const [attribute, label] of [
        ["permeate_flow", "device_treatment_permeate_flow"],
        ["concentrate_flow", "device_treatment_concentrate_flow"],
      ] as const) {
        if (
          a.flow_unit === "m³/h" &&
          typeof a[attribute] === "number" &&
          Number.isFinite(a[attribute])
        ) {
          actual.push({ label, value: a[attribute], unit: "m³/h" });
        }
      }
      if (visual.pressure !== undefined) {
        actual.push({
          label: "device_treatment_differential_pressure",
          value: visual.pressure,
          unit: "bar",
        });
      }
      if (d.id === "uv_disinfection_unit") {
        for (const [attribute, label, unit] of [
          ["lamp_hours", "device_treatment_lamp_hours", "h"],
          ["uv_intensity", "device_treatment_uv_signal", "%"],
        ] as const) {
          if (
            typeof a[attribute] === "number" &&
            Number.isFinite(a[attribute])
          ) {
            actual.push({ label, value: a[attribute], unit });
          }
        }
      }
      if (visual.deliveryRate !== undefined) {
        primary = {
          label:
            d.id === "ozone_generator"
              ? "device_treatment_ozone_output"
              : "device_treatment_delivery_rate",
          value: visual.deliveryRate,
          unit: d.id === "ozone_generator" ? "g/h" : "L/h",
        };
      }
    }
    if (bound && isParking(d) && this.entity && isAvailable(this.entity)) {
      if (visual.hasPosition) {
        primary = {
          label: "device_parking_passage_opening",
          value: visual.position,
          unit: "%",
        };
      }
      if (
        ["parking_guidance_controller", "parking_guidance_sign"].includes(
          d.id,
        ) &&
        visual.hasTelemetry
      ) {
        primary = {
          label: "device_parking_free_spaces",
          value: visual.level,
          unit: "",
        };
        actual.push({
          label: "device_parking_capacity",
          value: visual.value,
          unit: "",
        });
      }
      if (
        [
          "parking_occupancy_sensor",
          "inductive_loop_detector",
          "vehicle_radar",
          "parking_space_indicator",
        ].includes(d.id) &&
        visual.mode !== "unknown"
      ) {
        primary = {
          label: "device_parking_bay_state",
          value: `device_option_${visual.mode}`,
          unit: "",
        };
      }
    }
    if (bound && isOccupancy(d)) {
      const reported = occupancyLive(d, this.entity);
      if (reported.primary) primary = reported.primary;
      actual.push(...reported.metrics);
    }
    if (bound && (isWeather(d) || isLighting(d))) {
      const reported = isWeather(d)
        ? weatherLive(d, this.entity)
        : lightingLive(d, this.entity);
      primary = reported.primary;
      actual.push(...reported.metrics);
    }
    const cleaningReported =
      isCleaning(d) && bound ? cleaningLive(d, this.entity) : undefined;
    if (cleaningReported) {
      primary = cleaningReported.primary;
      actual.push(...cleaningReported.metrics);
    }
    const applianceReported =
      isAppliance(d) && bound ? applianceLive(d, this.entity) : undefined;
    if (applianceReported) {
      primary = applianceReported.primary;
      actual.push(...applianceReported.metrics);
    }
    const wellnessReported =
      isWellness(d) && bound ? wellnessLive(d, this.entity) : undefined;
    if (wellnessReported) {
      primary = wellnessReported.primary;
      actual.push(...wellnessReported.metrics);
    }
    const streetStatus =
      d.id === "streetlight" && bound
        ? this.entity?.state === "unavailable"
          ? "unavailable"
          : lightingLive(d, this.entity).status
        : undefined;
    const metrics = bound
      ? actual
      : model.metrics.filter((m) => m.label !== model.primary.label);
    return html`<article
      class="device-element ${bound ? "live" : "example"}"
      data-device-type=${d.id}
      data-category=${d.category}
      data-interaction=${profile.interaction}
      style=${styleMap({ "--device-accent": accent })}
      aria-busy=${this.busy}
      tabindex="0"
      role="region"
      aria-label=${this.card.title || this._t(deviceNameKey(d))}
    >
      <header>
        <div>
          <p class="category">${this._t(categoryNameKey(d.category))}</p>
          <h3>${this.card.title || this._t(deviceNameKey(d))}</h3>
        </div>
        <span class="status"
          ><i></i
          >${cleaningReported ? this._t(cleaningReported.status) : applianceReported ? this._t(applianceReported.status) : wellnessReported ? this._t(wellnessReported.status) : streetStatus ? this._t(streetStatus) : bound ? this._t(isAvailable(this.entity) ? "online" : "unavailable") : this._t(model.status)}</span
        >
      </header>
      ${bound && this.entity && isAvailable(this.entity) ? html`<p class="control-note bound-entity-state"><bdi>${this.localize("ui.panel.emad-dashboard.ha_primary_reading", { name: this.entity.attributes.friendly_name || this.entity.entity_id, state: this.formatState(this.entity) })}</bdi></p>` : nothing}
      <div class="card-content">
        <div class="card-summary">
          <div class="visual-stage">
            ${catalogVisual(d, visual, this.card.id)}
            <div class="primary-reading">
              <span>${this._t(primary.label)}</span
              ><strong
                ><bdi>${this._metricValue(primary)}</bdi
                ><small>${primary.unit}</small></strong
              >
            </div>
          </div>
          ${
            metrics.length
              ? html`<div class="metric-grid">
                  ${metrics.map(
                    (m) =>
                      html`<div>
                        <span>${this._t(m.label)}</span
                        ><b><bdi>${this._metricValue(m)} ${m.unit}</bdi></b>
                      </div>`,
                  )}
                </div>`
              : nothing
          }
        </div>
        <div class="card-controls">
          ${
            bound
              ? html`${!this.entity ? html`<p class="missing" role="status">${this._t("catalog_missing")}</p>` : nothing}<emad-ui-device
                    controls-only
                    .cameraHass=${this.cameraHass}
                    .card=${this.card}
                    .entity=${this.entity}
                    .localize=${this.localize}
                    .formatState=${this.formatState}
                    .language=${this.language}
                    .services=${this.services}
                    .temperatureUnit=${this.temperatureUnit}
                    .disabled=${this.disabled || supervisoryDevice(d) || (!this.card.deviceId && ((!!this.entity && !counterpartEntity(d, this.entity)) || safety || (isCleaning(d) && !cleaningRemote(d, this.entity)) || (isAppliance(d) && !applianceRemote(d, this.entity)) || (isWellness(d) && ["pool_filter", "pool_level_sensor", "pool_chlorinator", "pool_dosing_controller"].includes(d.id)) || isOccupancy(d) || isWeather(d) || (isLighting(d) && (!lightingRemote(d) || !/^(light|switch)\./.test(this.entity?.entity_id ?? ""))) || (valve !== undefined && !valve.remote) || (isWaterDevice(d) && !waterRemote(d)) || (isTreatment(d) && !treatmentRemote(d)) || (isParking(d) && (!parkingRemote(d) || !this.entity?.entity_id.startsWith("cover.")))))}
                    .busy=${this.busy}
                    .error=${this.error}
                  ></emad-ui-device>`
              : html`<div
                    class="specific-controls"
                    aria-label=${this._t("device_example_controls")}
                  >
                    ${model.controls.map((c) => this._control(c))}
                  </div>
                  ${model.chart ? this._chart() : nothing}`
          }
        </div>
      </div>
      ${bound && !this.card.deviceId && this.entity && !counterpartEntity(d, this.entity) ? html`<p class="control-note" role="status">${this._t("ha_incompatible_entity")}</p>` : nothing}
      ${
        this.card.deviceId
          ? html`<emad-ui-device-entities
              .card=${this.card}
              .entities=${this.relatedEntities}
              .services=${this.services}
              .temperatureUnit=${this.temperatureUnit}
              .language=${this.language}
              .localize=${this.localize}
              .formatState=${this.formatState}
              .disabled=${this.disabled}
              .readOnly=${supervisoryDevice(d)}
              .busy=${this.relatedBusy}
              .errors=${this.relatedErrors}
            ></emad-ui-device-entities>`
          : nothing
      }
      <footer>
        <span class="example-badge"
          >${this._t(bound ? "catalog_connected" : "catalog_example")}</span
        >${bound ? html`<button ?disabled=${!this.entity} @click=${this._details}>${this._t("details")} ↗</button>` : html`<button class="reset" ?disabled=${this.disabled} @click=${this._reset}>${this._t("catalog_reset")}</button>`}
      </footer>
      ${!bound ? html`<p class="example-hint">${this._t(safety ? "catalog_safety_note" : "catalog_demo_hint")}</p>` : nothing}
    </article>`;
  }
  static styles = [
    css`
      :host {
        box-sizing: border-box;
        display: block;
        position: relative;
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        margin: 1px;
        clip-path: var(--emad-shape, none);
        background: var(--card-background-color, #fff);
        min-width: 0;
        color: var(--primary-text-color, #20352b);
        --device-accent: #409778;
      }
      * {
        box-sizing: border-box;
      }
      .device-element {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 22px 22px 14px;
        overflow: auto;
        scrollbar-width: thin;
      }
      header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      header > div {
        min-width: 0;
      }
      .category {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        line-height: 1.5;
        color: var(--secondary-text-color, #6b7c72);
        margin: 0;
      }
      h3 {
        font-size: 17px;
        line-height: 1.3;
        letter-spacing: -0.3px;
        margin: 6px 0 0;
        font-weight: 600;
        overflow-wrap: anywhere;
      }
      .control-note {
        font-size: 9px;
        line-height: 1.5;
        color: var(--secondary-text-color);
        margin: 2px 0;
      }
      .status {
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 9px;
        padding-top: 3px;
        color: var(--secondary-text-color);
      }
      .status i {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--device-accent);
      }
      .visual-stage {
        position: relative;
        min-height: 185px;
        flex-shrink: 0;
        background: radial-gradient(
          ellipse at 50% 83%,
          color-mix(in srgb, var(--device-accent) 7%, transparent),
          transparent 67%
        );
        border-bottom: 1px solid var(--divider-color, #e4eae5);
        margin-inline: -7px;
      }
      .primary-reading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 10px;
        position: relative;
        margin: -4px 7px 12px;
      }
      .primary-reading > span {
        font-size: 10px;
        color: var(--secondary-text-color);
      }
      .primary-reading strong {
        font-size: 26px;
        font-weight: 500;
        letter-spacing: -1px;
        line-height: 1.1;
        max-width: 70%;
        overflow-wrap: anywhere;
      }
      .primary-reading strong small {
        font-size: 11px;
        color: var(--secondary-text-color);
        letter-spacing: 0;
        margin-inline-start: 4px;
      }
      .metric-grid {
        flex-shrink: 0;
        display: flex;
        gap: 8px;
      }
      .metric-grid > div {
        flex: 1;
        min-width: 0;
        padding: 9px 10px;
        border: 1px solid var(--divider-color, #e4eae5);
        border-radius: 7px 2px 7px 2px;
        background: color-mix(
          in srgb,
          var(--device-accent) 3%,
          var(--card-background-color, #fff)
        );
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .metric-grid span,
      .control-label {
        font-size: 9px;
        color: var(--secondary-text-color);
        line-height: 1.3;
      }
      .metric-grid b {
        font-size: 12px;
        font-weight: 500;
        overflow-wrap: anywhere;
      }
      .specific-controls {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .range-control {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 6px;
        font-size: 10px;
        color: var(--secondary-text-color);
      }
      .range-control b {
        font-size: 11px;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      input[type="range"] {
        grid-column: 1/-1;
        width: 100%;
        min-height: 24px;
        margin: 0;
        accent-color: var(--device-accent);
        cursor: pointer;
      }
      .control-label {
        display: block;
        margin-bottom: 7px;
      }
      .choices {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }
      .choices button {
        flex: 1;
        min-width: 40px;
        min-height: 30px;
        padding: 5px 7px;
        font-size: 9px;
      }
      .selected {
        background: color-mix(
          in srgb,
          var(--device-accent) 16%,
          var(--card-background-color)
        );
        border-color: var(--device-accent);
        color: var(--primary-text-color);
      }
      button {
        font: inherit;
        font-size: 11px;
        min-height: 36px;
        border: 1px solid var(--divider-color, #dce5df);
        border-radius: 6px 2px 6px 2px;
        background: var(--card-background-color, #fff);
        color: inherit;
        padding: 7px 12px;
        cursor: pointer;
        transition:
          background 0.16s,
          transform 0.16s;
      }
      button:hover {
        background: color-mix(
          in srgb,
          var(--device-accent) 10%,
          var(--card-background-color)
        );
        transform: translateY(-1px);
      }
      button:active {
        transform: translateY(1px);
      }
      button:disabled,
      input:disabled {
        opacity: 0.45;
        cursor: default;
        transform: none;
      }
      button:focus-visible,
      input:focus-visible {
        outline: 3px solid var(--device-accent);
        outline-offset: 3px;
      }
      .device-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }
      .action {
        flex: 1;
        min-width: 64px;
      }
      .action-start,
      .action-open,
      .action-brew,
      .action-dispense,
      .action-flush {
        background: color-mix(
          in srgb,
          var(--device-accent) 12%,
          var(--card-background-color)
        );
        border-color: color-mix(
          in srgb,
          var(--device-accent) 45%,
          var(--divider-color)
        );
      }
      .action-alarm {
        color: var(--error-color, #bc644e);
      }
      .colors {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .swatch {
        width: 23px;
        height: 23px;
        border-radius: 50%;
        display: block;
        border: 1px solid #0002;
        position: relative;
      }
      .swatch input {
        appearance: none;
        margin: 0;
        inset: -4px;
        position: absolute;
        border: 1px solid transparent;
        border-radius: 50%;
        cursor: pointer;
      }
      .swatch input:checked {
        border-color: var(--device-accent);
        box-shadow: 0 0 0 2px var(--card-background-color);
      }
      input[type="color"] {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
      }
      .floors {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 5px;
      }
      .floors button {
        min-width: 0;
        padding: 5px;
        min-height: 30px;
      }
      .port-map {
        display: flex;
        gap: 6px;
      }
      .port-state {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        height: 27px;
        border: 1px solid var(--divider-color);
        border-radius: 3px;
        background: var(--primary-background-color);
        font-size: 9px;
        position: relative;
      }
      .port-state i {
        position: absolute;
        top: 3px;
        inset-inline-end: 3px;
        width: 3px;
        height: 3px;
        background: var(--disabled-text-color);
        border-radius: 50%;
      }
      .port-state.up i {
        background: var(--device-accent);
        box-shadow: 0 0 5px var(--device-accent);
      }
      .history-chart {
        position: relative;
        padding: 1px 0 6px;
        min-height: 48px;
      }
      .history-chart svg {
        display: block;
        width: 100%;
        height: 43px;
      }
      .chart-grid {
        fill: none;
        stroke: var(--divider-color);
        stroke-width: 0.7;
      }
      .chart-line {
        fill: none;
        stroke: var(--device-accent);
        stroke-width: 1.6;
      }
      .history-chart span {
        position: absolute;
        bottom: 0;
        inset-inline-end: 0;
        font-size: 8px;
        color: var(--secondary-text-color);
      }
      footer {
        margin-top: auto;
        border-top: 1px solid var(--divider-color, #e4eae5);
        padding-top: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .example-badge {
        font-size: 8px;
        color: var(--secondary-text-color);
        border: 1px dashed var(--divider-color);
        padding: 3px 5px;
      }
      footer button {
        border: 0;
        background: transparent;
        min-height: 25px;
        padding: 3px;
        font-size: 9px;
        color: var(--secondary-text-color);
      }
      .example-hint {
        font-size: 8px;
        line-height: 1.4;
        color: var(--secondary-text-color);
        margin: -6px 0 0;
      }
      .missing {
        font-size: 11px;
        line-height: 1.5;
        color: var(--warning-color);
      }
      emad-ui-device {
        height: auto;
        min-height: 0;
      }
      .telemetry-unknown .gauge-needle,
      .telemetry-unknown .iso-liquid,
      .telemetry-unknown .iso-water-surface,
      .telemetry-unknown .water-ripple,
      .telemetry-unknown .numeric-display .screen-label {
        display: none;
      }
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `,
    physicalDeviceStyles,
    physicalWaterStyles,
    physicalTreatmentStyles,
    physicalParkingStyles,
    physicalOccupancyStyles,
    physicalWeatherStyles,
    physicalLightingStyles,
    physicalStreetExitStyles,
    physicalCleaningStyles,
    physicalApplianceRealismStyles,
    physicalWellnessStyles,
    responsiveControlStyles,
    responsiveCatalogStyles,
  ];
}
declare global {
  interface HTMLElementTagNameMap {
    "emad-ui-catalog-device": EmadDashboardCatalogDevice;
  }
}
