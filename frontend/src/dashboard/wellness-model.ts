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

export const WELLNESS_DEVICES = [
  "pool_circulation_pump",
  "pool_filter",
  "pool_heater",
  "pool_heat_pump",
  "pool_chlorinator",
  "pool_dosing_controller",
  "pool_level_sensor",
  "pool_cover",
  "pool_light",
  "fountain_pump",
  "spa_controller",
  "sauna_controller",
  "steam_room_controller",
] as const;
export const isWellness = (d: CatalogDevice) => d.category === "pool";
const thermal = (d: CatalogDevice) =>
  [
    "pool_heater",
    "pool_heat_pump",
    "spa_controller",
    "sauna_controller",
    "steam_room_controller",
  ].includes(d.id);
const chemical = (d: CatalogDevice) =>
  ["pool_chlorinator", "pool_dosing_controller"].includes(d.id);
const key = (s: string) => `device_wellness_${s}` as DashboardTextKey;
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(label), value, unit });
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const percent = (v: unknown): v is number => finite(v) && v >= 0 && v <= 100;
const temperatures = (d: CatalogDevice) =>
  d.id === "sauna_controller"
    ? { current: 72, target: 78, min: 40, max: 95 }
    : d.id === "steam_room_controller"
      ? { current: 42, target: 45, min: 30, max: 50 }
      : d.id === "spa_controller"
        ? { current: 35, target: 36, min: 26, max: 40 }
        : { current: 26, target: 28, min: 15, max: 35 };

export function initialWellnessState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isWellness(d)) return s;
  const t = temperatures(d);
  const level =
    d.id === "pool_light" ? 75 : d.id === "pool_level_sensor" ? 68 : 65;
  return {
    ...s,
    active: false,
    alert: false,
    open: true,
    level,
    target: level,
    speed: level,
    position: 65,
    value: thermal(d)
      ? t.current
      : d.id === "pool_dosing_controller"
        ? 7.2
        : d.id === "pool_filter"
          ? 0.8
          : 0,
    tilt: thermal(d) ? t.target : 730,
    pan: 0,
    floor: 0,
    progress: 100,
    duration: 8,
    program: "idle",
    mode: d.id === "fountain_pump" ? "wellness_crown" : "wellness_heat",
    metric: "wellness_acid",
    period: "wellness_flow",
    color: "#7ab4df",
  };
}
export const wellnessIsMoving = (d: CatalogDevice, s: DevicePreviewState) =>
  isWellness(d) && s.active;
export function wellnessRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  n: number,
): DevicePreviewState | undefined {
  if (!isWellness(d)) return undefined;
  if (!finite(n)) return s;
  if (field === "tilt" && thermal(d)) {
    const t = temperatures(d);
    return { ...s, tilt: clamp(n, t.min, t.max), active: s.open || s.active };
  }
  if (field === "level" && d.id === "pool_level_sensor") {
    return { ...s, level: clamp(n) };
  }
  if (field === "value" && d.id === "pool_filter") {
    return { ...s, value: clamp(n, 0, 3) };
  }
  if (field === "value" && d.id === "pool_dosing_controller") {
    return { ...s, value: clamp(n, 6, 8.5) };
  }
  if (field === "tilt" && d.id === "pool_dosing_controller") {
    return { ...s, tilt: clamp(n, 300, 900) };
  }
  if (field === "target") {
    const target = clamp(n);
    if (d.id === "pool_level_sensor") {
      return { ...s, target, active: s.level !== target };
    }
    if (d.id === "pool_cover") {
      return { ...s, target, active: s.position !== target };
    }
    if (thermal(d) && d.id !== "spa_controller") return s;
    return {
      ...s,
      target,
      speed: target > 0 ? target : s.speed,
      open: d.id === "spa_controller" ? s.open : target > 0,
      active: true,
    };
  }
  return s;
}
export function wellnessChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: string,
): DevicePreviewState | undefined {
  if (!isWellness(d)) return undefined;
  if (
    field === "mode" &&
    d.id === "fountain_pump" &&
    ["wellness_crown", "wellness_column"].includes(value)
  ) {
    return { ...s, mode: value };
  }
  if (
    field === "period" &&
    chemical(d) &&
    ["wellness_flow", "wellness_no_flow"].includes(value)
  ) {
    return {
      ...s,
      period: value,
      ...(value === "wellness_no_flow"
        ? { level: 0, active: false }
        : { active: true }),
    };
  }
  if (
    field === "metric" &&
    d.id === "pool_dosing_controller" &&
    ["wellness_acid", "wellness_sanitizer"].includes(value)
  ) {
    return { ...s, metric: value };
  }
  return s;
}
export function wellnessAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isWellness(d)) return undefined;
  if (d.id === "pool_cover") {
    if (a === "pause") return { ...s, target: s.position, active: false };
    if (a === "open" || a === "close") {
      return {
        ...s,
        target: a === "open" ? 100 : 0,
        active: s.position !== (a === "open" ? 100 : 0),
      };
    }
    return s;
  }
  if (d.id === "pool_level_sensor") return s;
  if (a === "flush" && d.id === "pool_filter" && s.program === "idle") {
    return {
      ...s,
      open: true,
      target: s.target || s.speed || 65,
      program: "filter_stop",
      progress: 0,
      active: true,
    };
  }
  if (a === "sample" && d.id === "sauna_controller") {
    return { ...s, program: "steam_example", progress: 0, active: true };
  }
  if (a === "start" || a === "stop") {
    return {
      ...s,
      open: a === "start",
      target: a === "start" ? s.target || s.speed || 65 : s.target,
      active: true,
      program: d.id === "pool_filter" ? s.program : "idle",
      progress: d.id === "pool_filter" ? s.progress : 100,
    };
  }
  return s;
}
export function wellnessFilterPhase(s: DevicePreviewState) {
  if (s.program === "filter_stop") return "stopping";
  if (s.program !== "backwash") return "filter";
  return s.progress < 12
    ? "turn_backwash"
    : s.progress < 50
      ? "backwash"
      : s.progress < 60
        ? "stopping"
        : s.progress < 68
          ? "turn_rinse"
          : s.progress < 84
            ? "rinse"
            : s.progress < 92
              ? "stopping"
              : "turn_filter";
}
export function advanceWellnessState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!wellnessIsMoving(d, s) || !finite(elapsed) || elapsed < 0) return s;
  if (elapsed === 0) return { ...s };
  const approach = (v: number, t: number, rate: number) =>
    Math.abs(v - t) <= elapsed * rate
      ? t
      : v + Math.sign(t - v) * elapsed * rate;
  if (d.id === "pool_level_sensor") {
    const level = approach(s.level, s.target, 0.05);
    return { ...s, level, active: level !== s.target };
  }
  if (d.id === "pool_cover") {
    const position = approach(s.position, s.target, 0.018);
    return { ...s, position, active: position !== s.target };
  }
  if (d.id === "pool_filter" && s.program !== "idle") {
    if (!s.open) {
      const level = approach(s.level, 0, 0.15);
      return { ...s, level, active: level !== 0 };
    }
    if (elapsed >= 12000) {
      return {
        ...s,
        program: "idle",
        progress: 100,
        level: s.open ? s.target : 0,
        active: false,
      };
    }
    if (s.program === "filter_stop") {
      const level = approach(s.level, 0, 0.15);
      return { ...s, level, program: level === 0 ? "backwash" : s.program };
    }
    // Coast to a complete stop before rotating the multiport valve.
    const phase = wellnessFilterPhase(s);
    const stopping = phase === "stopping";
    const turning = phase.startsWith("turn_");
    const demand = stopping || turning ? 0 : s.target;
    const level = approach(s.level, demand, 0.15);
    let progress = Math.min(100, s.progress + elapsed / 70);
    for (const boundary of [60, 92]) {
      if (s.progress < boundary && progress >= boundary && level > 0) {
        progress = boundary - 0.001;
      }
    }
    if (progress === 100) {
      return { ...s, level: 0, progress: 100, program: "idle", active: true };
    }
    return { ...s, level, progress, active: true };
  }
  const flow = !chemical(d) || s.period === "wellness_flow";
  const demand =
    s.open && flow
      ? thermal(d) && d.id !== "spa_controller"
        ? s.value < s.tilt
          ? 100
          : 0
        : s.target
      : 0;
  const level = approach(s.level, demand, d.id === "pool_light" ? 0.4 : 0.12);
  const value =
    thermal(d) && s.open && s.value < s.tilt
      ? approach(s.value, s.tilt, d.id === "sauna_controller" ? 0.0015 : 0.0006)
      : s.value;
  const progress =
    s.program === "steam_example"
      ? Math.min(100, s.progress + elapsed / 35)
      : s.progress;
  const program = progress === 100 ? "idle" : s.program;
  return {
    ...s,
    level,
    value,
    progress,
    program,
    active:
      level !== demand ||
      (thermal(d) && s.open && value < s.tilt) ||
      (thermal(d) &&
        d.id !== "spa_controller" &&
        value === s.tilt &&
        level > 0) ||
      program !== "idle",
  };
}
export function wellnessActionLabel(
  d: CatalogDevice,
  a: DeviceAction,
): DashboardTextKey | undefined {
  if (!isWellness(d)) return undefined;
  if (a === "flush") return key("backwash_example");
  if (a === "sample") return key("steam_example");
  if (a === "start" || a === "stop") {
    return key(
      d.id === "pool_light"
        ? a === "start"
          ? "light_on"
          : "light_off"
        : a === "start"
          ? "start_example"
          : "stop_example",
    );
  }
  return undefined;
}
export function wellnessActionDisabled(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
) {
  return (
    isWellness(d) &&
    ((a === "pause" && !s.active) ||
      (a === "flush" && s.program !== "idle") ||
      (a === "sample" && s.program === "steam_example"))
  );
}
export function wellnessInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isWellness(d)) return undefined;
  const range = (
    field: "target" | "tilt" | "level" | "value",
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
  const choices = (
    field: "mode" | "period" | "metric",
    label: string,
    options: readonly string[],
  ): DeviceControl => ({ kind: "choices", field, label: key(label), options });
  const controls: DeviceControl[] = [];
  const metrics: DeviceMetric[] = [];
  let primary = metric("output", s.level, "%");
  let status = key(!s.open || s.level === 0 ? "off" : "running");
  if (d.id === "pool_cover") {
    primary = metric("cover_opening", s.position, "%");
    status = key(
      s.active
        ? s.target > s.position
          ? "opening"
          : "closing"
        : s.position === 0
          ? "closed"
          : s.position === 100
            ? "open"
            : "paused",
    );
    controls.push(range("target", "requested_opening"), {
      kind: "actions",
      actions: ["open", "pause", "close"],
    });
    metrics.push(metric("requested_opening", s.target, "%"));
  } else if (d.id === "pool_level_sensor") {
    primary = metric("water_level", s.level, "%");
    status = key("monitoring");
    controls.push(range("target", "example_level"));
  } else {
    if (thermal(d)) {
      const t = temperatures(d);
      primary = {
        label: "device_measured_temperature",
        value: s.value,
        unit: "°C",
      };
      status = key(
        !s.open
          ? "off"
          : s.value < s.tilt
            ? "heating"
            : s.value > s.tilt
              ? "coasting"
              : "at_target",
      );
      metrics.push(metric("requested_temperature", s.tilt, "°C"));
      controls.push(range("tilt", "example_setpoint", t.min, t.max, "°C", 0.5));
      if (d.id === "spa_controller") {
        metrics.push(metric("jets", s.level, "%"));
        controls.push(range("target", "jets"));
      }
      if (d.id === "sauna_controller") {
        controls.push({ kind: "actions", actions: ["sample"] });
      }
    } else {
      controls.push(
        range(
          "target",
          d.id === "pool_light"
            ? "brightness"
            : d.id === "fountain_pump"
              ? "jet_output"
              : "requested_output",
        ),
      );
      if (d.id === "pool_light") {
        primary = metric("brightness", s.level, "%");
        controls.push({ kind: "color" });
        status = key(s.level === 0 ? "off" : s.level < 100 ? "dimmed" : "on");
      }
      if (d.id === "fountain_pump") {
        controls.push(
          choices("mode", "jet_pattern", ["wellness_crown", "wellness_column"]),
        );
      }
      if (chemical(d)) {
        controls.push(
          choices("period", "flow_feedback", [
            "wellness_flow",
            "wellness_no_flow",
          ]),
        );
        if (s.period === "wellness_no_flow") status = key("flow_inhibited");
        if (d.id === "pool_dosing_controller") {
          metrics.push(
            metric("example_ph", s.value, "pH"),
            metric("example_orp", s.tilt, "mV"),
          );
          controls.push(
            choices("metric", "dosing_channel", [
              "wellness_acid",
              "wellness_sanitizer",
            ]),
            range("value", "example_ph", 6, 8.5, "pH", 0.1),
            range("tilt", "example_orp", 300, 900, "mV", 10),
          );
        }
      }
      if (d.id === "pool_filter") {
        const phase = wellnessFilterPhase(s);
        primary = metric("filter_mode", key(phase));
        status = key(s.open ? phase : "paused");
        metrics.push(metric("example_pressure", s.value, "bar"));
        controls.push(range("value", "example_pressure", 0, 3, "bar", 0.1), {
          kind: "actions",
          actions: ["flush"],
        });
        if (s.program !== "idle") {
          metrics.push(metric("cycle_progress", s.progress, "%"));
        }
      }
    }
    controls.push({ kind: "actions", actions: [s.open ? "stop" : "start"] });
  }
  controls.push({
    kind: "note",
    label: key(
      chemical(d)
        ? "chemistry_note"
        : thermal(d)
          ? "thermal_note"
          : d.id === "pool_filter"
            ? "filter_note"
            : d.id === "pool_level_sensor"
              ? "level_note"
              : "example_note",
    ),
  });
  return { primary, metrics, controls, chart: false, status, state: s };
}

export interface WellnessLive {
  primary: DeviceMetric;
  metrics: DeviceMetric[];
  status: DashboardTextKey;
  known: boolean;
  visual: Partial<DeviceVisualState>;
}
export function wellnessLive(d: CatalogDevice, e?: HassEntity): WellnessLive {
  const empty: WellnessLive = {
    primary: metric("feedback", "—"),
    metrics: [],
    status: key(e?.state === "unavailable" ? "unavailable" : "unknown"),
    known: false,
    visual: {
      active: false,
      hasTelemetry: false,
      hasLevel: false,
      hasPosition: false,
      powerOn: undefined,
      heating: false,
      flowAvailable: undefined,
      level: 0,
      speed: 0,
      position: 0,
      value: 0,
      temperature: undefined,
      pressure: undefined,
      outputs: undefined,
      color: "#7ab4df",
      processPhase: "unknown",
      processProgress: 100,
    },
  };
  if (!e || !e.state.trim() || ["unknown", "unavailable"].includes(e.state)) {
    return empty;
  }
  const a = e.attributes;
  if (d.id === "pool_level_sensor") {
    const n = Number(e.state);
    const unit = a.unit_of_measurement;
    if (
      !finite(n) ||
      n < 0 ||
      !["%", "mm", "cm", "m"].includes(unit ?? "") ||
      (unit === "%" && n > 100)
    ) {
      return empty;
    }
    return {
      ...empty,
      known: true,
      status: key("monitoring"),
      primary: metric("water_level", n, unit),
      visual: {
        ...empty.visual,
        hasTelemetry: true,
        hasLevel: unit === "%",
        level: unit === "%" ? n : 0,
        value: n,
        valueUnit: unit,
      },
    };
  }
  if (d.id === "pool_cover") {
    if (
      !e.entity_id.startsWith("cover.") ||
      !["open", "closed", "opening", "closing", "stopped"].includes(e.state)
    ) {
      return empty;
    }
    const position = percent(a.current_position)
      ? a.current_position
      : e.state === "closed"
        ? 0
        : undefined;
    return {
      ...empty,
      known: true,
      status: key(e.state === "stopped" ? "paused" : e.state),
      primary:
        position === undefined
          ? metric(
              "cover_state",
              key(e.state === "stopped" ? "paused" : e.state),
            )
          : metric("cover_opening", position, "%"),
      visual: {
        ...empty.visual,
        hasTelemetry: true,
        hasPosition: position !== undefined,
        position: position ?? 0,
        active: ["opening", "closing"].includes(e.state),
        processPhase: e.state,
      },
    };
  }
  const climate =
    e.entity_id.startsWith("climate.") &&
    thermal(d) &&
    ["off", "heat", "cool", "auto", "heat_cool"].includes(e.state);
  const binary =
    /^(fan|switch|light|input_boolean)\./.test(e.entity_id) &&
    ["on", "off"].includes(e.state);
  if (!climate && !binary) return empty;
  const on = e.state !== "off";
  const output =
    d.id === "pool_light"
      ? finite(a.brightness) && a.brightness >= 0 && a.brightness <= 255
        ? a.brightness / 2.55
        : undefined
      : percent(a.percentage)
        ? a.percentage
        : percent(a.output_percentage)
          ? a.output_percentage
          : undefined;
  const flow = typeof a.flow_ok === "boolean" ? a.flow_ok : undefined;
  const heating = on && (a.hvac_action === "heating" || a.heating === true);
  const cooling =
    on && d.id === "pool_heat_pump" && a.hvac_action === "cooling";
  const unit = ["°C", "°F"].includes(
    a.temperature_unit ?? a.unit_of_measurement,
  )
    ? (a.temperature_unit ?? a.unit_of_measurement)
    : undefined;
  const temperature =
    finite(a.current_temperature) && unit ? a.current_temperature : undefined;
  const rgb: unknown = a.rgb_color;
  const color =
    Array.isArray(rgb) &&
    rgb.length === 3 &&
    rgb.every((v) => finite(v) && v >= 0 && v <= 255)
      ? `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`
      : "#7ab4df";
  const level =
    !on || (chemical(d) && flow !== true)
      ? 0
      : thermal(d)
        ? d.id === "spa_controller"
          ? percent(a.jet_percentage)
            ? a.jet_percentage
            : 0
          : heating || cooling
            ? 100
            : 0
        : (output ??
          (d.id === "pool_filter" ? (flow === true ? 100 : 0) : 100));
  const phase =
    d.id === "pool_filter" &&
    ["filter", "backwash", "rinse"].includes(a.filter_mode)
      ? a.filter_mode
      : "unknown";
  const pressure =
    finite(a.pressure) &&
    a.pressure >= 0 &&
    a.pressure <= 6 &&
    a.pressure_unit === "bar"
      ? a.pressure
      : undefined;
  const metrics: DeviceMetric[] = [];
  if (pressure !== undefined) {
    metrics.push(metric("reported_pressure", pressure, "bar"));
  }
  if (flow !== undefined) {
    metrics.push(
      metric("flow_feedback", key(flow ? "flow_confirmed" : "no_flow")),
    );
  }
  const status = key(
    !on
      ? "off"
      : chemical(d) && flow === false
        ? "flow_inhibited"
        : cooling
          ? "cooling"
          : thermal(d)
            ? heating
              ? "heating"
              : "on"
            : output === 0
              ? "zero_output"
              : output !== undefined && output < 100
                ? "dimmed"
                : "on",
  );
  return {
    primary:
      temperature !== undefined
        ? metric("temperature", temperature, unit)
        : output !== undefined && !thermal(d)
          ? metric(
              d.id === "pool_light" ? "brightness" : "output",
              on ? output : 0,
              "%",
            )
          : metric("power_state", key(on ? "on" : "off")),
    metrics,
    status,
    known: true,
    visual: {
      ...empty.visual,
      hasTelemetry: true,
      hasLevel: output !== undefined,
      powerOn: on,
      heating,
      flowAvailable: flow,
      level,
      speed: level,
      active: level > 0 || heating,
      value: temperature ?? 0,
      temperature,
      pressure,
      color,
      processPhase: phase,
      mode:
        d.id === "pool_dosing_controller"
          ? a.dosing_channel === "acid"
            ? "wellness_acid"
            : a.dosing_channel === "sanitizer"
              ? "wellness_sanitizer"
              : "unknown"
          : cooling
            ? "wellness_cool"
            : "wellness_heat",
    },
  };
}
export function wellnessVisualState(
  d: CatalogDevice,
  v: DeviceVisualState,
  s?: DevicePreviewState,
  e?: HassEntity,
): DeviceVisualState {
  if (!isWellness(d)) return v;
  if (!s) return { ...v, ...wellnessLive(d, e).visual, example: false };
  const flow = !chemical(d) || s.period === "wellness_flow";
  const level = flow ? s.level : 0;
  return {
    ...v,
    example: true,
    hasTelemetry: true,
    hasLevel: true,
    hasPosition: true,
    powerOn: s.open,
    heating: thermal(d) && s.open && s.value < s.tilt,
    flowAvailable:
      flow &&
      (d.id === "pool_filter" ||
        d.id === "pool_circulation_pump" ||
        d.id === "pool_heater" ||
        d.id === "pool_heat_pump" ||
        chemical(d)) &&
      level > 0,
    active: d.id === "pool_cover" ? s.active : level > 0,
    value: s.value,
    level,
    speed: level,
    position: s.position,
    mode: d.id === "pool_dosing_controller" ? s.metric : s.mode,
    temperature: thermal(d) ? s.value : undefined,
    pressure: d.id === "pool_filter" ? s.value : undefined,
    processPhase: d.id === "pool_filter" ? wellnessFilterPhase(s) : s.program,
    processProgress: s.progress,
    outputs: d.id === "spa_controller" ? [level] : undefined,
    color: s.color,
  };
}
