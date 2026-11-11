import type { HassEntity } from "home-assistant-js-websocket";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogDevice } from "../src/dashboard/device-catalog";
import {
  initialDeviceState,
  deviceInterface,
  previewVisual,
  entityVisual,
  previewAction,
} from "../src/dashboard/device-interface";
import {
  WEATHER_DEVICES,
  weatherRange,
  weatherChoice,
  weatherAction,
  advanceWeatherState,
  weatherLive,
  weatherVisualState,
} from "../src/dashboard/weather-model";
import {
  LIGHTING_DEVICES,
  lightingRange,
  lightingChoice,
  lightingAction,
  advanceLightingState,
  lightingLive,
  lightingVisualState,
  lightingRemote,
} from "../src/dashboard/lighting-model";
import { EmadDashboardCatalogDevice } from "../src/dashboard/emad-ui-catalog-device";
import type { DashboardTextKey } from "../src/dashboard/dashboard-model";
import en from "../src/translations/en.json";

vi.hoisted(() =>
  Object.assign(globalThis, {
    __STATIC_PATH__: "/",
    __BUILD__: "modern",
    __VERSION__: "test",
    __BACKWARDS_COMPAT__: false,
    __SUPERVISOR__: false,
    __NAMESPACE__: "frontend",
  }),
);
const device = (id: string) => catalogDevice(id)!;
const initial = (id: string) => initialDeviceState(device(id));
const entity = (
  state: string,
  unit?: string,
  attrs: HassEntity["attributes"] = {},
  entity_id = "sensor.weather",
): HassEntity => ({
  entity_id,
  state,
  attributes: {
    ...attrs,
    ...(unit === undefined ? {} : { unit_of_measurement: unit }),
  },
  last_changed: "",
  last_updated: "",
  context: { id: "test", parent_id: null, user_id: null },
});
async function mount(id: string) {
  const card = new EmadDashboardCatalogDevice();
  card.card = {
    id: "wl-test",
    kind: "device",
    deviceType: id,
    x: 0,
    y: 0,
    w: 384,
    h: 444,
  };
  card.localize = (key: string) =>
    en.ui.panel["emad-dashboard"][
      key.replace("ui.panel.emad-dashboard.", "") as DashboardTextKey
    ] || "";
  document.body.append(card);
  await card.updateComplete;
  return card;
}
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});
describe("Weather and lighting physical behavior", () => {
  it.each([...WEATHER_DEVICES, ...LIGHTING_DEVICES])(
    "renders a specific construction and device controls for %s",
    async (id) => {
      const card = await mount(id);
      const root = card.shadowRoot!;
      expect(
        root.querySelector(`[data-physical-device="${id}"]`),
      ).not.toBeNull();
      expect(
        root.querySelectorAll(
          ".specific-controls button,.specific-controls input",
        ).length,
      ).toBeGreaterThan(0);
      expect(root.querySelector(".history-chart")).toBeNull();
      expect(root.textContent).not.toContain("device_weather_");
      expect(root.textContent).not.toContain("device_lighting_");
    },
  );
  it.each([...WEATHER_DEVICES, ...LIGHTING_DEVICES])(
    "keeps missing feedback distinct from an example or zero for %s",
    (id) => {
      const d = device(id);
      const e = entity("unavailable");
      const base = entityVisual(e);
      const live =
        d.category === "weather" ? weatherLive(d, e) : lightingLive(d, e);
      const v =
        d.category === "weather"
          ? weatherVisualState(d, base, undefined, e)
          : lightingVisualState(d, base, undefined, e);
      expect(live.known).toBe(false);
      expect(live.primary.value).toBe("—");
      expect(live.metrics).toEqual([]);
      expect(v.hasTelemetry).toBe(false);
      expect(v.active).toBe(false);
      expect(v.example).toBe(false);
    },
  );
  it("accelerates wind cups, decelerates to calm, and then holds their last angle", () => {
    const d = device("anemometer");
    let s = weatherRange(d, initial(d.id), "target", 8)!;
    s = advanceWeatherState(d, s, 1000);
    expect(s.value).toBe(8);
    expect(s.position).toBeGreaterThan(0);
    const before = s.position;
    s = advanceWeatherState(d, s, 100);
    expect(s.position).not.toBe(before);
    s = weatherAction(d, s, "stop")!;
    s = advanceWeatherState(d, s, 100);
    expect(s.value).toBeGreaterThan(0);
    expect(s.value).toBeLessThan(8);
    s = advanceWeatherState(d, s, 1000);
    expect(s.value).toBe(0);
    expect(s.active).toBe(false);
    expect(advanceWeatherState(d, s, 1000)).toEqual(s);
  });
  it("turns a vane across north by the shortest route", () => {
    const d = device("wind_direction_sensor");
    let s = { ...initial(d.id), pan: 350, tilt: 350 };
    s = weatherRange(d, s, "tilt", 10)!;
    s = advanceWeatherState(d, s, 100);
    expect(s.pan).toBe(0);
    s = advanceWeatherState(d, s, 100);
    expect(s.pan).toBe(10);
    expect(s.active).toBe(false);
  });
  it("increments a rain bucket once on a completed tip and never on pause", () => {
    const d = device("rain_gauge");
    let s = weatherAction(d, initial(d.id), "sample")!;
    s = advanceWeatherState(d, s, 700);
    expect(s.channels).toBe(0);
    s = weatherAction(d, s, "pause")!;
    expect(advanceWeatherState(d, s, 9000)).toEqual(s);
    s = weatherAction(d, s, "resume")!;
    s = advanceWeatherState(d, s, 700);
    expect(s.channels).toBe(1);
    expect(s.value).toBe(0.2);
    expect(advanceWeatherState(d, s, 10000).channels).toBe(1);
  });
  it("ends a short rain example but retains wetness until cleared", () => {
    const d = device("rain_sensor");
    let s = advanceWeatherState(
      d,
      weatherAction(d, initial(d.id), "sample")!,
      4000,
    );
    expect(s.active).toBe(false);
    expect(s.mode).toBe("weather_wet");
    expect(s.program).toBe("idle");
    s = weatherAction(d, s, "stop")!;
    expect(s.mode).toBe("weather_dry");
  });
  it("uses a finite detected lightning event without inventing storm distance", () => {
    const d = device("lightning_detector");
    const s = advanceWeatherState(
      d,
      weatherAction(d, initial(d.id), "sample")!,
      900,
    );
    expect(s.channels).toBe(1);
    expect(s.active).toBe(false);
    expect(deviceInterface(d, s).metrics).toEqual([]);
  });
  it("keeps frost presence independent of subzero temperature", () => {
    const d = device("frost_sensor");
    let s = advanceWeatherState(
      d,
      weatherRange(d, initial(d.id), "target", -10)!,
      600000,
    );
    expect(s.mode).toBe("weather_dry");
    s = weatherChoice(d, s, "mode", "weather_frosted")!;
    expect(s.mode).toBe("weather_frosted");
  });
  it("uses distinct pickup and release levels in the illustrative flood contact", () => {
    const d = device("flood_sensor");
    let s = initial(d.id);
    for (const [depth, contact] of [
      [25, 1],
      [15, 1],
      [5, 0],
      [15, 0],
    ]) {
      s = advanceWeatherState(d, weatherRange(d, s, "target", depth)!, 600000);
      expect(s.level).toBe(contact);
    }
  });
  it("drains a clear roof and retains a restricted example", () => {
    const d = device("roof_drain_monitor");
    let s = weatherChoice(
      d,
      initial(d.id),
      "mode",
      "weather_restricted_drain",
    )!;
    s = advanceWeatherState(d, weatherRange(d, s, "target", 50)!, 1200);
    expect(s.value).toBe(50);
    expect(s.active).toBe(false);
    s = weatherChoice(d, s, "mode", "weather_clear_drain")!;
    s = advanceWeatherState(d, s, 6000);
    expect(s.value).toBe(0);
    expect(s.active).toBe(false);
  });
  it.each([
    ["weather_temperature_sensor", "32", "°F", 0],
    ["anemometer", "36", "km/h", 10],
    ["barometer", "101300", "Pa", 1013],
    ["snow_sensor", "12", "cm", 120],
    ["uv_sensor", "0", "UVI", 0],
  ] as const)(
    "converts known units and accepts zero for %s",
    (id, n, u, value) => {
      const live = weatherLive(device(id), entity(n, u));
      expect(live.known).toBe(true);
      expect(live.value).toBeCloseTo(value);
    },
  );
  it.each([
    ["barometer", "0", "W"],
    ["anemometer", "12", ""],
    ["wind_direction_sensor", "360", "°"],
    ["weather_humidity_sensor", "101", "%"],
    ["uv_sensor", "", "UVI"],
    ["snow_sensor", "Infinity", "mm"],
  ] as const)("rejects mismatched or invalid %s feedback %s %s", (id, n, u) =>
    expect(weatherLive(device(id), entity(n, u)).known).toBe(false),
  );
  it("does not fabricate rain depth from a dry binary contact", () => {
    const live = weatherLive(
      device("rain_sensor"),
      entity("off", undefined, {}, "binary_sensor.rain"),
    );
    expect(live.wet).toBe(false);
    expect(live.value).toBeUndefined();
    expect(live.primary.unit).toBe("");
  });
  it("fades a light smoothly to zero and restores its last nonzero setting", () => {
    const d = device("dimmable_light");
    let s = lightingRange(d, initial(d.id), "target", 42)!;
    s = advanceLightingState(d, s, 1000);
    s = lightingAction(d, s, "stop")!;
    s = advanceLightingState(d, s, 100);
    expect(s.level).toBeGreaterThan(0);
    expect(s.level).toBeLessThan(42);
    s = advanceLightingState(d, s, 1000);
    expect(s.level).toBe(0);
    expect(s.active).toBe(false);
    s = advanceLightingState(d, lightingAction(d, s, "start")!, 1000);
    expect(s.level).toBe(42);
  });
  it("bounds the driver to volts rather than an invented power measurement", () => {
    const d = device("led_driver");
    const s = advanceLightingState(
      d,
      lightingRange(d, initial(d.id), "target", 9)!,
      1000,
    );
    expect(s.level).toBe(9);
    expect(deviceInterface(d, s).primary.unit).toBe("V");
    expect(deviceInterface(d, s).metrics).toEqual([]);
  });
  it("updates RGBW white independently and stores DMX channels independently", () => {
    const d = device("rgbw_light");
    let s = advanceLightingState(
      d,
      lightingRange(d, initial(d.id), "position", 72)!,
      1000,
    );
    expect(s.floor).toBe(72);
    expect(s.level).toBe(68);
    const m = device("dmx_controller");
    s = lightingRange(m, initial(m.id), "value", 153)!;
    s = lightingChoice(m, s, "metric", "light_channel_2")!;
    expect(s.value).toBe(0);
    s = lightingRange(m, s, "value", 91)!;
    s = lightingChoice(m, s, "metric", "light_channel_1")!;
    expect(s.value).toBe(153);
    expect(s.tilt).toBe(91);
  });
  it("limits color temperature, changes it gradually, and settles with reduced motion", () => {
    const d = device("tunable_white_light");
    let s = lightingRange(d, initial(d.id), "tilt", 9000)!;
    expect(s.tilt).toBe(6500);
    s = advanceLightingState(d, s, 100);
    expect(s.pan).toBe(3600);
    s = advanceLightingState(d, s, 600000);
    expect(s.pan).toBe(6500);
    expect(s.active).toBe(false);
  });
  it.each(["emergency_light", "exit_sign"])(
    "runs a finite example test and never enables live safety control for %s",
    (id) => {
      const d = device(id);
      let s = lightingAction(d, initial(id), "test")!;
      expect(lightingVisualState(d, previewVisual(s), s).level).toBe(100);
      s = advanceLightingState(d, s, 3100);
      expect(s.program).toBe("idle");
      expect(s.active).toBe(false);
      expect(lightingRemote(d)).toBe(false);
      expect(lightingVisualState(d, previewVisual(s), s).level).toBe(
        id === "exit_sign" ? 100 : 0,
      );
    },
  );
  it("accepts reported zero brightness and rejects invented color or power", () => {
    const d = device("rgbw_light");
    const e = entity(
      "on",
      undefined,
      { brightness: 0, rgbw_color: [0, 128, 255, 64], power: 10 },
      "light.lamp",
    );
    const live = lightingLive(d, e);
    expect(live.level).toBe(0);
    expect(live.color).toBe("#0080ff");
    expect(live.white).toBeCloseTo(64 / 2.55);
    expect(live.metrics).toEqual([]);
    expect(
      lightingLive(
        d,
        entity("off", undefined, { brightness: 200 }, "light.lamp"),
      ).level,
    ).toBe(0);
    expect(
      lightingLive(
        d,
        entity("on", undefined, { rgb_color: [300, 0, 0] }, "light.lamp"),
      ).color,
    ).toBeUndefined();
  });
  it("does not convert ambient light into emission or actionable power", () => {
    const d = device("illuminance_sensor");
    expect(lightingLive(d, entity("0", "lx")).level).toBe(0);
    expect(lightingLive(d, entity("45", "W")).known).toBe(false);
    expect(lightingRemote(d)).toBe(false);
  });
  it("binds card sliders to the new state and settles without RAF in reduced motion", async () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const card = await mount("tunable_white_light");
    const root = card.shadowRoot!;
    const input = root.querySelector<HTMLInputElement>(
      'input[data-field="tilt"]',
    )!;
    input.value = "6500";
    input.dispatchEvent(new Event("input"));
    await card.updateComplete;
    await card.updateComplete;
    expect(
      root.querySelector(".realistic-lighting")!.getAttribute("data-cct"),
    ).toBe("6500");
    expect(raf).not.toHaveBeenCalled();
  });
  it("uses unit-checked live metrics instead of example histories or fake wattage", async () => {
    const card = await mount("rgb_light");
    card.card = { ...card.card, entity: "light.lamp" };
    card.entity = entity(
      "on",
      undefined,
      { brightness: 128, rgb_color: [255, 0, 0] },
      "light.lamp",
    );
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector(".specific-controls")).toBeNull();
    expect(card.shadowRoot!.querySelector(".metric-grid")).toBeNull();
    expect(
      card
        .shadowRoot!.querySelector(".realistic-lighting")!
        .getAttribute("style"),
    ).toContain("#ff0000");
  });
  it("applies the new action dispatch before generic family behavior", () => {
    const d = device("rain_gauge");
    const s = previewAction(initial(d.id), "sample", d);
    expect(s.program).toBe("tip");
    expect(s.value).toBe(0);
  });
});

it.each([-22, 0, 22])(
  "keeps the rain bucket rigid at %s degrees",
  async (angle) => {
    const { weatherBucketPoint } =
      await import("../src/dashboard/physical-weather");
    const p = weatherBucketPoint(angle, 16, 7);
    expect(Math.hypot(p[0], p[2] - 24)).toBeCloseTo(Math.hypot(16, 7), 8);
    expect(p[1]).toBe(5);
  },
);
it("shows only explicitly reported emergency supply and battery data", () => {
  const d = device("emergency_light");
  expect(
    lightingLive(d, entity("on", undefined, {}, "light.emergency")).known,
  ).toBe(false);
  const live = lightingLive(
    d,
    entity(
      "on",
      undefined,
      { mains_power: false, battery_level: 0 },
      "light.emergency",
    ),
  );
  expect(live.mode).toBe("light_backup");
  expect(live.level).toBe(100);
  expect(live.metrics[0].value).toBe(0);
});
it("accepts explicit controller channels without inventing unreported ones", () => {
  const d = device("dmx_controller");
  expect(lightingLive(d, entity("on")).outputs).toBeUndefined();
  expect(
    lightingLive(
      d,
      entity("on", undefined, { channel_levels: [0, 128, 255, 15] }),
    ).outputs,
  ).toEqual([0, 128, 255, 15]);
  expect(
    lightingLive(
      d,
      entity("on", undefined, { channel_levels: [0, 128, 256, 15] }),
    ).known,
  ).toBe(false);
});

it.each(["dimmable_light", "streetlight", "rain_gauge"])(
  "continues after a zero-elapsed first animation frame for %s",
  async (id) => {
    const raf = vi.fn((_cb: FrameRequestCallback) => 1);
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const card = await mount(id);
    const action = card.shadowRoot!.querySelector<HTMLButtonElement>(
      id === "rain_gauge" ? ".action-sample" : ".action-stop",
    )!;
    action.click();
    await card.updateComplete;
    expect(raf).toHaveBeenCalledTimes(1);
    (raf.mock.calls[0][0] as FrameRequestCallback)(0);
    await card.updateComplete;
    expect(raf).toHaveBeenCalledTimes(2);
    (raf.mock.calls[1][0] as FrameRequestCallback)(performance.now() + 5000);
    await card.updateComplete;
    if (id === "rain_gauge") {
      expect(
        card.shadowRoot!.querySelector(".primary-reading")!.textContent,
      ).toContain("0.2");
    } else {
      expect(
        card
          .shadowRoot!.querySelector(".realistic-lighting")!
          .getAttribute("data-level"),
      ).toBe("0.000");
    }
  },
);

describe("Streetlight and exit-sign redesign", () => {
  it("fades roadway illumination to zero and restores the previous dimming level", async () => {
    const d = device("streetlight");
    let s = lightingRange(d, initial(d.id), "target", 34)!;
    s = advanceLightingState(d, s, 1000);
    s = lightingAction(d, s, "stop")!;
    s = advanceLightingState(d, s, 60);
    expect(s.level).toBeGreaterThan(0);
    expect(s.level).toBeLessThan(34);
    s = advanceLightingState(d, s, 1000);
    expect(s.level).toBe(0);
    const card = await mount(d.id);
    const off =
      card.shadowRoot!.querySelector<HTMLButtonElement>(".action-stop")!;
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    off.click();
    await card.updateComplete;
    await card.updateComplete;
    expect(
      card
        .shadowRoot!.querySelector(".street-light-pool")!
        .getAttribute("opacity"),
    ).toBe("0");
    expect(
      card
        .shadowRoot!.querySelector(".street-optic-edge")!
        .getAttribute("opacity"),
    ).toBe("0");
    expect(card.shadowRoot!.querySelector(".street-galvanized")).not.toBeNull();
    s = advanceLightingState(d, lightingAction(d, s, "start")!, 1000);
    expect(s.level).toBe(34);
  });
  it("keeps day/night surroundings independent of the lamp state and color", () => {
    const d = device("streetlight");
    const s = initial(d.id);
    expect(s.pan).toBe(4000);
    expect(s.period).toBe("road_night");
    const day = lightingChoice(d, s, "period", "road_day")!;
    expect(day.level).toBe(s.level);
    expect(day.pan).toBe(s.pan);
    const off = advanceLightingState(d, lightingAction(d, day, "stop")!, 1000);
    expect(lightingChoice(d, off, "period", "road_night")!.level).toBe(0);
  });
  it("changes lamp color with bounded finite response without fabricating watts or lux", () => {
    const d = device("streetlight");
    const s = advanceLightingState(
      d,
      lightingRange(d, initial(d.id), "tilt", 2200)!,
      1000,
    );
    expect(s.pan).toBe(2200);
    expect(s.level).toBe(68);
    const model = deviceInterface(d, s);
    expect(model.metrics.map((m) => m.unit)).toEqual(["K"]);
  });
  it("retains neutral surroundings and unreported color for a connected streetlight", () => {
    const d = device("streetlight");
    const e = entity("on", undefined, { brightness: 0 }, "light.road");
    const v = lightingVisualState(d, entityVisual(e), undefined, e);
    expect(v.level).toBe(0);
    expect(v.colorTemperature).toBeUndefined();
    expect(v.lightEnvironment).toBeUndefined();
  });
  it("renders real street hardware, graded light, and no airborne cone", async () => {
    const card = await mount("streetlight");
    const r = card.shadowRoot!;
    for (const cls of [
      "street-luminaire",
      "street-access-door",
      "street-foundation",
      "street-spigot",
      "street-flat-glass",
      "street-light-pool",
    ]) {
      expect(r.querySelector(`.${cls}`), cls).not.toBeNull();
    }
    const stops = r.querySelectorAll("radialGradient stop");
    expect(stops.length).toBeGreaterThanOrEqual(5);
    expect(stops[stops.length - 1].getAttribute("stop-opacity")).toBe("0");
    expect(r.querySelector(".lt-beam")).toBeNull();
  });
  it("scopes gradient references to each card instance", async () => {
    const a = await mount("streetlight");
    const b = await mount("streetlight");
    b.card = { ...b.card, id: "second-road" };
    await b.updateComplete;
    const idA = a.shadowRoot!.querySelector("radialGradient")!.id;
    const idB = b.shadowRoot!.querySelector("radialGradient")!.id;
    expect(idA).not.toBe(idB);
    for (const [resource, target, attribute] of [
      ["clipPath", ".street-road-illumination", "clip-path"],
      ["filter", ".street-source-glow", "filter"],
      ["linearGradient", ".street-optic-edge g", "fill"],
    ]) {
      const resourceA = a.shadowRoot!.querySelector(resource)!.id;
      const resourceB = b.shadowRoot!.querySelector(resource)!.id;
      expect(resourceA).not.toBe(resourceB);
      expect(a.shadowRoot!.querySelector(target)!.getAttribute(attribute)).toBe(
        `url(#${resourceA})`,
      );
      expect(b.shadowRoot!.querySelector(target)!.getAttribute(attribute)).toBe(
        `url(#${resourceB})`,
      );
    }
    expect(
      a
        .shadowRoot!.querySelector(".street-light-pool ellipse")!
        .getAttribute("fill"),
    ).toBe(`url(#${idA})`);
    expect(
      b
        .shadowRoot!.querySelector(".street-light-pool ellipse")!
        .getAttribute("fill"),
    ).toBe(`url(#${idB})`);
  });
  it.each(["down", "left", "right", "up"] as const)(
    "renders the %s exit arrow without changing its meaning in RTL",
    async (direction) => {
      const card = await mount("exit_sign");
      card.setAttribute("dir", "rtl");
      const root = card.shadowRoot!;
      const button = root.querySelector<HTMLButtonElement>(
        `button[data-value="exit_${direction}"]`,
      )!;
      button.click();
      await card.updateComplete;
      expect(
        root
          .querySelector(".exit-sign-assembly")!
          .getAttribute("data-direction"),
      ).toBe(direction);
      expect(
        root
          .querySelector(".exit-direction-arrow")!
          .getAttribute("data-direction"),
      ).toBe(direction);
      expect(
        root.querySelector(".exit-panel-light")!.getAttribute("opacity"),
      ).toBe("1");
    },
  );
  it.each(["test", "alarm", "restore"] as const)(
    "keeps a maintained exit sign illuminated through the %s example",
    (action) => {
      const d = device("exit_sign");
      let s = lightingAction(d, initial(d.id), action)!;
      expect(lightingVisualState(d, previewVisual(s), s).level).toBe(100);
      s = advanceLightingState(d, s, 5000);
      expect(lightingVisualState(d, previewVisual(s), s).level).toBe(100);
      expect(lightingRemote(d)).toBe(false);
    },
  );
  it("does not infer an exit lamp output or arrow from mains feedback alone", () => {
    const d = device("exit_sign");
    const e = entity("on", undefined, { mains_power: true });
    const live = lightingLive(d, e);
    expect(live.known).toBe(true);
    expect(live.level).toBeUndefined();
    expect(live.hasOutput).toBe(false);
    expect(live.exitDirection).toBeUndefined();
    const v = lightingVisualState(d, entityVisual(e), undefined, e);
    expect(v.hasLightOutput).toBe(false);
    expect(v.level).toBe(0);
  });
  it.each([true, false])(
    "honors explicitly reported exit lamp state %s",
    (on) => {
      const d = device("exit_sign");
      const live = lightingLive(
        d,
        entity("on", undefined, {
          mains_power: false,
          lamp_on: on,
          exit_direction: "right",
        }),
      );
      expect(live.hasOutput).toBe(true);
      expect(live.level).toBe(on ? 100 : 0);
      expect(live.exitDirection).toBe("right");
    },
  );
  it.each(["on", "off"])(
    "accepts actual light-domain exit state %s without requiring inferred supply",
    (state) => {
      const live = lightingLive(
        device("exit_sign"),
        entity(state, undefined, { exit_direction: "left" }, "light.exit"),
      );
      expect(live.known).toBe(true);
      expect(live.level).toBe(state === "on" ? 100 : 0);
      expect(live.mode).toBe("unknown");
      expect(live.exitDirection).toBe("left");
    },
  );
  it.each(["unknown", "unavailable"])(
    "does not illuminate stale exit feedback when %s",
    (state) => {
      const d = device("exit_sign");
      const e = entity(state, undefined, {
        mains_power: true,
        lamp_on: true,
        exit_direction: "up",
      });
      const v = lightingVisualState(d, entityVisual(e), undefined, e);
      expect(v.hasLightOutput).toBe(false);
      expect(v.level).toBe(0);
      expect(v.exitDirection).toBeUndefined();
    },
  );
  it("leaves an invalid installed exit direction unreported", () =>
    expect(
      lightingLive(
        device("exit_sign"),
        entity("on", undefined, {
          mains_power: true,
          lamp_on: true,
          exit_direction: "north-east",
        }),
      ).exitDirection,
    ).toBeUndefined());
  it("renders connected lamp feedback separately from the supply readout", async () => {
    const card = await mount("exit_sign");
    card.card = { ...card.card, entity: "sensor.exit" };
    card.entity = entity(
      "on",
      undefined,
      { mains_power: true, lamp_on: false, exit_direction: "left" },
      "sensor.exit",
    );
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector(".specific-controls")).toBeNull();
    expect(
      card
        .shadowRoot!.querySelector(".exit-sign-assembly")!
        .getAttribute("data-output"),
    ).toBe("0.000");
    expect(
      card.shadowRoot!.querySelector(".primary-reading")!.textContent,
    ).toContain("Mains supply reported");
    expect(
      card.shadowRoot!.querySelector(".metric-grid")!.textContent,
    ).toContain("Not illuminated");
  });
});

describe("Streetlight emission and feedback", () => {
  it("shows steady dimmed output after the transition stops, with an explicit status", async () => {
    const card = await mount("streetlight");
    const r = card.shadowRoot!;
    expect(r.querySelector(".iso-scene")!.classList.contains("active")).toBe(
      false,
    );
    expect(
      Number(r.querySelector(".street-light-pool")!.getAttribute("opacity")),
    ).toBeGreaterThan(0);
    expect(r.querySelector(".status")!.textContent).toContain("Dimmed");
    expect(r.querySelector(".street-source-glow")).not.toBeNull();
  });
  it("keeps zero exact and increases source and receiving-surface emission together", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    const card = await mount("streetlight");
    const r = card.shadowRoot!;
    const input = r.querySelector<HTMLInputElement>(
      'input[data-field="target"]',
    )!;
    await [0, 10, 25, 50, 100].reduce(async (prior, value) => {
      const previous = await prior;
      input.value = String(value);
      input.dispatchEvent(new Event("input"));
      await card.updateComplete;
      await card.updateComplete;
      const pool = Number(
        r.querySelector(".street-light-pool")!.getAttribute("opacity"),
      );
      const source = Number(
        r.querySelector(".street-optic-edge")!.getAttribute("opacity"),
      );
      expect(pool).toBeGreaterThan(previous);
      expect(source).toBe(pool);
      expect(
        r.querySelector(".street-source-glow")!.getAttribute("opacity"),
      ).toBe(String(pool));
      if (value === 0) expect(pool).toBe(0);
      if (value === 100) expect(pool).toBe(1);
      expect(r.querySelector(".primary-reading")!.textContent).toContain(
        String(value),
      );
      expect(r.querySelector(".iso-scene")!.classList.contains("active")).toBe(
        false,
      );
      return pool;
    }, Promise.resolve(-1));
    expect(raf).not.toHaveBeenCalled();
  });
  it.each([
    ["off", { brightness: 255 }, "Off", "0.000"],
    ["on", { brightness: 0 }, "On · zero output", "0.000"],
    ["on", { brightness: 64 }, "Dimmed", "0.251"],
    ["on", { brightness: 255 }, "On", "1.000"],
    ["on", {}, "On", "1.000"],
    ["unknown", { brightness: 255 }, "Output not reported", "0.000"],
    ["unavailable", { brightness: 255 }, "Unavailable", "0.000"],
  ] as const)(
    "uses reported %s feedback without retaining stale illumination (%j)",
    async (state, attrs, status, output) => {
      const card = await mount("streetlight");
      card.card = { ...card.card, entity: "light.road" };
      card.entity = entity(state, undefined, attrs, "light.road");
      await card.updateComplete;
      const r = card.shadowRoot!;
      expect(
        r.querySelector(".streetlight-assembly")!.getAttribute("data-output"),
      ).toBe(output);
      expect(r.querySelector(".status")!.textContent).toContain(status);
      if (output === "0.000") {
        expect(
          r.querySelector(".street-light-pool")!.getAttribute("opacity"),
        ).toBe("0");
        expect(
          r.querySelector(".street-source-glow")!.getAttribute("opacity"),
        ).toBe("0");
      }
      expect(r.querySelector(".street-luminaire")).not.toBeNull();
      expect(r.querySelector(".iso-scene")!.classList.contains("alert")).toBe(
        false,
      );
      if (state === "on" && !("brightness" in attrs)) {
        expect(r.querySelector(".primary-reading")!.textContent).toContain(
          "On",
        );
        expect(r.querySelector(".primary-reading")!.textContent).not.toContain(
          "%",
        );
      }
    },
  );
  it("clears a previously lit card when feedback disappears", async () => {
    const card = await mount("streetlight");
    card.card = { ...card.card, entity: "light.road" };
    card.entity = undefined;
    await card.updateComplete;
    expect(
      card
        .shadowRoot!.querySelector(".street-light-pool")!
        .getAttribute("opacity"),
    ).toBe("0");
    expect(card.shadowRoot!.querySelector(".status")!.textContent).toContain(
      "Output not reported",
    );
  });
  it("changes color while off without starting emission and restores the saved dimming", () => {
    const d = device("streetlight");
    let s = advanceLightingState(
      d,
      lightingRange(d, initial(d.id), "target", 25)!,
      1000,
    );
    s = advanceLightingState(d, lightingAction(d, s, "stop")!, 1000);
    for (const cct of [2200, 4000, 6500]) {
      s = advanceLightingState(d, lightingRange(d, s, "tilt", cct)!, 1000);
      expect(s.level).toBe(0);
      expect(s.pan).toBe(cct);
      expect(s.active).toBe(false);
      expect(lightingVisualState(d, previewVisual(s), s).level).toBe(0);
    }
    s = advanceLightingState(d, lightingAction(d, s, "start")!, 1000);
    expect(s.level).toBe(25);
    expect(s.pan).toBe(6500);
  });
  it("clips the pool to the road and keeps source glow inside the transformed luminaire", async () => {
    const card = await mount("streetlight");
    const r = card.shadowRoot!;
    const clip = r.querySelector("clipPath")!;
    expect(clip).not.toBeNull();
    expect(
      r.querySelector(".street-road-illumination")!.getAttribute("clip-path"),
    ).toBe(`url(#${clip.id})`);
    expect(clip.querySelector("polygon")!.getAttribute("points")).toBe(
      r.querySelector(".street-asphalt")!.getAttribute("points"),
    );
    expect(
      r.querySelector(".street-luminaire .street-source-glow"),
    ).not.toBeNull();
    expect(
      r.querySelector(".street-luminaire .street-optic-edge"),
    ).not.toBeNull();
    expect(
      r.querySelector(".street-source-glow")!.querySelector(".street-cast-top"),
    ).toBeNull();
  });
  it("cancels animation on disconnect and stops scheduling once settled", async () => {
    const raf = vi.fn((_cb: FrameRequestCallback) => 42);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const card = await mount("streetlight");
    card.shadowRoot!.querySelector<HTMLButtonElement>(".action-stop")!.click();
    await card.updateComplete;
    raf.mock.calls[0][0](performance.now() + 1000);
    await card.updateComplete;
    expect(raf).toHaveBeenCalledTimes(1);
    expect(
      card
        .shadowRoot!.querySelector(".street-light-pool")!
        .getAttribute("opacity"),
    ).toBe("0");
    card.shadowRoot!.querySelector<HTMLButtonElement>(".action-start")!.click();
    await card.updateComplete;
    card.remove();
    expect(cancel).toHaveBeenCalledWith(42);
    raf.mock.calls[1][0](performance.now() + 2000);
    expect(raf).toHaveBeenCalledTimes(2);
  });
});

it("settles streetlight LED brightness and color in at most 250 ms", () => {
  const d = device("streetlight");
  let s = lightingRange(d, initial(d.id), "target", 0)!;
  s = lightingRange(d, s, "tilt", 6500)!;
  s = advanceLightingState(d, s, 250);
  expect(s.level).toBe(0);
  expect(s.pan).toBe(6500);
  expect(s.active).toBe(false);
  s = lightingRange(d, s, "target", 100)!;
  s = advanceLightingState(d, s, 125);
  expect(s.level).toBe(50);
  expect(s.active).toBe(true);
  s = advanceLightingState(d, s, 125);
  expect(s.level).toBe(100);
  expect(s.active).toBe(false);
});
