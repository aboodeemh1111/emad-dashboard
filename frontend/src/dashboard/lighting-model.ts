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
import type {
  DeviceVisualState,
  ExitSignDirection,
} from "./device-visual-state";

export const LIGHTING_DEVICES = [
  "smart_light",
  "dimmable_light",
  "tunable_white_light",
  "rgb_light",
  "rgbw_light",
  "led_strip",
  "led_driver",
  "lighting_relay",
  "dimmer",
  "lighting_control_panel",
  "dali_controller",
  "dmx_controller",
  "floodlight",
  "landscape_light",
  "streetlight",
  "emergency_light",
  "exit_sign",
  "daylight_sensor",
  "illuminance_sensor",
  "lighting_keypad",
] as const;
export const isLighting = (d: CatalogDevice) => d.category === "lighting";
const k = (s: string) => `device_lighting_${s}` as DashboardTextKey;
const metric = (
  s: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: k(s), value, unit });
const sensor = (d: CatalogDevice) =>
  ["daylight_sensor", "illuminance_sensor"].includes(d.id);
const emergency = (d: CatalogDevice) =>
  ["emergency_light", "exit_sign"].includes(d.id);
const controller = (d: CatalogDevice) =>
  [
    "lighting_control_panel",
    "dali_controller",
    "dmx_controller",
    "lighting_keypad",
  ].includes(d.id);
const rgb = (d: CatalogDevice) =>
  ["rgb_light", "rgbw_light", "led_strip"].includes(d.id);
const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
export const lightingRemote = (d: CatalogDevice) =>
  !sensor(d) && !controller(d) && !emergency(d);
export function initialLightingState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isLighting(d)) return s;
  const level = emergency(d)
    ? d.id === "exit_sign"
      ? 100
      : 0
    : sensor(d)
      ? 420
      : d.id === "smart_light" || d.id === "lighting_relay"
        ? 100
        : d.id === "led_driver"
          ? 6.8
          : 68;
  return {
    ...s,
    level,
    target: level,
    speed: d.id === "led_driver" ? 6.8 : 68,
    pan: d.id === "dmx_controller" ? 0 : d.id === "streetlight" ? 4000 : 3000,
    tilt: d.id === "dmx_controller" ? 0 : d.id === "streetlight" ? 4000 : 3000,
    position: 0,
    floor: 0,
    value: d.id === "led_driver" ? 6.8 : 0,
    active: false,
    alert: false,
    open: false,
    channels: 0,
    progress: 100,
    program: "idle",
    mode: d.id === "lighting_keypad" ? "light_scene_off" : "light_mains",
    metric: d.id === "exit_sign" ? "exit_down" : "light_channel_1",
    period: d.id === "streetlight" ? "road_night" : s.period,
    color: "#efbf5b",
  };
}
export const lightingIsMoving = (d: CatalogDevice, s: DevicePreviewState) =>
  isLighting(d) && s.active;
export function lightingRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  n: number,
): DevicePreviewState | undefined {
  if (!isLighting(d)) return undefined;
  if (!Number.isFinite(n)) return s;
  if (d.id === "dmx_controller" && field === "value") {
    const f = ["pan", "tilt", "position", "floor"] as const;
    const index = Number(s.metric.slice(-1)) - 1;
    return index >= 0 && index < 4
      ? { ...s, value: clamp(n, 0, 255), [f[index]]: clamp(n, 0, 255) }
      : s;
  }
  if (
    field === "tilt" &&
    ["tunable_white_light", "streetlight"].includes(d.id)
  ) {
    return { ...s, tilt: clamp(n, 2200, 6500), active: true };
  }
  if (field === "position" && d.id === "rgbw_light") {
    return { ...s, position: clamp(n), active: true };
  }
  if (field === "target") {
    return {
      ...s,
      target: clamp(n, 0, d.id === "led_driver" ? 10 : sensor(d) ? 10000 : 100),
      active: true,
      ...(n > 0 ? { speed: n } : {}),
    };
  }
  return s;
}
export function lightingChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  v: string,
): DevicePreviewState | undefined {
  if (!isLighting(d)) return undefined;
  if (
    d.id === "exit_sign" &&
    field === "metric" &&
    ["exit_down", "exit_left", "exit_right", "exit_up"].includes(v)
  ) {
    return { ...s, metric: v };
  }
  if (
    d.id === "streetlight" &&
    field === "period" &&
    ["road_day", "road_night"].includes(v)
  ) {
    return { ...s, period: v };
  }
  if (
    d.id === "dmx_controller" &&
    field === "metric" &&
    /^light_channel_[1-4]$/.test(v)
  ) {
    const f = ["pan", "tilt", "position", "floor"] as const;
    return { ...s, metric: v, value: s[f[Number(v.slice(-1)) - 1]] };
  }
  if (
    d.id === "lighting_keypad" &&
    field === "mode" &&
    [
      "light_scene_off",
      "light_scene_work",
      "light_scene_relax",
      "light_scene_clean",
    ].includes(v)
  ) {
    return { ...s, mode: v, progress: 0, program: "press", active: true };
  }
  return s;
}
export function lightingAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isLighting(d)) return undefined;
  if (emergency(d)) {
    if (a === "test" && s.program !== "test") {
      return { ...s, program: "test", progress: 0, active: true };
    }
    if (a === "alarm") {
      return {
        ...s,
        mode: "light_backup",
        active: false,
        program: "idle",
        progress: 100,
      };
    }
    if (a === "restore") {
      return {
        ...s,
        mode: d.id === "lighting_keypad" ? "light_scene_off" : "light_mains",
        active: false,
        program: "idle",
        progress: 100,
      };
    }
    return s;
  }
  if (a === "start" || a === "stop") {
    return {
      ...s,
      target:
        a === "start"
          ? d.id === "smart_light" || d.id === "lighting_relay"
            ? 100
            : s.speed || 68
          : 0,
      active: true,
    };
  }
  return s;
}
export function advanceLightingState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!lightingIsMoving(d, s) || !Number.isFinite(elapsed) || elapsed < 0) {
    return s;
  }
  // A zero-length first frame must still schedule the next Lit update.
  if (elapsed === 0) return { ...s };
  const approach = (v: number, t: number, rate: number) =>
    Math.abs(t - v) <= elapsed * rate
      ? t
      : v + Math.sign(t - v) * elapsed * rate;
  const level = approach(
    s.level,
    s.target,
    d.id === "led_driver"
      ? 0.015
      : sensor(d)
        ? 15
        : d.id === "streetlight"
          ? 0.4
          : 0.15,
  );
  const pan = approach(s.pan, s.tilt, d.id === "streetlight" ? 24 : 6);
  const floor = approach(s.floor, s.position, 0.15);
  const progress = Math.min(
    100,
    s.progress + elapsed / (s.program === "test" ? 30 : 2.5),
  );
  return {
    ...s,
    level,
    pan,
    floor,
    progress,
    active:
      level !== s.target ||
      pan !== s.tilt ||
      floor !== s.position ||
      progress < 100,
    program: progress === 100 ? "idle" : s.program,
  };
}
export function lightingActionLabel(
  d: CatalogDevice,
  _s: DevicePreviewState,
  a: DeviceAction,
): DashboardTextKey | undefined {
  if (!isLighting(d)) return undefined;
  if (emergency(d)) {
    return k(
      a === "test"
        ? "example_test"
        : a === "alarm"
          ? "mains_loss"
          : "restore_mains",
    );
  }
  return k(
    d.id === "lighting_relay"
      ? a === "start"
        ? "energize"
        : "deenergize"
      : d.id === "led_driver"
        ? a === "start"
          ? "enable_output"
          : "disable_output"
        : a === "start"
          ? "turn_on"
          : "turn_off",
  );
}
export function lightingInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isLighting(d)) return undefined;
  let primary = metric("brightness", s.level, "%");
  let controls: DeviceControl[] = [];
  const metrics: DeviceMetric[] = [];
  const range = (
    field: "target" | "tilt" | "position" | "value",
    label: string,
    min: number,
    max: number,
    unit: string,
    step = 1,
  ): DeviceControl => ({
    kind: "range",
    field,
    label: k(label),
    min,
    max,
    unit,
    step,
  });
  if (sensor(d)) {
    primary = metric("illuminance", s.level, "lx");
    controls = [range("target", "example_illuminance", 0, 10000, "lx", 10)];
  } else if (emergency(d)) {
    primary = metric(
      "supply",
      k(
        s.program === "test"
          ? "test_running"
          : s.mode === "light_backup"
            ? "battery_supply"
            : "mains_supply",
      ),
    );
    controls = [
      {
        kind: "actions",
        actions: s.mode === "light_backup" ? ["restore"] : ["test", "alarm"],
      },
      { kind: "note", label: k("emergency_note") },
    ];
    if (d.id === "exit_sign") {
      metrics.push(
        metric("lamp_output", k("illuminated")),
        metric("installed_direction", `device_option_${s.metric}`),
      );
      controls.splice(0, 0, {
        kind: "choices",
        field: "metric",
        label: k("example_exit_direction"),
        options: ["exit_down", "exit_left", "exit_right", "exit_up"],
      });
    }
  } else if (d.id === "dmx_controller") {
    primary = metric("channel_level", s.value, "/255");
    controls = [
      {
        kind: "choices",
        field: "metric",
        label: k("example_channel"),
        options: [
          "light_channel_1",
          "light_channel_2",
          "light_channel_3",
          "light_channel_4",
        ],
      },
      range("value", "channel_level", 0, 255, "/255"),
    ];
  } else if (controller(d)) {
    primary = metric(
      "selected_scene",
      d.id === "lighting_keypad"
        ? `device_option_${s.mode.startsWith("light_scene_") ? s.mode : "light_scene_off"}`
        : s.channels.toString(2).replaceAll("0", "").length,
    );
    controls =
      d.id === "lighting_keypad"
        ? [
            {
              kind: "choices",
              field: "mode",
              label: k("example_scene"),
              options: [
                "light_scene_off",
                "light_scene_work",
                "light_scene_relax",
                "light_scene_clean",
              ],
            },
          ]
        : [
            {
              kind: "note",
              label: k(
                d.id === "dali_controller" ? "dali_note" : "circuits_note",
              ),
            },
            { kind: "ports", count: 4, interactive: true },
          ];
  } else {
    if (d.id === "led_driver") {
      primary = metric("control_signal", s.level, "V");
      controls.push(range("target", "control_signal", 0, 10, "V", 0.1));
    } else if (d.id === "lighting_relay" || d.id === "smart_light") {
      primary = metric(
        d.id === "lighting_relay" ? "contact" : "state",
        k(
          d.id === "lighting_relay"
            ? s.level >= 99.99
              ? "contact_closed"
              : "contact_open"
            : s.level >= 50
              ? "on"
              : "off",
        ),
      );
    } else controls.push(range("target", "brightness", 0, 100, "%"));
    if (["tunable_white_light", "streetlight"].includes(d.id)) {
      metrics.push(metric("cct", s.pan, "K"));
      controls.push(
        range(
          "tilt",
          d.id === "streetlight" ? "example_lamp_color" : "cct",
          2200,
          6500,
          "K",
          50,
        ),
      );
      if (d.id === "streetlight") {
        controls.push({
          kind: "choices",
          field: "period",
          label: k("road_environment"),
          options: ["road_day", "road_night"],
        });
      }
    }
    if (rgb(d)) controls.push({ kind: "color" });
    if (d.id === "rgbw_light") {
      metrics.push(metric("white_channel", s.floor, "%"));
      controls.push(range("position", "white_channel", 0, 100, "%"));
    }
    controls.push({
      kind: "actions",
      actions: [s.target > 0 ? "stop" : "start"],
    });
  }
  if (!emergency(d)) {
    controls.push({
      kind: "note",
      label: k(
        d.id === "streetlight"
          ? "road_note"
          : d.id === "led_driver"
            ? "driver_note"
            : d.id === "dmx_controller"
              ? "dmx_note"
              : sensor(d)
                ? "sensor_note"
                : "example_note",
      ),
    });
  }
  return {
    primary,
    metrics,
    controls,
    chart: false,
    status: k(
      s.active
        ? "transition"
        : d.id === "streetlight"
          ? s.level === 0
            ? "off"
            : s.level < 100
              ? "dimmed"
              : "on"
          : "ready",
    ),
    state: s,
  };
}
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const byte = (v: unknown): v is number => finite(v) && v >= 0 && v <= 255;
export function lightingLive(
  d: CatalogDevice,
  e?: HassEntity,
): {
  primary: DeviceMetric;
  metrics: DeviceMetric[];
  known: boolean;
  status?: DashboardTextKey;
  level?: number;
  color?: string;
  cct?: number;
  white?: number;
  outputs?: number[];
  hasOutput?: boolean;
  exitDirection?: ExitSignDirection;
  mode: string;
} {
  const empty = {
    primary: metric(
      sensor(d) ? "illuminance" : "state",
      "—",
      sensor(d) ? "lx" : "",
    ),
    metrics: [] as DeviceMetric[],
    known: false,
    status: k("output_unknown"),
    mode: "unknown",
  };
  if (!e || ["unknown", "unavailable"].includes(e.state)) return empty;
  const a = e.attributes;
  if (sensor(d)) {
    const n = e.state.trim() ? Number(e.state) : NaN;
    return a.unit_of_measurement === "lx" && finite(n) && n >= 0
      ? {
          ...empty,
          primary: metric("illuminance", n, "lx"),
          known: true,
          level: n,
        }
      : empty;
  }
  if (emergency(d)) {
    const mains = a.mains_power;
    const exit = d.id === "exit_sign";
    const lamp = exit
      ? typeof a.lamp_on === "boolean"
        ? a.lamp_on
        : e.entity_id.startsWith("light.") && ["on", "off"].includes(e.state)
          ? e.state === "on"
          : undefined
      : typeof mains === "boolean"
        ? !mains
        : undefined;
    if (typeof mains !== "boolean" && lamp === undefined) return empty;
    const metrics: DeviceMetric[] = [];
    if (
      finite(a.battery_level) &&
      a.battery_level >= 0 &&
      a.battery_level <= 100
    ) {
      metrics.push(metric("battery_charge", a.battery_level, "%"));
    }
    const rawDirection = a.exit_direction;
    const direction: ExitSignDirection | undefined =
      rawDirection === "left" ||
      rawDirection === "right" ||
      rawDirection === "up" ||
      rawDirection === "down"
        ? rawDirection
        : undefined;
    if (exit) {
      metrics.push(
        metric(
          "lamp_output",
          k(
            lamp === undefined
              ? "output_unknown"
              : lamp
                ? "illuminated"
                : "not_illuminated",
          ),
        ),
      );
      metrics.push(
        metric(
          "installed_direction",
          direction ? `device_option_exit_${direction}` : "—",
        ),
      );
    }
    return {
      ...empty,
      known: true,
      primary:
        typeof mains === "boolean"
          ? metric("supply", k(mains ? "reported_mains" : "reported_backup"))
          : metric("lamp_output", k(lamp ? "illuminated" : "not_illuminated")),
      mode:
        typeof mains === "boolean"
          ? mains
            ? "light_mains"
            : "light_backup"
          : "unknown",
      level: lamp === undefined ? undefined : lamp ? 100 : 0,
      hasOutput: lamp !== undefined,
      exitDirection: direction,
      metrics,
    };
  }
  if (controller(d)) {
    if (d.id === "lighting_keypad") return empty;
    const levels: unknown = a.channel_levels;
    if (!Array.isArray(levels) || levels.length !== 4 || !levels.every(byte)) {
      return empty;
    }
    return {
      ...empty,
      known: true,
      outputs: levels,
      primary: metric("reported_channels", levels.filter((v) => v > 0).length),
    };
  }
  if (
    !/^(light|switch)\./.test(e.entity_id) ||
    !["on", "off"].includes(e.state)
  ) {
    return empty;
  }
  const on = e.state === "on";
  const brightness = byte(a.brightness) ? a.brightness / 2.55 : undefined;
  const level = on ? brightness : 0;
  const cct =
    finite(a.color_temp_kelvin) &&
    a.color_temp_kelvin >= 1000 &&
    a.color_temp_kelvin <= 10000
      ? a.color_temp_kelvin
      : undefined;
  const rgbColor: unknown = a.rgb_color;
  const rgbw: unknown = a.rgbw_color;
  const triplet =
    Array.isArray(rgbw) && rgbw.length === 4 && rgbw.every(byte)
      ? rgbw
      : Array.isArray(rgbColor) && rgbColor.length === 3 && rgbColor.every(byte)
        ? rgbColor
        : undefined;
  const color = triplet
    ? `#${triplet
        .slice(0, 3)
        .map((v) => Math.round(v).toString(16).padStart(2, "0"))
        .join("")}`
    : undefined;
  const white = triplet?.length === 4 ? triplet[3] / 2.55 : undefined;
  const metrics: DeviceMetric[] = [];
  if (cct !== undefined) metrics.push(metric("cct", cct, "K"));
  if (finite(a.power) && a.power >= 0 && a.power_unit === "W") {
    metrics.push(metric("reported_power", a.power, "W"));
  }
  return {
    ...empty,
    primary:
      brightness !== undefined
        ? metric("brightness", level ?? 0, "%")
        : metric("state", k(on ? "on" : "off")),
    metrics,
    known: true,
    level: level ?? (on ? 100 : 0),
    color,
    cct,
    white,
    mode: on ? "on" : "off",
    status: k(
      !on
        ? "off"
        : brightness === 0
          ? "on_zero"
          : brightness !== undefined && brightness < 100
            ? "dimmed"
            : "on",
    ),
  };
}
export function lightingVisualState(
  d: CatalogDevice,
  v: DeviceVisualState,
  s?: DevicePreviewState,
  e?: HassEntity,
): DeviceVisualState {
  if (!isLighting(d)) return v;
  if (s) {
    const lit = emergency(d)
      ? d.id === "exit_sign" ||
        s.mode === "light_backup" ||
        s.program === "test"
      : s.level > 0;
    return {
      ...v,
      example: true,
      hasTelemetry: true,
      hasLightOutput: true,
      exitDirection:
        d.id === "exit_sign"
          ? (s.metric.replace("exit_", "") as ExitSignDirection)
          : undefined,
      lightEnvironment:
        d.id === "streetlight"
          ? s.period === "road_night"
            ? "night"
            : "day"
          : undefined,
      active: s.active,
      level: emergency(d) ? (lit ? 100 : 0) : s.level,
      position: s.level,
      mode: s.mode,
      color: s.color,
      colorTemperature: s.pan,
      whiteLevel: s.floor,
      processPhase: s.program,
      processProgress: s.progress,
      outputs:
        d.id === "dmx_controller"
          ? [s.pan, s.tilt, s.position, s.floor]
          : Array.from({ length: 4 }, (_, i) =>
              Math.floor(s.channels / 2 ** i) % 2 ? 255 : 0,
            ),
    };
  }
  const live = lightingLive(d, e);
  return {
    ...v,
    example: false,
    active: false,
    hasTelemetry: live.known,
    hasLightOutput: live.hasOutput ?? live.known,
    exitDirection: live.exitDirection,
    level: live.level ?? 0,
    position: live.level ?? 0,
    mode: live.mode,
    color: live.color ?? "#e8ebe9",
    colorTemperature: live.cct,
    whiteLevel: live.white,
    outputs: live.outputs,
    processPhase: "idle",
    processProgress: 100,
  };
}
