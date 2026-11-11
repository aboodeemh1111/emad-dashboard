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

export const APPLIANCE_DEVICES = [
  "washing_machine",
  "clothes_dryer",
  "dishwasher",
  "refrigerator",
  "freezer",
  "cold_room_controller",
  "refrigerated_display_case",
  "ice_machine",
  "oven",
  "microwave_oven",
  "induction_hob",
  "smart_cooker_hood",
  "air_fryer",
  "smart_kettle",
  "coffee_machine",
  "water_dispenser",
  "vending_machine",
  "commercial_warewasher",
  "blast_chiller",
] as const;
export const isAppliance = (d: CatalogDevice) => d.category === "appliances";
export const applianceCold = (d: CatalogDevice) =>
  [
    "refrigerator",
    "freezer",
    "cold_room_controller",
    "refrigerated_display_case",
    "blast_chiller",
  ].includes(d.id);
const hot = (d: CatalogDevice) =>
  ["oven", "air_fryer", "smart_kettle"].includes(d.id);
const dispensing = (d: CatalogDevice) =>
  ["coffee_machine", "water_dispenser", "vending_machine"].includes(d.id);
const doors = (d: CatalogDevice) =>
  ![
    "induction_hob",
    "smart_cooker_hood",
    "smart_kettle",
    "coffee_machine",
    "water_dispenser",
    "vending_machine",
  ].includes(d.id);
const continuous = (d: CatalogDevice) =>
  ["smart_cooker_hood", "induction_hob"].includes(d.id);
const enclosure = (d: CatalogDevice) =>
  d.id === "freezer"
    ? "lid"
    : d.id === "air_fryer"
      ? "drawer"
      : d.id === "commercial_warewasher"
        ? "hood"
        : d.id === "ice_machine"
          ? "bin"
          : "door";
const key = (s: string) => `device_appliance_${s}` as DashboardTextKey;
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(label), value, unit });
const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const limits = (d: CatalogDevice) =>
  d.id === "freezer"
    ? [-24, -12, -18]
    : d.id === "blast_chiller"
      ? [-20, 5, -5]
      : applianceCold(d)
        ? [1, 10, 4]
        : d.id === "smart_kettle"
          ? [60, 100, 100]
          : [80, 230, 180];
export function initialApplianceState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isAppliance(d)) return s;
  return {
    ...s,
    active: false,
    open: false,
    alert: false,
    position: 0,
    pan: 0,
    progress: 0,
    program: "idle",
    duration: dispensing(d) ? 6 : 18,
    level: d.id === "smart_kettle" ? 65 : dispensing(d) ? 85 : 0,
    value: applianceCold(d)
      ? d.id === "freezer"
        ? -15
        : d.id === "blast_chiller"
          ? 12
          : 8
      : d.id === "microwave_oven"
        ? 600
        : 22,
    target: limits(d)[2],
    speed: d.id === "induction_hob" ? 5 : 55,
    tilt: 0,
    floor: 0,
    mode: "ap_normal",
    period: "ap_pan_present",
    metric: d.id === "vending_machine" ? "ap_product_a" : "ap_cold",
  };
}
export const applianceIsMoving = (d: CatalogDevice, s: DevicePreviewState) =>
  isAppliance(d) && s.active;
export function applianceActionDisabled(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): boolean {
  if (!isAppliance(d)) return false;
  if (a === "open") {
    return (
      s.open ||
      (d.id === "washing_machine" && (s.program === "running" || s.level > 0))
    );
  }
  if (a === "close") return !s.open;
  if (a === "pause") return s.program !== "running";
  if (["start", "brew", "dispense"].includes(a)) {
    return (
      s.program === "running" ||
      s.program === "draining" ||
      s.position > 0 ||
      s.open ||
      (d.id === "smart_kettle" && s.level < 20) ||
      (["induction_hob", "smart_cooker_hood"].includes(d.id) &&
        s.speed === 0) ||
      (d.id === "induction_hob" &&
        (s.period === "ap_pan_absent" || s.speed === 0)) ||
      (dispensing(d) && s.level < (d.id === "vending_machine" ? 1 : 15))
    );
  }
  if (a === "stop") {
    return (
      ["idle", "complete"].includes(s.program) &&
      !(d.id === "washing_machine" && s.level > 0)
    );
  }
  return false;
}
export function applianceAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isAppliance(d)) return undefined;
  if (applianceActionDisabled(d, s, a)) return s;
  if (a === "open" || a === "close") {
    return {
      ...s,
      open: a === "open",
      pan: a === "open" ? 100 : 0,
      active: true,
      program: s.program === "running" ? "paused" : s.program,
    };
  }
  if (a === "test" && d.id === "smart_cooker_hood") {
    return { ...s, tilt: s.tilt ? 0 : 1 };
  }
  if (a === "pause") {
    return { ...s, program: "paused", active: s.position !== s.pan };
  }
  if (a === "stop") {
    return {
      ...s,
      program: d.id === "washing_machine" && s.level > 0 ? "draining" : "idle",
      progress: 0,
      active:
        s.position !== s.pan || (d.id === "washing_machine" && s.level > 0),
    };
  }
  if (["start", "brew", "dispense"].includes(a)) {
    return {
      ...s,
      program: "running",
      progress: s.program === "paused" ? s.progress : 0,
      floor: 0,
      active: !continuous(d),
    };
  }
  return s;
}
export function applianceRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  n: number,
): DevicePreviewState | undefined {
  if (!isAppliance(d)) return undefined;
  if (!finite(n)) return s;
  if (field === "target") {
    const [min, max] = limits(d);
    return { ...s, target: clamp(n, min, max) };
  }
  if (field === "value" && d.id === "microwave_oven") {
    return { ...s, value: Math.round(clamp(n, 100, 1000) / 100) * 100 };
  }
  if (field === "speed") {
    return {
      ...s,
      speed: clamp(Math.round(n), 0, d.id === "induction_hob" ? 9 : 100),
      ...(n === 0 ? { program: "idle", active: false } : {}),
    };
  }
  if (field === "level") {
    return s.program === "running" ? s : { ...s, level: clamp(n), floor: 0 };
  }
  return s;
}
export function applianceChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: string,
): DevicePreviewState | undefined {
  if (!isAppliance(d)) return undefined;
  const allowed =
    field === "mode"
      ? ["ap_normal", "ap_quick", "ap_gentle"]
      : field === "period"
        ? ["ap_pan_present", "ap_pan_absent"]
        : field === "metric"
          ? [
              "ap_cold",
              "ap_ambient",
              "ap_hot",
              "ap_product_a",
              "ap_product_b",
              "ap_product_c",
            ]
          : [];
  if (
    !allowed.includes(value) ||
    (s.program === "running" && field !== "period")
  ) {
    return s;
  }
  if (
    d.id === "induction_hob" &&
    field === "period" &&
    value === "ap_pan_absent"
  ) {
    return { ...s, period: value, program: "idle", active: false };
  }
  return { ...s, [field]: value };
}
// All example cycles are accelerated, finite illustrations, not equipment timings.
export function advanceApplianceState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!applianceIsMoving(d, s) || !finite(elapsed) || elapsed < 0) return s;
  if (elapsed === 0) return { ...s };
  const step = elapsed / 9;
  const position =
    s.position < s.pan
      ? Math.min(s.pan, s.position + step)
      : Math.max(s.pan, s.position - step);
  if (s.program === "draining") {
    const level = Math.max(0, s.level - elapsed / 70);
    return {
      ...s,
      position,
      level,
      program: level === 0 ? "idle" : "draining",
      active: level > 0 || position !== s.pan,
    };
  }
  if (s.program !== "running") {
    return { ...s, position, active: position !== s.pan };
  }
  const duration =
    s.duration *
    (s.mode === "ap_quick" ? 0.65 : s.mode === "ap_gentle" ? 1.3 : 1);
  let progress = Math.min(100, s.progress + elapsed / (duration * 10));
  const delta = progress - s.progress;

  let value = s.value;
  if (hot(d)) {
    value =
      s.value < s.target
        ? Math.min(
            s.target,
            s.value + delta * (d.id === "smart_kettle" ? 1.2 : 3),
          )
        : s.value;
  }
  if (applianceCold(d)) {
    value =
      s.value > s.target ? Math.max(s.target, s.value - delta * 0.5) : s.value;
  }
  if (d.id === "smart_kettle" && value >= s.target) progress = 100;
  const finished = progress === 100;
  const level =
    d.id === "washing_machine"
      ? progress < 15
        ? progress * 2
        : progress < 65
          ? 30
          : progress < 85
            ? Math.max(0, 30 - (progress - 65) * 1.5)
            : 0
      : dispensing(d)
        ? Math.max(
            0,
            s.level - delta * (d.id === "vending_machine" ? 0.01 : 0.15),
          )
        : s.level;
  return {
    ...s,
    position,
    progress,
    value,
    level,
    floor: dispensing(d) ? progress : s.floor,
    program: finished ? "complete" : "running",
    active: !finished || position !== s.pan,
  };
}
export function appliancePhase(
  d: CatalogDevice,
  s: DevicePreviewState,
): string {
  if (s.position !== s.pan) return s.pan > s.position ? "opening" : "closing";
  if (d.id === "smart_kettle" && s.level < 20) return "low_water";
  if (d.id === "induction_hob" && s.period === "ap_pan_absent") return "no_pan";
  if (s.program !== "running") {
    return s.open ? `${enclosure(d)}_open_state` : s.program;
  }
  if (d.id === "washing_machine") {
    return s.progress < 15
      ? "filling"
      : s.progress < 50
        ? "washing"
        : s.progress < 65
          ? "rinsing"
          : s.progress < 85
            ? "draining"
            : "spinning";
  }
  if (["dishwasher", "commercial_warewasher"].includes(d.id)) {
    return s.progress < 65 ? "washing" : s.progress < 85 ? "rinsing" : "drying";
  }
  if (d.id === "clothes_dryer") {
    return s.progress < 85 ? "tumbling" : "cooldown";
  }
  if (d.id === "ice_machine") {
    return s.progress < 70
      ? "freezing"
      : s.progress < 92
        ? "harvesting"
        : "bin_full";
  }
  if (d.id === "coffee_machine") {
    return s.progress < 20
      ? "preinfusion"
      : s.progress < 85
        ? "brewing"
        : "finishing";
  }
  if (d.id === "water_dispenser") {
    return s.progress < 90 ? "dispensing" : "finishing";
  }
  if (d.id === "vending_machine") {
    return s.progress < 45
      ? "selecting"
      : s.progress < 70
        ? "releasing"
        : "pickup";
  }
  if (applianceCold(d)) return s.value > s.target ? "cooling" : "holding";
  if (d.id === "smart_cooker_hood") return "extracting";
  if (d.id === "microwave_oven") return "cooking";
  if (d.id === "induction_hob") return "heating_pan";
  return s.value < s.target ? "heating" : "holding";
}
export function applianceActionLabel(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DashboardTextKey | undefined {
  if (!isAppliance(d)) return undefined;
  if (a === "open" || a === "close") return key(`${enclosure(d)}_${a}`);
  return key(
    a === "start"
      ? s.program === "paused"
        ? "resume"
        : "start"
      : a === "stop"
        ? d.id === "washing_machine"
          ? "stop_drain"
          : "stop"
        : a === "test"
          ? s.tilt
            ? "lamp_off"
            : "lamp_on"
          : a === "brew"
            ? "brew"
            : a === "dispense"
              ? d.id === "vending_machine"
                ? "vend"
                : "dispense"
              : a,
  );
}
export function applianceInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isAppliance(d)) return undefined;
  const range = (
    field: "target" | "level" | "speed" | "value",
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
  const controls: DeviceControl[] = [];
  const metrics: DeviceMetric[] = [];
  let primary = metric("cycle", s.progress, "%");
  if (applianceCold(d) || hot(d)) {
    primary = metric(
      applianceCold(d) ? "air_temperature" : "example_temperature",
      s.value,
      "°C",
    );
    metrics.push(metric("setpoint", s.target, "°C"));
    const [min, max] = limits(d);
    controls.push(range("target", "setpoint", min, max, "°C"));
  } else if (d.id === "microwave_oven") {
    primary = { label: "device_power_level", value: s.value, unit: "W" };
    metrics.push(metric("cycle", s.progress, "%"));
    controls.push(range("value", "microwave_power", 100, 1000, "W", 100));
  } else if (d.id === "induction_hob" || d.id === "smart_cooker_hood") {
    primary = metric(
      d.id === "induction_hob" ? "power_stage" : "fan_speed",
      s.program === "running" ? s.speed : 0,
      d.id === "induction_hob" ? "" : "%",
    );
    controls.push(
      range(
        "speed",
        d.id === "induction_hob" ? "power_stage" : "fan_speed",
        0,
        d.id === "induction_hob" ? 9 : 100,
        d.id === "induction_hob" ? "" : "%",
      ),
    );
    if (d.id === "induction_hob") {
      controls.push({
        kind: "choices",
        field: "period",
        label: key("cookware"),
        options: ["ap_pan_present", "ap_pan_absent"],
      });
    }
  }
  if (
    [
      "washing_machine",
      "clothes_dryer",
      "dishwasher",
      "commercial_warewasher",
    ].includes(d.id)
  ) {
    controls.push({
      kind: "choices",
      field: "mode",
      label: key("program"),
      options: ["ap_normal", "ap_quick", "ap_gentle"],
    });
  }
  if (d.id === "smart_kettle" || dispensing(d)) {
    controls.push(
      range(
        "level",
        d.id === "smart_kettle"
          ? "water_fill"
          : d.id === "vending_machine"
            ? "stock"
            : "reservoir",
        0,
        100,
        "%",
      ),
    );
    metrics.push(
      metric(d.id === "vending_machine" ? "stock" : "water_fill", s.level, "%"),
    );
  }
  if (d.id === "water_dispenser") {
    controls.push({
      kind: "choices",
      field: "metric",
      label: key("water_selection"),
      options: ["ap_cold", "ap_ambient", "ap_hot"],
    });
  }
  if (d.id === "vending_machine") {
    controls.push({
      kind: "choices",
      field: "metric",
      label: key("product_selection"),
      options: ["ap_product_a", "ap_product_b", "ap_product_c"],
    });
  }
  if (doors(d)) {
    metrics.push(
      metric(
        enclosure(d),
        key(`${enclosure(d)}_${s.open ? "open_state" : "closed_state"}`),
      ),
    );
    controls.push({ kind: "actions", actions: ["open", "close"] });
  }
  controls.push({
    kind: "actions",
    actions: dispensing(d)
      ? [d.id === "coffee_machine" ? "brew" : "dispense", "stop"]
      : continuous(d)
        ? ["start", "stop"]
        : ["start", "pause", "stop"],
  });
  if (d.id === "smart_cooker_hood") {
    controls.push({ kind: "actions", actions: ["test"] });
  }
  controls.push({
    kind: "note",
    label: key(
      d.id === "washing_machine"
        ? "washer_note"
        : applianceCold(d)
          ? "cold_note"
          : d.id === "smart_cooker_hood"
            ? "hood_note"
            : d.id === "induction_hob"
              ? "hob_note"
              : d.id === "smart_kettle"
                ? "kettle_note"
                : dispensing(d)
                  ? "dispense_note"
                  : "example_note",
    ),
  });
  return {
    primary,
    metrics,
    controls,
    chart: false,
    status: key(appliancePhase(d, s)),
    state: s,
  };
}
export function applianceLive(d: CatalogDevice, e?: HassEntity) {
  const unavailable = !e || ["unavailable", "unknown"].includes(e.state);
  const visual: Partial<DeviceVisualState> = {
    active: false,
    powerOn: false,
    heating: false,
    hasTelemetry: false,
    hasPosition: false,
    position: 0,
    open: false,
    level: 0,
    speed: 0,
    processPhase: "unknown",
    processProgress: 0,
    temperature: undefined,
    hasLevel: false,
  };
  const empty = {
    primary: metric("reported_state", "—"),
    metrics: [] as DeviceMetric[],
    status: unavailable
      ? ("unavailable" as DashboardTextKey)
      : key("unreported"),
    visual,
  };
  if (unavailable || !e) return empty;
  const a = e.attributes;
  const unit = a.temperature_unit ?? a.unit_of_measurement;
  const temperature =
    finite(a.current_temperature) && ["°C", "°F"].includes(unit)
      ? a.current_temperature
      : undefined;
  const sensor =
    e.entity_id.startsWith("sensor.") &&
    ["°C", "°F"].includes(unit) &&
    e.state.trim() !== "" &&
    Number.isFinite(Number(e.state));
  const percent = (n: unknown): n is number => finite(n) && n >= 0 && n <= 100;
  const door = typeof a.door_open === "boolean" ? a.door_open : undefined;
  const explicit =
    typeof a.operation_state === "string" ? a.operation_state : undefined;
  const phase =
    explicit &&
    [
      "filling",
      "draining",
      "tumbling",
      "cooldown",
      "preinfusion",
      "finishing",
      "selecting",
      "releasing",
      "pickup",
      "holding",
      "heating_pan",
      "idle",
      "paused",
      "complete",
      "washing",
      "rinsing",
      "spinning",
      "drying",
      "cooking",
      "heating",
      "cooling",
      "brewing",
      "dispensing",
      "extracting",
      "freezing",
      "harvesting",
    ].includes(explicit)
      ? explicit
      : "unknown";
  const running =
    !["unknown", "idle", "paused", "complete"].includes(phase) &&
    door !== true &&
    (d.id !== "induction_hob" || a.pan_present === true);
  const binary =
    /^(switch|fan|input_boolean)\./.test(e.entity_id) &&
    ["on", "off"].includes(e.state);
  const climate = e.entity_id.startsWith("climate.") && applianceCold(d);
  const on = (binary || climate) && e.state !== "off";
  const cooling = climate && a.hvac_action === "cooling" && on && door !== true;
  const speed = percent(a.percentage) ? a.percentage : undefined;
  const metrics: DeviceMetric[] = [];
  if (door !== undefined) {
    metrics.push(
      metric(
        enclosure(d),
        key(`${enclosure(d)}_${door ? "open_state" : "closed_state"}`),
      ),
    );
  }
  if (percent(a.cycle_progress)) {
    metrics.push(metric("cycle", a.cycle_progress, "%"));
  }
  if (finite(a.temperature) && ["°C", "°F"].includes(unit)) {
    metrics.push(metric("reported_setpoint", a.temperature, unit));
  }
  return {
    ...empty,
    primary:
      temperature !== undefined || sensor
        ? metric("reported_temperature", temperature ?? Number(e.state), unit)
        : binary || climate
          ? metric("reported_state", key(on ? "on" : "off"))
          : running
            ? metric("reported_state", key(phase))
            : empty.primary,
    metrics,
    status: key(
      cooling
        ? "cooling"
        : phase !== "unknown"
          ? phase
          : binary || climate
            ? on
              ? "on"
              : "off"
            : "unreported",
    ),
    visual: {
      ...visual,
      hasTelemetry: true,
      powerOn: on || running,
      active:
        running ||
        cooling ||
        (d.id === "smart_cooker_hood" &&
          on &&
          speed !== undefined &&
          speed > 0),
      heating: running && ["heating", "cooking"].includes(phase),
      open: door ?? false,
      hasPosition: door !== undefined,
      position: door ? 100 : 0,
      mode:
        d.id === "induction_hob"
          ? a.pan_present === true
            ? "ap_pan_present"
            : "ap_pan_absent"
          : "",
      metric:
        d.id === "water_dispenser" &&
        ["cold", "ambient", "hot"].includes(a.water_selection)
          ? `ap_${a.water_selection}`
          : "",
      processPhase: cooling ? "cooling" : phase,
      processProgress: percent(a.cycle_progress) ? a.cycle_progress : 0,
      speed: speed ?? 0,
      temperature: temperature ?? (sensor ? Number(e.state) : undefined),
      value:
        d.id === "microwave_oven"
          ? finite(a.power_level) && a.power_unit === "W"
            ? a.power_level
            : 0
          : (temperature ?? (sensor ? Number(e.state) : 0)),
      valueUnit:
        d.id === "microwave_oven"
          ? finite(a.power_level) && a.power_unit === "W"
            ? "W"
            : undefined
          : unit,
      level: percent(a.water_level) ? a.water_level : 0,
      hasLevel: percent(a.water_level),
    },
  };
}
export const applianceRemote = (d: CatalogDevice, e?: HassEntity) =>
  !!e &&
  (/^(switch|input_boolean)\./.test(e.entity_id) ||
    (d.id === "smart_cooker_hood" && e.entity_id.startsWith("fan.")) ||
    (applianceCold(d) && e.entity_id.startsWith("climate.")));
export function applianceVisualState(
  d: CatalogDevice,
  v: DeviceVisualState,
  s?: DevicePreviewState,
  e?: HassEntity,
): DeviceVisualState {
  if (!isAppliance(d)) return v;
  if (!s) return { ...v, ...applianceLive(d, e).visual, example: false };
  const phase = appliancePhase(d, s);
  const operating = s.program === "running" && !s.open && s.position === 0;
  return {
    ...v,
    ...s,
    example: true,
    active: operating,
    powerOn: operating,
    heating:
      operating &&
      (hot(d)
        ? s.value < s.target
        : ["microwave_oven", "induction_hob"].includes(d.id)),
    temperature: hot(d) || applianceCold(d) ? s.value : undefined,
    processPhase: phase,
    processProgress: s.progress,
    hasPosition: true,
    hasLevel: true,
  };
}
