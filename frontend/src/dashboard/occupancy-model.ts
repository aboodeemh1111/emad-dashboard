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

export const OCCUPANCY_DEVICES = [
  "occupancy_sensor",
  "millimeter_wave_presence_sensor",
  "people_counter",
  "directional_people_counter",
  "desk_occupancy_sensor",
  "seat_occupancy_sensor",
  "bed_occupancy_sensor",
  "room_booking_panel",
  "room_availability_display",
  "queue_management_terminal",
  "visitor_management_terminal",
  "asset_tracking_tag",
  "asset_tracking_gateway",
  "assistance_call_button",
] as const;
export const isOccupancy = (d: CatalogDevice) => d.category === "occupancy";
const binary = (d: CatalogDevice) =>
  [
    "occupancy_sensor",
    "millimeter_wave_presence_sensor",
    "desk_occupancy_sensor",
    "seat_occupancy_sensor",
    "bed_occupancy_sensor",
  ].includes(d.id);
const pressure = (d: CatalogDevice) =>
  ["seat_occupancy_sensor", "bed_occupancy_sensor"].includes(d.id);
const counter = (d: CatalogDevice) =>
  ["people_counter", "directional_people_counter"].includes(d.id);
const panel = (d: CatalogDevice) =>
  ["room_booking_panel", "room_availability_display"].includes(d.id);
const key = (s: string) => `device_occupancy_${s}` as DashboardTextKey;
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(label), value, unit });
const actions = (...items: DeviceAction[]): DeviceControl => ({
  kind: "actions",
  actions: items,
});
const note = (s: string): DeviceControl => ({ kind: "note", label: key(s) });
const choice = (options: string[], s = "example_state"): DeviceControl => ({
  kind: "choices",
  field: "mode",
  label: key(s),
  options,
});
const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
export const occupancyIsMoving = (d: CatalogDevice, s: DevicePreviewState) =>
  isOccupancy(d) && s.active && s.progress < 100;
export function initialOccupancyState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isOccupancy(d)) return s;
  return {
    ...s,
    active: false,
    alert: false,
    program: "idle",
    progress: 100,
    position: 0,
    target: 0,
    mode: panel(d) ? "room_available" : "room_vacant",
    value: d.id === "directional_people_counter" ? 3 : 0,
    channels: d.id === "queue_management_terminal" ? 42 : 0,
    level: 0,
    duration: 0,
  };
}
function cycle(
  s: DevicePreviewState,
  program: string,
  duration: number,
): DevicePreviewState {
  return { ...s, program, duration, progress: 0, active: true };
}
export function advanceOccupancyState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!occupancyIsMoving(d, s) || !Number.isFinite(elapsed)) return s;
  const progress = clamp(s.progress + Math.max(0, elapsed) / (s.duration * 10));
  const position =
    s.program === "load"
      ? s.value + (s.target - s.value) * smooth(progress / 100)
      : s.position;
  if (progress < 100) return { ...s, progress, position };
  const out = { ...s, progress: 100, position, active: false };
  if (d.id === "people_counter") {
    out.channels++;
    out.program = "idle";
  } else if (d.id === "directional_people_counter") {
    if (s.program === "enter") {
      out.value++;
      out.channels++;
    } else if (s.program === "leave") {
      out.value = Math.max(0, out.value - 1);
      out.level++;
    }
    out.program = "idle";
  } else if (d.id === "occupancy_sensor") {
    out.mode = "room_vacant";
    out.program = "idle";
  } else if (d.id === "millimeter_wave_presence_sensor") {
    out.mode = "room_still";
    out.program = "idle";
  } else if (d.id === "room_booking_panel") {
    out.mode =
      s.program === "reserve"
        ? "room_reserved"
        : s.program === "checkin"
          ? "room_in_use"
          : "room_available";
    out.program = "idle";
  } else if (d.id === "queue_management_terminal") {
    out.channels++;
    out.program = "ticket_ready";
  } else if (d.id === "visitor_management_terminal") {
    out.channels++;
    out.program = "checked_in";
  } else if (d.id === "assistance_call_button") {
    out.program = s.program === "call" ? "pending" : "acknowledged";
  } else {
    if (["asset_tracking_tag", "asset_tracking_gateway"].includes(d.id)) {
      out.channels++;
    }
    out.program = "idle";
  }
  return out;
}
export function occupancyChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: string,
): DevicePreviewState | undefined {
  if (!isOccupancy(d)) return undefined;
  if (field !== "mode") return s;
  const valid =
    d.id === "room_availability_display"
      ? ["room_available", "room_reserved", "room_in_use"]
      : d.id === "millimeter_wave_presence_sensor"
        ? ["room_vacant", "room_moving", "room_still"]
        : ["room_vacant", "room_occupied"];
  if (!valid.includes(value)) return s;
  if (pressure(d)) {
    return {
      ...cycle(s, "load", 0.9),
      value: s.position,
      target: value === "room_occupied" ? 100 : 0,
      mode: value,
    };
  }
  if (d.id === "millimeter_wave_presence_sensor" && value === "room_moving") {
    return { ...cycle(s, "presence", 2.8), mode: value };
  }
  return { ...s, mode: value, active: false, program: "idle", progress: 100 };
}
export function occupancyActionDisabled(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): boolean {
  if (!isOccupancy(d)) return false;
  if (a === "pause") return !s.active;
  if (a === "resume") return s.active || s.progress === 100;
  if (s.active && !["pause", "stop", "restore"].includes(a)) return true;
  return (
    d.id === "directional_people_counter" && a === "close" && s.value === 0
  );
}
export function occupancyAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isOccupancy(d)) return undefined;
  if (occupancyActionDisabled(d, s, a)) return s;
  if (a === "pause") return { ...s, active: false };
  if (a === "resume") return { ...s, active: s.progress < 100 };
  if (a === "stop") {
    return {
      ...s,
      active: false,
      progress: 100,
      program: "idle",
      ...(d.id === "occupancy_sensor" ? { mode: "room_vacant" } : {}),
    };
  }
  switch (d.id) {
    case "occupancy_sensor":
      return a === "sample"
        ? { ...cycle(s, "motion", 3.6), mode: "room_moving" }
        : s;
    case "people_counter":
      return a === "sample" ? cycle(s, "crossing", 2.4) : s;
    case "directional_people_counter":
      return a === "open" || a === "close"
        ? cycle(s, a === "open" ? "enter" : "leave", 2.8)
        : s;
    case "room_booking_panel":
      return a === "open" || a === "close" || a === "sample"
        ? cycle(
            s,
            a === "open" ? "reserve" : a === "sample" ? "checkin" : "release",
            0.7,
          )
        : s;
    case "queue_management_terminal":
      return a === "dispense" ? cycle(s, "print", 2.2) : s;
    case "visitor_management_terminal":
      return a === "test" ? cycle(s, "checkin", 2.4) : s;
    case "asset_tracking_tag":
      return a === "sample" ? cycle(s, "advertise", 0.8) : s;
    case "asset_tracking_gateway":
      return a === "sample" ? cycle(s, "receive", 1.2) : s;
    case "assistance_call_button":
      if (a === "alarm") return { ...cycle(s, "call", 0.45), alert: true };
      if (a === "test") return cycle(s, "ack", 0.45);
      if (a === "restore") {
        return {
          ...s,
          active: false,
          alert: false,
          program: "idle",
          progress: 100,
        };
      }
      return s;
    default:
      return s;
  }
}
export function occupancyPhase(
  d: CatalogDevice,
  s: DevicePreviewState,
): string {
  if (s.progress < 100 && !s.active) return "paused";
  if (d.id === "occupancy_sensor") {
    return s.active
      ? s.progress < 65
        ? "motion_detected"
        : "hold_time"
      : "vacant";
  }
  if (d.id === "millimeter_wave_presence_sensor") {
    return s.mode === "room_vacant"
      ? "vacant"
      : s.mode === "room_still"
        ? "stationary_presence"
        : "moving_presence";
  }
  if (pressure(d)) return s.position >= 50 ? "occupied" : "vacant";
  if (d.id === "desk_occupancy_sensor") {
    return s.mode === "room_occupied" ? "occupied" : "vacant";
  }
  if (counter(d)) return s.active ? "counting" : "ready";
  if (panel(d)) return s.active ? "updating" : s.mode.replace("room_", "");
  if (d.id === "queue_management_terminal") {
    return s.program === "print"
      ? "printing"
      : s.program === "ticket_ready"
        ? "ticket_ready"
        : "ready";
  }
  if (d.id === "visitor_management_terminal") {
    return s.program === "checkin"
      ? s.progress < 55
        ? "reading_code"
        : "printing_badge"
      : s.program === "checked_in"
        ? "checked_in"
        : "ready";
  }
  if (d.id === "asset_tracking_tag" || d.id === "asset_tracking_gateway") {
    return s.active
      ? "packet_activity"
      : s.channels > 0
        ? "packet_seen"
        : "ready";
  }
  return s.alert
    ? s.program === "acknowledged"
      ? "acknowledged"
      : "call_pending"
    : "normal";
}
export function occupancyActionLabel(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DashboardTextKey | undefined {
  if (!isOccupancy(d)) return undefined;
  if (a === "pause" || a === "resume") {
    return key(a === "pause" ? "pause_example" : "resume_example");
  }
  if (a === "stop") {
    return key(
      d.id === "queue_management_terminal" && s.program === "ticket_ready"
        ? "take_ticket"
        : "clear_example",
    );
  }
  if (d.id === "occupancy_sensor") return key("simulate_motion");
  if (d.id === "people_counter") return key("run_crossing");
  if (d.id === "directional_people_counter") {
    return key(a === "open" ? "person_enter" : "person_leave");
  }
  if (d.id === "room_booking_panel") {
    return key(
      a === "open"
        ? "reserve_room"
        : a === "sample"
          ? "check_in"
          : "release_room",
    );
  }
  if (d.id === "queue_management_terminal") return key("issue_ticket");
  if (d.id === "visitor_management_terminal") return key("run_checkin");
  if (d.id === "asset_tracking_tag") return key("send_packet");
  if (d.id === "asset_tracking_gateway") return key("receive_packet");
  if (d.id === "assistance_call_button") {
    return key(
      a === "alarm"
        ? "simulate_call"
        : a === "test"
          ? "simulate_ack"
          : "reset_call",
    );
  }
  return undefined;
}
export function occupancyInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isOccupancy(d)) return undefined;
  const phase = occupancyPhase(d, s);
  let primary = metric("state", key(phase));
  let metrics: DeviceMetric[] = [];
  let controls: DeviceControl[];
  if (d.id === "occupancy_sensor") {
    metrics = [
      metric(
        "example_cycle_remaining",
        s.progress < 100 ? Math.max(0, ((100 - s.progress) / 100) * 3.6) : 0,
        "s",
      ),
    ];
    controls = [actions("sample"), note("pir_note")];
  } else if (d.id === "millimeter_wave_presence_sensor") {
    controls = [
      choice(["room_vacant", "room_moving", "room_still"]),
      note("radar_note"),
    ];
  } else if (
    [
      "desk_occupancy_sensor",
      "seat_occupancy_sensor",
      "bed_occupancy_sensor",
    ].includes(d.id)
  ) {
    controls = [
      choice(["room_vacant", "room_occupied"]),
      note(pressure(d) ? "pressure_note" : "desk_note"),
    ];
  } else if (counter(d)) {
    primary = metric(
      d.id === "people_counter" ? "crossings" : "example_inside",
      d.id === "people_counter" ? s.channels : s.value,
    );
    metrics =
      d.id === "directional_people_counter"
        ? [
            metric("entries", s.channels),
            metric("exits", s.level),
            metric("example_start_count", 3),
          ]
        : [];
    controls = [
      d.id === "people_counter" ? actions("sample") : actions("open", "close"),
      note(d.id === "people_counter" ? "counter_note" : "directional_note"),
    ];
  } else if (d.id === "room_booking_panel") {
    primary = { label: "device_room_state", value: key(phase), unit: "" };
    metrics = [metric("example_booking_length", 30, "min")];
    controls = [
      s.mode === "room_available"
        ? actions("open")
        : s.mode === "room_reserved"
          ? actions("sample", "close")
          : actions("close"),
      note("booking_note"),
    ];
  } else if (d.id === "room_availability_display") {
    controls = [
      choice(["room_available", "room_reserved", "room_in_use"]),
      note("availability_note"),
    ];
  } else if (d.id === "queue_management_terminal") {
    primary = metric(
      "example_queue_number",
      `Q${String(s.channels + (s.program === "print" ? 1 : 0)).padStart(3, "0")}`,
    );
    controls = [
      actions(
        "dispense",
        ...(s.program === "ticket_ready" ? ["stop" as DeviceAction] : []),
      ),
      note("queue_note"),
    ];
  } else if (d.id === "visitor_management_terminal") {
    metrics = [metric("example_checkins", s.channels)];
    controls = [
      s.program === "checked_in" ? actions("stop") : actions("test"),
      note("visitor_note"),
    ];
  } else if (
    d.id === "asset_tracking_tag" ||
    d.id === "asset_tracking_gateway"
  ) {
    primary = metric("example_packets", s.channels);
    metrics =
      d.id === "asset_tracking_gateway" && s.channels > 0
        ? [metric("example_rssi", -58, "dBm")]
        : [];
    controls = [actions("sample"), note("tracking_note")];
  } else {
    controls = [
      s.alert
        ? s.program === "acknowledged"
          ? actions("restore")
          : actions("test", "restore")
        : actions("alarm"),
      note("call_note"),
    ];
  }
  if (s.active) {
    controls = [
      ...controls.slice(0, -1),
      actions("pause"),
      controls[controls.length - 1],
    ];
  } else if (s.progress < 100) {
    controls = [actions("resume", "stop"), controls[controls.length - 1]];
  }
  return {
    primary,
    metrics,
    controls,
    chart: false,
    status: key(phase),
    state: s,
  };
}
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export function occupancyLive(
  d: CatalogDevice,
  e?: HassEntity,
): {
  primary?: DeviceMetric;
  metrics: DeviceMetric[];
  mode: string;
  count?: number;
  known: boolean;
  alert: boolean;
  phase?: string;
} {
  const empty = {
    metrics: [] as DeviceMetric[],
    mode: "unknown",
    known: false,
    alert: false,
  };
  if (!e || ["unknown", "unavailable"].includes(e.state)) return empty;
  const a = e.attributes;
  const metrics: DeviceMetric[] = [];
  if (
    typeof a.battery_level === "number" &&
    Number.isFinite(a.battery_level) &&
    a.battery_level >= 0 &&
    a.battery_level <= 100
  ) {
    metrics.push({
      label: "device_battery",
      value: a.battery_level,
      unit: "%",
    });
  }
  if (
    typeof a.rssi === "number" &&
    Number.isFinite(a.rssi) &&
    a.rssi <= 0 &&
    a.rssi >= -127 &&
    a.rssi_unit === "dBm"
  ) {
    metrics.push(metric("reported_rssi", a.rssi, "dBm"));
  }
  if (binary(d)) {
    const present =
      typeof a.occupancy === "boolean"
        ? a.occupancy
        : e.entity_id.startsWith("binary_sensor.") &&
            ["on", "off"].includes(e.state)
          ? e.state === "on"
          : e.state === "occupied"
            ? true
            : e.state === "vacant"
              ? false
              : undefined;
    return {
      ...empty,
      metrics,
      known: present !== undefined,
      mode:
        present === undefined
          ? "unknown"
          : present
            ? "room_occupied"
            : "room_vacant",
      ...(present === undefined
        ? {}
        : { primary: metric("state", key(present ? "occupied" : "vacant")) }),
    };
  }
  if (counter(d)) {
    const n = e.state.trim() ? Number(e.state) : Number.NaN;
    const valid =
      integer(n) &&
      [undefined, "", "people", "persons", "count"].includes(
        a.unit_of_measurement,
      );
    for (const [name, label] of [
      ["in_count", "entries"],
      ["out_count", "exits"],
    ] as const) {
      if (integer(a[name])) metrics.push(metric(label, a[name]));
    }
    return {
      ...empty,
      metrics,
      known: valid,
      count: valid ? n : undefined,
      ...(valid ? { primary: metric("reported_count", n) } : {}),
    };
  }
  if (panel(d)) {
    const state =
      typeof a.booking_state === "string" ? a.booking_state : e.state;
    const known = ["available", "reserved", "in_use"].includes(state);
    return {
      ...empty,
      metrics,
      known,
      mode: known ? `room_${state}` : "unknown",
      ...(known ? { primary: metric("state", key(state)) } : {}),
    };
  }
  if (d.id === "assistance_call_button") {
    const on =
      e.state === "on" || e.state === "pending" || e.state === "acknowledged";
    const known = on || e.state === "off" || e.state === "normal";
    const phase = on
      ? e.state === "acknowledged" || a.acknowledged === true
        ? "acknowledged"
        : "call_pending"
      : "normal";
    return {
      ...empty,
      metrics,
      known,
      alert: known && on,
      phase: known ? phase : undefined,
      ...(known ? { primary: metric("state", key(phase)) } : {}),
    };
  }
  return { ...empty, metrics };
}
export function occupancyVisualState(
  d: CatalogDevice,
  base: DeviceVisualState,
  s?: DevicePreviewState,
  e?: HassEntity,
): DeviceVisualState {
  if (!isOccupancy(d)) return base;
  if (s) {
    return {
      ...base,
      example: true,
      active: s.active,
      alert: s.alert,
      hasTelemetry: true,
      position: s.position,
      mode: s.mode,
      value:
        d.id === "queue_management_terminal"
          ? s.channels + (s.program === "print" ? 1 : 0)
          : d.id === "people_counter"
            ? s.channels
            : s.value,
      level: s.level,
      target: s.target,
      processProgress: s.progress,
      processPhase: occupancyPhase(d, s),
      program: s.program,
    };
  }
  const live = occupancyLive(d, e);
  return {
    ...base,
    example: false,
    active: false,
    alert: live.alert,
    hasTelemetry: live.known,
    position: live.mode === "room_occupied" ? 100 : 0,
    mode: live.mode,
    value: live.count ?? 0,
    level: 0,
    target: undefined,
    processProgress: undefined,
    processPhase: live.phase,
    program: undefined,
  };
}
