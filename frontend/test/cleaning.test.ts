import type { HassEntity } from "home-assistant-js-websocket";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogDevice } from "../src/dashboard/device-catalog";
import {
  deviceInterface,
  initialDeviceState,
  previewVisual,
} from "../src/dashboard/device-interface";
import {
  CLEANING_DEVICES,
  advanceCleaningState,
  cleaningAction,
  cleaningActionDisabled,
  cleaningChoice,
  cleaningInterface,
  cleaningLive,
  cleaningPhase,
  cleaningRange,
  cleaningRoute,
  cleaningVisualState,
} from "../src/dashboard/cleaning-model";
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
    id: "cleaning-test",
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
describe("Cleaning, waste and service robot constructions", () => {
  it.each(CLEANING_DEVICES)(
    "renders and localizes %s without fabricated histories",
    async (id) => {
      const c = await mount(id);
      const r = c.shadowRoot!;
      expect(r.querySelector(`[data-cleaning-device="${id}"]`)).not.toBeNull();
      expect(
        r.querySelector(".specific-controls button,.specific-controls input"),
      ).not.toBeNull();
      expect(r.querySelector(".history-chart")).toBeNull();
      expect(r.textContent).not.toMatch(/device_cleaning_|device_option_cl_/);
      const m = deviceInterface(device(id), initial(id));
      expect(
        m.metrics.some((v) => ["L", "W", "m²", "min"].includes(v.unit)),
      ).toBe(false);
    },
  );
  it.each(CLEANING_DEVICES)(
    "translates every %s control and metric into Arabic",
    async (id) => {
      const c = await mount(id, "ar");
      expect(c.shadowRoot!.querySelector("article")!.textContent).not.toMatch(
        /device_cleaning_|device_option_cl_/,
      );
      const m = cleaningInterface(device(id), initial(id))!;
      for (const lang of [en, ar]) {
        const t = lang.ui.panel["emad-dashboard"];
        for (const k of [
          m.primary.label,
          m.status,
          ...m.metrics.map((v) => v.label),
          ...m.controls.flatMap((control) =>
            "label" in control ? [control.label] : [],
          ),
        ]) {
          expect(t[k], k).toBeTruthy();
        }
        for (const control of m.controls) {
          if (control.kind === "choices") {
            for (const o of control.options) {
              expect(
                t[`device_option_${o}` as DashboardTextKey],
                o,
              ).toBeTruthy();
            }
          }
        }
      }
    },
  );
  it.each(CLEANING_DEVICES)(
    "translates %s through its operating transitions",
    (id) => {
      const d = device(id);
      let s = initial(id);
      const check = () => {
        const status = cleaningInterface(d, s)!.status;
        for (const lang of [en, ar]) {
          expect(lang.ui.panel["emad-dashboard"][status], status).toBeTruthy();
        }
      };
      check();
      for (const action of [
        "open",
        "close",
        "start",
        "pause",
        "start",
        "compact",
        "sample",
        "dispense",
        "flush",
        "dock",
        "stop",
      ] as const) {
        s = cleaningAction(d, s, action) ?? s;
        check();
        for (let i = 0; i < 100; i++) {
          s = advanceCleaningState(d, s, 400) ?? s;
          check();
        }
      }
    },
  );
  it.each(CLEANING_DEVICES)("keeps %s example actions local", async (id) => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const c = await mount(id);
    const send = vi.fn();
    c.addEventListener("emad-device-command", send);
    for (const b of c.shadowRoot!.querySelectorAll<HTMLButtonElement>(
      ".specific-controls button",
    )) {
      if (!b.disabled) b.click();
    }
    await c.updateComplete;
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["robot_vacuum", "robot_mop", "floor_scrubber"])(
    "uses %s brushes and pads instead of fan blades",
    async (id) => {
      const c = await mount(id);
      expect(c.shadowRoot!.querySelector(".cl-brush")).not.toBeNull();
      expect(c.shadowRoot!.querySelector(".fan-blade")).toBeNull();
    },
  );
  it("keeps the window robot on glass with a tether and suction pads", async () => {
    const c = await mount("window_cleaning_robot");
    for (const cls of [".cl-window-pane", ".cl-tether", ".cl-suction-gasket"]) {
      expect(c.shadowRoot!.querySelector(cls)).not.toBeNull();
    }
  });
  it("gives the scrubber separate tanks and a recovery squeegee", async () => {
    const c = await mount("floor_scrubber");
    for (const cls of [
      ".cl-clean-tank",
      ".cl-recovery-tank",
      ".cl-recovery-hose",
      ".cl-squeegee",
    ]) {
      expect(c.shadowRoot!.querySelector(cls)).not.toBeNull();
    }
  });
  it("isolates inset resource IDs across card instances", async () => {
    const a = await mount("waste_compactor");
    const b = await mount("waste_compactor");
    b.card = { ...b.card, id: "second-compactor" };
    await b.updateComplete;
    expect(a.shadowRoot!.querySelector("clipPath")!.id).not.toBe(
      b.shadowRoot!.querySelector("clipPath")!.id,
    );
  });
});
describe("Robot travel, interlocks and charging", () => {
  it.each(CLEANING_DEVICES.slice(0, 8))(
    "finishes %s without leaving a frame loop running",
    (id) => {
      const d = device(id);
      let s = cleaningAction(d, initial(id), "start")!;
      s = advanceCleaningState(d, s, 600000);
      expect(s.program).toBe("complete");
      expect(s.active).toBe(false);
      if (id !== "window_cleaning_robot") {
        expect(s.value).toBeGreaterThanOrEqual(90);
      }
      expect(advanceCleaningState(d, s, 1000)).toBe(s);
    },
  );
  it.each(CLEANING_DEVICES.slice(0, 7))(
    "freezes %s at an obstacle and resumes its existing mission",
    (id) => {
      const d = device(id);
      let s = advanceCleaningState(
        d,
        cleaningAction(d, initial(id), "start")!,
        2000,
      );
      const pose = [s.pan, s.tilt, s.progress];
      s = cleaningChoice(d, s, "period", "cl_blocked")!;
      expect(s.active).toBe(false);
      expect(cleaningActionDisabled(d, s, "dock")).toBe(true);
      expect(advanceCleaningState(d, s, 5000)).toBe(s);
      expect([s.pan, s.tilt, s.progress]).toEqual(pose);
      s = cleaningChoice(d, s, "period", "cl_clear")!;
      expect(s.program).toBe("paused_working");
      s = cleaningAction(d, s, "start")!;
      expect(s.progress).toBe(pose[2]);
      expect(s.program).toBe("working");
    },
  );
  it.each([
    "robot_vacuum",
    "delivery_robot",
    "inspection_robot",
    "security_robot",
  ])("returns %s to charge when the example battery becomes low", (id) => {
    const d = device(id);
    let s = cleaningAction(d, initial(id), "start")!;
    s = cleaningRange(d, s, "value", 10)!;
    expect(s.program).toBe("returning");
    s = advanceCleaningState(d, s, 600000);
    expect(s.program).toBe("complete");
    expect(s.value).toBe(90);
  });
  it.each(["robot_mop", "floor_scrubber"])(
    "inhibits %s when clean water is low",
    (id) => {
      const d = device(id);
      const s = cleaningRange(d, initial(id), "level", 0)!;
      expect(cleaningActionDisabled(d, s, "start")).toBe(true);
      expect(cleaningPhase(d, s)).toBe("low_water");
    },
  );
  it("keeps delivery compartments closed and locked during travel", () => {
    const d = device("delivery_robot");
    let s = advanceCleaningState(
      d,
      cleaningAction(d, initial(d.id), "start")!,
      3000,
    );
    expect(s.position).toBe(0);
    expect(s.target).toBe(0);
    expect(cleaningActionDisabled(d, s, "open")).toBe(true);
    s = cleaningAction(d, s, "pause")!;
    s = advanceCleaningState(d, cleaningAction(d, s, "open")!, 1000);
    expect(s.position).toBe(100);
    expect(cleaningActionDisabled(d, s, "start")).toBe(true);
    expect(cleaningActionDisabled(d, s, "dock")).toBe(true);
  });
  it("docks before charging and never reduces an already full battery", () => {
    const d = device("robot_docking_station");
    let s = cleaningAction(d, initial(d.id), "start")!;
    s = advanceCleaningState(d, s, 1000);
    expect(s.program).toBe("returning");
    expect(s.value).toBe(25);
    s = advanceCleaningState(d, s, 1000);
    expect(s.program).toBe("aligning");
    expect(cleaningPhase(d, s)).toBe("aligning");
    s = advanceCleaningState(d, s, 3000);
    expect(s.value).toBeGreaterThan(25);
    s = cleaningRange(d, initial(d.id), "value", 100)!;
    s = advanceCleaningState(d, cleaningAction(d, s, "start")!, 600000);
    expect(s.value).toBe(100);
  });
  it("allows a low-battery return to resume without starting a new mission", () => {
    const d = device("robot_vacuum");
    let s = cleaningRange(
      d,
      cleaningAction(d, initial(d.id), "start")!,
      "value",
      10,
    )!;
    s = cleaningAction(d, s, "pause")!;
    expect(cleaningActionDisabled(d, s, "start")).toBe(false);
    s = cleaningAction(d, s, "start")!;
    expect(s.program).toBe("returning");
  });
  it("moves smoothly through route corners with finite headings", () => {
    for (const mode of ["cl_standard", "cl_edge", "cl_spot"]) {
      let old = cleaningRoute(0, mode);
      for (let p = 0.1; p <= 100; p += 0.1) {
        const n = cleaningRoute(p, mode);
        expect(Number.isFinite(n.heading)).toBe(true);
        expect(Math.hypot(n.x - old.x, n.y - old.y)).toBeLessThan(2);
        old = n;
      }
    }
  });
});
describe("Waste and washroom mechanisms", () => {
  it.each([
    "smart_waste_bin",
    "waste_compactor",
    "waste_chute_controller",
    "smart_toilet",
    "delivery_robot",
  ])("moves the %s enclosure continuously and reverses it", (id) => {
    const d = device(id);
    let s = cleaningAction(d, initial(id), "open")!;
    s = advanceCleaningState(d, s, 450);
    expect(s.position).toBe(50);
    s = cleaningAction(d, s, "close")!;
    s = advanceCleaningState(d, s, 450);
    expect(s.position).toBe(0);
    expect(s.active).toBe(false);
  });
  it.each(["waste_compactor", "waste_chute_controller"])(
    "inhibits %s until the guard closes and locks it while operating",
    (id) => {
      const d = device(id);
      let s = advanceCleaningState(
        d,
        cleaningAction(d, initial(id), "open")!,
        1000,
      );
      expect(
        cleaningActionDisabled(
          d,
          s,
          id === "waste_compactor" ? "compact" : "start",
        ),
      ).toBe(true);
      s = advanceCleaningState(d, cleaningAction(d, s, "close")!, 1000);
      s = cleaningAction(d, s, id === "waste_compactor" ? "compact" : "start")!;
      expect(cleaningActionDisabled(d, s, "open")).toBe(true);
    },
  );
  it("presses, holds and retracts without repeatedly reducing waste after completion", () => {
    const d = device("waste_compactor");
    let s = cleaningAction(d, initial(d.id), "compact")!;
    s = advanceCleaningState(d, s, 4500);
    expect(cleaningPhase(d, s)).toBe("pressing");
    expect(s.speed).toBeGreaterThan(80);
    s = advanceCleaningState(d, s, 1000);
    expect(cleaningPhase(d, s)).toBe("holding");
    s = advanceCleaningState(d, s, 4500);
    expect(s.level).toBeCloseTo(35);
    expect(s.speed).toBe(0);
    expect(s.active).toBe(false);
    expect(advanceCleaningState(d, s, 10000).level).toBe(s.level);
  });
  it("retracts a stopped compactor before unlocking its guard", () => {
    const d = device("waste_compactor");
    let s = advanceCleaningState(
      d,
      cleaningAction(d, initial(d.id), "compact")!,
      4000,
    );
    const stroke = s.speed;
    s = cleaningAction(d, s, "stop")!;
    expect(s.speed).toBe(stroke);
    expect(cleaningActionDisabled(d, s, "open")).toBe(true);
    s = advanceCleaningState(d, s, 10000);
    expect(s.speed).toBe(0);
    expect(cleaningActionDisabled(d, s, "open")).toBe(false);
  });
  it("samples fill height without moving any material", () => {
    const d = device("waste_fill_level_sensor");
    let s = initial(d.id);
    const level = s.level;
    s = advanceCleaningState(d, cleaningAction(d, s, "sample")!, 10000);
    expect(s.level).toBe(level);
    expect(s.active).toBe(false);
  });
  it.each(["soap_dispenser_monitor", "paper_dispenser_monitor"])(
    "finishes one %s serving and rejects an empty refill",
    (id) => {
      const d = device(id);
      let s = advanceCleaningState(
        d,
        cleaningAction(d, initial(id), "dispense")!,
        10000,
      );
      expect(s.level).toBeCloseTo(72);
      expect(s.program).toBe("complete");
      expect(s.active).toBe(false);
      s = cleaningRange(d, s, "level", 0)!;
      expect(cleaningActionDisabled(d, s, "dispense")).toBe(true);
    },
  );
  it("stops tap flow on hand removal and at the example timeout", () => {
    const d = device("smart_tap");
    let s = cleaningChoice(d, initial(d.id), "period", "cl_hand_present")!;
    expect(cleaningPhase(d, s)).toBe("flowing");
    s = cleaningChoice(d, s, "period", "cl_hand_removed")!;
    expect(s.active).toBe(false);
    s = advanceCleaningState(
      d,
      cleaningChoice(d, s, "period", "cl_hand_present")!,
      10000,
    );
    expect(s.program).toBe("complete");
    expect(s.active).toBe(false);
  });
  it("flushes and refills the toilet with independent lid movement", () => {
    const d = device("smart_toilet");
    let s = cleaningAction(d, initial(d.id), "flush")!;
    s = advanceCleaningState(d, s, 2000);
    expect(s.level).toBeLessThan(100);
    s = cleaningAction(d, s, "open")!;
    s = advanceCleaningState(d, s, 1000);
    expect(s.position).toBe(100);
    expect(s.program).toBe("working");
    s = advanceCleaningState(d, s, 10000);
    expect(s.level).toBe(100);
    expect(s.active).toBe(false);
  });
  it("finishes cistern refill after stopping a flush", () => {
    const d = device("smart_toilet");
    let s = advanceCleaningState(
      d,
      cleaningAction(d, initial(d.id), "flush")!,
      2000,
    );
    s = cleaningAction(d, s, "stop")!;
    expect(s.program).toBe("refilling");
    s = advanceCleaningState(d, s, 10000);
    expect(s.level).toBe(100);
    expect(s.program).toBe("complete");
  });
  it.each(CLEANING_DEVICES)(
    "clamps %s numeric examples and rejects non-finite values",
    (id) => {
      const d = device(id);
      const s = initial(id);
      expect(cleaningRange(d, s, "level", NaN)).toBe(s);
      expect(cleaningRange(d, s, "level", Infinity)).toBe(s);
      expect(cleaningRange(d, s, "level", 1000)!.level).toBe(100);
      expect(cleaningRange(d, s, "level", -100)!.level).toBe(0);
    },
  );
});
describe("Cleaning telemetry and animation lifecycle", () => {
  it.each(CLEANING_DEVICES)(
    "does not infer %s mechanical operation from switch power",
    (id) => {
      const r = cleaningLive(device(id), entity("on"));
      expect(r.visual.active).toBe(false);
      expect(r.visual.hasLevel).toBe(false);
      expect(r.primary.value).toBe("—");
    },
  );
  it.each(CLEANING_DEVICES)(
    "clears unavailable %s effects and example data",
    (id) => {
      const d = device(id);
      const v = cleaningVisualState(
        d,
        previewVisual(initial(id)),
        undefined,
        entity("unavailable", {
          battery_level: 80,
          fill_level: 62,
          operation_state: "cleaning",
          door_open: true,
        }),
      );
      expect(v.active).toBe(false);
      expect(v.hasTelemetry).toBe(false);
      expect(v.hasLevel).toBe(false);
      expect(v.example).toBe(false);
      expect(v.position).toBe(0);
    },
  );
  it("accepts actual vacuum state and battery, without inventing a live route", () => {
    const d = device("robot_vacuum");
    const r = cleaningLive(
      d,
      entity("cleaning", { battery_level: 74 }, "vacuum.robot"),
    );
    expect(r.visual.active).toBe(true);
    expect(r.primary.value).toBe(74);
    expect(r.visual.pan).toBe(0);
    expect(r.visual.tilt).toBe(0);
  });
  it("requires charging feedback and ignores contradictory dock feedback", () => {
    const d = device("robot_docking_station");
    expect(cleaningLive(d, entity("on", {}, "switch.dock")).visual.active).toBe(
      false,
    );
    expect(
      cleaningLive(
        d,
        entity("on", { operation_state: "charging", docked: false }),
      ).visual.active,
    ).toBe(false);
    const r = cleaningLive(
      device("robot_vacuum"),
      entity("docked", { battery_level: 40 }, "vacuum.robot"),
    );
    expect(r.visual.active).toBe(false);
  });
  it("reports a closed bin lid without inventing an active waste cycle", () => {
    const r = cleaningLive(
      device("smart_waste_bin"),
      entity("closed", { current_position: 0 }, "cover.bin"),
    );
    expect(r.visual.active).toBe(false);
    expect(r.status).toBe("device_cleaning_lid_closed_state");
    expect(r.visual.position).toBe(0);
  });
  it("requires real tap flow feedback rather than an open valve", () => {
    const d = device("smart_tap");
    expect(cleaningLive(d, entity("open", {}, "valve.tap")).visual.active).toBe(
      false,
    );
    expect(
      cleaningLive(d, entity("open", { water_flowing: true }, "valve.tap"))
        .visual.active,
    ).toBe(true);
  });
  it("rejects levels without percent units or outside the valid range", () => {
    const d = device("waste_fill_level_sensor");
    expect(cleaningLive(d, entity("65", {}, "sensor.bin")).primary.value).toBe(
      "—",
    );
    expect(
      cleaningLive(d, entity("101", { unit_of_measurement: "%" }, "sensor.bin"))
        .primary.value,
    ).toBe("—");
    expect(
      cleaningLive(d, entity("65", { unit_of_measurement: "%" }, "sensor.bin"))
        .primary.value,
    ).toBe(65);
  });
  it.each([
    "waste_compactor",
    "waste_chute_controller",
    "soap_dispenser_monitor",
    "paper_dispenser_monitor",
    "smart_toilet",
    "smart_urinal",
    "robot_docking_station",
  ])("keeps unsupported connected %s controls monitoring-only", async (id) => {
    const c = await mount(id);
    c.card = { ...c.card, entity: "switch.actual" };
    c.entity = entity("on");
    await c.updateComplete;
    expect(c.shadowRoot!.querySelector(".specific-controls")).toBeNull();
    expect(c.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(true);
  });
  it("settles finite missions with reduced motion and schedules no frames", async () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const c = await mount("robot_vacuum");
    c.shadowRoot!.querySelector<HTMLButtonElement>(".action-start")!.click();
    await c.updateComplete;
    await c.updateComplete;
    expect(
      c
        .shadowRoot!.querySelector(".realistic-cleaning")!
        .getAttribute("data-phase"),
    ).toBe("complete");
    expect(raf).not.toHaveBeenCalled();
  });
  it("continues a zero-elapsed frame, ends at the hinge endpoint, and cancels on disconnect", async () => {
    const raf = vi.fn((_cb: FrameRequestCallback) => 43);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const c = await mount("smart_waste_bin");
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
    expect(cancel).toHaveBeenCalledWith(43);
  });
  it("performs no JS motion work for an idle card", async () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    await mount("inspection_robot");
    expect(raf).not.toHaveBeenCalled();
  });
});
