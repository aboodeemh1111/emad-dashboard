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

export const TREATMENT_SENSORS: Readonly<
  Record<string, { unit: string; min: number; max: number; value: number }>
> = {
  ph_sensor: { unit: "pH", min: 0, max: 14, value: 7.2 },
  orp_sensor: { unit: "mV", min: -1500, max: 1500, value: 720 },
  conductivity_sensor: { unit: "µS/cm", min: 0, max: 20000, value: 450 },
  total_dissolved_solids_sensor: {
    unit: "µS/cm",
    min: 0,
    max: 20000,
    value: 450,
  },
  turbidity_sensor: { unit: "NTU", min: 0, max: 1000, value: 0.4 },
  chlorine_sensor: { unit: "mg/L", min: 0, max: 5, value: 0.6 },
  dissolved_oxygen_sensor: { unit: "mg/L", min: 0, max: 20, value: 8.2 },
  salinity_sensor: { unit: "PSU", min: 0, max: 50, value: 1.2 },
  water_hardness_sensor: { unit: "mg/L", min: 0, max: 500, value: 120 },
};
export const TREATMENT_DEVICES = [
  "water_softener",
  "water_filter",
  "sand_filter",
  "activated_carbon_filter",
  "reverse_osmosis_unit",
  "ultrafiltration_unit",
  "uv_disinfection_unit",
  "ozone_generator",
  "chlorinator",
  "dosing_pump",
  ...Object.keys(TREATMENT_SENSORS),
] as const;
export const isTreatment = (d: CatalogDevice) =>
  d.category === "water_treatment";
export const treatmentRemote = (d: CatalogDevice) =>
  [
    "reverse_osmosis_unit",
    "ultrafiltration_unit",
    "uv_disinfection_unit",
    "ozone_generator",
    "chlorinator",
    "dosing_pump",
  ].includes(d.id);
const passive = (d: CatalogDevice) =>
  [
    "water_softener",
    "water_filter",
    "sand_filter",
    "activated_carbon_filter",
  ].includes(d.id);
const media = (d: CatalogDevice) =>
  ["sand_filter", "activated_carbon_filter"].includes(d.id);
const chemical = (d: CatalogDevice) =>
  ["ozone_generator", "chlorinator", "dosing_pump"].includes(d.id);
const hardness = (d: CatalogDevice) => d.id === "water_hardness_sensor";
const key = (s: string) => `device_treatment_${s}` as DashboardTextKey;
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(label), value, unit });
const range = (
  field: "target" | "speed" | "level" | "value",
  label: string,
  min: number,
  max: number,
  unit: string,
  step = 1,
): DeviceControl => ({
  kind: "range",
  field,
  label: key(label),
  min,
  max,
  unit,
  step,
});
const actions = (...items: DeviceAction[]): DeviceControl => ({
  kind: "actions",
  actions: items,
});
const note = (label: string): DeviceControl => ({
  kind: "note",
  label: key(label),
});
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function initialTreatmentState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isTreatment(d)) return s;
  const sensor = TREATMENT_SENSORS[d.id];
  return {
    ...s,
    active: false,
    alert: false,
    program: "service",
    progress: 100,
    level: 65,
    speed:
      hardness(d) || d.id === "chlorine_sensor"
        ? 0.06
        : d.id === "ultrafiltration_unit"
          ? 6
          : d.id === "reverse_osmosis_unit"
            ? 3
            : 1.2,
    value: sensor?.value ?? 0.18,
    target:
      sensor?.value ??
      (d.id === "reverse_osmosis_unit" ? 60 : chemical(d) ? 2 : 82),
  };
}
export function treatmentPhase(
  d: CatalogDevice,
  s: DevicePreviewState,
): string {
  if (s.program === "service") return "service";
  if (d.id === "water_softener") {
    return ["backwash", "brine_draw", "slow_rinse", "fast_rinse", "refill"][
      Math.min(4, Math.floor(s.progress / 20))
    ];
  }
  if (media(d) || d.id === "ultrafiltration_unit") {
    return s.progress < 65 ? "backwash" : "rinse";
  }
  if (hardness(d)) {
    return ["flush", "sample", "reagent", "read", "rinse"][
      Math.min(4, Math.floor(s.progress / 20))
    ];
  }
  return "flush";
}
export function treatmentRate(d: CatalogDevice, s: DevicePreviewState): number {
  return s.active &&
    !s.alert &&
    s.speed > 0 &&
    (d.id === "ozone_generator" || s.level > 0)
    ? s.target
    : 0;
}
export function treatmentFlow(
  d: CatalogDevice,
  s: DevicePreviewState,
): number | undefined {
  if (TREATMENT_SENSORS[d.id]) {
    return hardness(d) ? (s.active ? s.speed : 0) : undefined;
  }
  if (passive(d)) return s.program !== "service" && !s.active ? 0 : s.speed;
  if (chemical(d)) return s.speed;
  return s.active ? s.speed : 0;
}
export function treatmentIsMoving(
  d: CatalogDevice,
  s: DevicePreviewState,
): boolean {
  if (!isTreatment(d)) return false;
  if (d.id === "uv_disinfection_unit") {
    return s.active && !s.alert && s.progress < 100;
  }
  if (TREATMENT_SENSORS[d.id] && !hardness(d)) {
    return s.active && s.value !== s.target;
  }
  return s.active && s.program !== "service" && s.progress < 100 && s.speed > 0;
}
export function advanceTreatmentState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!treatmentIsMoving(d, s)) return s;
  const seconds = Math.max(0, elapsed) / 1000;
  const sensor = TREATMENT_SENSORS[d.id];
  if (sensor && !hardness(d)) {
    const step = ((sensor.max - sensor.min) / 3) * seconds;
    const value =
      Math.abs(s.target - s.value) <= step
        ? s.target
        : s.value + Math.sign(s.target - s.value) * step;
    return { ...s, value, active: value !== s.target };
  }
  const progress = Math.min(
    100,
    s.progress +
      seconds *
        (d.id === "uv_disinfection_unit"
          ? 50
          : d.id === "water_softener"
            ? 100 / 15
            : 10),
  );
  if (d.id === "uv_disinfection_unit") return { ...s, progress };
  return {
    ...s,
    progress,
    value: hardness(d) && progress >= 60 ? s.target : s.value,
    active: progress < 100,
    program: progress >= 100 ? "service" : s.program,
  };
}
export function treatmentRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: number,
): DevicePreviewState | undefined {
  if (!isTreatment(d)) return undefined;
  if (!Number.isFinite(value)) return s;
  const sensor = TREATMENT_SENSORS[d.id];
  if (sensor) {
    const target = clamp(value, sensor.min, sensor.max);
    return {
      ...s,
      target,
      ...(!hardness(d) ? { active: target !== s.value } : {}),
    };
  }
  if (field === "level") return { ...s, level: clamp(value, 0, 100) };
  if (field === "speed") {
    return {
      ...s,
      speed: clamp(value, 0, d.id === "ultrafiltration_unit" ? 12 : 6),
    };
  }
  if (field === "value") return { ...s, value: clamp(value, 0, 1) };
  return {
    ...s,
    target: clamp(
      value,
      d.id === "reverse_osmosis_unit" ? 10 : 0,
      d.id === "reverse_osmosis_unit"
        ? 80
        : d.id === "ozone_generator"
          ? 10
          : 5,
    ),
  };
}
export function treatmentAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  action: DeviceAction,
): DevicePreviewState | undefined {
  if (!isTreatment(d)) return undefined;
  if (action === "alarm") return { ...s, active: false, alert: true };
  if (action === "restore") return { ...s, alert: false };
  if (action === "stop") {
    return {
      ...s,
      active: false,
      program: "service",
      progress: d.id === "uv_disinfection_unit" ? 0 : 100,
    };
  }
  if (action === "pause") return { ...s, active: false };
  if (action === "resume") return s.alert ? s : { ...s, active: true };
  if (action === "start") {
    return s.alert
      ? s
      : {
          ...s,
          active: true,
          progress: d.id === "uv_disinfection_unit" ? 0 : 100,
        };
  }
  if (action === "flush" || (action === "sample" && hardness(d))) {
    return {
      ...s,
      active: true,
      progress: 0,
      program: hardness(d) ? "sample" : "cycle",
    };
  }
  return s;
}
export function treatmentInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isTreatment(d)) return undefined;
  const sensor = TREATMENT_SENSORS[d.id];
  const cycle = s.program !== "service";
  let status = key(
    cycle
      ? s.active
        ? s.speed > 0
          ? treatmentPhase(d, s)
          : "no_flow"
        : "paused"
      : passive(d)
        ? "service"
        : s.active
          ? "running"
          : "standby",
  );
  let primary: DeviceMetric;
  let metrics: DeviceMetric[] = [];
  let controls: DeviceControl[];
  const operating = () => actions(s.active ? "stop" : "start");
  const cycleControls = () =>
    cycle
      ? [actions(s.active ? "pause" : "resume", "stop")]
      : [actions(hardness(d) ? "sample" : "flush")];
  if (sensor) {
    status = key(
      hardness(d)
        ? cycle
          ? !s.active
            ? "paused"
            : s.speed <= 0
              ? "no_flow"
              : treatmentPhase(d, s)
          : "monitoring"
        : treatmentIsMoving(d, s)
          ? "settling"
          : "monitoring",
    );
    primary = {
      label: "catalog_reading",
      value:
        d.id === "total_dissolved_solids_sensor" ? s.value * 0.64 : s.value,
      unit: d.id === "total_dissolved_solids_sensor" ? "mg/L" : sensor.unit,
    };
    if (d.id === "total_dissolved_solids_sensor") {
      metrics = [
        metric("source_conductivity", s.value, "µS/cm"),
        metric("tds_factor", 0.64),
      ];
    }
    if (hardness(d)) {
      metrics = [
        metric("hardness_basis", "CaCO₃"),
        metric("sample_phase", key(cycle ? treatmentPhase(d, s) : "ready")),
      ];
    }
    controls = [
      range(
        "target",
        d.id === "total_dissolved_solids_sensor"
          ? "example_conductivity"
          : "example_sample",
        sensor.min,
        sensor.max,
        sensor.unit,
        sensor.unit === "pH" ? 0.1 : sensor.max <= 50 ? 0.01 : 1,
      ),
      ...(hardness(d) ? cycleControls() : []),
      note(
        d.id === "total_dissolved_solids_sensor"
          ? "tds_note"
          : hardness(d)
            ? "hardness_note"
            : "sensor_note",
      ),
    ];
  } else if (passive(d)) {
    primary =
      d.id === "water_softener"
        ? metric("cycle", key(cycle ? treatmentPhase(d, s) : "service"))
        : metric("differential_pressure", s.value, "bar");
    metrics = [
      metric("example_flow", treatmentFlow(d, s) ?? 0, "m³/h"),
      ...(d.id === "water_softener"
        ? [metric("salt_level", s.level, "%")]
        : []),
    ];
    controls = [
      range("speed", "example_feed", 0, 6, "m³/h", 0.1),
      ...(d.id === "water_softener"
        ? [range("level", "example_salt", 0, 100, "%")]
        : [range("value", "example_dp", 0, 1, "bar", 0.01)]),
      ...(d.id === "water_filter" ? [] : cycleControls()),
      note("passive_note"),
    ];
  } else if (d.id === "reverse_osmosis_unit") {
    const feed = s.active ? s.speed : 0;
    const permeate = (feed * s.target) / 100;
    primary = metric("permeate_flow", cycle ? 0 : permeate, "m³/h");
    metrics = [
      metric("feed_flow", feed, "m³/h"),
      metric("concentrate_flow", cycle ? feed : feed - permeate, "m³/h"),
      metric("example_recovery", s.target, "%"),
    ];
    controls = [
      range("speed", "example_feed", 0, 6, "m³/h", 0.1),
      range("target", "example_recovery", 10, 80, "%"),
      ...(cycle ? cycleControls() : [operating(), actions("flush")]),
      note("ro_note"),
    ];
  } else if (d.id === "ultrafiltration_unit") {
    primary = metric("example_tmp", 0.35, "bar");
    metrics = [
      metric("feed_flow", s.active ? s.speed : 0, "m³/h"),
      metric("cycle", key(cycle ? treatmentPhase(d, s) : "service")),
    ];
    controls = [
      range("speed", "example_feed", 0, 12, "m³/h", 0.1),
      ...(cycle ? cycleControls() : [operating(), actions("flush")]),
      note("uf_note"),
    ];
  } else if (d.id === "uv_disinfection_unit") {
    status = key(
      s.alert
        ? "lamp_fault"
        : s.active
          ? s.progress < 100
            ? "warming"
            : "lamp_on"
          : "lamp_off",
    );
    primary = metric("lamp_state", status);
    metrics = [
      metric("example_lamp_hours", 1800, "h"),
      metric(
        "example_uv_signal",
        s.active && !s.alert ? (s.progress < 100 ? 0 : 82) : 0,
        "%",
      ),
    ];
    controls = [
      ...(s.alert ? [] : [operating()]),
      actions(s.alert ? "restore" : "alarm"),
      note("uv_note"),
    ];
  } else {
    const rate = treatmentRate(d, s);
    status = key(
      s.alert
        ? "fault"
        : !s.active
          ? "standby"
          : s.speed <= 0
            ? "no_flow"
            : d.id !== "ozone_generator" && s.level <= 0
              ? "empty_tank"
              : rate > 0
                ? "running"
                : "standby",
    );
    primary = metric(
      d.id === "ozone_generator" ? "ozone_output" : "delivery_rate",
      rate,
      d.id === "ozone_generator" ? "g/h" : "L/h",
    );
    metrics = [
      metric("feed_flow", s.speed, "m³/h"),
      ...(d.id === "dosing_pump"
        ? [
            metric("stroke_rate", (rate * 1000) / 60, "min⁻¹"),
            metric("example_stroke", 1, "mL"),
          ]
        : d.id === "chlorinator"
          ? [metric("chemical_level", s.level, "%")]
          : []),
    ];
    controls = [
      range(
        "target",
        d.id === "ozone_generator" ? "output_setting" : "delivery_setting",
        0,
        d.id === "ozone_generator" ? 10 : 5,
        d.id === "ozone_generator" ? "g/h" : "L/h",
        0.1,
      ),
      range("speed", "example_feed", 0, 6, "m³/h", 0.1),
      ...(d.id === "ozone_generator"
        ? []
        : [range("level", "example_chemical_level", 0, 100, "%")]),
      operating(),
      note(
        d.id === "ozone_generator"
          ? "ozone_note"
          : d.id === "chlorinator"
            ? "chlorinator_note"
            : "dose_note",
      ),
    ];
  }
  if (cycle) metrics.unshift(metric("example_progress", s.progress, "%"));
  return { primary, metrics, controls, status, chart: false, state: s };
}
export function treatmentVisualState(
  d: CatalogDevice,
  s: DeviceVisualState,
  example?: DevicePreviewState,
  entity?: HassEntity,
): DeviceVisualState {
  if (!isTreatment(d)) return s;
  const sensor = TREATMENT_SENSORS[d.id];
  if (example) {
    const phase = treatmentPhase(d, example);
    const cycle = example.program !== "service";
    const flow = treatmentFlow(d, example);
    return {
      ...s,
      value:
        d.id === "total_dissolved_solids_sensor"
          ? example.value * 0.64
          : example.value,
      valueUnit:
        d.id === "total_dissolved_solids_sensor" ? "mg/L" : sensor?.unit,
      flow,
      level: example.level,
      processPhase: cycle
        ? phase
        : d.id === "uv_disinfection_unit"
          ? example.active
            ? example.progress < 100
              ? "warming"
              : "ready"
            : "off"
          : "service",
      processProgress: example.progress,
      deliveryRate: chemical(d) ? treatmentRate(d, example) : undefined,
      recovery: d.id === "reverse_osmosis_unit" ? example.target : undefined,
      active:
        d.id === "uv_disinfection_unit" || (sensor && !hardness(d))
          ? example.active
          : chemical(d)
            ? treatmentRate(d, example) > 0
            : example.active && (flow ?? 0) > 0,
      pressure: passive(d) ? example.value : undefined,
    };
  }
  if (!s.available) {
    return {
      ...s,
      active: false,
      hasTelemetry: false,
      value: 0,
      flow: undefined,
      deliveryRate: undefined,
      pressure: undefined,
      processPhase: "service",
    };
  }
  const a = entity?.attributes ?? {};
  const unit = a.unit_of_measurement;
  const numeric = entity?.state.trim() ? Number(entity.state) : NaN;
  const finite = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n);
  const allowed = sensor
    ? d.id === "total_dissolved_solids_sensor"
      ? ["mg/L", "ppm"]
      : sensor.unit === "µS/cm"
        ? ["µS/cm", "μS/cm", "uS/cm"]
        : sensor.unit === "pH"
          ? ["pH", "", undefined]
          : [sensor.unit]
    : [];
  const valid = !!sensor && Number.isFinite(numeric) && allowed.includes(unit);
  const flow =
    unit === "m³/h" && Number.isFinite(numeric)
      ? numeric
      : finite(a.flow_rate) && a.flow_unit === "m³/h"
        ? a.flow_rate
        : undefined;
  const rateUnit = d.id === "ozone_generator" ? "g/h" : "L/h";
  const rate =
    unit === rateUnit && Number.isFinite(numeric)
      ? numeric
      : finite(a.delivery_rate) && a.delivery_unit === rateUnit
        ? a.delivery_rate
        : undefined;
  const phase =
    typeof a.process_phase === "string" &&
    [
      "backwash",
      "brine_draw",
      "slow_rinse",
      "fast_rinse",
      "refill",
      "rinse",
      "flush",
      "sample",
      "reagent",
      "read",
      "warming",
      "ready",
    ].includes(a.process_phase)
      ? a.process_phase
      : "service";
  return {
    ...s,
    value: valid ? numeric : 0,
    valueUnit: valid ? unit : undefined,
    hasTelemetry: valid,
    flow,
    deliveryRate: rate,
    processPhase: phase,
    processProgress: undefined,
    recovery: undefined,
    active:
      s.available &&
      (sensor
        ? false
        : d.id === "uv_disinfection_unit"
          ? s.active
          : chemical(d)
            ? rate !== undefined && rate > 0
            : flow !== undefined && flow > 0),
    pressure:
      finite(a.differential_pressure) && a.pressure_unit === "bar"
        ? a.differential_pressure
        : undefined,
    level:
      finite(a.tank_level) && a.level_unit === "%"
        ? clamp(a.tank_level, 0, 100)
        : 0,
  };
}
