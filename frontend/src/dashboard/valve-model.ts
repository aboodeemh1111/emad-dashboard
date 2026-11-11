import type { CatalogDevice } from "./device-catalog";
import type { DashboardTextKey } from "./dashboard-model";
import type {
  DeviceAction,
  DeviceControl,
  DeviceInterface,
  DeviceMetric,
  DevicePreviewState,
} from "./device-interface";

export interface ValveSpec {
  body:
    | "ball"
    | "butterfly"
    | "globe"
    | "threeway"
    | "diaphragm"
    | "mixing"
    | "backflow"
    | "sensor";
  actuator:
    | "rotary"
    | "linear"
    | "solenoid"
    | "lever"
    | "wheel"
    | "spring"
    | "thermostat"
    | "safety"
    | "sensor"
    | "none";
  control:
    | "position"
    | "binary"
    | "manual"
    | "pressure"
    | "temperature"
    | "monitor"
    | "safety";
  travelMs: number;
  remote: boolean;
}
const spec = (
  body: ValveSpec["body"],
  actuator: ValveSpec["actuator"],
  control: ValveSpec["control"],
  travelMs = 5000,
  remote = true,
): ValveSpec => ({ body, actuator, control, travelMs, remote });
export const VALVE_SPECS: Readonly<Record<string, ValveSpec>> = {
  motorized_ball_valve: spec("ball", "rotary", "position"),
  motorized_butterfly_valve: spec("butterfly", "rotary", "position", 6000),
  solenoid_valve: spec("diaphragm", "solenoid", "binary", 450),
  modulating_control_valve: spec("globe", "linear", "position"),
  two_way_valve: spec("ball", "rotary", "position"),
  three_way_valve: spec("threeway", "linear", "position"),
  pressure_independent_control_valve: spec("globe", "linear", "position"),
  pressure_reducing_valve: spec("diaphragm", "spring", "pressure", 0, false),
  thermostatic_mixing_valve: spec(
    "mixing",
    "thermostat",
    "temperature",
    0,
    false,
  ),
  balancing_valve: spec("globe", "wheel", "manual", 4000, false),
  isolation_valve: spec("ball", "lever", "manual", 1800, false),
  emergency_shutoff_valve: spec("globe", "safety", "safety", 1200, false),
  valve_position_sensor: spec("sensor", "sensor", "monitor", 0, false),
  backflow_prevention_monitor: spec("backflow", "none", "monitor", 0, false),
  energy_valve: spec("ball", "rotary", "position"),
  irrigation_valve: spec("diaphragm", "solenoid", "binary", 450),
  gas_shutoff_valve: spec("globe", "safety", "safety", 1200, false),
  valve_tamper_switch: spec("sensor", "sensor", "monitor", 0, false),
  gas_regulator_monitor: spec("diaphragm", "spring", "monitor", 0, false),
};
export const valveSpec = (device: CatalogDevice) => VALVE_SPECS[device.id];
const key = (name: string) => `device_${name}` as DashboardTextKey;
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(label), value, unit });
const range = (
  field: "position" | "target",
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
const note = (label: string): DeviceControl => ({
  kind: "note",
  label: key(label),
});
const percent = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export function initialValveState(
  device: CatalogDevice,
  state: DevicePreviewState,
): DevicePreviewState {
  const v = valveSpec(device);
  if (!v) return state;
  const next = {
    ...state,
    active: false,
    position: 65,
    target: 65,
    mode: "manual",
    open: true,
  };
  if (v.control === "binary") {
    Object.assign(next, {
      position: 0,
      target: 0,
      open: false,
      mode: "deenergized",
    });
  }
  if (
    v.control === "safety" ||
    v.actuator === "lever" ||
    device.id === "valve_tamper_switch"
  ) {
    Object.assign(next, { position: 100, target: 100 });
  }
  if (v.control === "pressure" || device.id === "gas_regulator_monitor") {
    Object.assign(next, { target: 3.2, value: 3.2 });
  }
  if (v.control === "temperature") {
    Object.assign(next, { target: 42, value: 42 });
  }
  if (device.id === "backflow_prevention_monitor") next.value = 0.2;
  if (device.id === "energy_valve") next.value = 2.4;
  return next;
}
export function valveIsMoving(
  device: CatalogDevice,
  state: DevicePreviewState,
) {
  const v = valveSpec(device);
  return (
    !!v && v.travelMs > 0 && state.active && state.target !== state.position
  );
}
export function advanceValveState(
  device: CatalogDevice,
  state: DevicePreviewState,
  elapsedMs: number,
): DevicePreviewState {
  const v = valveSpec(device);
  if (!v || !valveIsMoving(device, state)) return state;
  const target = percent(state.target);
  const distance = (100 * Math.max(0, elapsedMs)) / v.travelMs;
  const delta = target - state.position;
  const position =
    Math.abs(delta) <= distance
      ? target
      : state.position + Math.sign(delta) * distance;
  return {
    ...state,
    position,
    open: position > 0,
    active: position !== target,
  };
}
export function valveRange(
  device: CatalogDevice,
  state: DevicePreviewState,
  field: string,
  value: number,
): DevicePreviewState | undefined {
  const v = valveSpec(device);
  if (!v) return undefined;
  if (v.control === "pressure" || v.control === "temperature") {
    const target =
      v.control === "pressure"
        ? Math.max(0.5, Math.min(5.5, value))
        : Math.max(30, Math.min(55, value));
    return { ...state, target, value: target, active: false };
  }
  if (v.control === "monitor" && field === "position") {
    const position = percent(value);
    return {
      ...state,
      position,
      target: position,
      open: position > 0,
      active: false,
      alert: device.id === "valve_tamper_switch" && position < 99,
    };
  }
  if (field !== "target" || v.control === "binary" || v.control === "safety") {
    return state;
  }
  const target = percent(value);
  return {
    ...state,
    target,
    active: Math.abs(target - state.position) > 0.001,
  };
}
export function valveAction(
  device: CatalogDevice,
  state: DevicePreviewState,
  action: DeviceAction,
): DevicePreviewState | undefined {
  const v = valveSpec(device);
  if (!v) return undefined;
  if (v.control === "monitor") {
    if (action === "alarm") {
      return {
        ...state,
        alert: true,
        value: v.body === "backflow" ? -Math.abs(state.value) : state.value,
      };
    }
    if (action === "restore") {
      return {
        ...state,
        alert: false,
        value: v.body === "backflow" ? Math.abs(state.value) : state.value,
      };
    }
    if (action === "sample") {
      return { ...state, value: Number((state.value + 0.05).toFixed(2)) };
    }
    return state;
  }
  if (v.control === "pressure" || v.control === "temperature") return state;
  if (action === "alarm" && v.control === "safety") {
    return { ...state, alert: true, target: 0, active: state.position > 0 };
  }
  if (action === "restore" && v.control === "safety") {
    return state.position === 0
      ? { ...state, alert: false, active: false }
      : state;
  }
  if (
    v.control === "safety" &&
    state.alert &&
    action === "resume" &&
    state.position > 0
  ) {
    return { ...state, target: 0, active: true };
  }
  if (v.control === "safety" && state.alert) return state;
  if (action === "open" || action === "close") {
    const target = action === "open" ? 100 : 0;
    return {
      ...state,
      target,
      active: target !== state.position,
      mode:
        v.control === "binary"
          ? target
            ? "energized"
            : "deenergized"
          : state.mode,
    };
  }
  if (action === "pause" && v.control !== "binary") {
    return { ...state, active: false };
  }
  if (action === "resume") {
    return { ...state, active: state.target !== state.position };
  }
  return state;
}

export function valveInterface(
  device: CatalogDevice,
  state: DevicePreviewState,
): DeviceInterface | undefined {
  const v = valveSpec(device);
  if (!v) return undefined;
  const moving = valveIsMoving(device, state);
  const held = !state.active && Math.abs(state.target - state.position) > 0.001;
  const status = moving
    ? key(state.target > state.position ? "valve_opening" : "valve_closing")
    : held
      ? key("valve_held")
      : key(
          state.position <= 0
            ? "valve_closed"
            : state.position >= 100
              ? "valve_open"
              : "valve_partial",
        );
  let primary = metric("position", state.position, "%");
  let metrics: DeviceMetric[] = [];
  let controls: DeviceControl[];
  let label: DashboardTextKey = status;
  if (v.control === "position" || v.control === "manual") {
    metrics = [
      metric("valve_requested", state.target, "%"),
      metric(
        v.actuator === "linear" ? "valve_stem_travel" : "valve_rotation",
        v.actuator === "linear"
          ? state.position
          : Number(
              (state.position * (v.actuator === "wheel" ? 7.2 : 0.9)).toFixed(
                1,
              ),
            ),
        v.actuator === "linear" ? "%" : "°",
      ),
    ];
    controls = [
      range(
        "target",
        v.control === "manual" ? "valve_manual_setting" : "valve_target",
      ),
      actions("open", held ? "resume" : "pause", "close"),
      note(v.control === "manual" ? "valve_manual_note" : "valve_motion_note"),
    ];
    if (v.actuator === "linear") {
      primary = metric("valve_stem_travel", state.position, "%");
      metrics = [
        metric("valve_requested", state.target, "%"),
        metric("valve_actuation", key("valve_linear")),
      ];
    }
    if (v.actuator === "wheel") {
      metrics = [
        metric("valve_requested", state.target, "%"),
        metric("valve_actuation", key("valve_manual")),
      ];
    }
    if (v.actuator === "lever") {
      primary = metric("valve_state", status);
      metrics = [
        metric(
          "valve_rotation",
          Number((state.position * 0.9).toFixed(1)),
          "°",
        ),
        metric("valve_actuation", key("valve_manual")),
      ];
      controls = [actions("open", "close"), note("valve_manual_note")];
    }
    if (device.id === "three_way_valve") {
      metrics = [
        metric("valve_path_a", state.position, "%"),
        metric("valve_path_b", 100 - state.position, "%"),
      ];
      controls = [
        range("target", "valve_path_target"),
        actions("open", held ? "resume" : "pause", "close"),
        note("valve_paths_note"),
      ];
    }
    if (device.id === "pressure_independent_control_valve") {
      controls.push(note("valve_picv_note"));
    }
    if (device.id === "energy_valve") {
      metrics = [
        metric("valve_requested", state.target, "%"),
        metric(
          "valve_example_flow",
          state.position === 0 ? 0 : state.value,
          "m³/h",
        ),
        metric("valve_example_delta_t", 5.5, "°C"),
      ];
      controls.push(note("valve_flow_note"));
    }
  } else if (v.control === "binary") {
    primary = metric(
      "valve_state",
      moving
        ? status
        : key(state.position === 0 ? "valve_closed" : "valve_open"),
    );
    metrics = [
      metric(
        "valve_coil",
        key(
          state.mode === "energized" ? "valve_energized" : "valve_deenergized",
        ),
      ),
      metric("valve_action", key("valve_normally_closed")),
    ];
    controls = [
      actions(state.mode === "energized" ? "close" : "open"),
      note("valve_binary_note"),
    ];
  } else if (v.control === "pressure") {
    label = key("valve_self_acting");
    primary = metric("outlet_pressure", state.value, "bar");
    metrics = [
      metric("valve_requested_pressure", state.target, "bar"),
      metric("valve_example_inlet", 6, "bar"),
    ];
    controls = [
      range("target", "valve_pressure_setting", 0.5, 5.5, "bar", 0.1),
      note("valve_self_note"),
    ];
  } else if (v.control === "temperature") {
    label = key("valve_self_acting");
    primary = metric("valve_mixed_temperature", state.value, "°C");
    metrics = [
      metric("valve_hot_inlet", 60, "°C"),
      metric("valve_cold_inlet", 18, "°C"),
    ];
    controls = [
      range("target", "valve_temperature_setting", 30, 55, "°C", 0.5),
      note("valve_mixing_note"),
    ];
  } else if (v.control === "safety") {
    label = state.alert
      ? key(moving ? "valve_closing" : "valve_tripped")
      : status;
    primary = metric("valve_state", label);
    metrics = [
      metric("position", state.position, "%"),
      metric("valve_latch", key(state.alert ? "valve_latched" : "valve_armed")),
    ];
    controls = state.alert
      ? state.position > 0
        ? moving
          ? [note("valve_trip_closing")]
          : [actions("resume")]
        : [actions("restore")]
      : [actions("alarm"), ...(state.position === 0 ? [actions("open")] : [])];
    controls.push(note("valve_safety_note"));
  } else {
    label = state.alert ? "catalog_alert" : "catalog_normal";
    if (v.body === "sensor") {
      primary = metric("valve_feedback", state.position, "%");
      metrics = [
        metric(
          "valve_open_limit",
          key(state.position >= 99 ? "valve_made" : "valve_not_made"),
        ),
        metric(
          "valve_closed_limit",
          key(state.position <= 1 ? "valve_made" : "valve_not_made"),
        ),
      ];
      controls = [
        range("position", "valve_sample_feedback"),
        note("valve_sensor_note"),
      ];
    } else if (v.body === "backflow") {
      primary = metric("valve_check_state", label);
      metrics = [metric("valve_example_dp", state.value, "bar")];
      controls = [
        actions(state.alert ? "restore" : "alarm"),
        note("valve_backflow_note"),
      ];
    } else {
      primary = metric("outlet_pressure", state.value, "bar");
      controls = [actions("sample"), note("valve_sensor_note")];
    }
  }
  return { primary, metrics, controls, chart: false, status: label, state };
}
