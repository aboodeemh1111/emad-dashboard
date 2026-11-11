import type { HassEntity } from "home-assistant-js-websocket";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogDevice } from "../src/dashboard/device-catalog";
import {
  deviceInterface,
  initialDeviceState,
  previewVisual,
  previewAction,
} from "../src/dashboard/device-interface";
import {
  WELLNESS_DEVICES,
  wellnessAction,
  wellnessChoice,
  wellnessFilterPhase,
  wellnessInterface,
  wellnessIsMoving,
  wellnessLive,
  wellnessRange,
  wellnessVisualState,
  advanceWellnessState,
} from "../src/dashboard/wellness-model";
import { EmadDashboardCatalogDevice } from "../src/dashboard/emad-ui-catalog-device";
import type { DashboardTextKey } from "../src/dashboard/dashboard-model";
import en from "../src/translations/en.json";
import ar from "../src/translations/ar.json";

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
  attributes: HassEntity["attributes"] = {},
  entity_id = "switch.pool",
): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: "",
  last_updated: "",
  context: { id: "test", parent_id: null, user_id: null },
});
async function mount(id: string, language = "en") {
  const card = new EmadDashboardCatalogDevice();
  card.card = {
    id: "wellness-test",
    kind: "device",
    deviceType: id,
    x: 0,
    y: 0,
    w: 384,
    h: 720,
  };
  card.language = language;
  card.localize = (key: string) =>
    (language === "ar" ? ar : en).ui.panel["emad-dashboard"][
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
describe("Pool, fountain and wellness constructions", () => {
  it.each(WELLNESS_DEVICES)(
    "gives %s specific geometry and controls without fake histories",
    async (id) => {
      const c = await mount(id);
      const r = c.shadowRoot!;
      expect(r.querySelector(`[data-wellness-device="${id}"]`)).not.toBeNull();
      expect(
        r.querySelector(".specific-controls input,.specific-controls button"),
      ).not.toBeNull();
      expect(r.querySelector(".history-chart")).toBeNull();
      expect(r.textContent).not.toMatch(
        /device_wellness_|device_option_wellness_/,
      );
      const model = deviceInterface(device(id), initial(id));
      expect(
        model.metrics.some(
          (m) => m.unit === "L" || m.unit === "W" || m.unit === "m³/h",
        ),
      ).toBe(false);
    },
  );
  it.each(WELLNESS_DEVICES)(
    "localizes all %s controls and metrics in English and Arabic",
    (id) => {
      const m = wellnessInterface(device(id), initial(id))!;
      const keys = [
        m.primary.label,
        m.status,
        ...m.metrics.map((v) => v.label),
        ...m.controls.flatMap((c) => ("label" in c ? [c.label] : [])),
      ];
      for (const lang of [en, ar]) {
        const strings = lang.ui.panel["emad-dashboard"];
        for (const key of keys) expect(strings[key], key).toBeTruthy();
        for (const control of m.controls) {
          if (control.kind === "choices") {
            for (const option of control.options) {
              expect(
                strings[`device_option_${option}` as DashboardTextKey],
                option,
              ).toBeTruthy();
            }
          }
        }
      }
    },
  );
  it("moves the cover continuously, pauses in place, and respects opening semantics", () => {
    const d = device("pool_cover");
    let s = wellnessAction(d, initial(d.id), "close")!;
    expect(s.position).toBe(65);
    s = advanceWellnessState(d, s, 1000);
    expect(s.position).toBe(47);
    expect(s.active).toBe(true);
    s = wellnessAction(d, s, "pause")!;
    expect(s.target).toBe(47);
    expect(wellnessIsMoving(d, s)).toBe(false);
    expect(advanceWellnessState(d, s, 1000).position).toBe(47);
    s = wellnessRange(d, s, "target", 12.5)!;
    expect(s.position).toBe(47);
    s = advanceWellnessState(d, s, 10000);
    expect(s.position).toBe(12.5);
    expect(s.active).toBe(false);
    s = advanceWellnessState(d, previewAction(s, "open", d), 10000);
    expect(s.position).toBe(100);
  });
  it.each([
    "pool_light",
    "pool_circulation_pump",
    "fountain_pump",
    "pool_chlorinator",
    "pool_dosing_controller",
  ])("stops %s output and restores the saved output", (id) => {
    const d = device(id);
    let s = advanceWellnessState(
      d,
      wellnessRange(d, initial(id), "target", 25)!,
      1000,
    );
    s = advanceWellnessState(d, wellnessAction(d, s, "stop")!, 2000);
    expect(s.level).toBe(0);
    expect(s.active).toBe(false);
    const v = wellnessVisualState(d, previewVisual(s), s);
    expect(v.level).toBe(0);
    s = advanceWellnessState(d, wellnessAction(d, s, "start")!, 2000);
    expect(s.level).toBe(25);
    expect(s.active).toBe(false);
  });
  it("keeps light color independent of power and level", () => {
    const d = device("pool_light");
    let s = advanceWellnessState(
      d,
      wellnessAction(d, initial(d.id), "stop")!,
      1000,
    );
    s = { ...s, color: "#b19ad8" };
    expect(wellnessVisualState(d, previewVisual(s), s).level).toBe(0);
    s = advanceWellnessState(d, wellnessAction(d, s, "start")!, 1000);
    expect(s.color).toBe("#b19ad8");
    expect(s.level).toBe(75);
  });
  it.each(["pool_chlorinator", "pool_dosing_controller"])(
    "inhibits %s immediately without flow and ramps back after flow returns",
    (id) => {
      const d = device(id);
      let s = wellnessChoice(d, initial(id), "period", "wellness_no_flow")!;
      expect(s.level).toBe(0);
      expect(s.open).toBe(true);
      expect(wellnessVisualState(d, previewVisual(s), s).flowAvailable).toBe(
        false,
      );
      s = advanceWellnessState(
        d,
        wellnessChoice(d, s, "period", "wellness_flow")!,
        1000,
      );
      expect(s.level).toBe(65);
    },
  );
  it("stops the filter pump before every valve change and completes backwash and rinse", () => {
    const d = device("pool_filter");
    let s = wellnessAction(d, initial(d.id), "flush")!;
    const phases = new Set<string>();
    for (let i = 0; i < 900; i++) {
      s = advanceWellnessState(d, s, 16);
      const phase = wellnessFilterPhase(s);
      phases.add(phase);
      if (phase.startsWith("turn_")) expect(s.level).toBe(0);
    }
    for (const phase of [
      "stopping",
      "turn_backwash",
      "backwash",
      "turn_rinse",
      "rinse",
      "turn_filter",
      "filter",
    ]) {
      expect(phases.has(phase), phase).toBe(true);
    }
    expect(s.program).toBe("idle");
    expect(s.level).toBe(65);
    expect(s.active).toBe(false);
  });
  it("pauses the filter cycle without changing valve position and resumes it", () => {
    const d = device("pool_filter");
    let s = wellnessAction(d, initial(d.id), "flush")!;
    for (let i = 0; i < 130; i++) s = advanceWellnessState(d, s, 20);
    expect(wellnessFilterPhase(s)).toBe("backwash");
    const progress = s.progress;
    s = advanceWellnessState(d, wellnessAction(d, s, "stop")!, 1000);
    expect(s.level).toBe(0);
    expect(s.progress).toBe(progress);
    expect(s.active).toBe(false);
    s = advanceWellnessState(d, wellnessAction(d, s, "start")!, 12000);
    expect(s.program).toBe("idle");
    expect(s.level).toBe(65);
  });
  it.each([
    "pool_heater",
    "pool_heat_pump",
    "spa_controller",
    "sauna_controller",
    "steam_room_controller",
  ])("keeps residual temperature in %s instead of instantly cooling", (id) => {
    const d = device(id);
    let s = wellnessAction(d, initial(id), "stop")!;
    const before = s.value;
    s = advanceWellnessState(d, s, 600000);
    expect(s.value).toBe(before);
    expect(s.level).toBe(0);
    expect(s.active).toBe(false);
    s = wellnessAction(d, s, "start")!;
    s = advanceWellnessState(
      d,
      wellnessRange(d, s, "tilt", id === "sauna_controller" ? 40 : 20)!,
      600000,
    );
    expect(s.value).toBe(before);
    expect(s.active).toBe(false);
  });
  it.each(
    WELLNESS_DEVICES.flatMap((id) =>
      ["unknown", "unavailable", "missing"].map(
        (state) => [id, state] as const,
      ),
    ),
  )("clears stale %s output with %s feedback", (id, state) => {
    const d = device(id);
    const e =
      state === "missing"
        ? undefined
        : entity(state, {
            brightness: 255,
            percentage: 100,
            current_position: 100,
            current_temperature: 80,
            heating: true,
            flow_ok: true,
            jet_percentage: 100,
          });
    const live = wellnessLive(d, e);
    expect(live.known).toBe(false);
    expect(live.visual.level).toBe(0);
    expect(live.visual.active).toBe(false);
    expect(live.visual.hasPosition).toBe(false);
    expect(live.visual.heating).toBe(false);
    expect(live.primary.value).toBe("—");
  });
  it.each([0, 10, 25, 50, 100])(
    "preserves an actual %s percent pool level without assuming volume",
    (n) => {
      const live = wellnessLive(
        device("pool_level_sensor"),
        entity(String(n), { unit_of_measurement: "%" }, "sensor.pool_level"),
      );
      expect(live.visual.level).toBe(n);
      expect(live.primary.value).toBe(n);
      expect(live.metrics).toHaveLength(0);
    },
  );
  it("does not turn an absolute level or a unitless sensor into a fabricated pool percentage", () => {
    const d = device("pool_level_sensor");
    const actual = wellnessLive(
      d,
      entity("420", { unit_of_measurement: "mm" }, "sensor.pool_level"),
    );
    expect(actual.primary.unit).toBe("mm");
    expect(actual.visual.hasLevel).toBe(false);
    expect(wellnessLive(d, entity("68", {}, "sensor.pool_level")).known).toBe(
      false,
    );
  });
  it("does not infer a fully open cover from an open state alone", () => {
    const live = wellnessLive(
      device("pool_cover"),
      entity("open", {}, "cover.pool"),
    );
    expect(live.visual.hasPosition).toBe(false);
    expect(live.primary.unit).toBe("");
    expect(
      wellnessLive(device("pool_cover"), entity("closed", {}, "cover.pool"))
        .visual.position,
    ).toBe(0);
  });
  it("distinguishes binary power from reported output and preserves a true zero", () => {
    const d = device("pool_light");
    const binary = wellnessLive(d, entity("on", {}, "light.pool"));
    expect(binary.primary.unit).toBe("");
    expect(binary.primary.value).toBe("device_wellness_on");
    const zero = wellnessLive(d, entity("on", { brightness: 0 }, "light.pool"));
    expect(zero.visual.level).toBe(0);
    expect(zero.status).toBe("device_wellness_zero_output");
    expect(
      wellnessLive(d, entity("off", { brightness: 255 }, "light.pool")).visual
        .level,
    ).toBe(0);
  });
  it("requires explicit heating feedback and temperature units", () => {
    const d = device("sauna_controller");
    let live = wellnessLive(
      d,
      entity("heat", { current_temperature: 75 }, "climate.sauna"),
    );
    expect(live.visual.heating).toBe(false);
    expect(live.primary.unit).toBe("");
    live = wellnessLive(
      d,
      entity(
        "heat",
        {
          current_temperature: 170,
          temperature_unit: "°F",
          hvac_action: "heating",
        },
        "climate.sauna",
      ),
    );
    expect(live.visual.heating).toBe(true);
    expect(live.primary.value).toBe(170);
    expect(live.primary.unit).toBe("°F");
    live = wellnessLive(
      d,
      entity(
        "off",
        { hvac_action: "heating", jet_percentage: 100 },
        "climate.sauna",
      ),
    );
    expect(live.visual.heating).toBe(false);
    expect(live.visual.level).toBe(0);
  });
  it("requires reported spa jets instead of deriving jets from heating mode", () => {
    const d = device("spa_controller");
    expect(
      wellnessLive(d, entity("heat", { hvac_action: "heating" }, "climate.spa"))
        .visual.level,
    ).toBe(0);
    expect(
      wellnessLive(d, entity("heat", { jet_percentage: 35 }, "climate.spa"))
        .visual.level,
    ).toBe(35);
  });
  it.each(["pool_filter", "pool_chlorinator", "pool_dosing_controller"])(
    "keeps connected %s controls monitoring-only",
    async (id) => {
      const c = await mount(id);
      c.card = { ...c.card, entity: "switch.actual" };
      c.entity = entity("on");
      await c.updateComplete;
      expect(c.shadowRoot!.querySelector(".specific-controls")).toBeNull();
      expect(c.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
        true,
      );
    },
  );
  it("isolates pool-light gradients and clips between instances", async () => {
    const a = await mount("pool_light");
    const b = await mount("pool_light");
    b.card = { ...b.card, id: "second-pool" };
    await b.updateComplete;
    for (const resource of ["radialGradient", "linearGradient", "clipPath"]) {
      expect(a.shadowRoot!.querySelector(resource)!.id).not.toBe(
        b.shadowRoot!.querySelector(resource)!.id,
      );
    }
  });
  it("settles directly in reduced motion without scheduling frames", async () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const c = await mount("pool_cover");
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-close")!.click();
    await c.updateComplete;
    await c.updateComplete;
    expect(
      c
        .shadowRoot!.querySelector(".wl-pool-cover")!
        .getAttribute("data-opening"),
    ).toBe("0");
    expect(raf).not.toHaveBeenCalled();
  });
  it("continues after the zero-elapsed frame, stops at the endpoint, and cancels on disconnect", async () => {
    const raf = vi.fn((_cb: FrameRequestCallback) => 42);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const c = await mount("pool_cover");
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-close")!.click();
    await c.updateComplete;
    raf.mock.calls[0][0](0);
    await c.updateComplete;
    expect(raf).toHaveBeenCalledTimes(2);
    raf.mock.calls[1][0](performance.now() + 10000);
    await c.updateComplete;
    expect(raf).toHaveBeenCalledTimes(2);
    expect(
      c
        .shadowRoot!.querySelector(".wl-pool-cover")!
        .getAttribute("data-opening"),
    ).toBe("0");
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-open")!.click();
    await c.updateComplete;
    c.remove();
    expect(cancel).toHaveBeenCalledWith(42);
  });
});

it("animates the example level smoothly without treating it as a fill command", () => {
  const d = device("pool_level_sensor");
  let s = wellnessRange(d, initial(d.id), "target", 100)!;
  expect(s.level).toBe(68);
  s = advanceWellnessState(d, s, 200);
  expect(s.level).toBe(78);
  s = advanceWellnessState(d, s, 1000);
  expect(s.level).toBe(100);
  expect(s.active).toBe(false);
});
it("animates a reported cooling heat pump without inventing heating", () => {
  const live = wellnessLive(
    device("pool_heat_pump"),
    entity("cool", { hvac_action: "cooling" }, "climate.pool"),
  );
  expect(live.visual.active).toBe(true);
  expect(live.visual.heating).toBe(false);
  expect(live.status).toBe("device_wellness_cooling");
});

it("removes optical and receiving-surface emission when the pool light is off", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const c = await mount("pool_light");
  const r = c.shadowRoot!;
  r.querySelector<HTMLButtonElement>(".action-stop")!.click();
  await c.updateComplete;
  await c.updateComplete;
  expect(
    r.querySelector(".wl-pool-light-source")!.getAttribute("opacity"),
  ).toBe("0");
  expect(
    r.querySelector(".wl-underwater-emission")!.getAttribute("opacity"),
  ).toBe("0");
  const color = r.querySelector<HTMLInputElement>('input[type="color"]')!;
  color.value = "#e57f73";
  color.dispatchEvent(new Event("input"));
  await c.updateComplete;
  expect(
    r.querySelector(".wl-pool-light-source")!.getAttribute("opacity"),
  ).toBe("0");
});
it.each([
  ["opening", "normal"],
  ["closing", "reverse"],
])(
  "rotates the connected cover correctly while %s",
  async (state, direction) => {
    const c = await mount("pool_cover");
    c.card = { ...c.card, entity: "cover.pool" };
    c.entity = entity(state, { current_position: 50 }, "cover.pool");
    await c.updateComplete;
    expect(
      c.shadowRoot!.querySelector(".wl-cover-spindle")!.getAttribute("style"),
    ).toContain(direction);
  },
);

it("separates the cover position label from its moving status in Arabic", () => {
  const model = wellnessInterface(device("pool_cover"), initial("pool_cover"))!;
  expect(model.primary.label).toBe("device_wellness_cover_opening");
  expect(ar.ui.panel["emad-dashboard"][model.primary.label]).toBe("نسبة الفتح");
  expect(ar.ui.panel["emad-dashboard"].device_wellness_opening).toBe(
    "جارٍ الفتح",
  );
});
