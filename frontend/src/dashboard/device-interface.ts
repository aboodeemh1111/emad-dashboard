import type { HassEntity } from "home-assistant-js-websocket";
import {
  initialCleaningState,
  cleaningInterface,
  cleaningAction,
} from "./cleaning-model";
import {
  initialApplianceState,
  applianceInterface,
  applianceAction,
} from "./appliance-model";
import {
  initialWellnessState,
  wellnessInterface,
  wellnessAction,
} from "./wellness-model";
import {
  initialWeatherState,
  weatherInterface,
  weatherAction,
} from "./weather-model";
import {
  initialLightingState,
  lightingInterface,
  lightingAction,
} from "./lighting-model";
import {
  initialOccupancyState,
  occupancyInterface,
  occupancyAction,
} from "./occupancy-model";
import type { CatalogDevice, CatalogReading } from "./device-catalog";
import { catalogReading } from "./device-catalog";
import type { DashboardTextKey } from "./dashboard-model";
import { domainOf, isAvailable } from "./dashboard-model";
import { physicalProfile } from "./device-physical-profiles";
import type { DeviceVisualState } from "./device-visual-state";
import {
  initialTreatmentState,
  treatmentInterface,
  treatmentAction,
} from "./treatment-model";
import {
  initialParkingState,
  parkingInterface,
  parkingAction,
} from "./parking-model";
import { initialWaterState, waterInterface, waterAction } from "./water-model";
import { initialValveState, valveInterface, valveAction } from "./valve-model";

export interface DevicePreviewState {
  channels: number;
  active: boolean;
  alert: boolean;
  open: boolean;
  value: number;
  target: number;
  level: number;
  position: number;
  speed: number;
  pan: number;
  tilt: number;
  floor: number;
  color: string;
  mode: string;
  period: string;
  metric: string;
  duration: number;
  progress: number;
  program: string;
}
type NumericField = {
  [K in keyof DevicePreviewState]: DevicePreviewState[K] extends number
    ? K
    : never;
}[keyof DevicePreviewState];
export type DeviceAction =
  | "resume"
  | "start"
  | "stop"
  | "open"
  | "close"
  | "pause"
  | "lock"
  | "unlock"
  | "alarm"
  | "restore"
  | "sample"
  | "dock"
  | "flush"
  | "brew"
  | "dispense"
  | "compact"
  | "test";
export type DeviceControl =
  | {
      kind: "range";
      field: NumericField;
      label: DashboardTextKey;
      min: number;
      max: number;
      step: number;
      unit: string;
    }
  | {
      kind: "choices";
      field: "mode" | "period" | "metric" | "program";
      label: DashboardTextKey;
      options: readonly string[];
    }
  | { kind: "actions"; actions: readonly DeviceAction[] }
  | { kind: "note"; label: DashboardTextKey }
  | { kind: "color" }
  | { kind: "floors"; max: number }
  | { kind: "ports"; count: number; interactive?: boolean };
export interface DeviceMetric {
  label: DashboardTextKey;
  value: number | string;
  unit: string;
}
export interface DeviceInterface {
  primary: DeviceMetric;
  metrics: DeviceMetric[];
  controls: DeviceControl[];
  chart: boolean;
  status: DashboardTextKey;
  state: DevicePreviewState;
}
export const deviceTextKey = (key: string) =>
  `device_${key}` as DashboardTextKey;
export const optionTextKey = (key: string) => deviceTextKey(`option_${key}`);
export const actionTextKey = (key: DeviceAction) =>
  deviceTextKey(`action_${key}`);
const range = (
  field: NumericField,
  label: string,
  min: number,
  max: number,
  unit = "%",
  step = 1,
): DeviceControl => ({
  kind: "range",
  field,
  label: deviceTextKey(label),
  min,
  max,
  step,
  unit,
});
const choices = (
  field: "mode" | "period" | "metric" | "program",
  label: string,
  options: readonly string[],
): DeviceControl => ({
  kind: "choices",
  field,
  label: deviceTextKey(label),
  options,
});
const actions = (...items: DeviceAction[]): DeviceControl => ({
  kind: "actions",
  actions: items,
});
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: deviceTextKey(label), value, unit });

function readingForDevice(device: CatalogDevice): CatalogReading {
  const reading = catalogReading(device);
  const id = device.id;
  const kind = physicalProfile(device).interaction;
  if (kind === "climate") {
    return {
      ...reading,
      value: id === "spa_controller" ? 36 : 23,
      unit: "°C",
      min: id === "spa_controller" ? 20 : 16,
      max: id === "spa_controller" ? 40 : 30,
      step: 0.5,
    };
  }
  if (id === "dissolved_oxygen_sensor") {
    return { ...reading, value: 8.2, unit: "mg/L", min: 0, max: 20, step: 0.1 };
  }
  if (id.includes("humidity") || id.includes("moisture")) {
    return { ...reading, value: 46, unit: "%", min: 0, max: 100 };
  }
  if (id.includes("gas_pressure")) {
    return { ...reading, value: 2.8, unit: "bar", max: 10, step: 0.1 };
  }
  if (id.includes("water_pressure")) {
    return { ...reading, value: 3.2, unit: "bar", max: 10, step: 0.1 };
  }
  if (id.includes("people_counter")) {
    return { ...reading, value: 12, unit: "", max: 100, step: 1 };
  }
  if (id.includes("uv_sensor")) {
    return { ...reading, value: 4.2, unit: "UV", max: 12, step: 0.1 };
  }
  if (id.includes("air_quality")) {
    return { ...reading, value: 32, unit: "AQI", max: 500, step: 1 };
  }
  if (id.includes("voc")) {
    return { ...reading, value: 120, unit: "ppb", max: 1000, step: 1 };
  }
  if (id.includes("load_cell")) {
    return { ...reading, value: 250, unit: "kg", max: 1000 };
  }
  if (id.includes("rain_gauge")) {
    return { ...reading, value: 2.4, unit: "mm", max: 50 };
  }
  if (kind === "heating") {
    return {
      ...reading,
      value: id.includes("sauna") ? 70 : id.includes("incubator") ? 37 : 55,
      unit: "°C",
      min: id.includes("sauna") ? 40 : 20,
      max: id.includes("sauna") ? 100 : 85,
      step: 0.5,
    };
  }
  if (kind === "cold" || kind === "fridge") {
    return {
      ...reading,
      value: /freezer/.test(id) ? -18 : 4,
      unit: "°C",
      min: -30,
      max: 12,
      step: 0.5,
    };
  }
  if (kind === "cooling") {
    return {
      ...reading,
      value: id.includes("chiller") ? 7 : 22,
      unit: "°C",
      min: 4,
      max: 30,
      step: 0.5,
    };
  }
  if (kind === "humidity") {
    return { ...reading, value: 46, unit: "%", min: 20, max: 80 };
  }
  if (kind === "oven") {
    return {
      ...reading,
      value: id.includes("microwave") ? 600 : 180,
      unit: id.includes("microwave") ? "W" : "°C",
      min: id.includes("microwave") ? 100 : 50,
      max: id.includes("microwave") ? 1000 : 250,
      step: id.includes("microwave") ? 100 : 5,
    };
  }
  if (kind === "kettle") {
    return { ...reading, value: 80, unit: "°C", min: 40, max: 100, step: 5 };
  }
  if (kind === "pressure_pump" || kind === "pressure_valve") {
    return { ...reading, value: 3.2, unit: "bar", min: 0.5, max: 8, step: 0.1 };
  }
  if (kind === "mixing_valve") {
    return { ...reading, value: 42, unit: "°C", min: 20, max: 65, step: 0.5 };
  }
  if (kind === "drive") {
    return { ...reading, value: 42, unit: "Hz", min: 0, max: 60 };
  }
  return reading;
}
export function initialDeviceState(device: CatalogDevice): DevicePreviewState {
  const reading = readingForDevice(device);
  const kind = physicalProfile(device).interaction;
  const state: DevicePreviewState = {
    channels: 11,
    active: ![
      "alarm",
      "fire",
      "medical",
      "robot",
      "appliance",
      "oven",
      "coffee",
      "kettle",
      "dispenser",
      "bin",
    ].includes(kind),
    alert: false,
    open: false,
    value: reading.value,
    target:
      kind === "light" && /tunable|rgbw/.test(device.id)
        ? 3200
        : kind === "ev"
          ? 80
          : kind === "battery"
            ? 20
            : reading.value,
    level: 68,
    position: 65,
    speed: 60,
    pan: 0,
    tilt: 0,
    floor: 3,
    color: "#efbf5b",
    mode:
      kind === "climate"
        ? "cool"
        : ["camera", "ptz"].includes(kind)
          ? "live"
          : kind === "reader"
            ? "card"
            : kind === "clock"
              ? "format_24"
              : "auto",
    period: "day",
    metric: /water_meter|gas_meter|fuel_flow|effluent/.test(device.id)
      ? "total"
      : ["network", "poe", "gateway", "io", "server"].includes(kind)
        ? "status"
        : "energy",
    duration: 10,
    progress: 42,
    program:
      kind === "coffee"
        ? "espresso"
        : ["media", "display", "projector"].includes(kind)
          ? "music"
          : ["climate", "cooling", "cold"].includes(kind)
            ? "auto"
            : "normal",
  };
  if (["fire", "medical", "alarm"].includes(kind)) state.metric = "zone_1";
  if (kind === "server") state.metric = "cpu";
  if (device.id === "thermal_camera") state.mode = "thermal";
  if (device.id === "ceiling_fan") state.mode = "forward";
  if (device.id === "water_dispenser") state.mode = "cold";
  if (
    device.id === "commercial_display" ||
    device.id === "video_wall_controller"
  ) {
    state.program = "hdmi";
  }
  if (
    [
      "robot_lawn_mower",
      "delivery_robot",
      "inspection_robot",
      "security_robot",
    ].includes(device.id)
  ) {
    state.program = "zone_1";
  }
  if (device.id === "robot_docking_station") {
    state.target = 80;
    state.mode = "auto";
  }
  if (device.id === "audio_matrix" || device.id === "video_matrix") {
    state.mode = "input_1";
    state.program = "output_1";
  }
  if (kind === "treatment" && device.id.includes("dosing")) state.target = 2;
  if (kind === "electrical") state.metric = "status";
  if (kind === "ev") state.mode = "eco";
  if (kind === "escalator") state.mode = "up";
  if (device.id === "analog_output_module") state.target = 5;
  if (device.id === "voltage_sensor") state.metric = "voltage";
  if (device.id === "ev_load_controller") {
    state.target = 32;
    state.mode = "auto";
  }
  if (device.id === "energy_diverter") {
    state.target = 2.4;
    state.mode = "auto";
  }
  return initialCleaningState(
    device,
    initialApplianceState(
      device,
      initialWellnessState(
        device,
        initialOccupancyState(
          device,
          initialParkingState(
            device,
            initialTreatmentState(
              device,
              initialWeatherState(
                device,
                initialLightingState(
                  device,
                  initialWaterState(device, initialValveState(device, state)),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
export function deviceInterface(
  device: CatalogDevice,
  state: DevicePreviewState,
): DeviceInterface {
  const cleaningModel = cleaningInterface(device, state);
  if (cleaningModel) return cleaningModel;
  const applianceModel = applianceInterface(device, state);
  if (applianceModel) return applianceModel;
  const wellnessModel = wellnessInterface(device, state);
  if (wellnessModel) return wellnessModel;
  const weatherModel = weatherInterface(device, state);
  if (weatherModel) return weatherModel;
  const lightingModel = lightingInterface(device, state);
  if (lightingModel) return lightingModel;
  const occupancyModel = occupancyInterface(device, state);
  if (occupancyModel) return occupancyModel;
  const parkingModel = parkingInterface(device, state);
  if (parkingModel) return parkingModel;
  const treatmentModel = treatmentInterface(device, state);
  if (treatmentModel) return treatmentModel;
  const waterModel = waterInterface(device, state);
  if (waterModel) return waterModel;
  const valveModel = valveInterface(device, state);
  if (valveModel) return valveModel;
  const p = physicalProfile(device);
  const kind = p.interaction;
  const id = device.id;
  const reading = readingForDevice(device);
  let primary: DeviceMetric = {
    label: reading.label,
    value: state.value,
    unit: reading.unit,
  };
  let metrics: DeviceMetric[] = [];
  let controls: DeviceControl[] = [];
  let chart = false;
  let status: DashboardTextKey = state.active
    ? "catalog_running"
    : "catalog_standby";
  const history = () => {
    chart = true;
    controls = [
      choices("period", "history", ["hour", "day", "week"]),
      actions("sample"),
    ];
  };
  const operating = () => actions(state.active ? "stop" : "start");
  switch (kind) {
    case "climate":
    case "heating":
    case "cooling":
    case "cold":
    case "fridge":
    case "kettle":
    case "oven":
    case "mixing_valve": {
      primary = metric(
        kind === "oven" && id.includes("microwave")
          ? "power_level"
          : "measured_temperature",
        state.value,
        reading.unit,
      );
      metrics = [
        metric("target", state.target, reading.unit),
        metric("load", state.active ? 62 : 0, "%"),
      ];
      controls = [
        range(
          "target",
          kind === "oven" && id.includes("microwave")
            ? "power_level"
            : "target_temperature",
          reading.min,
          reading.max,
          reading.unit,
          reading.step,
        ),
      ];
      if (kind === "climate") {
        controls.push(
          choices("mode", "hvac_mode", ["cool", "heat", "auto", "dry", "fan"]),
        );
      }
      if (
        ["climate", "cooling", "cold"].includes(kind) &&
        !id.includes("radiator")
      ) {
        controls.push(
          choices("program", "fan_mode", ["auto", "low", "medium", "high"]),
        );
      }
      if (kind === "oven") {
        controls.push(
          choices("program", "cooking_mode", ["normal", "eco", "boost"]),
        );
      }
      if (kind === "fridge") {
        controls.push(actions(state.open ? "close" : "open"));
      }
      controls.push(operating());
      break;
    }
    case "humidity":
    case "purifier":
    case "fan":
    case "damper":
    case "pump":
    case "pressure_pump":
    case "drive": {
      const position = kind === "damper";
      const pressure = kind === "pressure_pump";
      primary = position
        ? metric("opening", state.position, "%")
        : pressure
          ? metric("pressure", state.value, "bar")
          : kind === "humidity"
            ? metric("humidity", state.value, "%")
            : kind === "pump"
              ? metric("flow", state.active ? state.speed * 0.04 : 0, "m³/h")
              : kind === "drive"
                ? metric("frequency", state.value, "Hz")
                : metric("speed", state.speed, "%");
      metrics =
        kind === "pump" || pressure
          ? [
              metric("pressure", state.active ? 3.2 : 0, "bar"),
              metric("motor_load", state.active ? state.speed : 0, "%"),
            ]
          : [
              metric(
                "power",
                state.active ? Math.round(state.speed * 1.8) : 0,
                "W",
              ),
              metric(
                kind === "fan" ? "rotation_speed" : "filter_remaining",
                kind === "fan" ? (state.active ? state.speed * 18 : 0) : 84,
                kind === "fan" ? "rpm" : "%",
              ),
            ];
      controls = [
        position
          ? range("position", "opening", 0, 100)
          : kind === "humidity"
            ? range("target", "target_humidity", 20, 80)
            : pressure
              ? range("target", "target_pressure", 0.5, 8, "bar", 0.1)
              : kind === "drive"
                ? range("target", "frequency", 0, 60, "Hz")
                : range("speed", "speed", 0, 100),
        choices("mode", "operating_mode", ["auto", "manual"]),
        operating(),
      ];
      break;
    }
    case "tank":
    case "bin": {
      primary = metric(
        kind === "bin" ? "fill" : "water_level",
        state.level,
        "%",
      );
      metrics = [
        metric("capacity", id.includes("waste") ? 240 : 1000, "L"),
        metric(
          "remaining",
          Math.round((100 - state.level) * (id.includes("waste") ? 2.4 : 10)),
          "L",
        ),
      ];
      controls = [
        range("level", "sample_level", 0, 100),
        actions(state.open ? "close" : "open"),
      ];
      if (kind === "bin" && id.includes("compactor")) {
        controls.push(actions("compact"));
      }
      chart = true;
      break;
    }
    case "valve":
    case "pressure_valve":
    case "shade":
    case "door":
    case "barrier": {
      const pressure = kind === "pressure_valve";
      primary = pressure
        ? metric("outlet_pressure", state.value, "bar")
        : metric("position", state.position, "%");
      metrics = pressure
        ? [
            metric("inlet_pressure", 5.6, "bar"),
            metric("flow", state.position * 0.03, "m³/h"),
          ]
        : kind === "valve"
          ? [
              metric("flow", state.position * 0.03, "m³/h"),
              metric("pressure", 3.2, "bar"),
            ]
          : [metric("opening", state.position, "%")];
      controls = [
        pressure
          ? range("target", "target_pressure", 0.5, 8, "bar", 0.1)
          : range(
              "position",
              kind === "shade" && id.includes("glass") ? "opacity" : "opening",
              0,
              100,
            ),
        actions("open", "pause", "close"),
      ];
      if (id === "venetian_blind" || id === "motorized_louver") {
        controls.splice(1, 0, range("tilt", "slat_angle", -80, 80, "°"));
      }
      if (id === "energy_valve") metrics.push(metric("delta_t", 5.5, "°C"));
      break;
    }
    case "light": {
      primary = metric("brightness", state.level, "%");
      metrics = [metric("power", Math.round(state.level * 0.12), "W")];
      controls = [range("level", "brightness", 0, 100)];
      if (/rgb/.test(id)) controls.push({ kind: "color" });
      if (/tunable|rgbw/.test(id)) {
        controls.push(
          range("target", "color_temperature", 2000, 6500, "K", 100),
        );
      }
      controls.push(operating());
      break;
    }
    case "sensor":
    case "quality":
    case "vibration":
    case "meter":
    case "electrical":
    case "network":
    case "server":
    case "gateway":
    case "io":
    case "poe":
    case "clock": {
      if (kind === "meter" && /water|gas|fuel|effluent/.test(id)) {
        primary = metric(
          state.metric === "flow"
            ? "flow"
            : state.metric === "pressure"
              ? "pressure"
              : "total",
          state.metric === "flow"
            ? 2.4
            : state.metric === "pressure"
              ? 3.2
              : state.value,
          state.metric === "flow"
            ? "m³/h"
            : state.metric === "pressure"
              ? "bar"
              : "m³",
        );
        metrics = [metric("flow", 2.4, "m³/h"), metric("pressure", 3.2, "bar")];
        history();
        controls.unshift(
          choices("metric", "measurement", ["total", "flow", "pressure"]),
        );
      } else if (kind === "electrical") {
        primary = metric(
          "contacts",
          state.active ? "catalog_closed" : "catalog_open",
        );
        metrics = [
          metric("current", state.active ? 12.4 : 0, "A"),
          metric("voltage", 230, "V"),
        ];
        controls = [
          actions("open", "close"),
          choices("metric", "diagnostics", ["status", "current", "voltage"]),
        ];
      } else if (kind === "meter") {
        primary = metric(
          state.metric === "energy"
            ? "energy"
            : state.metric === "voltage"
              ? "voltage"
              : "current",
          state.metric === "energy"
            ? state.value
            : state.metric === "voltage"
              ? 230
              : 12.4,
          state.metric === "energy"
            ? reading.unit
            : state.metric === "voltage"
              ? "V"
              : "A",
        );
        metrics = [metric("power_factor", 0.98), metric("frequency", 50, "Hz")];
        history();
        controls.unshift(
          choices("metric", "measurement", ["energy", "voltage", "current"]),
        );
      } else if (["network", "poe", "gateway", "io", "server"].includes(kind)) {
        primary = metric(
          kind === "io"
            ? "channels"
            : kind === "gateway"
              ? "messages"
              : "latency",
          kind === "io" ? p.ports : kind === "gateway" ? 128 : 12,
          kind === "io" ? "" : kind === "gateway" ? "/s" : "ms",
        );
        metrics = [
          metric("connected_ports", p.ports),
          metric("uptime", 99.98, "%"),
        ];
        controls = [
          {
            kind: "ports",
            count: p.ports,
            interactive: kind === "io" && !id.includes("input"),
          },
          choices("metric", "diagnostics", ["status", "traffic", "channels"]),
          actions("sample"),
        ];
        chart = true;
      } else if (kind === "clock") {
        primary = metric("time", "12:40");
        metrics = [
          metric("synchronization", 1, "ms"),
          metric("connected_clocks", id === "master_clock" ? 24 : 1),
        ];
        controls = [
          choices("mode", "time_format", ["format_12", "format_24"]),
          actions("sample"),
        ];
      } else {
        history();
        metrics = [
          metric(
            "minimum",
            Number((state.value * 0.9).toFixed(2)),
            reading.unit,
          ),
          metric(
            "maximum",
            Number((state.value * 1.1).toFixed(2)),
            reading.unit,
          ),
        ];
      }
      break;
    }
    case "alarm":
    case "fire":
    case "medical": {
      status = state.alert ? "catalog_alert" : "catalog_normal";
      primary = metric("alarm_state", status);
      metrics = [
        metric("zones", kind === "medical" ? 4 : id.includes("panel") ? 8 : 1),
        metric(
          "signal",
          state.alert ? "device_signal_alarm" : "device_signal_normal",
        ),
      ];
      controls = [
        ...(id.includes("panel") || kind === "medical"
          ? [choices("metric", "zones", ["zone_1", "zone_2", "zone_3"])]
          : []),
        actions(state.alert ? "restore" : "alarm"),
      ];
      break;
    }
    case "occupancy":
    case "parking":
    case "counter":
    case "reader":
    case "lock":
    case "intercom": {
      primary =
        kind === "counter"
          ? metric("people", Math.round(state.value))
          : kind === "lock"
            ? metric(
                "lock_state",
                state.open ? "catalog_unlocked" : "catalog_locked",
              )
            : metric(
                kind === "parking" ? "parking_state" : "presence",
                state.open ? "catalog_occupied" : "catalog_clear",
              );
      metrics =
        kind === "counter"
          ? [metric("entries", 28), metric("exits", 16)]
          : kind === "reader"
            ? [metric("credentials", 32), metric("last_scan", "12:40")]
            : [
                metric("battery", 94, "%"),
                metric("signal_strength", -58, "dBm"),
              ];
      controls =
        kind === "lock"
          ? [actions(state.open ? "lock" : "unlock")]
          : kind === "intercom"
            ? [
                actions(state.active ? "stop" : "start"),
                actions("open", "close"),
              ]
            : kind === "reader"
              ? [
                  choices("mode", "access_mode", ["card", "pin", "schedule"]),
                  actions("test"),
                ]
              : [actions("sample")];
      if (kind === "counter") chart = true;
      break;
    }
    case "camera":
    case "ptz": {
      primary = metric(
        "stream",
        state.active ? "device_stream_live" : "device_stream_paused",
      );
      metrics = [
        metric(
          "resolution",
          id === "thermal_camera" ? "640 × 480" : "1920 × 1080",
        ),
        metric("frame_rate", 25, "fps"),
      ];
      controls = [
        choices(
          "mode",
          "camera_view",
          id === "thermal_camera"
            ? ["thermal", "normal"]
            : ["live", "recordings"],
        ),
      ];
      if (kind === "ptz") {
        controls.push(
          range("pan", "pan", -90, 90, "°"),
          range("tilt", "tilt", -45, 45, "°"),
        );
      }
      controls.push(operating());
      break;
    }
    case "elevator":
    case "escalator": {
      primary =
        kind === "elevator"
          ? metric("current_floor", state.floor)
          : metric("speed", state.active ? 0.5 : 0, "m/s");
      metrics = [
        metric("door_state", state.open ? "catalog_open" : "catalog_closed"),
        metric("load", 38, "%"),
      ];
      controls =
        kind === "elevator"
          ? [
              { kind: "floors", max: id === "dumbwaiter" ? 4 : 8 },
              actions("open", "close"),
            ]
          : [choices("mode", "direction", ["up", "down"]), operating()];
      break;
    }
    case "weather": {
      primary = metric(
        id === "rain_gauge"
          ? "rainfall"
          : id === "wind_direction_sensor"
            ? "wind_direction"
            : "wind_speed",
        id === "wind_direction_sensor" ? 235 : state.value,
        id === "wind_direction_sensor" ? "°" : reading.unit,
      );
      metrics = [metric("temperature", 28, "°C"), metric("humidity", 32, "%")];
      history();
      break;
    }
    case "irrigation":
    case "treatment": {
      primary = metric(
        kind === "irrigation" ? "flow" : "filter_remaining",
        kind === "irrigation" ? (state.active ? 12 : 0) : 84,
        kind === "irrigation" ? "L/min" : "%",
      );
      metrics = [
        metric("pressure", 3.2, "bar"),
        metric("runtime", state.duration, "min"),
      ];
      controls = [
        choices("mode", "operating_mode", ["auto", "manual"]),
        range(
          "duration",
          kind === "irrigation" ? "watering_duration" : "cycle_duration",
          1,
          60,
          "min",
        ),
        operating(),
      ];
      if (id.includes("dosing")) {
        controls.unshift(range("target", "dose", 0, 10, "mL/L", 0.1));
      }
      break;
    }
    case "power":
    case "transfer":
    case "battery":
    case "solar":
    case "ev": {
      primary =
        kind === "battery" || kind === "ev"
          ? metric("state_of_charge", state.level, "%")
          : metric("power", state.active ? 8.4 : 0, "kW");
      metrics = [
        metric("voltage", 230, "V"),
        metric("current", state.active ? 12.4 : 0, "A"),
      ];
      controls =
        kind === "transfer"
          ? [
              choices("mode", "supply_source", ["mains", "backup", "auto"]),
              actions("test"),
            ]
          : kind === "ev"
            ? [
                range("target", "charge_limit", 20, 100),
                choices("mode", "charging_mode", ["eco", "boost", "schedule"]),
                operating(),
              ]
            : kind === "battery"
              ? [
                  range("target", "reserve_level", 10, 90),
                  choices("mode", "storage_mode", [
                    "auto",
                    "charge",
                    "discharge",
                  ]),
                ]
              : kind === "solar"
                ? [
                    choices("period", "history", ["hour", "day", "week"]),
                    actions("sample"),
                  ]
                : [
                    choices("mode", "operating_mode", ["auto", "manual"]),
                    operating(),
                  ];
      chart = true;
      break;
    }
    case "appliance":
    case "coffee":
    case "dispenser":
    case "robot":
    case "media":
    case "display":
    case "projector": {
      primary =
        kind === "robot"
          ? metric("battery", 87, "%")
          : kind === "media" || kind === "display" || kind === "projector"
            ? metric("volume", state.level, "%")
            : kind === "coffee"
              ? metric("brew_temperature", 92, "°C")
              : kind === "dispenser"
                ? metric("remaining", state.level, "%")
                : metric("cycle_progress", state.progress, "%");
      metrics =
        kind === "robot"
          ? [metric("cleaned_area", 28, "m²"), metric("runtime", 24, "min")]
          : kind === "appliance"
            ? [
                metric("remaining_time", 38, "min"),
                metric("temperature", 40, "°C"),
              ]
            : [metric("power", state.active ? 48 : 0, "W")];
      controls =
        kind === "robot"
          ? [
              choices("program", "cleaning_mode", ["quiet", "normal", "turbo"]),
              actions("start", "pause", "dock"),
            ]
          : kind === "coffee"
            ? [
                choices("program", "drink", [
                  "espresso",
                  "double",
                  "americano",
                ]),
                actions("brew", "stop"),
              ]
            : kind === "dispenser"
              ? [
                  actions(
                    id.includes("toilet") || id.includes("urinal")
                      ? "flush"
                      : "dispense",
                  ),
                ]
              : [
                  choices(
                    "program",
                    kind === "appliance" ? "program" : "source",
                    kind === "appliance"
                      ? ["normal", "eco", "quick"]
                      : ["music", "hdmi", "bluetooth"],
                  ),
                  ...(kind === "media"
                    ? [range("level", "volume", 0, 100)]
                    : []),
                  operating(),
                ];
      break;
    }
  }
  if (kind === "tank") controls = [range("level", "sample_level", 0, 100)];
  if (kind === "io") {
    primary = metric(
      "channels",
      state.channels.toString(2).split("1").length - 1,
    );
    metrics = [metric("connected_ports", p.ports)];
  }
  // Product-specific controls and readings within shared mechanical families.
  if (id === "room_booking_panel" || id === "room_availability_display") {
    primary = metric(
      "room_state",
      state.open ? "catalog_occupied" : "catalog_clear",
    );
    metrics = [
      metric("next_booking", "14:00"),
      metric("people", state.open ? 4 : 0),
    ];
    controls = [
      choices("period", "schedule_view", ["day", "week"]),
      actions(state.open ? "close" : "open"),
    ];
  }
  if (id === "queue_management_terminal") {
    primary = metric("queue_number", Math.round(state.value));
    metrics = [metric("waiting", 5), metric("service_desks", 3)];
    controls = [actions("sample")];
  }
  if (id === "visitor_kiosk" || id === "visitor_management_terminal") {
    primary = metric("visitors", state.open ? 13 : 12);
    metrics = [metric("appointments", 8), metric("checked_in", 4)];
    controls = [
      choices("mode", "access_mode", ["card", "pin", "schedule"]),
      actions("test"),
    ];
  }
  if (
    [
      "robot_lawn_mower",
      "delivery_robot",
      "inspection_robot",
      "security_robot",
      "robot_docking_station",
    ].includes(id)
  ) {
    metrics = [
      metric("battery", 87, "%"),
      metric(
        id === "robot_lawn_mower"
          ? "mowed_area"
          : id === "delivery_robot"
            ? "completed_deliveries"
            : "completed_tasks",
        id === "robot_lawn_mower" ? 128 : 5,
        id === "robot_lawn_mower" ? "m²" : "",
      ),
    ];
    controls = [
      choices("program", id === "robot_lawn_mower" ? "mowing_zone" : "route", [
        "zone_1",
        "zone_2",
        "zone_3",
      ]),
      actions("start", "pause", "dock"),
    ];
    if (id === "robot_docking_station") {
      primary = metric("state_of_charge", state.level, "%");
      metrics = [metric("power", state.active ? 42 : 0, "W")];
      controls = [
        range("target", "charge_limit", 20, 100),
        choices("mode", "charging_mode", ["auto", "schedule"]),
        actions("test"),
      ];
    }
  }
  if (id === "smart_toilet" || id === "smart_urinal") {
    primary = metric("flush_volume", id === "smart_toilet" ? 6 : 1.5, "L");
    metrics = [metric("water_used", 24, "L")];
    controls = [
      choices("program", "flush_mode", ["normal", "eco"]),
      actions("flush"),
    ];
  }
  if (id === "water_dispenser") {
    controls = [
      choices("mode", "water_temperature", ["cold", "ambient", "hot"]),
      actions("dispense"),
    ];
  }
  if (id === "commercial_display" || id === "video_wall_controller") {
    primary = metric("brightness", state.level, "%");
    controls = [
      range("level", "brightness", 0, 100),
      choices("program", "source", ["hdmi", "normal"]),
      operating(),
    ];
  }
  if (id === "audio_matrix" || id === "video_matrix") {
    primary = metric("routing", state.mode + " → " + state.program);
    controls = [
      choices("mode", "input", ["input_1", "input_2", "input_3"]),
      choices("program", "output", ["output_1", "output_2", "output_3"]),
      actions("test"),
    ];
  }
  if (kind === "server") {
    primary = metric("cpu_load", state.value, "%");
    metrics = [metric("memory_used", 42, "%"), metric("temperature", 36, "°C")];
    controls = [
      choices("metric", "diagnostics", ["cpu", "memory", "storage"]),
      actions("sample"),
    ];
  }
  if (id === "ceiling_fan") {
    controls = [
      range("speed", "speed", 0, 100),
      choices("mode", "rotation_direction", ["forward", "reverse"]),
      operating(),
    ];
  }
  if (kind === "pressure_pump") {
    controls.splice(1, 0, range("speed", "speed", 0, 100));
  }
  if (kind === "medical") {
    metrics = [
      metric("line_pressure", 4.2, "bar"),
      metric("reserve_level", 80, "%"),
    ];
  }
  if (kind === "clock") {
    primary = metric("time", state.mode === "format_12" ? "12:40 PM" : "12:40");
  }
  if (id === "analog_output_module") {
    primary = metric("output", state.target, "V");
    controls = [range("target", "output", 0, 10, "V", 0.1), actions("test")];
  }
  if (id === "analog_input_module") {
    primary = metric("input", 12.4, "mA");
    metrics = [metric("voltage", 5.2, "V")];
    controls = [
      choices("period", "history", ["hour", "day", "week"]),
      actions("sample"),
    ];
  }
  if (kind === "drive") {
    metrics = [
      metric("current", state.active ? 12.4 : 0, "A"),
      metric("motor_load", state.active ? state.speed : 0, "%"),
    ];
  }
  if (kind === "damper") {
    metrics = [metric("position", state.position, "%")];
  }
  if (id === "ev_load_controller") {
    primary = metric("current", state.active ? 24 : 0, "A");
    metrics = [
      metric("power", state.active ? 5.5 : 0, "kW"),
      metric("voltage", 230, "V"),
    ];
    controls = [
      range("target", "current_limit", 6, 64, "A"),
      choices("mode", "operating_mode", ["auto", "manual"]),
      operating(),
    ];
  }
  if (id === "energy_diverter") {
    primary = metric("diverted_power", state.active ? state.target : 0, "kW");
    metrics = [metric("power", 3.6, "kW"), metric("energy", 8.2, "kWh")];
    controls = [
      range("target", "power_limit", 0, 6, "kW", 0.1),
      choices("mode", "operating_mode", ["auto", "manual"]),
      operating(),
    ];
  }
  if (kind === "treatment" && /dosing|chlorinator|ozone/.test(id)) {
    primary = metric("dose", /dosing/.test(id) ? state.target : 2, "mL/L");
    metrics = [
      metric("flow", state.active ? 2.4 : 0, "m³/h"),
      metric("runtime", state.duration, "min"),
    ];
  }
  if (id === "nurse_call_system") {
    metrics = [
      metric("zones", 8),
      metric(
        "signal",
        state.alert ? "device_signal_alarm" : "device_signal_normal",
      ),
    ];
  }
  if (
    id === "fire_pump" ||
    id === "jockey_pump" ||
    id === "fire_pump_controller"
  ) {
    metrics = [
      metric("pressure", 3.2, "bar"),
      metric("rotation_speed", 0, "rpm"),
    ];
  }
  return { primary, metrics, controls, chart, status, state };
}
export function previewAction(
  state: DevicePreviewState,
  action: DeviceAction,
  device: CatalogDevice,
): DevicePreviewState {
  const cleaningState = cleaningAction(device, state, action);
  if (cleaningState) return cleaningState;
  const applianceState = applianceAction(device, state, action);
  if (applianceState) return applianceState;
  const wellnessState = wellnessAction(device, state, action);
  if (wellnessState) return wellnessState;
  const weatherState = weatherAction(device, state, action);
  if (weatherState) return weatherState;
  const lightingState = lightingAction(device, state, action);
  if (lightingState) return lightingState;
  const occupancyState = occupancyAction(device, state, action);
  if (occupancyState) return occupancyState;
  const parkingState = parkingAction(device, state, action);
  if (parkingState) return parkingState;
  const treatmentState = treatmentAction(device, state, action);
  if (treatmentState) return treatmentState;
  const waterState = waterAction(device, state, action);
  if (waterState) return waterState;
  const valveState = valveAction(device, state, action);
  if (valveState) return valveState;
  const next = { ...state };
  switch (action) {
    case "start":
    case "brew":
    case "dispense":
    case "flush":
      next.active = true;
      break;
    case "stop":
    case "pause":
    case "dock":
      next.active = false;
      break;
    case "open":
    case "unlock":
      next.open = true;
      next.position = 100;
      if (physicalProfile(device).interaction === "electrical") {
        next.active = false;
      }
      break;
    case "close":
    case "lock":
      next.open = false;
      next.position = 0;
      if (physicalProfile(device).interaction === "electrical") {
        next.active = true;
      }
      break;
    case "alarm":
      next.alert = true;
      break;
    case "restore":
      next.alert = false;
      break;
    case "compact":
      next.level = Math.max(0, next.level - 25);
      next.position = 80;
      break;
    case "test":
      next.open = !next.open;
      next.active = !next.active;
      break;
    case "sample": {
      const reading = readingForDevice(device);
      const raw = state.value + (reading.max - reading.min) * 0.035;
      next.value = Number((raw > reading.max ? reading.min : raw).toFixed(2));
      if (
        ["occupancy", "parking"].includes(physicalProfile(device).interaction)
      ) {
        next.open = !next.open;
      }
      break;
    }
  }
  return next;
}
export function previewVisual(state: DevicePreviewState): DeviceVisualState {
  return {
    ...state,
    available: true,
    hasTelemetry: true,
    hasPosition: true,
    example: true,
  };
}
export function entityVisual(entity?: HassEntity): DeviceVisualState {
  const a = entity?.attributes ?? {};
  const domain = domainOf(entity?.entity_id ?? "");
  const numeric = Number(entity?.state);
  const value = Number.isFinite(numeric)
    ? numeric
    : typeof a.current_temperature === "number"
      ? a.current_temperature
      : typeof a.temperature === "number"
        ? a.temperature
        : 0;
  const valveFeatures = Number(a.supported_features ?? 0);
  const binaryValve =
    domain === "valve" &&
    valveFeatures % 2 === 1 &&
    Math.floor(valveFeatures / 2) % 2 === 1 &&
    Math.floor(valveFeatures / 4) % 2 === 0 &&
    Math.floor(valveFeatures / 8) % 2 === 0;
  const inferredValvePosition =
    domain === "valve" &&
    (entity?.state === "closed" || (binaryValve && entity?.state === "open"));
  const percent =
    typeof a.current_position === "number" &&
    Number.isFinite(a.current_position)
      ? Math.max(0, Math.min(100, a.current_position))
      : typeof a.percentage === "number"
        ? a.percentage
        : typeof a.brightness === "number"
          ? a.brightness / 2.55
          : a.unit_of_measurement === "%" && Number.isFinite(numeric)
            ? Math.max(0, Math.min(100, numeric))
            : inferredValvePosition
              ? entity?.state === "open"
                ? 100
                : 0
              : 0;
  const active =
    isAvailable(entity) &&
    (["fan", "switch", "input_boolean", "light"].includes(domain)
      ? entity?.state === "on"
      : domain === "vacuum"
        ? entity?.state === "cleaning"
        : domain === "media_player"
          ? entity?.state === "playing"
          : domain === "valve"
            ? ["opening", "closing"].includes(entity?.state ?? "")
            : domain === "climate"
              ? !["off", "idle"].includes(entity!.state)
              : ["on", "running", "charging", "active"].includes(
                  entity?.state ?? "",
                ));
  const rgb: unknown = a.rgb_color;
  const color =
    Array.isArray(rgb) &&
    rgb.length === 3 &&
    rgb.every((v) => typeof v === "number" && Number.isFinite(v))
      ? `rgb(${rgb.map((v) => Math.max(0, Math.min(255, Number(v)))).join(",")})`
      : "#efbf5b";
  return {
    active,
    available: isAvailable(entity),
    alert:
      ["triggered", "alarm", "problem"].includes(entity?.state ?? "") ||
      (domain === "binary_sensor" &&
        ["smoke", "gas", "problem", "tamper"].includes(a.device_class ?? "") &&
        entity?.state === "on"),
    value,
    level: percent,
    position: percent,
    hasPosition:
      (typeof a.current_position === "number" &&
        Number.isFinite(a.current_position)) ||
      typeof a.percentage === "number" ||
      typeof a.brightness === "number" ||
      (a.unit_of_measurement === "%" && Number.isFinite(numeric)) ||
      inferredValvePosition,
    target:
      domain === "valve" &&
      typeof a.target_position === "number" &&
      Number.isFinite(a.target_position)
        ? Math.max(0, Math.min(100, a.target_position))
        : undefined,
    valueUnit:
      typeof a.unit_of_measurement === "string"
        ? a.unit_of_measurement
        : undefined,
    example: false,
    speed: typeof a.percentage === "number" ? a.percentage : 50,
    pan: typeof a.pan === "number" ? a.pan : 0,
    tilt: typeof a.tilt === "number" ? a.tilt : 0,
    floor: typeof a.current_floor === "number" ? a.current_floor : 0,
    open: entity?.state === "open" || a.door_state === "open",
    mode: entity?.state ?? "",
    color,
    hasTelemetry:
      inferredValvePosition ||
      Number.isFinite(numeric) ||
      typeof a.temperature === "number" ||
      typeof a.current_temperature === "number" ||
      typeof a.current_position === "number" ||
      typeof a.percentage === "number" ||
      typeof a.brightness === "number",
  };
}
