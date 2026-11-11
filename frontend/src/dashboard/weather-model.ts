import type { HassEntity } from "home-assistant-js-websocket";
import type { CatalogDevice } from "./device-catalog";
import type { DashboardTextKey } from "./dashboard-model";
import type {
  DeviceAction,
  DeviceControl,
  DeviceInterface,
  DeviceMetric,
  DevicePreviewState,
} from "./device-interface";
import type { DeviceVisualState } from "./device-visual-state";

export const WEATHER_DEVICES = [
  "weather_station",
  "weather_temperature_sensor",
  "weather_humidity_sensor",
  "barometer",
  "anemometer",
  "wind_direction_sensor",
  "rain_sensor",
  "rain_gauge",
  "solar_irradiance_sensor",
  "uv_sensor",
  "lightning_detector",
  "frost_sensor",
  "snow_sensor",
  "flood_sensor",
  "roof_drain_monitor",
] as const;
export const isWeather = (d: CatalogDevice) => d.category === "weather";
const k = (s: string) => `device_weather_${s}` as DashboardTextKey;
const metric = (
  s: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: k(s), value, unit });
const wind = (d: CatalogDevice) =>
  ["anemometer", "weather_station"].includes(d.id);
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export const weatherSpec = (
  d: CatalogDevice,
): {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  step: number;
} => {
  if (wind(d)) {
    return {
      label: "wind_speed",
      unit: "m/s",
      min: 0,
      max: 30,
      value: 0,
      step: 0.1,
    };
  }
  switch (d.id) {
    case "weather_temperature_sensor":
      return {
        label: "temperature",
        unit: "°C",
        min: -30,
        max: 55,
        value: 23.8,
        step: 0.1,
      };
    case "weather_humidity_sensor":
      return {
        label: "humidity",
        unit: "%",
        min: 0,
        max: 100,
        value: 46,
        step: 1,
      };
    case "barometer":
      return {
        label: "pressure",
        unit: "hPa",
        min: 800,
        max: 1100,
        value: 1013,
        step: 1,
      };
    case "wind_direction_sensor":
      return {
        label: "bearing",
        unit: "°",
        min: 0,
        max: 359,
        value: 0,
        step: 1,
      };
    case "rain_gauge":
      return {
        label: "rainfall",
        unit: "mm",
        min: 0,
        max: 200,
        value: 0,
        step: 0.2,
      };
    case "solar_irradiance_sensor":
      return {
        label: "irradiance",
        unit: "W/m²",
        min: 0,
        max: 1400,
        value: 620,
        step: 10,
      };
    case "uv_sensor":
      return {
        label: "uv_index",
        unit: "UVI",
        min: 0,
        max: 15,
        value: 3.2,
        step: 0.1,
      };
    case "lightning_detector":
      return {
        label: "events",
        unit: "",
        min: 0,
        max: 10000,
        value: 0,
        step: 1,
      };
    case "frost_sensor":
      return {
        label: "surface_temperature",
        unit: "°C",
        min: -20,
        max: 20,
        value: 2,
        step: 0.1,
      };
    case "snow_sensor":
      return {
        label: "snow_depth",
        unit: "mm",
        min: 0,
        max: 500,
        value: 0,
        step: 5,
      };
    default:
      return {
        label: "water_depth",
        unit: "mm",
        min: 0,
        max: 100,
        value: 0,
        step: 1,
      };
  }
};
export function initialWeatherState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isWeather(d)) return s;
  const value = weatherSpec(d).value;
  return {
    ...s,
    value,
    target: value,
    level: 0,
    position: 0,
    pan: 0,
    tilt: 0,
    channels: 0,
    active: false,
    alert: false,
    progress: 100,
    program: "idle",
    mode: d.id === "roof_drain_monitor" ? "weather_clear_drain" : "weather_dry",
  };
}
export const weatherIsMoving = (d: CatalogDevice, s: DevicePreviewState) =>
  isWeather(d) && s.active;
export function weatherRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  n: number,
): DevicePreviewState | undefined {
  if (!isWeather(d)) return undefined;
  if (!Number.isFinite(n)) return s;
  if (field === "tilt" && d.id === "wind_direction_sensor") {
    return { ...s, tilt: clamp(n, 0, 359), active: true };
  }
  if (field !== "target") return s;
  const spec = weatherSpec(d);
  return {
    ...s,
    target: clamp(n, spec.min, spec.max),
    active: true,
    program: "adjust",
    progress: 100,
  };
}
export function weatherChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: string,
): DevicePreviewState | undefined {
  if (!isWeather(d)) return undefined;
  const valid =
    d.id === "roof_drain_monitor"
      ? ["weather_clear_drain", "weather_restricted_drain"]
      : ["weather_dry", "weather_frosted"];
  if (field !== "mode" || !valid.includes(value)) return s;
  return {
    ...s,
    mode: value,
    active: d.id === "roof_drain_monitor" ? s.value > 0 : s.active,
  };
}
export function weatherAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isWeather(d)) return undefined;
  if (a === "pause") return { ...s, active: false };
  if (a === "resume") return { ...s, active: true };
  if (wind(d) && a === "stop") {
    return { ...s, target: 0, active: s.value > 0, program: "adjust" };
  }
  if (a === "stop" || a === "restore") {
    return {
      ...initialWeatherState(d, s),
      ...(wind(d) ? { value: 0, target: 0 } : {}),
      mode:
        d.id === "roof_drain_monitor" ? "weather_clear_drain" : "weather_dry",
    };
  }
  if (a !== "sample" || s.active) return s;
  if (wind(d)) return { ...s, target: 8, active: true };
  if (
    d.id === "rain_sensor" ||
    d.id === "rain_gauge" ||
    d.id === "lightning_detector"
  ) {
    return {
      ...s,
      program:
        d.id === "rain_gauge"
          ? "tip"
          : d.id === "rain_sensor"
            ? "shower"
            : "event",
      progress: 0,
      active: true,
    };
  }
  return s;
}
export function advanceWeatherState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!weatherIsMoving(d, s) || !Number.isFinite(elapsed) || elapsed < 0) {
    return s;
  }
  // A zero-length first frame must still schedule the next Lit update.
  if (elapsed === 0) return { ...s };
  const settle = elapsed >= 600000;
  const dt = elapsed / 1000;
  let value = s.value;
  const step = Math.max(
    0.1,
    ((weatherSpec(d).max - weatherSpec(d).min) * dt) / 1.2,
  );
  value =
    Math.abs(s.target - value) <= step
      ? s.target
      : value + Math.sign(s.target - value) * step;
  let pan = s.pan;
  const delta = ((s.tilt - pan + 540) % 360) - 180;
  pan =
    Math.abs(delta) <= dt * 100
      ? s.tilt
      : (pan + Math.sign(delta) * dt * 100 + 360) % 360;
  if (settle) {
    value = s.target;
    pan = s.tilt;
  }
  let progress = s.progress;
  let channels = s.channels;
  let program = s.program;
  let mode = s.mode;
  if (s.progress < 100) {
    progress = Math.min(
      100,
      s.progress +
        elapsed /
          (d.id === "rain_sensor" ? 35 : d.id === "rain_gauge" ? 14 : 8),
    );
    if (progress === 100) {
      if (program === "tip") {
        channels++;
        value = Number((channels * 0.2).toFixed(1));
      }
      if (program === "event") channels++;
      if (program === "shower") mode = "weather_wet";
      program = "idle";
    }
  }
  let target = s.target;
  if (d.id === "rain_gauge" && progress === 100) target = value;
  if (
    d.id === "roof_drain_monitor" &&
    value === target &&
    mode === "weather_clear_drain"
  ) {
    target = 0;
    value = Math.max(0, value - dt * 10);
  }
  const level =
    d.id === "flood_sensor"
      ? value >= 20
        ? 1
        : value <= 10
          ? 0
          : s.level
      : s.level;
  const position = wind(d) ? (s.position + value * dt * 35) % 360 : s.position;
  const active =
    !settle &&
    (wind(d)
      ? value > 0 || target > 0
      : value !== target ||
        Math.abs(((s.tilt - pan + 540) % 360) - 180) > 0.01 ||
        progress < 100);
  return {
    ...s,
    value,
    target,
    pan,
    position,
    progress,
    channels,
    program,
    mode,
    level,
    active,
  };
}
export function weatherActionLabel(
  d: CatalogDevice,
  a: DeviceAction,
): DashboardTextKey | undefined {
  if (!isWeather(d)) return undefined;
  return k(
    a === "pause"
      ? "pause"
      : a === "resume"
        ? "resume"
        : a === "sample"
          ? wind(d)
            ? "wind_example"
            : d.id === "rain_gauge"
              ? "tip_bucket"
              : d.id === "rain_sensor"
                ? "shower"
                : "event_example"
          : wind(d)
            ? "calm"
            : "clear_example",
  );
}
export function weatherInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isWeather(d)) return undefined;
  const spec = weatherSpec(d);
  let primary = metric(
    spec.label,
    d.id === "wind_direction_sensor"
      ? s.pan
      : d.id === "lightning_detector"
        ? s.channels
        : s.value,
    spec.unit,
  );
  const controls: DeviceControl[] = [];
  const metrics: DeviceMetric[] = [];
  if (d.id === "rain_sensor") {
    primary = metric(
      "surface",
      k(s.mode === "weather_wet" || s.program === "shower" ? "wet" : "dry"),
    );
  }
  if (d.id === "flood_sensor") {
    metrics.push(metric("contact", k(s.level ? "wet" : "dry")));
  }
  if (d.id === "weather_station") {
    metrics.push(
      metric("example_temperature", 23.8, "°C"),
      metric("example_humidity", 46, "%"),
    );
  }
  if (["rain_sensor", "rain_gauge", "lightning_detector"].includes(d.id)) {
    controls.push({ kind: "actions", actions: ["sample", "stop"] });
  } else {
    controls.push({
      kind: "range",
      field: d.id === "wind_direction_sensor" ? "tilt" : "target",
      label: k("example_input"),
      min: spec.min,
      max: spec.max,
      step: spec.step,
      unit: spec.unit,
    });
    if (wind(d)) {
      controls.push({ kind: "actions", actions: ["sample", "stop"] });
    }
  }
  if (d.id === "frost_sensor" || d.id === "roof_drain_monitor") {
    controls.push({
      kind: "choices",
      field: "mode",
      label: k("example_condition"),
      options:
        d.id === "frost_sensor"
          ? ["weather_dry", "weather_frosted"]
          : ["weather_clear_drain", "weather_restricted_drain"],
    });
  }
  if (s.active && !wind(d)) {
    controls.push({ kind: "actions", actions: ["pause"] });
  } else if (
    !s.active &&
    (s.progress < 100 || s.value !== s.target || s.pan !== s.tilt)
  ) {
    controls.push({ kind: "actions", actions: ["resume"] });
  }
  controls.push({
    kind: "note",
    label: k(
      d.id === "rain_gauge"
        ? "bucket_note"
        : d.id === "frost_sensor"
          ? "frost_note"
          : d.id === "flood_sensor"
            ? "flood_note"
            : d.id === "roof_drain_monitor"
              ? "drain_note"
              : wind(d)
                ? "wind_note"
                : "example_note",
    ),
  });
  return {
    primary,
    metrics,
    controls,
    chart: false,
    status: k(s.active ? "responding" : "ready"),
    state: s,
  };
}
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
function convert(n: number, u: unknown, target: string): number | undefined {
  if (u === target || (target === "" && u === undefined)) return n;
  if (target === "°C" && u === "°F") return ((n - 32) * 5) / 9;
  if (target === "m/s") {
    if (u === "km/h") return n / 3.6;
    if (u === "mph") return n * 0.44704;
    if (u === "kn") return n * 0.514444;
  }
  if (target === "hPa") {
    if (u === "Pa") return n / 100;
    if (u === "kPa") return n * 10;
    if (u === "mbar") return n;
  }
  if (target === "mm" && u === "cm") return n * 10;
  return undefined;
}
export function weatherLive(
  d: CatalogDevice,
  e?: HassEntity,
): {
  primary: DeviceMetric;
  metrics: DeviceMetric[];
  value?: number;
  wet?: boolean;
  bearing?: number;
  known: boolean;
} {
  const spec = weatherSpec(d);
  const metrics: DeviceMetric[] = [];
  const empty = {
    primary: metric(spec.label, "—", spec.unit),
    metrics,
    known: false,
  };
  if (!e || ["unknown", "unavailable"].includes(e.state)) return empty;
  if (["rain_sensor", "flood_sensor"].includes(d.id)) {
    const wet =
      typeof e.attributes.moisture === "boolean"
        ? e.attributes.moisture
        : e.entity_id.startsWith("binary_sensor.") &&
            ["on", "off"].includes(e.state)
          ? e.state === "on"
          : undefined;
    return wet === undefined
      ? empty
      : {
          ...empty,
          known: true,
          wet,
          primary: metric("contact", k(wet ? "wet" : "dry")),
        };
  }
  const raw =
    wind(d) && d.id === "weather_station"
      ? e.attributes.wind_speed
      : e.state.trim() !== ""
        ? Number(e.state)
        : undefined;
  const n = finite(raw) ? raw : undefined;
  const unit =
    wind(d) && d.id === "weather_station"
      ? e.attributes.wind_speed_unit
      : e.attributes.unit_of_measurement;
  const value = n === undefined ? undefined : convert(n, unit, spec.unit);
  const valid =
    value !== undefined &&
    (spec.unit === "°C" ? value >= -100 && value <= 100 : value >= 0) &&
    (spec.unit !== "%" || value <= 100) &&
    (d.id !== "wind_direction_sensor" || value < 360);
  const bearing =
    finite(e.attributes.wind_bearing) &&
    e.attributes.wind_bearing >= 0 &&
    e.attributes.wind_bearing < 360
      ? e.attributes.wind_bearing
      : undefined;
  return valid
    ? {
        primary: metric(spec.label, value, spec.unit),
        metrics,
        value,
        known: true,
        bearing,
      }
    : empty;
}
export function weatherVisualState(
  d: CatalogDevice,
  v: DeviceVisualState,
  s?: DevicePreviewState,
  e?: HassEntity,
): DeviceVisualState {
  if (!isWeather(d)) return v;
  const spec = weatherSpec(d);
  if (s) {
    return {
      ...v,
      example: true,
      hasTelemetry: true,
      value: s.value,
      level: s.level,
      position: s.position,
      pan: s.pan,
      processProgress: s.progress,
      processPhase: s.program,
      mode: s.mode,
      active: s.active,
      windSpeed: wind(d) ? s.value : undefined,
      windBearing:
        d.id === "weather_station"
          ? 0
          : d.id === "wind_direction_sensor"
            ? s.pan
            : undefined,
      alert: d.id === "flood_sensor" && !!s.level,
    };
  }
  const live = weatherLive(d, e);
  return {
    ...v,
    example: false,
    hasTelemetry: live.known,
    active: false,
    value: live.value ?? 0,
    level: live.wet ? 1 : 0,
    position: 0,
    pan:
      d.id === "wind_direction_sensor"
        ? (live.value ?? 0)
        : (live.bearing ?? 0),
    mode: live.wet
      ? "weather_wet"
      : live.wet === false
        ? "weather_dry"
        : "unknown",
    windSpeed: wind(d) ? live.value : undefined,
    windBearing: d.id === "wind_direction_sensor" ? live.value : live.bearing,
    alert: live.wet ?? false,
    valueUnit: spec.unit,
    processPhase: "idle",
    processProgress: 100,
  };
}
