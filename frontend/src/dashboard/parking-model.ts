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

export const PARKING_MOVERS: Readonly<
  Record<string, { seconds: number; mechanism: string }>
> = {
  vehicle_barrier: { seconds: 3.8, mechanism: "boom" },
  motorized_gate: { seconds: 6, mechanism: "sliding" },
  retractable_bollard: { seconds: 4.5, mechanism: "bollard" },
  parking_space_lock: { seconds: 3, mechanism: "folding" },
  turnstile: { seconds: 1.5, mechanism: "tripod" },
  speed_gate: { seconds: 1.8, mechanism: "swing" },
};
export const PARKING_DEVICES = [
  ...Object.keys(PARKING_MOVERS),
  "parking_occupancy_sensor",
  "inductive_loop_detector",
  "vehicle_radar",
  "license_plate_recognition_camera",
  "parking_ticket_dispenser",
  "parking_payment_terminal",
  "vehicle_rfid_reader",
  "parking_guidance_controller",
  "parking_guidance_sign",
  "parking_space_indicator",
  "loading_dock_controller",
] as const;
export const isParking = (d: CatalogDevice) => d.category === "parking";
export const parkingRemote = (d: CatalogDevice) =>
  [
    "vehicle_barrier",
    "motorized_gate",
    "retractable_bollard",
    "parking_space_lock",
  ].includes(d.id);
const detector = (d: CatalogDevice) =>
  [
    "parking_occupancy_sensor",
    "inductive_loop_detector",
    "vehicle_radar",
  ].includes(d.id);
const guidance = (d: CatalogDevice) =>
  ["parking_guidance_controller", "parking_guidance_sign"].includes(d.id);
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const key = (s: string) => `device_parking_${s}` as DashboardTextKey;
const metric = (
  s: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(s), value, unit });
const actions = (...items: DeviceAction[]): DeviceControl => ({
  kind: "actions",
  actions: items,
});
const note = (s: string): DeviceControl => ({ kind: "note", label: key(s) });
const range = (
  field: "target" | "level",
  s: string,
  max = 100,
): DeviceControl => ({
  kind: "range",
  field,
  label: key(s),
  min: 0,
  max,
  step: 1,
  unit: field === "level" ? "" : "%",
});
const choices = (options: string[], s = "bay_state"): DeviceControl => ({
  kind: "choices",
  field: "mode",
  label: key(s),
  options,
});
const smooth = (t: number) => {
  const p = clamp(t, 0, 1);
  return p * p * (3 - 2 * p);
};

export function initialParkingState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  return !isParking(d)
    ? s
    : {
        ...s,
        active: false,
        alert: false,
        position: 0,
        target: 0,
        value: 0,
        progress: 100,
        program: "idle",
        mode:
          d.id === "parking_guidance_sign" ? "parking_left" : "parking_free",
        level: 42,
        channels: 0,
        duration: 0,
      };
}
function move(
  d: CatalogDevice,
  s: DevicePreviewState,
  target: number,
): DevicePreviewState {
  const end = clamp(target);
  if (s.alert && end < s.position) return { ...s, target: end, active: false };
  return {
    ...s,
    value: s.position,
    target: end,
    progress: end === s.position ? 100 : 0,
    program: "motion",
    active: end !== s.position,
    duration: Math.max(
      0.3,
      (PARKING_MOVERS[d.id].seconds * Math.abs(end - s.position)) / 100,
    ),
  };
}
export function parkingIsMoving(d: CatalogDevice, s: DevicePreviewState) {
  return isParking(d) && s.active && s.progress < 100;
}
export function advanceParkingState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!parkingIsMoving(d, s) || !Number.isFinite(elapsed)) return s;
  const progress = clamp(s.progress + Math.max(0, elapsed) / (s.duration * 10));
  const done = progress === 100;
  const position =
    s.program === "motion"
      ? s.value + (s.target - s.value) * smooth(progress / 100)
      : s.position;
  return {
    ...s,
    progress,
    position,
    open: position === 100,
    active: !done,
    channels: s.channels + (done && d.id === "turnstile" ? 1 : 0),
    program:
      done && d.id === "loading_dock_controller"
        ? s.program === "deploy"
          ? "docked"
          : "idle"
        : s.program,
  };
}
export function parkingRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  n: number,
): DevicePreviewState | undefined {
  if (!isParking(d)) return undefined;
  if (!Number.isFinite(n)) return s;
  if (field === "level") return { ...s, level: Math.round(clamp(n, 0, 120)) };
  if (PARKING_MOVERS[d.id] && d.id !== "turnstile") return move(d, s, n);
  return s;
}
export function parkingAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isParking(d)) return undefined;
  if (PARKING_MOVERS[d.id]) {
    if (a === "alarm") {
      return s.active && s.target < s.position
        ? move(d, { ...s, alert: true }, 100)
        : { ...s, alert: true };
    }
    if (a === "restore") return { ...s, alert: false };
    if (a === "pause" || a === "stop") return { ...s, active: false };
    if (a === "resume") return move(d, s, s.target);
    if (d.id === "turnstile" && a === "start") {
      return s.alert
        ? s
        : {
            ...s,
            active: true,
            value: 0,
            position: 0,
            target: 100,
            progress: 0,
            program: "motion",
            duration: 1.5,
          };
    }
    if (a === "open" || a === "close") {
      return move(d, s, a === "open" ? 100 : 0);
    }
    return s;
  }
  if (a === "pause") return { ...s, active: false };
  if (a === "resume") return { ...s, active: s.progress < 100 };
  if (a === "stop") {
    return { ...s, active: false, progress: 100, program: "idle" };
  }
  if (d.id === "loading_dock_controller") {
    if (a === "start" || a === "close") {
      return {
        ...s,
        active: true,
        progress: 0,
        duration: 8,
        program: a === "start" ? "deploy" : "stow",
      };
    }
  }
  if (["sample", "test", "dispense"].includes(a)) {
    return {
      ...s,
      active: true,
      progress: 0,
      program: "cycle",
      duration:
        d.id === "parking_payment_terminal"
          ? 4
          : d.id === "parking_ticket_dispenser"
            ? 2.4
            : 1.8,
    };
  }
  return s;
}
export function parkingPhase(d: CatalogDevice, s: DevicePreviewState): string {
  if (d.id === "loading_dock_controller") {
    if (s.program === "docked") return "dock_ready";
    if (s.program === "idle") return "dock_stowed";
    if (!s.active) return "paused";
    return s.progress < 35
      ? "deck_raise"
      : s.progress < 65
        ? s.program === "deploy"
          ? "lip_extend"
          : "lip_retract"
        : "deck_lower";
  }
  if (s.program === "idle") return "ready";
  if (!s.active && s.progress < 100) return "paused";
  if (d.id === "parking_ticket_dispenser") {
    return s.progress < 100 ? "printing" : "ticket_ready";
  }
  if (d.id === "parking_payment_terminal") {
    return s.progress < 45
      ? "processing"
      : s.progress < 75
        ? "approved"
        : "receipt_ready";
  }
  if (d.id === "vehicle_rfid_reader") {
    return s.progress < 100 ? "reading_tag" : "tag_read";
  }
  if (d.id === "license_plate_recognition_camera") {
    return s.progress < 100 ? "capturing" : "plate_read";
  }
  return "ready";
}
export function parkingActionLabel(
  d: CatalogDevice,
  a: DeviceAction,
  s: DevicePreviewState,
): DashboardTextKey | undefined {
  let label: string | undefined;
  if (a === "alarm") label = "block_beam";
  else if (a === "restore") label = "clear_beam";
  else if (a === "resume") label = "resume";
  else if (a === "pause") label = "pause";
  else if (d.id === "retractable_bollard" && (a === "open" || a === "close")) {
    label = a === "open" ? "lower_bollard" : "raise_bollard";
  } else if (d.id === "parking_space_lock" && (a === "open" || a === "close")) {
    label = a === "open" ? "fold_lock" : "raise_lock";
  } else if (d.id === "turnstile" && a === "start") label = "one_passage";
  else if (
    d.id === "loading_dock_controller" &&
    (a === "start" || a === "close")
  ) {
    label = a === "start" ? "deploy_dock" : "stow_dock";
  } else if (a === "dispense") label = "print_ticket";
  else if (a === "test") label = "payment_example";
  else if (a === "sample") {
    label = d.id === "vehicle_rfid_reader" ? "read_tag" : "capture_plate";
  } else if (a === "stop") {
    label =
      s.program === "cycle" && s.progress === 100
        ? d.id === "parking_ticket_dispenser"
          ? "take_ticket"
          : "reset_result"
        : "end_example";
  }
  return label ? key(label) : undefined;
}
export function parkingInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isParking(d)) return undefined;
  const m = PARKING_MOVERS[d.id];
  let primary: DeviceMetric;
  let metrics: DeviceMetric[] = [];
  let controls: DeviceControl[];
  let status = key("ready");
  if (m) {
    const tripod = d.id === "turnstile";
    primary = metric(
      tripod ? "indexed_angle" : "passage_opening",
      s.position * (tripod ? 1.2 : 1),
      tripod ? "°" : "%",
    );
    status = key(
      s.alert
        ? "obstruction"
        : s.active
          ? s.target > s.position
            ? "opening"
            : "closing"
          : s.position === 0
            ? "closed"
            : s.position === 100
              ? "open"
              : "held",
    );
    if (tripod) {
      status = key(
        s.alert
          ? "obstruction"
          : s.active
            ? "indexing"
            : s.progress < 100
              ? "held"
              : "ready",
      );
    }
    metrics = tripod
      ? [metric("passages", s.channels)]
      : [
          metric("requested_opening", s.target, "%"),
          metric("beam_state", key(s.alert ? "beam_blocked" : "beam_clear")),
        ];
    if (d.id === "vehicle_barrier") {
      metrics.push(metric("arm_angle", s.position * 0.9, "°"));
    }
    if (d.id === "speed_gate") {
      metrics.push(metric("leaf_angle", s.position * 0.9, "°"));
    }
    if (d.id === "retractable_bollard") {
      metrics.push(
        metric("example_height", 650 * (1 - s.position / 100), "mm"),
      );
    }
    controls = tripod
      ? [
          actions(
            ...((s.active
              ? ["pause"]
              : s.progress < 100
                ? ["resume"]
                : ["start"]) as DeviceAction[]),
          ),
        ]
      : [
          range("target", "requested_opening"),
          actions("open", "pause", "close"),
          ...(s.progress < 100 && !s.active ? [actions("resume")] : []),
          actions(s.alert ? "restore" : "alarm"),
        ];
    controls.push(note(tripod ? "tripod_note" : "motion_note"));
  } else if (detector(d) || d.id === "parking_space_indicator") {
    const occupied = s.mode === "parking_occupied";
    primary = metric("bay_state", `device_option_${s.mode}`);
    status = key(
      occupied
        ? "occupied"
        : s.mode === "parking_reserved"
          ? "reserved"
          : "free",
    );
    controls = [
      choices(
        d.id === "parking_space_indicator"
          ? ["parking_free", "parking_occupied", "parking_reserved"]
          : ["parking_free", "parking_occupied"],
      ),
      note(
        d.id === "inductive_loop_detector"
          ? "loop_note"
          : d.id === "vehicle_radar"
            ? "radar_note"
            : "occupancy_note",
      ),
    ];
  } else if (guidance(d)) {
    primary = metric("free_spaces", 120 - s.level);
    metrics = [
      metric("occupied_spaces", s.level),
      metric("example_capacity", 120),
    ];
    controls = [
      range("level", "example_occupied", 120),
      ...(d.id === "parking_guidance_sign"
        ? [
            choices(
              ["parking_left", "parking_right", "parking_straight"],
              "direction",
            ),
          ]
        : []),
      note("guidance_note"),
    ];
  } else {
    const phase = parkingPhase(d, s);
    primary = metric("state", key(phase));
    status = key(phase);
    if (d.id === "loading_dock_controller") {
      metrics = [
        metric("cycle_progress", s.progress, "%"),
        metric(
          "restraint",
          key(s.program === "idle" ? "released" : "example_engaged"),
        ),
      ];
      controls = [
        actions(
          ...((s.active
            ? ["pause"]
            : s.progress < 100
              ? ["resume"]
              : s.program === "docked"
                ? ["close"]
                : ["start"]) as DeviceAction[]),
        ),
        note("dock_note"),
      ];
    } else {
      if (d.id === "license_plate_recognition_camera") {
        metrics = [
          metric(
            "example_plate",
            s.progress === 100 && s.program !== "idle" ? "EMAD 042" : "—",
          ),
        ];
      }
      if (d.id === "vehicle_rfid_reader") {
        metrics = [
          metric(
            "example_tag",
            s.progress === 100 && s.program !== "idle" ? "DEMO-042" : "—",
          ),
        ];
      }
      if (d.id === "parking_payment_terminal") {
        metrics = [metric("example_fee", 8, "SAR")];
      }
      controls = [
        actions(
          ...((s.active
            ? ["stop"]
            : s.program !== "idle"
              ? ["stop"]
              : [
                  d.id === "parking_ticket_dispenser"
                    ? "dispense"
                    : d.id === "parking_payment_terminal"
                      ? "test"
                      : "sample",
                ]) as DeviceAction[]),
        ),
        note(
          d.id === "license_plate_recognition_camera"
            ? "camera_note"
            : d.id === "vehicle_rfid_reader"
              ? "rfid_note"
              : d.id === "parking_payment_terminal"
                ? "payment_note"
                : "ticket_note",
        ),
      ];
    }
  }
  return { primary, metrics, controls, chart: false, status, state: s };
}
export function parkingVisualState(
  d: CatalogDevice,
  base: DeviceVisualState,
  s?: DevicePreviewState,
  entity?: HassEntity,
): DeviceVisualState {
  if (!isParking(d)) return base;
  if (s) {
    return {
      ...base,
      example: true,
      hasTelemetry: true,
      hasPosition: !!PARKING_MOVERS[d.id],
      position: s.position,
      target: s.target,
      active: s.active,
      alert: s.alert,
      mode: s.mode,
      level: s.level,
      processPhase: parkingPhase(d, s),
      processProgress: s.progress,
      program: s.program,
    };
  }
  const a = entity?.attributes ?? {};
  const finite = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);
  const pos =
    finite(a.current_position) &&
    a.current_position >= 0 &&
    a.current_position <= 100
      ? a.current_position
      : entity?.entity_id.startsWith("cover.") && entity.state === "closed"
        ? 0
        : undefined;
  const state = entity?.state;
  const occupied =
    typeof a.occupied === "boolean"
      ? a.occupied
      : entity?.entity_id.startsWith("binary_sensor.") &&
          ["on", "off"].includes(state ?? "")
        ? state === "on"
        : state === "occupied"
          ? true
          : state === "free"
            ? false
            : undefined;
  const count =
    finite(a.occupied_spaces) &&
    Number.isInteger(a.occupied_spaces) &&
    a.occupied_spaces >= 0
      ? a.occupied_spaces
      : undefined;
  const capacity =
    finite(a.capacity) && Number.isInteger(a.capacity) && a.capacity >= 0
      ? a.capacity
      : undefined;
  const reserved = d.id === "parking_space_indicator" && state === "reserved";
  const countsKnown =
    count !== undefined && capacity !== undefined && count <= capacity;
  const known =
    base.available &&
    (guidance(d)
      ? countsKnown
      : PARKING_MOVERS[d.id]
        ? pos !== undefined
        : occupied !== undefined || reserved);
  return {
    ...base,
    example: false,
    active: false,
    hasPosition: base.available && pos !== undefined,
    hasTelemetry: known,
    position: pos ?? 0,
    target: undefined,
    processProgress: undefined,
    processPhase: undefined,
    program: undefined,
    mode: guidance(d)
      ? base.available &&
        ["left", "right", "straight"].includes(String(a.direction))
        ? `parking_${a.direction}`
        : "unknown"
      : base.available && reserved
        ? "parking_reserved"
        : base.available && occupied !== undefined
          ? occupied
            ? "parking_occupied"
            : "parking_free"
          : "unknown",
    level:
      base.available &&
      count !== undefined &&
      capacity !== undefined &&
      count <= capacity
        ? capacity - count
        : 0,
    value: capacity ?? 0,
    alert: base.available && a.obstruction === true,
  };
}
/** Illustrative leveler geometry: raise the deck, extend/retract the lip, then lower. */
export function parkingDockPose(program: string, progress: number) {
  const p = clamp(progress) / 100;
  if (program === "idle") return { deck: 0, lip: -90 };
  if (program === "docked") return { deck: -3, lip: 0 };
  const stow = program === "stow";
  return {
    deck:
      p < 0.35
        ? (stow ? -3 : 0) + (stow ? 21 : 18) * smooth(p / 0.35)
        : p < 0.65
          ? 18
          : 18 - (stow ? 18 : 21) * smooth((p - 0.65) / 0.35),
    lip:
      p < 0.35
        ? stow
          ? 0
          : -90
        : p < 0.65
          ? stow
            ? -90 * smooth((p - 0.35) / 0.3)
            : -90 + 90 * smooth((p - 0.35) / 0.3)
          : stow
            ? -90
            : 0,
  };
}
