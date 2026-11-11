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

export const CLEANING_DEVICES = [
  "robot_vacuum",
  "robot_mop",
  "floor_scrubber",
  "window_cleaning_robot",
  "delivery_robot",
  "inspection_robot",
  "security_robot",
  "robot_docking_station",
  "smart_waste_bin",
  "waste_fill_level_sensor",
  "waste_compactor",
  "waste_chute_controller",
  "soap_dispenser_monitor",
  "paper_dispenser_monitor",
  "smart_tap",
  "smart_toilet",
  "smart_urinal",
] as const;
export const isCleaning = (d: CatalogDevice) => d.category === "cleaning";
export const cleaningRobot = (d: CatalogDevice) =>
  CLEANING_DEVICES.slice(0, 8).includes(
    d.id as (typeof CLEANING_DEVICES)[number],
  );
const wet = (d: CatalogDevice) =>
  ["robot_mop", "floor_scrubber"].includes(d.id);
const enclosure = (d: CatalogDevice) =>
  [
    "smart_waste_bin",
    "waste_compactor",
    "waste_chute_controller",
    "smart_toilet",
    "delivery_robot",
  ].includes(d.id);
const guarded = (d: CatalogDevice) =>
  ["waste_compactor", "waste_chute_controller", "delivery_robot"].includes(
    d.id,
  );
const supply = (d: CatalogDevice) =>
  ["soap_dispenser_monitor", "paper_dispenser_monitor"].includes(d.id);
const key = (s: string) => `device_cleaning_${s}` as DashboardTextKey;
const metric = (
  label: string,
  value: number | string,
  unit = "",
): DeviceMetric => ({ label: key(label), value, unit });
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const percent = (n: unknown): n is number => finite(n) && n >= 0 && n <= 100;
const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
const paused = (s: DevicePreviewState) => s.program.startsWith("paused_");
const job = (s: DevicePreviewState) =>
  [
    "working",
    "returning",
    "aligning",
    "retracting",
    "charging",
    "sampling",
    "refilling",
  ].includes(s.program);
const part = (d: CatalogDevice) =>
  d.id === "delivery_robot"
    ? "compartment"
    : d.id === "waste_chute_controller"
      ? "hatch"
      : d.id === "waste_compactor"
        ? "guard"
        : "lid";
export function initialCleaningState(
  d: CatalogDevice,
  s: DevicePreviewState,
): DevicePreviewState {
  if (!isCleaning(d)) return s;
  return {
    ...s,
    active: false,
    alert: false,
    open: false,
    position: 0,
    target: d.id === "robot_docking_station" ? 90 : 0,
    pan: d.id === "robot_docking_station" ? 0 : -24,
    tilt: d.id === "robot_docking_station" ? 38 : 0,
    value: d.id === "robot_docking_station" ? 25 : 84,
    level: d.id === "smart_toilet" ? 100 : supply(d) ? 75 : wet(d) ? 80 : 62,
    speed: cleaningRobot(d)
      ? d.id === "robot_docking_station"
        ? -180
        : cleaningRoute(0).heading
      : 0,
    progress: 0,
    duration: cleaningRobot(d)
      ? 18
      : d.id === "waste_compactor"
        ? 9
        : d.id === "smart_toilet"
          ? 10
          : 5,
    program: "idle",
    mode: ["smart_toilet", "smart_urinal"].includes(d.id)
      ? "cl_normal"
      : "cl_standard",
    period: d.id === "smart_tap" ? "cl_hand_removed" : "cl_clear",
    metric: "cl_slot_1",
    floor: 0,
  };
}
// Catmull–Rom route, shared by the chassis and the drawn path. Local coordinates only.
export function cleaningRoute(progress: number, mode = "cl_standard") {
  const points =
    mode === "cl_spot"
      ? [
          [-24, 0],
          [-8, -12],
          [12, -12],
          [22, 4],
          [8, 17],
          [-12, 12],
          [-24, 0],
        ]
      : mode === "cl_edge"
        ? [
            [-24, 0],
            [-24, -17],
            [24, -17],
            [24, 17],
            [-24, 17],
            [-24, 0],
          ]
        : [
            [-24, 0],
            [22, 0],
            [22, 17],
            [-22, 17],
            [-22, -17],
            [22, -17],
            [-24, 0],
          ];
  points[points.length - 1] = [18, 12];
  const at = (v: number) => {
    const t = clamp(v, 0, 1) * (points.length - 1);
    const i = Math.min(points.length - 2, Math.floor(t));
    const u = t - i;
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    return [0, 1].map(
      (k) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * u +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u),
    );
  };
  const t = clamp(progress) / 100;
  const a = at(t);
  const b = at(Math.min(1, t + 0.001));
  const c = at(Math.max(0, t - 0.001));
  return {
    x: a[0],
    y: a[1],
    heading: (Math.atan2(b[1] - c[1], b[0] - c[0]) * 180) / Math.PI - 90,
  };
}
export const cleaningSuspend = (s: DevicePreviewState) =>
  job(s) ? `paused_${s.program}` : s.program;
export const cleaningControlDisabled = (
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
) =>
  isCleaning(d) &&
  job(s) &&
  ((field === "period" && s.program === "charging") ||
    ["mode", "metric", "level"].includes(field));
export const cleaningIsMoving = (d: CatalogDevice, s: DevicePreviewState) =>
  isCleaning(d) && s.active;
export function cleaningActionDisabled(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
) {
  if (!isCleaning(d)) return false;
  if (a === "open" || a === "close") {
    return (
      (a === "open" ? s.open : !s.open) ||
      (guarded(d) && (job(s) || (d.id === "waste_compactor" && s.speed > 0)))
    );
  }
  if (a === "pause") return !job(s);
  if (a === "stop") return !job(s) && !paused(s);
  if (a === "dock") {
    return (
      s.period === "cl_blocked" ||
      (d.id === "delivery_robot" && (s.open || s.position > 0)) ||
      !cleaningRobot(d) ||
      s.program === "returning" ||
      s.program === "charging"
    );
  }
  if (["start", "flush", "dispense", "compact", "sample"].includes(a)) {
    return (
      job(s) ||
      (guarded(d) && (s.open || s.position > 0)) ||
      (cleaningRobot(d) &&
        (s.period === "cl_blocked" ||
          (d.id !== "robot_docking_station" &&
            s.value < 15 &&
            (!paused(s) || s.program === "paused_working")))) ||
      (wet(d) &&
        s.level < 10 &&
        (!paused(s) || s.program === "paused_working")) ||
      (supply(d) && s.level < 3)
    );
  }
  return false;
}
export function cleaningAction(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DevicePreviewState | undefined {
  if (!isCleaning(d)) return undefined;
  if (cleaningActionDisabled(d, s, a)) return s;
  if (a === "open" || a === "close") {
    return {
      ...s,
      open: a === "open",
      target: a === "open" ? 100 : 0,
      active: true,
    };
  }
  if (a === "pause") {
    return {
      ...s,
      program: `paused_${s.program}`,
      active: s.position !== s.target && !cleaningRobot(d),
    };
  }
  if (a === "stop" && d.id === "waste_compactor") {
    return { ...s, program: "retracting", active: true };
  }
  if (a === "stop") {
    return {
      ...s,
      program: d.id === "smart_toilet" && s.level < 100 ? "refilling" : "idle",
      active: d.id === "smart_toilet" && s.level < 100,
      progress: 0,
      speed: cleaningRobot(d) ? s.speed : 0,
    };
  }
  if (a === "dock") {
    return {
      ...s,
      program: "returning",
      active: true,
      open: false,
      target: s.target,
    };
  }
  if (["start", "flush", "dispense", "compact", "sample"].includes(a)) {
    const resume = paused(s) ? s.program.slice(7) : undefined;
    const program =
      resume ??
      (d.id === "robot_docking_station"
        ? "returning"
        : d.id === "waste_fill_level_sensor"
          ? "sampling"
          : "working");
    return {
      ...s,
      program,
      active: true,
      progress: resume ? s.progress : 0,
      period: d.id === "smart_tap" ? "cl_hand_present" : s.period,
      speed: cleaningRobot(d) ? s.speed : 0,
    };
  }
  return s;
}
export function cleaningRange(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  n: number,
): DevicePreviewState | undefined {
  if (!isCleaning(d)) return undefined;
  if (!finite(n)) return s;
  if (field === "target" && d.id === "robot_docking_station") {
    return { ...s, target: clamp(n, 50, 100) };
  }
  if (field === "level") {
    if (job(s) && d.id !== "waste_fill_level_sensor") return s;
    return { ...s, level: clamp(n) };
  }
  if (field === "value" && cleaningRobot(d)) {
    const value = clamp(n);
    return {
      ...s,
      value,
      ...(value < 15 && s.program === "working"
        ? { program: "returning", active: true }
        : {}),
    };
  }
  return s;
}
export function cleaningChoice(
  d: CatalogDevice,
  s: DevicePreviewState,
  field: string,
  value: string,
): DevicePreviewState | undefined {
  if (!isCleaning(d)) return undefined;
  if (
    field === "period" &&
    cleaningRobot(d) &&
    ["cl_clear", "cl_blocked"].includes(value)
  ) {
    return {
      ...s,
      period: value,
      ...(value === "cl_blocked" && job(s)
        ? { program: `paused_${s.program}`, active: false }
        : {}),
    };
  }
  if (
    field === "period" &&
    d.id === "smart_tap" &&
    ["cl_hand_present", "cl_hand_removed"].includes(value)
  ) {
    if (value === s.period) return s;
    return {
      ...s,
      period: value,
      program: value === "cl_hand_present" ? "working" : "idle",
      progress: 0,
      active: value === "cl_hand_present",
    };
  }
  if (job(s)) return s;
  if (
    field === "mode" &&
    ["cl_standard", "cl_edge", "cl_spot", "cl_normal", "cl_eco"].includes(value)
  ) {
    return { ...s, mode: value };
  }
  if (
    field === "metric" &&
    d.id === "delivery_robot" &&
    ["cl_slot_1", "cl_slot_2", "cl_slot_3"].includes(value)
  ) {
    return { ...s, metric: value };
  }
  return s;
}
function stepCleaning(
  d: CatalogDevice,
  s: DevicePreviewState,
  dt: number,
): DevicePreviewState {
  const move = (from: number, to: number, amount: number) =>
    from < to ? Math.min(to, from + amount) : Math.max(to, from - amount);
  const position = enclosure(d)
    ? move(s.position, s.target, dt / 9)
    : s.position;
  const travel = enclosure(d) && position !== s.target;
  if (s.program === "retracting") {
    const speed = move(s.speed, 0, dt * 0.025);
    return {
      ...s,
      position,
      speed,
      program: speed === 0 ? "idle" : "retracting",
      active: speed > 0 || travel,
    };
  }
  if (s.program === "refilling") {
    const level = Math.min(100, s.level + dt / 55);
    return {
      ...s,
      position,
      level,
      program: level === 100 ? "complete" : "refilling",
      active: level < 100 || travel,
    };
  }
  if (!job(s)) return { ...s, position, active: travel };
  if (
    cleaningRobot(d) &&
    s.period === "cl_blocked" &&
    s.program !== "charging"
  ) {
    return { ...s, program: `paused_${s.program}`, active: false };
  }
  const turn = (from: number, to: number) =>
    from + clamp(((to - from + 540) % 360) - 180, -dt * 0.15, dt * 0.15);
  if (s.program === "aligning") {
    const speed = turn(s.speed, 0);
    const aligned =
      Math.abs(((((speed + 180) % 360) + 360) % 360) - 180) < 0.01;
    return {
      ...s,
      position,
      speed: aligned ? 0 : speed,
      program: aligned ? "charging" : "aligning",
      active: true,
    };
  }
  if (s.program === "returning") {
    const x = d.id === "robot_docking_station" ? 0 : -24;
    const y = d.id === "robot_docking_station" ? 8 : 0;
    const dx = x - s.pan;
    const dy = y - s.tilt;
    const dist = Math.hypot(dx, dy);
    const f = dist ? Math.min(1, (dt * 0.018) / dist) : 1;
    const arrived = f === 1;
    return {
      ...s,
      position,
      pan: s.pan + dx * f,
      tilt: s.tilt + dy * f,
      speed:
        dist > 0
          ? turn(s.speed, (Math.atan2(dy, dx) * 180) / Math.PI - 90)
          : s.speed,
      program: arrived
        ? d.id === "window_cleaning_robot"
          ? "complete"
          : "aligning"
        : "returning",
      target: s.target,
      active: !arrived || d.id !== "window_cleaning_robot" || travel,
    };
  }
  if (s.program === "charging") {
    const limit = d.id === "robot_docking_station" ? s.target : 90;
    const value =
      s.value >= limit ? s.value : Math.min(limit, s.value + dt / 300);
    return {
      ...s,
      position,
      value,
      program: value >= limit ? "complete" : "charging",
      active: value < limit || travel,
    };
  }
  const progress = Math.min(
    100,
    s.progress + dt / (s.duration * (s.mode === "cl_eco" ? 7 : 10)),
  );
  const p = cleaningRoute(progress, s.mode);
  const delta = progress - s.progress;
  const finished = progress === 100;
  const level =
    d.id === "smart_toilet"
      ? progress < 35
        ? 100 - progress * 1.6
        : progress < 65
          ? 44
          : 44 + ((progress - 65) * 56) / 35
      : d.id === "waste_compactor"
        ? s.level -
          (s.progress < 60 ? Math.min(delta, 60 - s.progress) * 0.45 : 0)
        : supply(d)
          ? Math.max(0, s.level - delta * 0.03)
          : wet(d)
            ? Math.max(0, s.level - dt / 5500)
            : s.level;
  const press =
    progress < 55
      ? (progress / 55) * 100
      : progress < 65
        ? 100
        : ((100 - progress) / 35) * 100;
  const robot = cleaningRobot(d);
  const value = robot ? Math.max(0, s.value - dt / 12000) : s.value;
  const program = finished
    ? robot
      ? "returning"
      : "complete"
    : s.program === "sampling"
      ? "sampling"
      : "working";
  return {
    ...s,
    position,
    progress,
    pan: robot ? p.x : s.pan,
    tilt: robot ? p.y : s.tilt,
    level,
    value,
    speed: robot ? p.heading : d.id === "waste_compactor" ? press : s.speed,
    floor: finished && s.progress < 100 ? s.floor + 1 : s.floor,
    program:
      robot && value < 15
        ? "returning"
        : wet(d) && level < 10
          ? "paused_working"
          : program,
    active:
      robot && !finished && level < 10 && wet(d)
        ? false
        : !finished || robot || travel,
  };
}
export function advanceCleaningState(
  d: CatalogDevice,
  s: DevicePreviewState,
  elapsed: number,
): DevicePreviewState {
  if (!cleaningIsMoving(d, s) || !finite(elapsed) || elapsed < 0) return s;
  if (elapsed === 0) return { ...s };
  let next = s;
  let remaining = Math.min(elapsed, 600000);
  while (remaining > 0 && next.active) {
    const dt = Math.min(remaining, 1000);
    next = stepCleaning(d, next, dt);
    remaining -= dt;
  }
  return next;
}
export function cleaningPhase(d: CatalogDevice, s: DevicePreviewState): string {
  if (["aligning", "retracting"].includes(s.program)) return s.program;
  if (
    cleaningRobot(d) &&
    s.period === "cl_blocked" &&
    s.program !== "charging"
  ) {
    return "blocked";
  }
  if (paused(s)) return wet(d) && s.level < 10 ? "low_water" : "paused";
  if (s.program === "returning") {
    return d.id === "robot_docking_station" ? "docking" : "returning";
  }
  if (
    s.program === "charging" ||
    s.program === "sampling" ||
    s.program === "refilling"
  ) {
    return s.program;
  }
  if (s.program === "working") {
    return d.id === "delivery_robot"
      ? "delivering"
      : d.id === "inspection_robot"
        ? "inspecting"
        : d.id === "security_robot"
          ? "patrolling"
          : cleaningRobot(d)
            ? "cleaning"
            : d.id === "waste_compactor"
              ? s.progress < 55
                ? "pressing"
                : s.progress < 65
                  ? "holding"
                  : "retracting"
              : d.id === "waste_chute_controller"
                ? "cycling"
                : d.id === "smart_tap"
                  ? "flowing"
                  : d.id === "smart_toilet"
                    ? s.progress < 65
                      ? "flushing"
                      : "refilling"
                    : d.id === "smart_urinal"
                      ? "flushing"
                      : d.id === "paper_dispenser_monitor"
                        ? s.progress < 65
                          ? "feeding"
                          : "tearing"
                        : "dispensing";
  }
  if (enclosure(d) && s.position !== s.target) {
    return s.target > s.position ? "opening" : "closing";
  }
  if (s.program === "complete") return "complete";
  if (cleaningRobot(d) && s.value < 15) return "low_battery";
  if (wet(d) && s.level < 10) return "low_water";
  if (supply(d) && s.level < 3) return "empty";
  if (enclosure(d) && s.open) return `${part(d)}_open_state`;
  return d.id === "waste_fill_level_sensor" ? "monitoring" : "idle";
}
export function cleaningActionLabel(
  d: CatalogDevice,
  s: DevicePreviewState,
  a: DeviceAction,
): DashboardTextKey | undefined {
  if (!isCleaning(d)) return undefined;
  return key(
    a === "open" || a === "close"
      ? `${part(d)}_${a}`
      : a === "start"
        ? paused(s)
          ? "resume"
          : d.id === "robot_docking_station"
            ? "dock_example"
            : "start"
        : a === "dock"
          ? d.id === "window_cleaning_robot"
            ? "return_start"
            : "return_dock"
          : a === "compact"
            ? "compact"
            : a === "flush"
              ? "flush"
              : a === "sample"
                ? "sample"
                : a === "dispense"
                  ? d.id === "paper_dispenser_monitor"
                    ? "feed"
                    : d.id === "smart_tap"
                      ? "water"
                      : "dispense"
                  : a,
  );
}
export function cleaningInterface(
  d: CatalogDevice,
  s: DevicePreviewState,
): DeviceInterface | undefined {
  if (!isCleaning(d)) return undefined;
  const range = (
    field: "value" | "level" | "target",
    label: string,
    min = 0,
    max = 100,
  ): DeviceControl => ({
    kind: "range",
    field,
    label: key(label),
    min,
    max,
    step: 1,
    unit: "%",
  });
  const controls: DeviceControl[] = [];
  const metrics: DeviceMetric[] = [];
  const robot = cleaningRobot(d);
  let primary = metric(supply(d) ? "example_supply" : "fill", s.level, "%");
  if (robot) {
    primary = metric("battery", s.value, "%");
    metrics.push(metric("mission", s.progress, "%"));
    if (d.id === "delivery_robot") {
      metrics.push({
        label: "device_completed_deliveries",
        value: s.floor,
        unit: "",
      });
    }
    controls.push(range("value", "example_battery"));
    if (d.id === "robot_docking_station") {
      metrics.length = 0;
      metrics.push(metric("charge_target", s.target, "%"));
      controls.push(range("target", "charge_target", 50, 100));
    } else {
      controls.push(
        {
          kind: "choices",
          field: "mode",
          label: key(
            cleaningRobot(d) &&
              ["delivery_robot", "inspection_robot", "security_robot"].includes(
                d.id,
              )
              ? "route"
              : "pattern",
          ),
          options: ["cl_standard", "cl_edge", "cl_spot"],
        },
        {
          kind: "choices",
          field: "period",
          label: key("path_feedback"),
          options: ["cl_clear", "cl_blocked"],
        },
      );
      if (wet(d)) controls.push(range("level", "example_water"));
    }
  } else if (d.id === "waste_chute_controller") {
    primary = metric("example_cycle", s.progress, "%");
  } else if (d.id === "smart_tap") {
    primary = metric(
      "flow_state",
      key(cleaningPhase(d, s) === "flowing" ? "flowing" : "stopped"),
    );
    controls.push({
      kind: "choices",
      field: "period",
      label: key("presence"),
      options: ["cl_hand_present", "cl_hand_removed"],
    });
  } else if (["smart_toilet", "smart_urinal"].includes(d.id)) {
    primary = metric("cycle_state", key(cleaningPhase(d, s)));
    if (d.id === "smart_toilet") metrics.push(metric("cistern", s.level, "%"));
    controls.push({
      kind: "choices",
      field: "mode",
      label: key("flush_mode"),
      options: ["cl_normal", "cl_eco"],
    });
  } else {
    controls.push(
      range("level", supply(d) ? "example_supply" : "example_fill"),
    );
  }
  if (d.id === "waste_compactor") {
    metrics.push(metric("press_stroke", s.speed, "%"));
  }
  if (enclosure(d)) {
    metrics.push(
      metric(
        part(d),
        key(`${part(d)}_${s.open ? "open_state" : "closed_state"}`),
      ),
    );
    if (d.id === "delivery_robot") {
      controls.push({
        kind: "choices",
        field: "metric",
        label: key("compartment"),
        options: ["cl_slot_1", "cl_slot_2", "cl_slot_3"],
      });
    }
    controls.push({ kind: "actions", actions: ["open", "close"] });
  }
  controls.push({
    kind: "actions",
    actions: robot
      ? d.id === "robot_docking_station"
        ? ["start", "pause", "stop"]
        : ["start", "pause", "dock"]
      : d.id === "waste_fill_level_sensor"
        ? ["sample"]
        : d.id === "smart_waste_bin"
          ? []
          : d.id === "waste_compactor"
            ? ["compact", "stop"]
            : d.id === "waste_chute_controller"
              ? ["start", "stop"]
              : supply(d) || d.id === "smart_tap"
                ? ["dispense", "stop"]
                : ["flush", "stop"],
  });
  controls.push({
    kind: "note",
    label: key(
      robot
        ? d.id === "robot_docking_station"
          ? "dock_note"
          : "robot_note"
        : guarded(d)
          ? "guard_note"
          : d.id === "waste_fill_level_sensor"
            ? "sensor_note"
            : supply(d)
              ? "supply_note"
              : d.id === "smart_waste_bin"
                ? "bin_note"
                : "fixture_note",
    ),
  });
  return {
    primary,
    metrics,
    controls,
    status: key(cleaningPhase(d, s)),
    chart: false,
    state: s,
  };
}
export const cleaningRemote = (d: CatalogDevice, e?: HassEntity) =>
  !!e &&
  ((cleaningRobot(d) &&
    d.id !== "robot_docking_station" &&
    e.entity_id.startsWith("vacuum.")) ||
    (d.id === "smart_waste_bin" && e.entity_id.startsWith("cover.")) ||
    (d.id === "smart_tap" && e.entity_id.startsWith("valve.")));
export function cleaningLive(d: CatalogDevice, e?: HassEntity) {
  const unavailable = !e || ["unknown", "unavailable"].includes(e.state);
  const a = e?.attributes ?? {};
  const empty = {
    primary: metric("reported_state", "—"),
    metrics: [] as DeviceMetric[],
    status: unavailable
      ? ("unavailable" as DashboardTextKey)
      : key("unreported"),
    visual: {
      active: false,
      powerOn: false,
      hasTelemetry: false,
      hasLevel: false,
      hasPosition: false,
      level: 0,
      value: 0,
      position: 0,
      pan: 0,
      tilt: 0,
      speed: 0,
      open: false,
      program: "unknown",
      processPhase: "unknown",
      processProgress: 0,
    } as Partial<DeviceVisualState>,
  };
  if (unavailable || !e) return empty;
  const robot = cleaningRobot(d);
  const vacuum = robot && e.entity_id.startsWith("vacuum.");
  const sensor =
    e.entity_id.startsWith("sensor.") &&
    a.unit_of_measurement === "%" &&
    e.state.trim() !== "" &&
    percent(Number(e.state));
  const battery = percent(a.battery_level)
    ? a.battery_level
    : robot && sensor
      ? Number(e.state)
      : undefined;
  const level = percent(a.fill_level)
    ? a.fill_level
    : percent(a.remaining_percentage)
      ? a.remaining_percentage
      : !robot && sensor
        ? Number(e.state)
        : percent(a.water_level)
          ? a.water_level
          : undefined;
  const door = typeof a.door_open === "boolean" ? a.door_open : undefined;
  const cover = e.entity_id.startsWith("cover.") && d.id === "smart_waste_bin";
  const position =
    cover && percent(a.current_position)
      ? a.current_position
      : door !== undefined
        ? door
          ? 100
          : 0
        : cover && e.state === "closed"
          ? 0
          : undefined;
  const operation =
    typeof a.operation_state === "string" ? a.operation_state : "";
  const explicit = [
    "cleaning",
    "delivering",
    "inspecting",
    "patrolling",
    "returning",
    "docking",
    "aligning",
    "charging",
    "pressing",
    "holding",
    "retracting",
    "cycling",
    "flushing",
    "refilling",
    "dispensing",
    "feeding",
    "tearing",
    "sampling",
    "paused",
    "idle",
    "complete",
  ].includes(operation)
    ? operation
    : undefined;
  const phase =
    cover && position !== undefined
      ? position > 0
        ? "lid_open_state"
        : "lid_closed_state"
      : vacuum &&
          [
            "cleaning",
            "returning",
            "paused",
            "idle",
            "docked",
            "error",
          ].includes(e.state)
        ? e.state === "docked" && a.charging === true
          ? "charging"
          : e.state
        : (explicit ??
          (d.id === "smart_tap" && typeof a.water_flowing === "boolean"
            ? a.water_flowing
              ? "flowing"
              : "stopped"
            : (d.id === "smart_toilet" || d.id === "smart_urinal") &&
                a.flushing === true
              ? "flushing"
              : "unknown"));
  const active =
    [
      "cleaning",
      "delivering",
      "inspecting",
      "patrolling",
      "returning",
      "docking",
      "aligning",
      "charging",
      "pressing",
      "holding",
      "retracting",
      "cycling",
      "flushing",
      "refilling",
      "dispensing",
      "feeding",
      "tearing",
      "sampling",
      "flowing",
    ].includes(phase) &&
    !(guarded(d) && door === true) &&
    !(phase === "charging" && a.docked === false);
  const metrics: DeviceMetric[] = [];
  if (position !== undefined) {
    metrics.push(
      metric(
        part(d),
        key(`${part(d)}_${position > 0 ? "open_state" : "closed_state"}`),
      ),
    );
  }
  if (percent(a.cycle_progress)) {
    metrics.push(metric("mission", a.cycle_progress, "%"));
  }
  return {
    primary:
      robot && battery !== undefined
        ? metric("reported_battery", battery, "%")
        : !robot && level !== undefined
          ? metric("reported_fill", level, "%")
          : phase !== "unknown"
            ? metric("reported_state", key(phase))
            : empty.primary,
    metrics,
    status: key(phase === "unknown" ? "unreported" : phase),
    visual: {
      ...empty.visual,
      hasTelemetry: true,
      active,
      powerOn: active,
      value: battery ?? 0,
      level: level ?? 0,
      hasLevel: level !== undefined,
      open: position !== undefined && position > 0,
      position: position ?? 0,
      hasPosition: position !== undefined,
      program: phase,
      processPhase: phase,
      processProgress: percent(a.cycle_progress) ? a.cycle_progress : 0,
    },
  };
}
export function cleaningVisualState(
  d: CatalogDevice,
  v: DeviceVisualState,
  s?: DevicePreviewState,
  e?: HassEntity,
): DeviceVisualState {
  if (!isCleaning(d)) return v;
  if (!s) return { ...v, ...cleaningLive(d, e).visual, example: false };
  return {
    ...v,
    ...s,
    active: job(s),
    powerOn: job(s),
    example: true,
    hasLevel: true,
    hasPosition: true,
    processPhase: cleaningPhase(d, s),
    processProgress: s.progress,
  };
}
