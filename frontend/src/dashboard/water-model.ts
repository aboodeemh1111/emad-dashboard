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

export const WATER_DEVICES = [
  "water_meter",
  "water_flow_sensor",
  "water_pressure_sensor",
  "water_supply_pump",
  "booster_pump",
  "hot_water_circulation_pump",
  "borehole_pump",
  "water_tank",
  "tank_level_sensor",
  "float_switch",
  "water_heater",
  "calorifier",
  "expansion_vessel",
  "water_leak_detector",
  "leak_detection_cable",
] as const;
export const isWaterDevice = (d: CatalogDevice) =>
  d.category === "water_supply";
export const isWaterPump = (d: CatalogDevice) =>
  [
    "water_supply_pump",
    "booster_pump",
    "hot_water_circulation_pump",
    "borehole_pump",
  ].includes(d.id);
export const waterRemote = (d: CatalogDevice) =>
  isWaterPump(d) || ["water_heater", "calorifier"].includes(d.id);
const levelDevice = (d: CatalogDevice) =>
  ["water_tank", "tank_level_sensor", "float_switch"].includes(d.id);
const thermal = (d: CatalogDevice) =>
  ["water_heater", "calorifier"].includes(d.id);
const key = (s: string) => `device_water_${s}` as DashboardTextKey;
const metric = (
  s: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(s), value, unit });
const note = (s: string): DeviceControl => ({ kind: "note", label: key(s) });
const range = (
  field: "target" | "speed",
  label: string,
  min = 0,
  max = 100,
  unit = "%",
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
const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
const approach = (actual: number, target: number, step: number) =>
  Math.abs(target - actual) <= step
    ? target
    : actual + Math.sign(target - actual) * step;

export function initialWaterState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isWaterDevice(d)) return s;
  const next = {
    ...s,
    active: false,
    alert: false,
    open: false,
    mode: "manual",
    program: "medium",
    level: 68,
    target: 68,
  };
  if (isWaterPump(d)) {
    Object.assign(next, {
      active: true,
      position: 60,
      speed: 60,
      value: 3.2,
      target: 3.2,
      program: d.id === "booster_pump" ? "pump_1" : "medium",
    });
  }
  if (d.id === "water_meter") {
    Object.assign(next, { value: 128.642, target: 2.4, active: true });
  }
  if (d.id === "water_flow_sensor") {
    Object.assign(next, { value: 2.4, target: 2.4, active: true });
  }
  if (d.id === "water_pressure_sensor" || d.id === "expansion_vessel") {
    Object.assign(next, { value: 3.2, target: 3.2 });
  }
  if (d.id === "float_switch") Object.assign(next, { level: 35, target: 35 });
  if (thermal(d)) Object.assign(next, { value: 48, target: 55, active: false });
  return next;
}
export function waterIsMoving(d: CatalogDevice, s: DevicePreviewState) {
  if (!isWaterDevice(d)) return false;
  if (isWaterPump(d)) return s.position !== (s.active ? s.speed : 0);
  if (levelDevice(d)) return s.active && s.level !== s.target;
  if (thermal(d)) return s.active && s.value < s.target;
  return d.id === "expansion_vessel" && s.value !== s.target;
}
export function advanceWaterState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!waterIsMoving(d, s)) return s;
  const seconds = Math.max(0, elapsed) / 1000;
  if (isWaterPump(d)) {
    return {
      ...s,
      position: approach(s.position, s.active ? s.speed : 0, seconds * 100),
    };
  }
  if (levelDevice(d)) {
    const level = approach(s.level, s.target, seconds * 30);
    return {
      ...s,
      level,
      active: level !== s.target,
      open:
        d.id === "float_switch"
          ? level >= 60
            ? true
            : level <= 40
              ? false
              : s.open
          : s.open,
    };
  }
  if (thermal(d)) {
    return { ...s, value: approach(s.value, s.target, seconds * 3) };
  }
  return { ...s, value: approach(s.value, s.target, seconds * 2) };
}
export function waterRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: number,
): DevicePreviewState | undefined {
  if (!isWaterDevice(d)) return undefined;
  if (!Number.isFinite(value)) return s;
  if (levelDevice(d)) {
    return { ...s, target: clamp(value), active: clamp(value) !== s.level };
  }
  if (isWaterPump(d)) {
    return field === "speed"
      ? { ...s, speed: clamp(value) }
      : { ...s, target: clamp(value, 1, 6) };
  }
  if (thermal(d)) return { ...s, target: clamp(value, 40, 65) };
  if (d.id === "expansion_vessel") return { ...s, target: clamp(value, 1, 6) };
  if (d.id === "water_pressure_sensor") {
    return { ...s, target: clamp(value, 0, 10), value: clamp(value, 0, 10) };
  }
  if (["water_meter", "water_flow_sensor"].includes(d.id)) {
    return {
      ...s,
      target: clamp(value, 0, 6),
      ...(d.id === "water_flow_sensor" ? { value: clamp(value, 0, 6) } : {}),
      active: value > 0,
    };
  }
  return s;
}
export function waterChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: string,
): DevicePreviewState | undefined {
  if (!isWaterDevice(d)) return undefined;
  if (d.id === "hot_water_circulation_pump" && field === "program") {
    return {
      ...s,
      program: value,
      speed: value === "low" ? 30 : value === "high" ? 100 : 60,
    };
  }
  if (d.id === "booster_pump" && field === "program") {
    return { ...s, program: value };
  }
  return s;
}
export function waterAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  action: DeviceAction,
): DevicePreviewState | undefined {
  if (!isWaterDevice(d)) return undefined;
  if (action === "start" || (action === "resume" && levelDevice(d))) {
    return { ...s, active: true };
  }
  if (action === "stop" || action === "pause") return { ...s, active: false };
  if (action === "alarm" || action === "restore") {
    return { ...s, alert: action === "alarm" };
  }
  if (action === "sample" && d.id === "water_meter") {
    return { ...s, value: s.value + ((s.active ? s.target : 0) * 10) / 3600 };
  }
  return s;
}
export function waterInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isWaterDevice(d)) return undefined;
  let primary: DeviceMetric;
  let metrics: DeviceMetric[] = [];
  let controls: DeviceControl[] = [];
  let status = key("monitoring");
  if (isWaterPump(d)) {
    const running = s.position > 0;
    status = key(
      waterIsMoving(d, s)
        ? s.active
          ? "starting"
          : "stopping"
        : running
          ? "running"
          : "stopped",
    );
    primary = metric("motor", status);
    metrics = [metric("speed_feedback", s.position, "%")];
    if (d.id === "booster_pump") {
      primary = metric("example_pressure", s.value, "bar");
      metrics.push(metric("pressure_target", s.target, "bar"));
      controls.push(range("target", "pressure_target", 1, 6, "bar", 0.1), {
        kind: "choices",
        field: "program",
        label: key("duty_pump"),
        options: ["pump_1", "pump_2"],
      });
    } else if (d.id === "hot_water_circulation_pump") {
      controls.push({
        kind: "choices",
        field: "program",
        label: key("speed_setting"),
        options: ["low", "medium", "high"],
      });
    } else controls.push(range("speed", "speed_command"));
    controls.push(actions(s.active ? "stop" : "start"), note("pump_note"));
  } else if (levelDevice(d)) {
    status = key(waterIsMoving(d, s) ? "level_changing" : "monitoring");
    primary = metric("level", s.level, "%");
    if (d.id === "water_tank") {
      metrics = [
        metric("stored", s.level * 10, "L"),
        metric("free_capacity", (100 - s.level) * 10, "L"),
        metric("example_capacity", 1000, "L"),
      ];
    }
    if (d.id === "tank_level_sensor") {
      metrics = [
        metric("signal", 4 + s.level * 0.16, "mA"),
        metric("sensor_type", key("hydrostatic")),
      ];
    }
    if (d.id === "float_switch") {
      primary = metric(
        "high_level",
        key(s.open ? "contact_made" : "contact_open"),
      );
      metrics = [
        metric("level", s.level, "%"),
        metric("pickup", 60, "%"),
        metric("release", 40, "%"),
      ];
    }
    controls = [
      range("target", "example_level"),
      ...(s.level !== s.target
        ? [actions(waterIsMoving(d, s) ? "pause" : "resume")]
        : []),
      note(
        d.id === "float_switch"
          ? "float_note"
          : d.id === "tank_level_sensor"
            ? "level_note"
            : "tank_note",
      ),
    ];
  } else if (thermal(d)) {
    status = key(
      s.active && s.value < s.target
        ? "heating"
        : s.active
          ? "at_target"
          : "standby",
    );
    primary = metric("temperature", s.value, "°C");
    metrics = [
      metric("temperature_target", s.target, "°C"),
      metric("heat_input", key(s.active && s.value < s.target ? "on" : "off")),
    ];
    controls = [
      range("target", "temperature_target", 40, 65, "°C", 0.5),
      actions(s.active ? "stop" : "start"),
      note("thermal_note"),
    ];
  } else if (d.id === "expansion_vessel") {
    primary = metric("example_pressure", s.value, "bar");
    metrics = [
      metric("example_precharge", 2, "bar"),
      metric("example_vessel_size", 18, "L"),
    ];
    controls = [
      range("target", "example_system_pressure", 1, 6, "bar", 0.1),
      note("vessel_note"),
    ];
  } else if (d.id === "water_pressure_sensor") {
    primary = metric("example_pressure", s.value, "bar");
    metrics = [metric("signal", 4 + (s.value / 10) * 16, "mA")];
    controls = [
      range("target", "example_pressure", 0, 10, "bar", 0.1),
      note("pressure_note"),
    ];
  } else if (["water_meter", "water_flow_sensor"].includes(d.id)) {
    const flow = s.active ? s.target : 0;
    status = key(flow > 0 ? "flowing" : "no_flow");
    primary =
      d.id === "water_meter"
        ? metric("total_volume", s.value, "m³")
        : metric("flow", flow, "m³/h");
    metrics = [
      d.id === "water_meter"
        ? metric("flow", flow, "m³/h")
        : metric("signal", 4 + (flow / 6) * 16, "mA"),
    ];
    controls = [
      range("target", "example_flow", 0, 6, "m³/h", 0.1),
      ...(d.id === "water_meter" ? [actions("sample")] : []),
      note("meter_note"),
    ];
  } else {
    status = key(s.alert ? "wet" : "dry");
    primary = metric("leak_state", status);
    controls = [actions(s.alert ? "restore" : "alarm"), note("leak_note")];
  }
  return { primary, metrics, controls, status, chart: false, state: s };
}

/** Water diagrams accept only matching measurements; pressure never implies flow or tank level. */
export function waterVisualState(
  d: CatalogDevice,
  s: DeviceVisualState,
  example?: DevicePreviewState,
  entity?: HassEntity,
): DeviceVisualState {
  if (!isWaterDevice(d)) return s;
  if (example) {
    return {
      ...s,
      level: example.level,
      speed: isWaterPump(d) ? example.position : 0,
      active: isWaterPump(d)
        ? example.position > 0
        : thermal(d)
          ? example.active && example.value < example.target
          : example.active,
      flow: ["water_meter", "water_flow_sensor"].includes(d.id)
        ? example.active
          ? example.target
          : 0
        : undefined,
      pressure: [
        "water_pressure_sensor",
        "booster_pump",
        "expansion_vessel",
      ].includes(d.id)
        ? example.value
        : undefined,
      temperature: thermal(d) ? example.value : undefined,
      hasLevel: levelDevice(d),
      program: example.program,
      open: example.open,
    };
  }
  const a = entity?.attributes ?? {};
  const unit = a.unit_of_measurement;
  const number = entity?.state.trim() ? Number(entity.state) : NaN;
  const finite = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n);
  const pressure =
    unit === "bar" && Number.isFinite(number)
      ? number
      : finite(a.pressure) && a.pressure_unit === "bar"
        ? a.pressure
        : undefined;
  const flow =
    unit === "m³/h" && Number.isFinite(number)
      ? number
      : finite(a.flow_rate) && a.flow_unit === "m³/h"
        ? a.flow_rate
        : undefined;
  const temperature =
    unit === "°C" && Number.isFinite(number)
      ? number
      : finite(a.current_temperature)
        ? a.current_temperature
        : undefined;
  const level =
    levelDevice(d) && unit === "%" && Number.isFinite(number)
      ? clamp(number)
      : levelDevice(d) && finite(a.level) && a.level_unit === "%"
        ? clamp(a.level)
        : undefined;
  return {
    ...s,
    hasTelemetry:
      [flow, pressure, temperature, level].some(finite) ||
      (d.id === "water_meter" && unit === "m³" && Number.isFinite(number)),
    flow,
    pressure,
    temperature,
    level: level ?? 0,
    hasLevel: level !== undefined,
    speed: finite(a.percentage) ? clamp(a.percentage) : 0,
    program: typeof a.duty_pump === "string" ? a.duty_pump : "",
    open: d.id === "float_switch" ? entity?.state === "on" : s.open,
    alert: ["water_leak_detector", "leak_detection_cable"].includes(d.id)
      ? entity?.state === "on" || entity?.state === "wet"
      : s.alert,
    active:
      s.available &&
      (isWaterPump(d)
        ? s.active
        : thermal(d)
          ? a.hvac_action === "heating" || entity?.state === "heating"
          : flow !== undefined && flow > 0),
  };
}
