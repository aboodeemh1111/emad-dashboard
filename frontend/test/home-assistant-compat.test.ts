import { describe, expect, it } from "vitest";
import type { HomeAssistant } from "../src/platform/types";
import { catalogDevice } from "../src/dashboard/device-catalog";
import {
  counterpartEntity,
  deviceEntities,
  primaryDeviceEntity,
  prepareEntityCommand,
  supportsEntityService,
  withTemperatureUnit,
  powerCommand,
  catalogAllowsCommand,
  cardOwnsEntity,
} from "../src/dashboard/home-assistant-compat";
import { isAvailable } from "../src/dashboard/dashboard-model";
import { testEntity as entity } from "./test-entities";

describe("Native Home Assistant command compatibility", () => {
  it.each([
    ["button.start", "unknown", "press"],
    ["input_button.start", "unknown", "press"],
    ["scene.evening", "unknown", "turn_on"],
  ])("allows %s before its first activation", (id, state, service) => {
    expect(isAvailable(entity(id, state))).toBe(true);
    expect(prepareEntityCommand(entity(id, state), service)).toEqual({});
    expect(
      prepareEntityCommand(entity(id, "unavailable"), service),
    ).toBeUndefined();
  });
  it("does not treat an unknown measurement as available", () =>
    expect(isAvailable(entity("sensor.water", "unknown"))).toBe(false));
  it("sends both heat/cool endpoints and prevents crossed or incomplete ranges", () => {
    const e = entity("climate.room", "heat_cool", {
      supported_features: 2,
      target_temp_low: 18,
      target_temp_high: 24,
      min_temp: 7,
      max_temp: 35,
    });
    expect(
      prepareEntityCommand(e, "set_temperature", { target_temp_low: 19 }),
    ).toEqual({ target_temp_low: 19, target_temp_high: 24 });
    expect(
      prepareEntityCommand(e, "set_temperature", { target_temp_high: 17 }),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(e, "set_temperature", { temperature: 20 }),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(
        { ...e, attributes: { ...e.attributes, target_temp_high: undefined } },
        "set_temperature",
        { target_temp_low: 19 },
      ),
    ).toBeUndefined();
  });
  it("uses Fahrenheit limits without Celsius conversion", () => {
    const e = entity("climate.room", "heat", {
      supported_features: 1,
      min_temp: 45,
      max_temp: 95,
    });
    expect(
      prepareEntityCommand(e, "set_temperature", { temperature: 72.5 }),
    ).toEqual({ temperature: 72.5 });
    expect(
      prepareEntityCommand(e, "set_temperature", { temperature: 23 }),
    ).toBeUndefined();
  });
  it.each([
    ["climate.room", 8, "set_fan_mode", "fan_mode", "fan_modes"],
    ["climate.room", 16, "set_preset_mode", "preset_mode", "preset_modes"],
    ["climate.room", 32, "set_swing_mode", "swing_mode", "swing_modes"],
    [
      "climate.room",
      512,
      "set_swing_horizontal_mode",
      "swing_horizontal_mode",
      "swing_horizontal_modes",
    ],
    ["fan.room", 8, "set_preset_mode", "preset_mode", "preset_modes"],
    ["humidifier.room", 1, "set_mode", "mode", "available_modes"],
    [
      "water_heater.room",
      2,
      "set_operation_mode",
      "operation_mode",
      "operation_list",
    ],
    ["vacuum.room", 32, "set_fan_speed", "fan_speed", "fan_speed_list"],
    ["media_player.room", 2048, "select_source", "source", "source_list"],
    ["select.program", 0, "select_option", "option", "options"],
  ])(
    "validates %s %s options against current feedback",
    (id, flag, service, field, attribute) => {
      const e = entity(String(id), "on", {
        supported_features: flag,
        [attribute]: ["quiet", "boost"],
      });
      expect(
        prepareEntityCommand(e, String(service), { [field]: "boost" }),
      ).toEqual({ [field]: "boost" });
      expect(
        prepareEntityCommand(e, String(service), { [field]: "stale" }),
      ).toBeUndefined();
      if (flag) {
        expect(
          prepareEntityCommand(
            { ...e, attributes: { ...e.attributes, supported_features: 0 } },
            String(service),
            { [field]: "boost" },
          ),
        ).toBeUndefined();
      }
    },
  );
  it("checks power capabilities independently for each fan direction", () => {
    expect(
      powerCommand(entity("fan.room", "on", { supported_features: 1 })),
    ).toBeUndefined();
    expect(
      powerCommand(entity("fan.room", "on", { supported_features: 16 })),
    ).toEqual({ service: "turn_off" });
    expect(
      powerCommand(entity("fan.room", "off", { supported_features: 16 })),
    ).toBeUndefined();
    expect(
      powerCommand(entity("fan.room", "off", { supported_features: 32 })),
    ).toEqual({ service: "turn_on" });
  });
  it("falls back to actual HVAC modes when native turn services are absent", () => {
    expect(
      powerCommand(
        entity("climate.room", "off", { hvac_modes: ["off", "heat"] }),
      ),
    ).toEqual({ service: "set_hvac_mode", data: { hvac_mode: "heat" } });
    expect(
      powerCommand(entity("climate.room", "heat", { hvac_modes: ["heat"] })),
    ).toBeUndefined();
  });
  it.each([
    [16, "open_cover_tilt"],
    [32, "close_cover_tilt"],
    [64, "stop_cover_tilt"],
    [128, "set_cover_tilt_position"],
  ])("gates tilt feature %s", (flag, service) => {
    expect(
      supportsEntityService(
        entity("cover.blinds", "open", { supported_features: flag }),
        String(service),
      ),
    ).toBe(true);
    expect(
      supportsEntityService(
        entity("cover.blinds", "open", { supported_features: 15 }),
        String(service),
      ),
    ).toBe(false);
  });
  it("converts media percentage exactly once at the service boundary", () => {
    expect(
      prepareEntityCommand(
        entity("media_player.room", "playing", { supported_features: 4 }),
        "volume_set",
        { volume_level: 42 },
      ),
    ).toEqual({ volume_level: 0.42 });
  });
  it("rejects light capabilities that are not actually advertised", () => {
    const e = entity("light.room", "on", {
      supported_color_modes: ["onoff"],
      min_color_temp_kelvin: 2000,
      max_color_temp_kelvin: 6500,
    });
    expect(
      prepareEntityCommand(e, "turn_on", { brightness_pct: 50 }),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(e, "turn_on", { color_temp_kelvin: 4000 }),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(e, "turn_on", { rgb_color: [255, 0, 0] }),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(
        {
          ...e,
          attributes: {
            ...e.attributes,
            supported_color_modes: ["rgb", "color_temp"],
          },
        },
        "turn_on",
        { color_temp_kelvin: 4000 },
      ),
    ).toEqual({ color_temp_kelvin: 4000 });
  });
  it.each([NaN, Infinity, -1, 101, "50", null])(
    "rejects invalid actuator percentages %s",
    (value) => {
      expect(
        prepareEntityCommand(
          entity("cover.blinds", "open", { supported_features: 4 }),
          "set_cover_position",
          { position: value },
        ),
      ).toBeUndefined();
    },
  );
  it("rejects extra service fields and unrelated domains", () => {
    expect(
      prepareEntityCommand(entity("switch.pump", "on"), "turn_off", {
        entity_id: "switch.other",
      }),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(entity("sensor.temperature", "23"), "turn_on"),
    ).toBeUndefined();
    expect(
      prepareEntityCommand(
        entity("lock.front", "locked", { code_format: "number" }),
        "unlock",
      ),
    ).toBeUndefined();
  });
});

describe("Registered device counterparts", () => {
  const states = Object.fromEntries(
    [
      entity("sensor.washer", "running"),
      entity("select.washer_program", "eco", { options: ["eco", "cotton"] }),
      entity("button.washer_start", "unknown"),
      entity("button.washer_restart", "unknown"),
      entity("sensor.washer_hidden", "1"),
      entity("switch.other", "on"),
    ].map((e) => [e.entity_id, e]),
  );
  const registry = {
    "sensor.washer": { device_id: "washer" },
    "select.washer_program": { device_id: "washer" },
    "button.washer_start": { device_id: "washer" },
    "button.washer_restart": { device_id: "washer", entity_category: "config" },
    "sensor.washer_hidden": { device_id: "washer", hidden: true },
    "switch.other": { device_id: "other" },
  } as unknown as HomeAssistant["entities"];
  const card = {
    id: "washer",
    kind: "device" as const,
    deviceType: "washing_machine",
    deviceId: "washer",
    entity: "sensor.washer",
    x: 0,
    y: 0,
    w: 384,
    h: 720,
  };
  it("includes actual controls and readings only from the chosen device", () => {
    expect(
      deviceEntities("washer", states, registry).map((e) => e.entity_id),
    ).toEqual([
      "button.washer_start",
      "select.washer_program",
      "sensor.washer",
    ]);
    expect(cardOwnsEntity(card, "button.washer_start", states, registry)).toBe(
      true,
    );
    expect(cardOwnsEntity(card, "switch.other", states, registry)).toBe(false);
    expect(
      cardOwnsEntity(card, "button.washer_restart", states, registry),
    ).toBe(false);
  });
  it("chooses a matching primary and rejects unrelated entity domains", () => {
    const d = catalogDevice("washing_machine")!;
    expect(
      primaryDeviceEntity(catalogDevice("robot_docking_station")!, [
        entity("button.empty_dock", "unknown"),
      ])?.entity_id,
    ).toBe("button.empty_dock");
    expect(
      primaryDeviceEntity(d, deviceEntities("washer", states, registry))
        ?.entity_id,
    ).toBe("sensor.washer");
    expect(
      counterpartEntity(
        catalogDevice("thermostat")!,
        entity("light.room", "on"),
      ),
    ).toBe(false);
    expect(
      counterpartEntity(
        catalogDevice("thermostat")!,
        entity("climate.room", "cool"),
      ),
    ).toBe(true);
  });
  it("keeps companion entities available when a primary disappears", () => {
    const next = { ...states };
    delete next["sensor.washer"];
    expect(deviceEntities("washer", next, registry)).toHaveLength(2);
    expect(cardOwnsEntity(card, "button.washer_start", next, registry)).toBe(
      true,
    );
  });
  it("does not turn supervisory equipment into remote actuators", () => {
    expect(
      catalogAllowsCommand(
        { ...card, deviceType: "passenger_elevator" },
        states["button.washer_start"],
      ),
    ).toBe(false);
    expect(catalogAllowsCommand(card, states["button.washer_start"])).toBe(
      true,
    );
  });
});

describe("Controller temperature units", () => {
  it("labels standard thermostat values without mutating state or replacing stable references", () => {
    const source = entity("climate.room", "heat", { current_temperature: 72 });
    const normalized = withTemperatureUnit(source, "°F")!;
    expect(normalized.attributes.temperature_unit).toBe("°F");
    expect(normalized.attributes.current_temperature).toBe(72);
    expect(source.attributes.temperature_unit).toBeUndefined();
    expect(withTemperatureUnit(source, "°F")).toBe(normalized);
    expect(
      withTemperatureUnit(
        entity("sensor.temperature", "23", { unit_of_measurement: "°C" }),
        "°F",
      )?.attributes.unit_of_measurement,
    ).toBe("°C");
  });
});
