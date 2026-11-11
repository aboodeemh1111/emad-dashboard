import type { HassEntity } from "home-assistant-js-websocket";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogDevice } from "../src/dashboard/device-catalog";
import {
  deviceInterface,
  initialDeviceState,
  previewAction,
  previewVisual,
} from "../src/dashboard/device-interface";
import {
  APPLIANCE_DEVICES,
  advanceApplianceState,
  applianceAction,
  applianceActionDisabled,
  applianceChoice,
  applianceInterface,
  applianceIsMoving,
  applianceLive,
  appliancePhase,
  applianceRange,
  applianceVisualState,
} from "../src/dashboard/appliance-model";
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
  entity_id = "switch.appliance",
): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: "",
  last_updated: "",
  context: { id: "test", parent_id: null, user_id: null },
});
async function mount(id: string, language = "en") {
  const c = new EmadDashboardCatalogDevice();
  c.card = {
    id: "appliance-test",
    kind: "device",
    deviceType: id,
    x: 0,
    y: 0,
    w: 384,
    h: 720,
  };
  c.language = language;
  c.localize = (key: string) =>
    (language === "ar" ? ar : en).ui.panel["emad-dashboard"][
      key.replace("ui.panel.emad-dashboard.", "") as DashboardTextKey
    ] || "";
  document.body.append(c);
  await c.updateComplete;
  return c;
}
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});
describe("Appliance constructions and local controls", () => {
  it.each(APPLIANCE_DEVICES)(
    "renders detailed %s in English and Arabic without invented histories",
    async (id) => {
      for (const lang of ["en", "ar"]) {
        // eslint-disable-next-line no-await-in-loop -- Verify and remove each locale before mounting the next.
        const c = await mount(id, lang);
        const r = c.shadowRoot!;
        expect(
          r.querySelector(`[data-appliance-device="${id}"]`),
        ).not.toBeNull();
        expect(r.querySelector(".history-chart")).toBeNull();
        expect(r.querySelector(".specific-controls button")).not.toBeNull();
        expect(r.textContent).not.toMatch(
          /device_appliance_|device_option_ap_/,
        );
        c.remove();
      }
      const m = deviceInterface(device(id), initial(id));
      expect(
        m.metrics.some((x) => ["rpm", "kWh", "L/min"].includes(x.unit)),
      ).toBe(false);
    },
  );
  it.each(APPLIANCE_DEVICES)(
    "localizes every %s state, action, metric and option",
    (id) => {
      const d = device(id);
      const s = initial(id);
      const m = applianceInterface(d, s)!;
      for (const lang of [en, ar]) {
        const strings = lang.ui.panel["emad-dashboard"];
        for (const k of [
          m.primary.label,
          m.status,
          ...m.metrics.map((x) => x.label),
          ...m.controls.flatMap((c) => ("label" in c ? [c.label] : [])),
        ]) {
          expect(strings[k], k).toBeTruthy();
        }
        for (const c of m.controls) {
          if (c.kind === "choices") {
            for (const o of c.options) {
              expect(
                strings[`device_option_${o}` as DashboardTextKey],
                o,
              ).toBeTruthy();
            }
          }
        }
      }
    },
  );
  it.each(APPLIANCE_DEVICES)(
    "isolates %s local interactions from service commands",
    async (id) => {
      const c = await mount(id);
      const send = vi.fn();
      c.addEventListener("emad-device-command", send);
      vi.stubGlobal("matchMedia", () => ({ matches: true }));
      for (const b of c.shadowRoot!.querySelectorAll<HTMLButtonElement>(
        ".specific-controls button",
      )) {
        if (!b.disabled) b.click();
      }
      await c.updateComplete;
      expect(send).not.toHaveBeenCalled();
    },
  );
  it("uses a drum, laundry and water for the washer and a dry drum for the dryer", async () => {
    const w = await mount("washing_machine");
    const d = await mount("clothes_dryer");
    for (const c of [w, d]) {
      expect(c.shadowRoot!.querySelector(".ap-perforation")).not.toBeNull();
      expect(c.shadowRoot!.querySelector(".ap-laundry")).not.toBeNull();
      expect(c.shadowRoot!.querySelector(".fan-rotor")).toBeNull();
    }
    expect(d.shadowRoot!.querySelector(".ap-lint-filter")).not.toBeNull();
  });
  it("gives the microwave a turntable and no oven heating element or temperature control", async () => {
    const c = await mount("microwave_oven");
    expect(c.shadowRoot!.querySelector(".ap-turntable-rotor")).not.toBeNull();
    expect(c.shadowRoot!.querySelector(".ap-element")).toBeNull();
    expect(c.shadowRoot!.textContent).not.toContain("°C");
  });
  it("uses cookware rather than glowing coils for induction", async () => {
    const c = await mount("induction_hob");
    expect(c.shadowRoot!.querySelector(".ap-pan")).not.toBeNull();
    expect(c.shadowRoot!.querySelector(".heating-ring")).toBeNull();
  });
  it("keeps SVG clip IDs unique between instances", async () => {
    const a = await mount("washing_machine");
    const b = await mount("washing_machine");
    b.card = { ...b.card, id: "other-appliance" };
    await b.updateComplete;
    expect(a.shadowRoot!.querySelector("clipPath")!.id).not.toBe(
      b.shadowRoot!.querySelector("clipPath")!.id,
    );
  });
});
describe("Finite example mechanisms", () => {
  it.each(
    APPLIANCE_DEVICES.filter(
      (id) => !["smart_cooker_hood", "induction_hob"].includes(id),
    ),
  )("finishes %s without idle animation frames", (id) => {
    const d = device(id);
    let s = previewAction(initial(id), "start", d);
    expect(applianceIsMoving(d, s)).toBe(true);
    s = advanceApplianceState(d, s, 600000);
    expect(s.program).toBe("complete");
    expect(s.progress).toBe(100);
    expect(s.active).toBe(false);
    expect(advanceApplianceState(d, s, 1000)).toBe(s);
  });
  it.each([
    "refrigerator",
    "freezer",
    "cold_room_controller",
    "refrigerated_display_case",
    "dishwasher",
    "commercial_warewasher",
    "oven",
    "microwave_oven",
    "air_fryer",
    "blast_chiller",
  ])("moves the %s door continuously and inhibits a running cycle", (id) => {
    const d = device(id);
    let s = applianceAction(d, initial(id), "start")!;
    s = advanceApplianceState(d, s, 1000);
    s = applianceAction(d, s, "open")!;
    expect(s.program).toBe("paused");
    expect(s.position).toBe(0);
    s = advanceApplianceState(d, s, 450);
    expect(s.position).toBe(50);
    expect(applianceActionDisabled(d, s, "start")).toBe(true);
    s = advanceApplianceState(d, s, 450);
    expect(s.position).toBe(100);
    expect(s.active).toBe(false);
    s = applianceAction(d, s, "close")!;
    s = advanceApplianceState(d, s, 900);
    expect(s.position).toBe(0);
    expect(s.program).toBe("paused");
  });
  it("keeps the washer locked while wet and drains before allowing opening", () => {
    const d = device("washing_machine");
    let s = advanceApplianceState(
      d,
      applianceAction(d, initial(d.id), "start")!,
      4500,
    );
    expect(s.level).toBe(30);
    s = applianceAction(d, s, "pause")!;
    expect(applianceActionDisabled(d, s, "open")).toBe(true);
    s = applianceAction(d, s, "stop")!;
    expect(s.program).toBe("draining");
    s = advanceApplianceState(d, s, 3000);
    expect(s.level).toBe(0);
    expect(s.program).toBe("idle");
    expect(applianceActionDisabled(d, s, "open")).toBe(false);
  });
  it("freezes, harvests and stops the ice machine", () => {
    const d = device("ice_machine");
    let s = applianceAction(d, initial(d.id), "start")!;
    expect(appliancePhase(d, s)).toBe("freezing");
    s = advanceApplianceState(d, s, 14000);
    expect(appliancePhase(d, s)).toBe("harvesting");
    s = advanceApplianceState(d, s, 5000);
    expect(appliancePhase(d, s)).toBe("complete");
  });
  it.each(["coffee_machine", "water_dispenser", "vending_machine"])(
    "dispenses exactly one finite %s serving",
    (id) => {
      const d = device(id);
      let s = applianceAction(
        d,
        initial(id),
        id === "coffee_machine" ? "brew" : "dispense",
      )!;
      s = advanceApplianceState(d, s, 3000);
      expect(s.floor).toBe(50);
      const paused = applianceAction(d, s, "stop")!;
      expect(advanceApplianceState(d, paused, 10000).level).toBe(paused.level);
      s = advanceApplianceState(d, s, 3000);
      expect(s.floor).toBe(100);
      expect(s.level).toBeCloseTo(id === "vending_machine" ? 84 : 70);
      expect(s.program).toBe("complete");
    },
  );
  it("inhibits low-water kettle heating and switches off at the setpoint", () => {
    const d = device("smart_kettle");
    let s = applianceRange(d, initial(d.id), "level", 10)!;
    expect(applianceActionDisabled(d, s, "start")).toBe(true);
    s = applianceRange(d, s, "level", 60)!;
    s = applianceRange(d, s, "target", 80)!;
    s = advanceApplianceState(d, applianceAction(d, s, "start")!, 11000);
    expect(s.value).toBe(80);
    expect(s.program).toBe("complete");
    expect(s.active).toBe(false);
  });
  it("retains oven heat when stopped or a setpoint is reduced", () => {
    const d = device("oven");
    let s = advanceApplianceState(
      d,
      applianceAction(d, initial(d.id), "start")!,
      9000,
    );
    const temperature = s.value;
    s = applianceRange(d, s, "target", 80)!;
    s = advanceApplianceState(d, s, 1000);
    expect(s.value).toBe(temperature);
    expect(applianceAction(d, s, "stop")!.value).toBe(temperature);
  });
  it("stops induction immediately on pan removal and zero output", () => {
    const d = device("induction_hob");
    let s = applianceAction(d, initial(d.id), "start")!;
    s = applianceChoice(d, s, "period", "ap_pan_absent")!;
    expect(s.program).toBe("idle");
    expect(applianceActionDisabled(d, s, "start")).toBe(true);
    s = applianceChoice(d, s, "period", "ap_pan_present")!;
    s = applianceRange(d, s, "speed", 0)!;
    expect(applianceActionDisabled(d, s, "start")).toBe(true);
  });
  it("keeps hood light independent of extraction and schedules no continuous RAF", () => {
    const d = device("smart_cooker_hood");
    let s = applianceAction(d, initial(d.id), "test")!;
    expect(s.tilt).toBe(1);
    expect(s.program).toBe("idle");
    s = applianceAction(d, s, "start")!;
    expect(s.active).toBe(false);
    s = applianceAction(d, s, "stop")!;
    expect(s.tilt).toBe(1);
  });
  it.each(APPLIANCE_DEVICES)(
    "clamps %s numeric input and rejects non-finite input",
    (id) => {
      const d = device(id);
      const s = initial(id);
      expect(applianceRange(d, s, "level", NaN)).toBe(s);
      expect(applianceRange(d, s, "level", Infinity)).toBe(s);
      expect(applianceRange(d, s, "level", 1000)!.level).toBe(100);
    },
  );
  it("preserves phase and progress through pause/resume", () => {
    const d = device("clothes_dryer");
    let s = advanceApplianceState(
      d,
      applianceAction(d, initial(d.id), "start")!,
      6000,
    );
    const progress = s.progress;
    s = applianceAction(d, s, "pause")!;
    expect(advanceApplianceState(d, s, 10000).progress).toBe(progress);
    s = applianceAction(d, s, "start")!;
    expect(s.progress).toBe(progress);
  });
});
describe("Reported operation and lifecycle", () => {
  it.each(APPLIANCE_DEVICES)(
    "never invents %s mechanical operation from switch power",
    (id) => {
      const l = applianceLive(device(id), entity("on"));
      expect(l.visual.active).toBe(false);
      expect(l.visual.heating).toBe(false);
      expect(l.visual.hasPosition).toBe(false);
      expect(l.primary.unit).toBe("");
    },
  );
  it.each(APPLIANCE_DEVICES)(
    "silences unavailable %s and clears example telemetry",
    (id) => {
      const d = device(id);
      const s = initial(id);
      const v = applianceVisualState(
        d,
        previewVisual(s),
        undefined,
        entity("unavailable", {
          operation_state: "heating",
          door_open: true,
          current_temperature: 50,
          temperature_unit: "°C",
        }),
      );
      expect(v.active).toBe(false);
      expect(v.heating).toBe(false);
      expect(v.hasTelemetry).toBe(false);
      expect(v.temperature).toBeUndefined();
      expect(v.example).toBe(false);
      expect(v.open).toBe(false);
    },
  );
  it("animates a cooling climate only with hvac_action feedback", () => {
    const d = device("cold_room_controller");
    expect(
      applianceLive(d, entity("cool", {}, "climate.cold")).visual.active,
    ).toBe(false);
    expect(
      applianceLive(
        d,
        entity("cool", { hvac_action: "cooling" }, "climate.cold"),
      ).visual.active,
    ).toBe(true);
    expect(
      applianceLive(
        d,
        entity(
          "cool",
          { hvac_action: "cooling", door_open: true },
          "climate.cold",
        ),
      ).visual.active,
    ).toBe(false);
  });
  it("requires temperature units and preserves Fahrenheit readings", () => {
    const d = device("refrigerator");
    expect(
      applianceLive(d, entity("on", { current_temperature: 4 })).primary.unit,
    ).toBe("");
    const l = applianceLive(
      d,
      entity("on", { current_temperature: 39, temperature_unit: "°F" }),
    );
    expect(l.primary.value).toBe(39);
    expect(l.primary.unit).toBe("°F");
  });
  it("uses explicit operation feedback and inhibits it with an open door", () => {
    const d = device("washing_machine");
    expect(
      applianceLive(d, entity("on", { operation_state: "spinning" })).visual
        .active,
    ).toBe(true);
    expect(
      applianceLive(
        d,
        entity("on", { operation_state: "spinning", door_open: true }),
      ).visual.active,
    ).toBe(false);
  });
  it("keeps a connected card free from example controls and unknown power values", async () => {
    const c = await mount("microwave_oven");
    c.card = { ...c.card, entity: "switch.appliance" };
    c.entity = entity("on");
    await c.updateComplete;
    expect(c.shadowRoot!.querySelector(".specific-controls")).toBeNull();
    expect(
      c.shadowRoot!.querySelector(".primary-reading")!.textContent,
    ).not.toContain("600");
    expect(c.shadowRoot!.querySelector(".screen-label")!.textContent).toBe("—");
  });
  it("settles directly for reduced motion without scheduling a frame", async () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const c = await mount("dishwasher");
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-open")!.click();
    await c.updateComplete;
    await c.updateComplete;
    expect(
      c
        .shadowRoot!.querySelector(".realistic-appliances")!
        .getAttribute("data-door-position"),
    ).toBe("100");
    expect(raf).not.toHaveBeenCalled();
  });
  it("continues after zero elapsed, finishes at the endpoint and cancels on disconnect", async () => {
    const raf = vi.fn((_cb: FrameRequestCallback) => 41);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const c = await mount("refrigerator");
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-open")!.click();
    await c.updateComplete;
    raf.mock.calls[0][0](0);
    await c.updateComplete;
    expect(raf).toHaveBeenCalledTimes(2);
    raf.mock.calls[1][0](performance.now() + 10000);
    await c.updateComplete;
    expect(raf).toHaveBeenCalledTimes(2);
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-close")!.click();
    await c.updateComplete;
    c.remove();
    expect(cancel).toHaveBeenCalledWith(41);
  });
  it.each(["idle", "paused", "complete"])(
    "keeps a reported %s mechanism stopped",
    (phase) => {
      const l = applianceLive(
        device("washing_machine"),
        entity("on", { operation_state: phase }),
      );
      expect(l.visual.active).toBe(false);
      expect(l.visual.processPhase).toBe(phase);
    },
  );
  it("needs reported pan presence to animate a connected hob", () => {
    const d = device("induction_hob");
    expect(
      applianceLive(d, entity("on", { operation_state: "heating_pan" })).visual
        .active,
    ).toBe(false);
    expect(
      applianceLive(
        d,
        entity("on", { operation_state: "heating_pan", pan_present: true }),
      ).visual.active,
    ).toBe(true);
    expect(
      applianceLive(
        d,
        entity("on", { operation_state: "heating_pan", pan_present: false }),
      ).visual.mode,
    ).toBe("ap_pan_absent");
  });
  it("starts idle with no JS motion work", async () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    await mount("washing_machine");
    expect(raf).not.toHaveBeenCalled();
  });
});
