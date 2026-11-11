import memoizeOne from "memoize-one";
import type { HassEntity, HassEntities } from "home-assistant-js-websocket";
import type { HomeAssistant } from "../platform/types";
import { ClimateEntityFeature as Climate } from "../platform/features";
import { CoverEntityFeature as Cover } from "../platform/features";
import { FanEntityFeature as Fan } from "../platform/features";
import { MediaPlayerEntityFeature as Media } from "../platform/features";
import { VacuumEntityFeature as Vacuum } from "../platform/features";
import type { CatalogDevice, DeviceFamily } from "./device-catalog";
import { catalogDevice } from "./device-catalog";
import { physicalProfile } from "./device-physical-profiles";
import { supportsFeature } from "../platform/runtime";
import { isAvailable, domainOf } from "./dashboard-model";
import type { DashboardCard } from "./dashboard-model";

const DOMAINS: Record<DeviceFamily, readonly string[]> = {
  climate: ["climate"],
  plant: ["climate", "water_heater", "switch", "fan"],
  fan: ["fan"],
  sensor: ["sensor", "binary_sensor"],
  light: ["light", "switch"],
  shade: ["cover"],
  meter: ["sensor"],
  power: ["switch", "sensor", "binary_sensor"],
  energy: ["sensor", "switch", "number"],
  pump: ["switch", "valve", "fan"],
  tank: ["sensor", "binary_sensor", "water_heater"],
  valve: ["valve", "cover", "switch", "number"],
  quality: ["sensor", "binary_sensor"],
  safety: ["binary_sensor", "sensor", "alarm_control_panel"],
  access: ["lock", "cover", "binary_sensor", "switch"],
  lift: ["sensor", "binary_sensor"],
  camera: ["camera"],
  parking: ["cover", "sensor", "binary_sensor"],
  presence: ["binary_sensor", "sensor", "person", "device_tracker"],
  weather: ["weather", "sensor", "binary_sensor"],
  irrigation: ["valve", "switch", "sensor"],
  appliance: ["sensor", "switch", "climate", "water_heater", "select"],
  robot: ["vacuum", "sensor", "binary_sensor"],
  media: ["media_player", "remote", "switch"],
  network: ["sensor", "binary_sensor", "switch"],
  condition: ["sensor", "binary_sensor"],
  gateway: ["sensor", "binary_sensor", "switch"],
  motor: ["fan", "cover", "switch", "sensor"],
};

/** Suggestions are based on native domains, never a guess from a device name. */
export const counterpartDomains = (
  device: CatalogDevice,
): readonly string[] => [
  ...new Set([...DOMAINS[device.family], "sensor", "binary_sensor"]),
];

export const counterpartEntity = (device: CatalogDevice, entity: HassEntity) =>
  counterpartDomains(device).includes(domainOf(entity.entity_id));

export const supervisoryDevice = (device: CatalogDevice) =>
  device.family === "safety" ||
  ["fire", "medical", "elevator"].includes(physicalProfile(device).interaction);

/** Build the registry index once per state/registry update, even for many cards. */
const entitiesByDevice = memoizeOne(
  (states: HassEntities, registry: HomeAssistant["entities"]) => {
    const groups = new Map<string, HassEntity[]>();
    for (const entity of Object.values(states)) {
      const entry = registry[entity.entity_id];
      if (!entry?.device_id || entry.hidden || entry.entity_category) continue;
      const group = groups.get(entry.device_id) ?? [];
      group.push(entity);
      groups.set(entry.device_id, group);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.entity_id.localeCompare(b.entity_id));
    }
    return groups;
  },
);

/** Only visible normal entities of this exact registered device are included. */
export function deviceEntities(
  deviceId: string | undefined,
  states: HassEntities,
  registry: HomeAssistant["entities"],
): HassEntity[] {
  return deviceId
    ? (entitiesByDevice(states, registry).get(deviceId) ?? [])
    : [];
}

export function primaryDeviceEntity(
  device: CatalogDevice,
  entities: HassEntity[],
) {
  const domains = counterpartDomains(device);
  return (
    entities
      .filter((entity) => counterpartEntity(device, entity))
      .sort(
        (a, b) =>
          domains.indexOf(domainOf(a.entity_id)) -
            domains.indexOf(domainOf(b.entity_id)) ||
          Number(!isAvailable(a)) - Number(!isAvailable(b)) ||
          a.entity_id.localeCompare(b.entity_id),
      )[0] ?? entities[0]
  );
}

export function cardOwnsEntity(
  card: DashboardCard,
  entity: string,
  states: HassEntities,
  registry: HomeAssistant["entities"],
) {
  return (
    card.entity === entity ||
    deviceEntities(card.deviceId, states, registry).some(
      (e) => e.entity_id === entity,
    )
  );
}

export function catalogAllowsCommand(card: DashboardCard, entity: HassEntity) {
  const device = catalogDevice(card.deviceType);
  return (
    !device ||
    (!supervisoryDevice(device) &&
      (!!card.deviceId ||
        card.entity !== entity.entity_id ||
        counterpartEntity(device, entity)))
  );
}

const feature = (entity: HassEntity, flag: number) =>
  typeof entity.attributes.supported_features === "number" &&
  supportsFeature(entity, flag);
export const stringOptions = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
const options = (entity: HassEntity, key: string) =>
  stringOptions(entity.attributes[key]);
const modes = (entity: HassEntity) => options(entity, "supported_color_modes");
const color = (entity: HassEntity) =>
  modes(entity).some((m) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(m));
const brightness = (entity: HassEntity) =>
  modes(entity).some((m) =>
    [
      "brightness",
      "white",
      "color_temp",
      "hs",
      "xy",
      "rgb",
      "rgbw",
      "rgbww",
    ].includes(m),
  );

/** Service capability contract shared by rendering and the final dispatcher. */
export function supportsEntityService(
  entity: HassEntity,
  service: string,
): boolean {
  const has = (flag: number) => feature(entity, flag);
  switch (domainOf(entity.entity_id)) {
    case "light":
      return ["turn_on", "turn_off"].includes(service);
    case "switch":
    case "input_boolean":
      return ["turn_on", "turn_off"].includes(service);
    case "script":
      return ["turn_on", "turn_off"].includes(service);
    case "scene":
      return service === "turn_on";
    case "button":
    case "input_button":
      return service === "press";
    case "number":
    case "input_number":
      return service === "set_value";
    case "select":
    case "input_select":
      return service === "select_option";
    case "climate":
      return service === "set_hvac_mode"
        ? options(entity, "hvac_modes").length > 0
        : service === "set_temperature"
          ? has(Climate.TARGET_TEMPERATURE) ||
            has(Climate.TARGET_TEMPERATURE_RANGE)
          : service === "set_humidity"
            ? has(Climate.TARGET_HUMIDITY)
            : service === "set_fan_mode"
              ? has(Climate.FAN_MODE)
              : service === "set_preset_mode"
                ? has(Climate.PRESET_MODE)
                : service === "set_swing_mode"
                  ? has(Climate.SWING_MODE)
                  : service === "set_swing_horizontal_mode"
                    ? has(Climate.SWING_HORIZONTAL_MODE)
                    : service === "turn_on"
                      ? has(Climate.TURN_ON)
                      : service === "turn_off" && has(Climate.TURN_OFF);
    case "fan":
      return service === "set_percentage"
        ? has(Fan.SET_SPEED)
        : service === "oscillate"
          ? has(Fan.OSCILLATE)
          : service === "set_direction"
            ? has(Fan.DIRECTION)
            : service === "set_preset_mode"
              ? has(Fan.PRESET_MODE)
              : service === "turn_on"
                ? has(Fan.TURN_ON)
                : service === "turn_off" && has(Fan.TURN_OFF);
    case "cover": {
      const flags: Record<string, number> = {
        open_cover: Cover.OPEN,
        close_cover: Cover.CLOSE,
        stop_cover: Cover.STOP,
        set_cover_position: Cover.SET_POSITION,
        open_cover_tilt: Cover.OPEN_TILT,
        close_cover_tilt: Cover.CLOSE_TILT,
        stop_cover_tilt: Cover.STOP_TILT,
        set_cover_tilt_position: Cover.SET_TILT_POSITION,
      };
      return !!flags[service] && has(flags[service]);
    }
    case "valve":
      return (
        (
          {
            open_valve: 1,
            close_valve: 2,
            set_valve_position: 4,
            stop_valve: 8,
          } as Record<string, number>
        )[service] > 0 &&
        has(
          (
            {
              open_valve: 1,
              close_valve: 2,
              set_valve_position: 4,
              stop_valve: 8,
            } as Record<string, number>
          )[service],
        )
      );
    case "lock":
      return (
        ["lock", "unlock"].includes(service) && !entity.attributes.code_format
      );
    case "vacuum": {
      const flags: Record<string, number> = {
        start: Vacuum.START,
        pause: Vacuum.PAUSE,
        stop: Vacuum.STOP,
        return_to_base: Vacuum.RETURN_HOME,
        set_fan_speed: Vacuum.FAN_SPEED,
        locate: Vacuum.LOCATE,
        turn_on: Vacuum.TURN_ON,
        turn_off: Vacuum.TURN_OFF,
      };
      return !!flags[service] && has(flags[service]);
    }
    case "media_player": {
      const flags: Record<string, number> = {
        media_play: Media.PLAY,
        media_pause: Media.PAUSE,
        media_stop: Media.STOP,
        media_previous_track: Media.PREVIOUS_TRACK,
        media_next_track: Media.NEXT_TRACK,
        volume_set: Media.VOLUME_SET,
        volume_mute: Media.VOLUME_MUTE,
        select_source: Media.SELECT_SOURCE,
        select_sound_mode: Media.SELECT_SOUND_MODE,
        shuffle_set: Media.SHUFFLE_SET,
        repeat_set: Media.REPEAT_SET,
        turn_on: Media.TURN_ON,
        turn_off: Media.TURN_OFF,
      };
      return !!flags[service] && has(flags[service]);
    }
    case "humidifier":
      return (
        ["turn_on", "turn_off", "set_humidity"].includes(service) ||
        (service === "set_mode" && has(1))
      );
    case "water_heater":
      return service === "set_temperature"
        ? has(1)
        : service === "set_operation_mode"
          ? has(2)
          : service === "set_away_mode" && has(4);
    default:
      return false;
  }
}

export function powerCommand(
  entity: HassEntity,
): { service: string; data?: Record<string, unknown> } | undefined {
  const on = !["off", "standby"].includes(entity.state);
  const service = on ? "turn_off" : "turn_on";
  if (supportsEntityService(entity, service)) return { service };
  if (domainOf(entity.entity_id) === "climate") {
    const mode = on
      ? options(entity, "hvac_modes").find((m) => m === "off")
      : options(entity, "hvac_modes").find((m) => m !== "off");
    if (mode) return { service: "set_hvac_mode", data: { hvac_mode: mode } };
  }
  return undefined;
}

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const bounded = (value: unknown, min: unknown, max: unknown) =>
  finite(value) &&
  finite(min) &&
  finite(max) &&
  min <= max &&
  value >= min &&
  value <= max;

/** Reject stale options/features and invalid data using the latest entity state.
 * Input volume is the UI's percentage; only this boundary converts it to 0..1.
 */
export function prepareEntityCommand(
  entity: HassEntity,
  service: string,
  input: Record<string, unknown> = {},
): Record<string, unknown> | undefined {
  if (!isAvailable(entity) || !supportsEntityService(entity, service)) {
    return undefined;
  }
  const domain = domainOf(entity.entity_id);
  const a = entity.attributes;
  const data = { ...input };
  const select: Record<string, [string, string]> = {
    set_hvac_mode: ["hvac_mode", "hvac_modes"],
    set_fan_mode: ["fan_mode", "fan_modes"],
    set_preset_mode: ["preset_mode", "preset_modes"],
    set_swing_mode: ["swing_mode", "swing_modes"],
    set_swing_horizontal_mode: [
      "swing_horizontal_mode",
      "swing_horizontal_modes",
    ],
    set_operation_mode: ["operation_mode", "operation_list"],
    set_mode: ["mode", "available_modes"],
    set_fan_speed: ["fan_speed", "fan_speed_list"],
    select_source: ["source", "source_list"],
    select_sound_mode: ["sound_mode", "sound_mode_list"],
    select_option: ["option", "options"],
  };
  let allowed: string[] = [];
  if (select[service]) {
    const [field, attribute] = select[service];
    allowed = [field];
    if (!options(entity, attribute).includes(String(data[field]))) {
      return undefined;
    }
  } else if (service === "set_temperature") {
    if (
      domain === "climate" &&
      ("target_temp_low" in data || "target_temp_high" in data)
    ) {
      if (!feature(entity, Climate.TARGET_TEMPERATURE_RANGE)) return undefined;
      allowed = ["target_temp_low", "target_temp_high"];
      data.target_temp_low ??= a.target_temp_low;
      data.target_temp_high ??= a.target_temp_high;
      if (
        !bounded(data.target_temp_low, a.min_temp, a.max_temp) ||
        !bounded(data.target_temp_high, a.min_temp, a.max_temp) ||
        Number(data.target_temp_low) > Number(data.target_temp_high)
      ) {
        return undefined;
      }
    } else {
      if (
        domain === "climate" &&
        !feature(entity, Climate.TARGET_TEMPERATURE)
      ) {
        return undefined;
      }
      allowed = ["temperature"];
      if (!bounded(data.temperature, a.min_temp, a.max_temp)) return undefined;
    }
  } else if (service === "set_value") {
    allowed = ["value"];
    if (!bounded(data.value, a.min, a.max)) return undefined;
  } else if (service === "set_humidity") {
    allowed = ["humidity"];
    if (!bounded(data.humidity, a.min_humidity ?? 0, a.max_humidity ?? 100)) {
      return undefined;
    }
  } else if (
    [
      "set_percentage",
      "set_cover_position",
      "set_valve_position",
      "set_cover_tilt_position",
      "volume_set",
    ].includes(service)
  ) {
    const field =
      service === "set_percentage"
        ? "percentage"
        : service === "set_cover_tilt_position"
          ? "tilt_position"
          : service === "volume_set"
            ? "volume_level"
            : "position";
    allowed = [field];
    if (!bounded(data[field], 0, 100)) return undefined;
    if (service === "volume_set") {
      data.volume_level = Number(data.volume_level) / 100;
    }
  } else if (service === "turn_on" && domain === "light") {
    allowed = ["brightness_pct", "color_temp_kelvin", "rgb_color"];
    if (
      "brightness_pct" in data &&
      (!brightness(entity) || !bounded(data.brightness_pct, 0, 100))
    ) {
      return undefined;
    }
    if (
      "color_temp_kelvin" in data &&
      (!modes(entity).includes("color_temp") ||
        !bounded(
          data.color_temp_kelvin,
          a.min_color_temp_kelvin,
          a.max_color_temp_kelvin,
        ))
    ) {
      return undefined;
    }
    if (
      "rgb_color" in data &&
      (!color(entity) ||
        !Array.isArray(data.rgb_color) ||
        data.rgb_color.length !== 3 ||
        !data.rgb_color.every((n) => bounded(n, 0, 255)))
    ) {
      return undefined;
    }
  } else if (
    ["oscillate", "volume_mute", "shuffle_set", "set_away_mode"].includes(
      service,
    )
  ) {
    const field = (
      {
        oscillate: "oscillating",
        volume_mute: "is_volume_muted",
        shuffle_set: "shuffle",
        set_away_mode: "away_mode",
      } as Record<string, string>
    )[service];
    allowed = [field];
    if (typeof data[field] !== "boolean") return undefined;
  } else if (service === "set_direction" || service === "repeat_set") {
    const field = service === "set_direction" ? "direction" : "repeat";
    allowed = [field];
    if (
      !(
        service === "set_direction"
          ? ["forward", "reverse"]
          : ["off", "one", "all"]
      ).includes(String(data[field]))
    ) {
      return undefined;
    }
  }
  return Object.keys(data).every((key) => allowed.includes(key))
    ? data
    : undefined;
}

const temperatureEntities = new WeakMap<
  HassEntity,
  { unit: string; entity: HassEntity }
>();
/** Standard climate/heater temperatures use the controller's configured unit. */
export function withTemperatureUnit(
  entity: HassEntity | undefined,
  unit: string,
): HassEntity | undefined {
  if (
    !entity ||
    !["climate", "water_heater"].includes(domainOf(entity.entity_id)) ||
    entity.attributes.temperature_unit
  ) {
    return entity;
  }
  const cached = temperatureEntities.get(entity);
  if (cached?.unit === unit) return cached.entity;
  const normalized = {
    ...entity,
    attributes: { ...entity.attributes, temperature_unit: unit },
  };
  temperatureEntities.set(entity, { unit, entity: normalized });
  return normalized;
}
