import type { HassEntity } from "home-assistant-js-websocket";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deviceInterface,
  initialDeviceState,
  optionTextKey,
  entityVisual,
  previewVisual,
} from "../src/dashboard/device-interface";
import {
  advanceValveState,
  valveAction,
  valveIsMoving,
  valveRange,
  valveSpec,
} from "../src/dashboard/valve-model";
import {
  advanceWaterState,
  waterRange,
  waterAction,
  waterVisualState,
  waterIsMoving,
  WATER_DEVICES,
} from "../src/dashboard/water-model";
import {
  TREATMENT_DEVICES,
  TREATMENT_SENSORS,
  treatmentRange,
  treatmentAction,
  advanceTreatmentState,
  treatmentIsMoving,
  treatmentPhase,
  treatmentRate,
  treatmentFlow,
  treatmentVisualState,
} from "../src/dashboard/treatment-model";
import {
  PARKING_DEVICES,
  PARKING_MOVERS,
  parkingAction,
  parkingRange,
  parkingIsMoving,
  advanceParkingState,
  parkingVisualState,
  parkingDockPose,
  parkingPhase,
} from "../src/dashboard/parking-model";
import { parkingTripodTips } from "../src/dashboard/physical-parking";
import {
  OCCUPANCY_DEVICES,
  occupancyAction,
  occupancyChoice,
  occupancyIsMoving,
  advanceOccupancyState,
  occupancyLive,
  occupancyVisualState,
  occupancyActionDisabled,
  occupancyPhase,
} from "../src/dashboard/occupancy-model";
import { physicalProfile } from "../src/dashboard/device-physical-profiles";
import {
  DEVICE_CATALOG,
  DEVICE_CATEGORIES,
  catalogDevice,
  catalogReading,
  categoryNameKey,
  deviceNameKey,
  filterCatalog,
} from "../src/dashboard/device-catalog";
import { EmadDashboardCatalogDevice } from "../src/dashboard/emad-ui-catalog-device";
import { EmadDeviceLibrary } from "../src/dashboard/emad-ui-device-library";
import en from "../src/translations/en.json";
import ar from "../src/translations/ar.json";
import type { DashboardTextKey } from "../src/dashboard/dashboard-model";

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
const strings = en.ui.panel["emad-dashboard"];
const text = (key: DashboardTextKey) => strings[key];
const localize = (key: string) =>
  text(key.replace("ui.panel.emad-dashboard.", "") as DashboardTextKey) || "";
const mockEntity: HassEntity = {
  entity_id: "switch.pump",
  state: "on",
  attributes: { friendly_name: "Real pump" },
  last_changed: "",
  last_updated: "",
  context: { id: "test", parent_id: null, user_id: null },
};
async function mount(id = "booster_pump") {
  const card = new EmadDashboardCatalogDevice();
  card.card = {
    id: "test",
    kind: "device",
    deviceType: id,
    x: 0,
    y: 0,
    w: 384,
    h: 444,
  };
  card.localize = localize;
  document.body.append(card);
  await card.updateComplete;
  return card;
}
afterEach(() => document.body.replaceChildren());
describe("Full BMS device catalog", () => {
  it.each([
    ["heat_pump", "device_measured_temperature", "°C"],
    ["pool_heat_pump", "device_measured_temperature", "°C"],
    ["spa_controller", "device_measured_temperature", "°C"],
    ["air_handling_unit", "device_measured_temperature", "°C"],
    ["microwave_oven", "device_power_level", "W"],
    ["voltage_sensor", "device_voltage", "V"],
    ["dissolved_oxygen_sensor", "catalog_reading", "mg/L"],
    ["energy_diverter", "device_diverted_power", "kW"],
    ["ev_load_controller", "device_current", "A"],
    ["dosing_pump", "device_treatment_delivery_rate", "L/h"],
  ])("uses equipment-specific dimensions for %s", (id, label, unit) => {
    const item = catalogDevice(id)!;
    const model = deviceInterface(item, initialDeviceState(item));
    expect(model.primary.label).toBe(label);
    expect(model.primary.unit).toBe(unit);
    if (id === "energy_diverter" || id === "ev_load_controller") {
      expect(
        model.controls.some(
          (control) => control.kind === "range" && control.unit === unit,
        ),
      ).toBe(true);
      expect(
        model.controls.some(
          (control) =>
            control.kind === "range" && control.label === "device_charge_limit",
        ),
      ).toBe(false);
    }
  });
  it("covers 488 distinct entries and 30 nonempty systems with complete English and Arabic labels", () => {
    expect(DEVICE_CATALOG).toHaveLength(488);
    expect(new Set(DEVICE_CATALOG.map((item) => item.id)).size).toBe(488);
    expect(DEVICE_CATEGORIES).toHaveLength(30);
    for (const lang of [en, ar]) {
      const labels = lang.ui.panel["emad-dashboard"];
      for (const item of DEVICE_CATALOG) {
        expect(labels[deviceNameKey(item)]).toBeTruthy();
        expect(labels[categoryNameKey(item.category)]).toBeTruthy();
      }
    }
    for (const category of DEVICE_CATEGORIES) {
      expect(DEVICE_CATALOG.some((item) => item.category === category)).toBe(
        true,
      );
    }
  });
  it("finds English or localized names, matches all search terms, and combines categories", () => {
    expect(
      filterCatalog("", "air cooled chiller", text).map((item) => item.id),
    ).toEqual(["air_cooled_chiller"]);
    expect(filterCatalog("lighting", "pump", text)).toEqual([]);
    expect(
      filterCatalog(
        "",
        "مضخة تعزيز",
        (key) => ar.ui.panel["emad-dashboard"][key],
      ).map((item) => item.id),
    ).toEqual(["booster_pump"]);
  });
  it.each(DEVICE_CATALOG)(
    "renders $id as an isolated example",
    async (item) => {
      const card = await mount(item.id);
      expect(card.shadowRoot!.querySelector("h3")?.textContent).toBe(
        text(deviceNameKey(item)),
      );
      expect(card.shadowRoot!.querySelector("svg")).not.toBeNull();
      expect(card.shadowRoot!.textContent).toContain("Example · Not connected");
      const reading = catalogReading(item);
      expect(reading.value).toBeGreaterThanOrEqual(reading.min);
      expect(reading.value).toBeLessThanOrEqual(reading.max);
    },
  );
  it("keeps example interactions local and resets them", async () => {
    const card = await mount("water_tank");
    const sent = vi.fn();
    card.addEventListener("emad-device-command", sent);
    const range = card.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    range.value = "34";
    range.dispatchEvent(new Event("input"));
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("input")?.value).toBe("34");
    expect(card.shadowRoot!.querySelector("strong")?.textContent).toContain(
      "68",
    );
    expect(sent).not.toHaveBeenCalled();
    card.shadowRoot!.querySelector<HTMLButtonElement>(".reset")!.click();
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("strong")?.textContent).toContain(
      "68",
    );
  });
  it("renders real entities with the native control and never substitutes demo values for a missing binding", async () => {
    const card = await mount();
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    await card.updateComplete;
    const native = card.shadowRoot!.querySelector("emad-ui-device")!;
    expect(native.entity).toBe(mockEntity);
    expect(card.shadowRoot!.querySelector(".example")).toBeNull();
    card.entity = undefined;
    await card.updateComplete;
    expect(card.shadowRoot!.textContent).toContain(
      "connected entity is missing",
    );
    expect(card.shadowRoot!.querySelector(".example")).toBeNull();
  });
  it("keeps safety and elevator bindings supervisory and disables examples during layout editing", async () => {
    const card = await mount("fire_pump");
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
      true,
    );
    card.card = { ...card.card, deviceType: "passenger_elevator" };
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
      true,
    );
    card.card = { ...card.card, deviceType: "booster_pump", entity: undefined };
    card.entity = undefined;
    card.disabled = true;
    await card.updateComplete;
    expect(
      [...card.shadowRoot!.querySelectorAll("button")].every(
        (button) => button.disabled,
      ),
    ).toBe(true);
  });
  it("paginates rather than mounting hundreds of live components and hides add actions for viewers", async () => {
    const library = new EmadDeviceLibrary();
    library.localize = localize;
    document.body.append(library);
    await library.updateComplete;
    expect(
      library.shadowRoot!.querySelectorAll("emad-ui-catalog-device"),
    ).toHaveLength(12);
    expect(library.shadowRoot!.querySelector("button.add")).toBeNull();
    library.canEdit = true;
    await library.updateComplete;
    const sent = vi.fn();
    library.addEventListener("emad-catalog-add", sent);
    library.shadowRoot!.querySelector<HTMLButtonElement>("button.add")!.click();
    expect(sent.mock.calls[0][0].detail.deviceType).toBeTruthy();
    const search =
      library.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    search.value = "water tank";
    search.dispatchEvent(new Event("input"));
    await library.updateComplete;
    expect(
      library.shadowRoot!.querySelectorAll("emad-ui-catalog-device").length,
    ).toBeLessThan(12);
    expect(catalogDevice("made_up_device")).toBeUndefined();
  });
});

describe("Device-specific physical identity and controls", () => {
  it.each(DEVICE_CATALOG)(
    "has valid localized controls and geometry for $id",
    (device) => {
      const state = initialDeviceState(device);
      const model = deviceInterface(device, state);
      const profile = physicalProfile(device);
      expect(profile.shape).toBeTruthy();
      expect(model.controls.length).toBeGreaterThan(0);
      for (const control of model.controls) {
        if (control.kind === "range") {
          expect(state[control.field], device.id).toBeGreaterThanOrEqual(
            control.min,
          );
          expect(state[control.field], device.id).toBeLessThanOrEqual(
            control.max,
          );
        }
        if (control.kind === "choices") {
          expect(control.options, device.id).toContain(state[control.field]);
        }
        for (const lang of [en, ar]) {
          const labels = lang.ui.panel["emad-dashboard"];
          if ("label" in control) {
            expect(labels[control.label], device.id).toBeTruthy();
          }
          if (control.kind === "choices") {
            for (const option of control.options) {
              expect(labels[optionTextKey(option)], device.id).toBeTruthy();
            }
          }
        }
      }
      for (const m of [model.primary, ...model.metrics]) {
        expect(text(m.label), device.id).toBeTruthy();
      }
    },
  );
  it("uses real device constructions for unrelated equipment", async () => {
    const pairs = [
      ["thermostat", "split_air_conditioner"],
      ["booster_pump", "water_tank"],
      ["ip_camera", "ptz_camera"],
      ["smoke_detector", "pir_motion_detector"],
      ["washing_machine", "refrigerator"],
      ["card_reader", "fingerprint_reader"],
      ["solar_photovoltaic_array", "dc_ev_charger"],
    ];
    await Promise.all(
      pairs.map(async ([a, b]) => {
        const first = await mount(a);
        const second = await mount(b);
        expect(
          first.shadowRoot!.querySelector(".physical-device")!.innerHTML,
        ).not.toBe(
          second.shadowRoot!.querySelector(".physical-device")!.innerHTML,
        );
        expect(first.shadowRoot!.querySelector(".device-symbol")).toBeNull();
      }),
    );
  });
  it("keeps water meters, ceiling fans, delivery robots and room panels semantically correct", () => {
    const view = (id: string) => {
      const d = catalogDevice(id)!;
      return deviceInterface(d, initialDeviceState(d));
    };
    expect(
      view("water_meter").controls.flatMap((c) =>
        c.kind === "choices" ? c.options : [],
      ),
    ).not.toContain("voltage");
    expect(view("ceiling_fan").metrics.map((m) => m.label)).not.toContain(
      "device_filter_remaining",
    );
    expect(view("delivery_robot").metrics.map((m) => m.label)).toContain(
      "device_completed_deliveries",
    );
    expect(view("room_booking_panel").primary.label).toBe("device_room_state");
    expect(
      view("refrigerator").controls.some(
        (c) => c.kind === "range" && c.unit === "°C",
      ),
    ).toBe(true);
  });
  it("keeps a tank target separate from actual level and stops the fan mechanism", async () => {
    const tank = await mount("water_tank");
    const sent = vi.fn();
    tank.addEventListener("emad-device-command", sent);
    const input =
      tank.shadowRoot!.querySelector<HTMLInputElement>("input[type=range]")!;
    input.value = "100";
    input.dispatchEvent(new Event("input"));
    await tank.updateComplete;
    expect(input.value).toBe("100");
    expect(
      tank
        .shadowRoot!.querySelector(".realistic-water")
        ?.getAttribute("data-water-level"),
    ).toBe("68");
    expect(sent).not.toHaveBeenCalled();
    const fan = await mount("ceiling_fan");
    expect(fan.shadowRoot!.querySelector(".spinning")).not.toBeNull();
    const speed =
      fan.shadowRoot!.querySelector<HTMLInputElement>("input[type=range]")!;
    speed.value = "0";
    speed.dispatchEvent(new Event("input"));
    await fan.updateComplete;
    expect(fan.shadowRoot!.querySelector(".spinning")).toBeNull();
    speed.value = "60";
    speed.dispatchEvent(new Event("input"));
    await fan.updateComplete;
    fan
      .shadowRoot!.querySelector<HTMLButtonElement>(
        'button[data-action="stop"]',
      )!
      .click();
    await fan.updateComplete;
    expect(fan.shadowRoot!.querySelector(".spinning")).toBeNull();
  });
  it("retains pump geometry and sends only the actual bound entity command", async () => {
    const card = await mount("booster_pump");
    const sent = vi.fn();
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    card.addEventListener("emad-device-command", sent);
    await card.updateComplete;
    const native = card.shadowRoot!.querySelector("emad-ui-device")!;
    await native.updateComplete;
    expect(native.controlsOnly).toBe(true);
    expect(
      card.shadowRoot!.querySelector('svg[data-shape="booster_set"]'),
    ).not.toBeNull();
    native
      .shadowRoot!.querySelector<HTMLButtonElement>(".large-power")!
      .click();
    expect(sent.mock.calls[0][0].detail).toMatchObject({
      entity: "switch.pump",
      service: "turn_off",
    });
    card.entity = { ...mockEntity, state: "off" };
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector(".spinning")).toBeNull();
    card.entity = { ...mockEntity, state: "unavailable" };
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector(".unavailable")).not.toBeNull();
    expect(card.shadowRoot!.querySelector(".example")).toBeNull();
  });
  it("derives animation from real entity state and never invents a measurement", () => {
    expect(entityVisual(mockEntity).active).toBe(true);
    expect(entityVisual(mockEntity).hasTelemetry).toBe(false);
    expect(entityVisual({ ...mockEntity, state: "off" }).active).toBe(false);
    expect(
      entityVisual({ ...mockEntity, state: "unavailable" }).available,
    ).toBe(false);
  });
});

it("controls each example relay output locally", async () => {
  const card = await mount("relay_output_module");
  const sent = vi.fn();
  card.addEventListener("emad-device-command", sent);
  const channel = card.shadowRoot!.querySelector<HTMLButtonElement>(
    'button[data-port="0"]',
  )!;
  expect(channel.getAttribute("aria-pressed")).toBe("true");
  channel.click();
  await card.updateComplete;
  expect(channel.getAttribute("aria-pressed")).toBe("false");
  expect(sent).not.toHaveBeenCalled();
});

it("keeps elevator door geometry consistent with its state and closes it before floor travel", async () => {
  const card = await mount("passenger_elevator");
  const sent = vi.fn();
  card.addEventListener("emad-device-command", sent);
  const leaves = () =>
    Array.from(
      card.shadowRoot!.querySelectorAll<SVGGElement>(".lift-door-leaf"),
    );
  const offsets = () => leaves().map((leaf) => leaf.style.transform);
  expect(card.shadowRoot!.textContent).toContain("Closed");
  expect(offsets()).toEqual(["translateX(0px)", "translateX(0px)"]);
  card
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="open"]')!
    .click();
  await card.updateComplete;
  expect(offsets()).toEqual(["translateX(-27px)", "translateX(27px)"]);
  card
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-floor="8"]')!
    .click();
  await card.updateComplete;
  expect(offsets()).toEqual(["translateX(0px)", "translateX(0px)"]);
  expect(card.shadowRoot!.textContent).toContain("Closed");
  expect(
    card.shadowRoot!.querySelector(".physical-display text")!.textContent,
  ).toBe("8");
  expect(sent).not.toHaveBeenCalled();
});

it("rotates PTZ optics around a fixed mounting point and keeps camera examples local", async () => {
  const card = await mount("ptz_camera");
  const sent = vi.fn();
  card.addEventListener("emad-device-command", sent);
  const mountMarkup =
    card.shadowRoot!.querySelector(".cctv-mount-plate")!.innerHTML;
  const lensPoints = () =>
    card
      .shadowRoot!.querySelector(".cctv-lens-assembly polygon")!
      .getAttribute("points");
  const initialLens = lensPoints();
  const pan = card.shadowRoot!.querySelector<HTMLInputElement>(
    'input[data-field="pan"]',
  )!;
  pan.value = "90";
  pan.dispatchEvent(new Event("input"));
  await card.updateComplete;
  const pannedLens = lensPoints();
  expect(pannedLens).not.toBe(initialLens);
  expect(card.shadowRoot!.querySelector(".cctv-mount-plate")!.innerHTML).toBe(
    mountMarkup,
  );
  const tilt = card.shadowRoot!.querySelector<HTMLInputElement>(
    'input[data-field="tilt"]',
  )!;
  tilt.value = "45";
  tilt.dispatchEvent(new Event("input"));
  await card.updateComplete;
  expect(lensPoints()).not.toBe(pannedLens);
  expect(card.shadowRoot!.querySelector(".cctv-mount-plate")!.innerHTML).toBe(
    mountMarkup,
  );
  card
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="stop"]')!
    .click();
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain("Paused");
  expect(card.shadowRoot!.querySelector(".camera-live")).toBeNull();
  expect(sent).not.toHaveBeenCalled();
});

describe("Mechanism-specific valve controls", () => {
  const device = (id: string) => catalogDevice(id)!;
  const state = (id: string) => initialDeviceState(device(id));
  it.each(["motorized_ball_valve", "motorized_butterfly_valve"])(
    "maps %s travel to a bounded quarter turn",
    (id) => {
      const d = device(id);
      const closed = { ...state(id), position: 0, target: 0, open: false };
      const command = valveAction(d, closed, "open")!;
      expect(command.position).toBe(0);
      expect(command.target).toBe(100);
      const halfway = advanceValveState(d, command, valveSpec(d)!.travelMs / 2);
      expect(halfway.position).toBe(50);
      expect(
        deviceInterface(d, halfway).metrics.find(
          (m) => m.label === "device_valve_rotation",
        )?.value,
      ).toBe(45);
      const end = advanceValveState(d, halfway, 60000);
      expect(end.position).toBe(100);
      expect(end.active).toBe(false);
      expect(
        deviceInterface(d, end).metrics.find(
          (m) => m.label === "device_valve_rotation",
        )?.value,
      ).toBe(90);
      expect(
        deviceInterface(d, end).metrics.some(
          (m) => m.label === "device_flow" || m.label === "device_pressure",
        ),
      ).toBe(false);
    },
  );
  it("settles fractional animation steps at exact endpoints", () => {
    const d = device("motorized_ball_valve");
    for (const target of [0, 100]) {
      const nearEnd = {
        ...state(d.id),
        position: target === 0 ? 5e-13 : 100 - 5e-13,
        target,
        active: true,
      };
      expect(valveIsMoving(d, nearEnd)).toBe(true);
      const end = advanceValveState(d, nearEnd, 16.67);
      expect(end.position).toBe(target);
      expect(end.active).toBe(false);
      expect(deviceInterface(d, end).status).toBe(
        target === 0 ? "device_valve_closed" : "device_valve_open",
      );
    }
  });
  it("holds the actual position on Pause and resumes the retained target", () => {
    const d = device("motorized_ball_valve");
    const command = valveAction(
      d,
      { ...state(d.id), position: 0, target: 0 },
      "open",
    )!;
    const moving = advanceValveState(d, command, 1000);
    const paused = valveAction(d, moving, "pause")!;
    expect(paused.position).toBe(20);
    expect(paused.target).toBe(100);
    expect(advanceValveState(d, paused, 10000)).toBe(paused);
    const resumed = advanceValveState(
      d,
      valveAction(d, paused, "resume")!,
      1000,
    );
    expect(resumed.position).toBe(40);
    expect(valveIsMoving(d, resumed)).toBe(true);
  });
  it("uses linear stem feedback without inventing rotary angles", () => {
    const d = device("modulating_control_valve");
    const model = deviceInterface(d, state(d.id));
    expect(model.primary.label).toBe("device_valve_stem_travel");
    expect(model.metrics.some((m) => m.label === "device_valve_rotation")).toBe(
      false,
    );
  });
  it("gives a normally closed solenoid only binary coil commands", () => {
    const d = device("solenoid_valve");
    expect(
      deviceInterface(d, state(d.id)).controls.some((c) => c.kind === "range"),
    ).toBe(false);
    const energized = valveAction(d, state(d.id), "open")!;
    expect(energized.mode).toBe("energized");
    expect(advanceValveState(d, energized, 450).position).toBe(100);
    const closed = advanceValveState(
      d,
      valveAction(d, advanceValveState(d, energized, 450), "close")!,
      450,
    );
    expect(closed.position).toBe(0);
    expect(closed.mode).toBe("deenergized");
  });
  it.each([
    ["pressure_reducing_valve", "bar"],
    ["thermostatic_mixing_valve", "°C"],
  ])("gives self-acting %s a setpoint without motor commands", (id, unit) => {
    const d = device(id);
    const model = deviceInterface(d, state(id));
    expect(model.primary.unit).toBe(unit);
    expect(model.controls.some((c) => c.kind === "actions")).toBe(false);
    const adjusted = valveRange(d, state(id), "target", 1000)!;
    expect(adjusted.target).toBe(id === "pressure_reducing_valve" ? 5.5 : 55);
    expect(adjusted.value).toBe(adjusted.target);
    expect(adjusted.active).toBe(false);
  });
  it("latches an emergency trip and never reopens on reset", () => {
    const d = device("emergency_shutoff_valve");
    const tripped = valveAction(d, state(d.id), "alarm")!;
    expect(tripped.target).toBe(0);
    expect(valveAction(d, tripped, "restore")!.alert).toBe(true);
    expect(valveAction(d, tripped, "open")).toBe(tripped);
    const closed = advanceValveState(d, tripped, 1200);
    expect(closed.position).toBe(0);
    const reset = valveAction(d, closed, "restore")!;
    expect(reset.alert).toBe(false);
    expect(reset.position).toBe(0);
    expect(reset.target).toBe(0);
    expect(reset.active).toBe(false);
  });
  it("keeps valve monitors free of actuator commands and reports limit contacts", () => {
    const d = device("valve_position_sensor");
    const feedback = valveRange(d, state(d.id), "position", 100)!;
    const model = deviceInterface(d, feedback);
    expect(model.primary.value).toBe(100);
    expect(
      model.metrics.find((m) => m.label === "device_valve_open_limit")?.value,
    ).toBe("device_valve_made");
    expect(model.controls.some((c) => c.kind === "actions")).toBe(false);
    const monitor = device("backflow_prevention_monitor");
    const offered = deviceInterface(
      monitor,
      state(monitor.id),
    ).controls.flatMap((c) => (c.kind === "actions" ? c.actions : []));
    expect(offered).not.toContain("open");
    expect(offered).not.toContain("close");
  });
  it("does not invent position feedback for a positionable live valve", () => {
    const entity = {
      ...mockEntity,
      entity_id: "valve.test",
      state: "open",
      attributes: { supported_features: 15 },
    };
    expect(entityVisual(entity).hasPosition).toBe(false);
    expect(entityVisual({ ...entity, attributes: {} }).hasPosition).toBe(false);
    expect(entityVisual({ ...entity, state: "closed" }).position).toBe(0);
    expect(
      entityVisual({ ...entity, attributes: { supported_features: 3 } })
        .position,
    ).toBe(100);
    expect(
      entityVisual({
        ...entity,
        attributes: { supported_features: 15, current_position: 37 },
      }).position,
    ).toBe(37);
  });
  it("keeps a manual valve binding read-only", async () => {
    const card = await mount("balancing_valve");
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    await card.updateComplete;
    const native = card.shadowRoot!.querySelector("emad-ui-device")!;
    await native.updateComplete;
    expect(native.disabled).toBe(true);
    expect(card.shadowRoot!.querySelector(".specific-controls")).toBeNull();
  });
});

it("retains a fail-close trip during a suspended example stroke", () => {
  const d = catalogDevice("emergency_shutoff_valve")!;
  const tripped = valveAction(d, initialDeviceState(d), "alarm")!;
  const suspended = { ...advanceValveState(d, tripped, 300), active: false };
  expect(suspended.position).toBe(75);
  const offered = deviceInterface(d, suspended).controls.flatMap((c) =>
    c.kind === "actions" ? c.actions : [],
  );
  expect(offered).toEqual(["resume"]);
  const resumed = advanceValveState(
    d,
    valveAction(d, suspended, "resume")!,
    1000,
  );
  expect(resumed.position).toBe(0);
  expect(resumed.alert).toBe(true);
  const monitor = catalogDevice("backflow_prevention_monitor")!;
  expect(
    valveAction(monitor, initialDeviceState(monitor), "alarm")!.value,
  ).toBeLessThan(0);
});

describe("Water equipment mechanisms and measurements", () => {
  const device = (id: string) => catalogDevice(id)!;
  const initial = (id: string) => initialDeviceState(device(id));
  it.each([...WATER_DEVICES])(
    "renders dedicated water geometry for %s",
    async (id) => {
      const card = await mount(id);
      expect(
        card
          .shadowRoot!.querySelector(".realistic-water")
          ?.getAttribute("data-water-device"),
      ).toBe(id);
      expect(card.shadowRoot!.querySelector(".fan-blade")).toBeNull();
      const m = deviceInterface(device(id), initial(id));
      expect(m.chart).toBe(false);
      for (const lang of [en, ar]) {
        for (const label of [
          m.primary.label,
          m.status,
          ...m.metrics.map((v) => v.label),
          ...m.controls.flatMap((c) => ("label" in c ? [c.label] : [])),
        ]) {
          expect(lang.ui.panel["emad-dashboard"][label]).toBeTruthy();
        }
      }
    },
  );
  it("ramps the pump to rest without claiming zero system pressure", () => {
    const d = device("booster_pump");
    const stopped = waterAction(d, initial(d.id), "stop")!;
    expect(stopped.position).toBe(60);
    expect(waterIsMoving(d, stopped)).toBe(true);
    const midway = advanceWaterState(d, stopped, 300);
    expect(midway.position).toBe(30);
    const end = advanceWaterState(d, midway, 5000);
    expect(end.position).toBe(0);
    expect(end.value).toBe(3.2);
    expect(waterIsMoving(d, end)).toBe(false);
    expect(deviceInterface(d, end).metrics.some((m) => m.unit === "m³/h")).toBe(
      false,
    );
  });
  it("maps tank contents, free space and 4–20 mA feedback to actual level", () => {
    for (const id of ["water_tank", "tank_level_sensor"]) {
      const d = device(id);
      const command = waterRange(d, initial(id), "target", 100)!;
      expect(command.level).toBe(68);
      const halfway = advanceWaterState(d, command, 500);
      expect(halfway.level).toBe(83);
      const end = advanceWaterState(d, halfway, 10000);
      expect(end.level).toBe(100);
      const m = deviceInterface(d, end);
      expect(m.primary.value).toBe(100);
      expect(
        m.metrics.find(
          (v) =>
            v.label ===
            (id === "water_tank"
              ? "device_water_stored"
              : "device_water_signal"),
        )?.value,
      ).toBe(id === "water_tank" ? 1000 : 20);
      const empty = advanceWaterState(
        d,
        waterRange(d, end, "target", 0)!,
        10000,
      );
      expect(empty.level).toBe(0);
      expect(
        deviceInterface(d, empty).controls.some(
          (c) => c.kind === "actions" && c.actions.includes("open"),
        ),
      ).toBe(false);
    }
  });
  it("uses float-switch pickup/release hysteresis rather than presence", () => {
    const d = device("float_switch");
    const set = (s: ReturnType<typeof initial>, target: number) =>
      advanceWaterState(d, waterRange(d, s, "target", target)!, 10000);
    let state = set(initial(d.id), 59);
    expect(state.open).toBe(false);
    state = set(state, 60);
    expect(state.open).toBe(true);
    state = set(state, 50);
    expect(state.open).toBe(true);
    state = set(state, 40);
    expect(state.open).toBe(false);
    expect(deviceInterface(d, state).primary.label).toBe(
      "device_water_high_level",
    );
    expect(
      deviceInterface(d, state).metrics.some(
        (m) => m.label === "device_battery",
      ),
    ).toBe(false);
  });
  it("pauses level travel and retains the target", () => {
    const d = device("water_tank");
    const moving = advanceWaterState(
      d,
      waterRange(d, initial(d.id), "target", 0)!,
      500,
    );
    const held = waterAction(d, moving, "pause")!;
    expect(advanceWaterState(d, held, 5000)).toBe(held);
    expect(held.level).toBe(53);
    expect(held.target).toBe(0);
    const resumed = advanceWaterState(d, waterAction(d, held, "resume")!, 5000);
    expect(resumed.level).toBe(0);
  });
  it.each(["water_heater", "calorifier"])(
    "limits %s heating to target and retains heat when disabled",
    (id) => {
      const d = device(id);
      const enabled = waterAction(d, initial(id), "start")!;
      const end = advanceWaterState(d, enabled, 100000);
      expect(end.value).toBe(55);
      expect(waterIsMoving(d, end)).toBe(false);
      const stopped = waterAction(d, end, "stop")!;
      expect(advanceWaterState(d, stopped, 100000).value).toBe(55);
      expect(
        deviceInterface(d, stopped).controls.some((c) => c.kind === "choices"),
      ).toBe(false);
    },
  );
  it("uses pressure for expansion vessels and integrates meter flow with units", () => {
    const vessel = device("expansion_vessel");
    const m = deviceInterface(vessel, initial(vessel.id));
    expect(m.primary.unit).toBe("bar");
    expect(m.controls.find((c) => c.kind === "range")?.unit).toBe("bar");
    const meter = device("water_meter");
    const start = initial(meter.id);
    const next = waterAction(meter, start, "sample")!;
    expect(next.value - start.value).toBeCloseTo((2.4 * 10) / 3600, 10);
    const noFlow = waterRange(meter, next, "target", 0)!;
    expect(waterAction(meter, noFlow, "sample")!.value).toBe(next.value);
  });
  it("never treats unrelated live pressure as level or flow", () => {
    const entity = {
      ...mockEntity,
      entity_id: "sensor.water",
      state: "3.2",
      attributes: { unit_of_measurement: "bar" },
    };
    const base = entityVisual(entity);
    const level = waterVisualState(
      device("tank_level_sensor"),
      base,
      undefined,
      entity,
    );
    expect(level.hasLevel).toBe(false);
    expect(level.flow).toBeUndefined();
    expect(level.pressure).toBe(3.2);
    const percent = {
      ...entity,
      state: "75",
      attributes: { unit_of_measurement: "%" },
    };
    expect(
      waterVisualState(
        device("tank_level_sensor"),
        entityVisual(percent),
        undefined,
        percent,
      ).level,
    ).toBe(75);
    const unknown = waterVisualState(
      device("water_flow_sensor"),
      entityVisual({ ...entity, state: "unavailable" }),
      undefined,
      { ...entity, state: "unavailable" },
    );
    expect(unknown.flow).toBeUndefined();
    expect(unknown.active).toBe(false);
    const flowDevice = device("water_flow_sensor");
    const zero = waterRange(flowDevice, initial(flowDevice.id), "target", 0)!;
    expect(waterVisualState(flowDevice, previewVisual(zero), zero).flow).toBe(
      0,
    );
    const reportedZero = {
      ...mockEntity,
      state: "running",
      attributes: { flow_rate: 0, flow_unit: "m³/h" },
    };
    const actual = waterVisualState(
      flowDevice,
      entityVisual(reportedZero),
      undefined,
      reportedZero,
    );
    expect(actual.flow).toBe(0);
    expect(actual.hasTelemetry).toBe(true);
    expect(actual.active).toBe(false);
  });
  it.each([
    "tank_level_sensor",
    "float_switch",
    "water_leak_detector",
    "leak_detection_cable",
    "expansion_vessel",
  ])("keeps %s live bindings monitoring-only", async (id) => {
    const card = await mount(id);
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
      true,
    );
  });
});

describe("Treatment equipment and analytical instruments", () => {
  const device = (id: string) => catalogDevice(id)!;
  const initial = (id: string) => initialDeviceState(device(id));
  it.each([...TREATMENT_DEVICES])(
    "renders dedicated treatment geometry and localized controls for %s",
    async (id) => {
      const card = await mount(id);
      expect(
        card
          .shadowRoot!.querySelector(".realistic-treatment")
          ?.getAttribute("data-treatment-device"),
      ).toBe(id);
      expect(card.shadowRoot!.querySelector(".fan-blade")).toBeNull();
      const model = deviceInterface(device(id), initial(id));
      expect(model.chart).toBe(false);
      expect(model.primary.label).not.toBe("device_filter_remaining");
      for (const lang of [en, ar]) {
        for (const label of [
          model.primary.label,
          model.status,
          ...model.metrics.map((item) => item.label),
          ...model.controls.flatMap((c) => ("label" in c ? [c.label] : [])),
        ]) {
          expect(lang.ui.panel["emad-dashboard"][label]).toBeTruthy();
        }
      }
    },
  );
  it("distinguishes the nine sensing mechanisms", async () => {
    const signatures: Record<string, string> = {
      ph_sensor: ".treatment-ph-bulb",
      orp_sensor: ".treatment-platinum-ring",
      conductivity_sensor: ".treatment-ec-electrode",
      total_dissolved_solids_sensor: ".treatment-ec-electrode",
      turbidity_sensor: ".treatment-optical-detector",
      chlorine_sensor: ".treatment-chlorine-membrane",
      dissolved_oxygen_sensor: ".treatment-luminescent-spot",
      salinity_sensor: ".treatment-toroid",
      water_hardness_sensor: ".treatment-reagent-bottle",
    };
    await Promise.all(
      Object.entries(signatures).map(async ([id, selector]) => {
        const card = await mount(id);
        expect(card.shadowRoot!.querySelector(selector)).not.toBeNull();
      }),
    );
  });
  it("runs a bounded five-stage regeneration and holds it when paused", () => {
    const d = device("water_softener");
    let state = treatmentAction(d, initial(d.id), "flush")!;
    expect(treatmentPhase(d, state)).toBe("backwash");
    for (const phase of ["brine_draw", "slow_rinse", "fast_rinse", "refill"]) {
      state = advanceTreatmentState(d, state, 3000);
      expect(treatmentPhase(d, state)).toBe(phase);
    }
    const paused = treatmentAction(d, state, "pause")!;
    expect(advanceTreatmentState(d, paused, 10000)).toBe(paused);
    expect(treatmentFlow(d, paused)).toBe(0);
    expect(
      deviceInterface(d, paused).metrics.find(
        (item) => item.label === "device_treatment_example_flow",
      )!.value,
    ).toBe(0);
    const noFlow = treatmentRange(
      d,
      treatmentAction(d, paused, "resume")!,
      "speed",
      0,
    )!;
    expect(treatmentIsMoving(d, noFlow)).toBe(false);
    const end = advanceTreatmentState(
      d,
      treatmentRange(d, noFlow, "speed", 1.2)!,
      10000,
    );
    expect(end.progress).toBe(100);
    expect(end.program).toBe("service");
    expect(end.active).toBe(false);
  });
  it.each(["sand_filter", "activated_carbon_filter", "ultrafiltration_unit"])(
    "backwashes and rinses %s without inventing filter life",
    (id) => {
      const d = device(id);
      const start = treatmentAction(d, initial(id), "flush")!;
      expect(treatmentPhase(d, start)).toBe("backwash");
      const rinse = advanceTreatmentState(d, start, 7000);
      expect(treatmentPhase(d, rinse)).toBe("rinse");
      const end = advanceTreatmentState(d, rinse, 100000);
      expect(end.progress).toBe(100);
      expect(end.active).toBe(false);
    },
  );
  it("balances RO feed, permeate and concentrate and excludes product during flush", () => {
    const d = device("reverse_osmosis_unit");
    const running = treatmentAction(d, initial(d.id), "start")!;
    const m = deviceInterface(d, running);
    expect(m.primary.value).toBeCloseTo(1.8);
    const concentrate = m.metrics.find(
      (item) => item.label === "device_treatment_concentrate_flow",
    )!.value as number;
    expect((m.primary.value as number) + concentrate).toBeCloseTo(3);
    const flush = deviceInterface(d, treatmentAction(d, running, "flush")!);
    expect(flush.primary.value).toBe(0);
    expect(
      flush.metrics.find(
        (item) => item.label === "device_treatment_concentrate_flow",
      )!.value,
    ).toBe(3);
  });
  it("warms the UV lamp, handles a fault, and does not report filter remaining", () => {
    const d = device("uv_disinfection_unit");
    const on = treatmentAction(d, initial(d.id), "start")!;
    expect(deviceInterface(d, on).status).toBe("device_treatment_warming");
    const warm = advanceTreatmentState(d, on, 2000);
    expect(warm.progress).toBe(100);
    expect(deviceInterface(d, warm).status).toBe("device_treatment_lamp_on");
    const fault = treatmentAction(d, warm, "alarm")!;
    expect(fault.active).toBe(false);
    expect(treatmentAction(d, fault, "start")).toBe(fault);
    const cleared = treatmentAction(d, fault, "restore")!;
    expect(cleared.active).toBe(false);
    expect(cleared.alert).toBe(false);
  });
  it.each(["dosing_pump", "chlorinator", "ozone_generator"])(
    "interlocks %s output with flow and the applicable tank",
    (id) => {
      const d = device(id);
      const running = treatmentAction(d, initial(id), "start")!;
      expect(treatmentRate(d, running)).toBe(2);
      expect(treatmentFlow(d, treatmentAction(d, running, "stop")!)).toBe(1.2);
      expect(treatmentRate(d, treatmentRange(d, running, "speed", 0)!)).toBe(0);
      const empty = treatmentRange(d, running, "level", 0)!;
      expect(treatmentRate(d, empty)).toBe(id === "ozone_generator" ? 2 : 0);
      const model = deviceInterface(d, running);
      expect(model.primary.unit).toBe(id === "ozone_generator" ? "g/h" : "L/h");
      if (id === "dosing_pump") {
        expect(
          model.metrics.find(
            (item) => item.label === "device_treatment_stroke_rate",
          )!.value,
        ).toBeCloseTo((1000 * 2) / 60);
      }
    },
  );
  it("settles probe readings at their sample target without moving probe bodies", () => {
    for (const id of Object.keys(TREATMENT_SENSORS).filter(
      (sensorId) => sensorId !== "water_hardness_sensor",
    )) {
      const d = device(id);
      const spec = TREATMENT_SENSORS[id];
      const sample = treatmentRange(d, initial(id), "target", spec.max + 100)!;
      expect(sample.target).toBe(spec.max);
      expect(sample.value).toBe(spec.value);
      const end = advanceTreatmentState(d, sample, 100000);
      expect(end.value).toBe(spec.max);
      expect(treatmentIsMoving(d, end)).toBe(false);
    }
  });
  it("labels TDS as a conductivity-based estimate with a specific factor", () => {
    const d = device("total_dissolved_solids_sensor");
    const m = deviceInterface(d, initial(d.id));
    expect(m.primary.value).toBe(288);
    expect(m.primary.unit).toBe("mg/L");
    expect(
      m.metrics.find((item) => item.label === "device_treatment_tds_factor")!
        .value,
    ).toBe(0.64);
  });
  it("samples hardness through reagent and optical-read stages before updating the result", () => {
    const d = device("water_hardness_sensor");
    const sample = treatmentAction(
      d,
      treatmentRange(d, initial(d.id), "target", 220)!,
      "sample",
    )!;
    const reagent = advanceTreatmentState(d, sample, 4000);
    expect(treatmentPhase(d, reagent)).toBe("reagent");
    expect(reagent.value).toBe(120);
    const read = advanceTreatmentState(d, reagent, 2000);
    expect(treatmentPhase(d, read)).toBe("read");
    expect(read.value).toBe(220);
    const end = advanceTreatmentState(d, read, 100000);
    expect(end.program).toBe("service");
    expect(end.active).toBe(false);
  });
  it("accepts matching live measurements and keeps unknown flow distinct from zero", () => {
    const d = device("ph_sensor");
    const wrong = {
      ...mockEntity,
      state: "3.2",
      attributes: { unit_of_measurement: "bar" },
    };
    const invalid = treatmentVisualState(
      d,
      entityVisual(wrong),
      undefined,
      wrong,
    );
    expect(invalid.hasTelemetry).toBe(false);
    expect(invalid.flow).toBeUndefined();
    const ph = {
      ...wrong,
      state: "7.1",
      attributes: { unit_of_measurement: "pH" },
    };
    expect(treatmentVisualState(d, entityVisual(ph), undefined, ph).value).toBe(
      7.1,
    );
    const zero = {
      ...wrong,
      state: "on",
      attributes: { flow_rate: 0, flow_unit: "m³/h" },
    };
    expect(
      treatmentVisualState(
        device("reverse_osmosis_unit"),
        entityVisual(zero),
        undefined,
        zero,
      ).flow,
    ).toBe(0);
    const rate = {
      ...wrong,
      state: "1.4",
      attributes: { unit_of_measurement: "L/h" },
    };
    expect(
      treatmentVisualState(
        device("dosing_pump"),
        entityVisual(rate),
        undefined,
        rate,
      ).deliveryRate,
    ).toBe(1.4);
    const unavailable = {
      ...rate,
      state: "unavailable",
      attributes: {
        ...rate.attributes,
        flow_rate: 3,
        flow_unit: "m³/h",
        delivery_rate: 2,
        delivery_unit: "L/h",
      },
    };
    const hidden = treatmentVisualState(
      device("dosing_pump"),
      entityVisual(unavailable),
      undefined,
      unavailable,
    );
    expect(hidden.deliveryRate).toBeUndefined();
    expect(hidden.flow).toBeUndefined();
    expect(hidden.active).toBe(false);
  });
  it.each([
    "ph_sensor",
    "orp_sensor",
    "water_hardness_sensor",
    "water_filter",
    "water_softener",
  ])("keeps %s live monitoring controls read-only", async (id) => {
    const card = await mount(id);
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
      true,
    );
  });
});

describe("Parking and vehicle access mechanisms", () => {
  const device = (id: string) => catalogDevice(id)!;
  const initial = (id: string) => initialDeviceState(device(id));
  it.each([...PARKING_DEVICES])(
    "renders dedicated geometry and localized controls for %s",
    async (id) => {
      const card = await mount(id);
      expect(
        card
          .shadowRoot!.querySelector(".realistic-parking")
          ?.getAttribute("data-parking-device"),
      ).toBe(id);
      const model = deviceInterface(device(id), initial(id));
      expect(model.chart).toBe(false);
      for (const lang of [en, ar]) {
        const labels = [
          model.primary.label,
          model.status,
          ...model.metrics.map((item) => item.label),
          ...model.controls.flatMap((c) => ("label" in c ? [c.label] : [])),
        ];
        for (const label of labels) {
          expect(lang.ui.panel["emad-dashboard"][label]).toBeTruthy();
        }
        for (const c of model.controls) {
          if (c.kind === "choices") {
            for (const o of c.options) {
              expect(
                lang.ui.panel["emad-dashboard"][optionTextKey(o)],
              ).toBeTruthy();
            }
          }
        }
      }
    },
  );
  it.each(Object.keys(PARKING_MOVERS).filter((id) => id !== "turnstile"))(
    "moves %s continuously, holds its pose, and resumes to exact endpoints",
    (id) => {
      const d = device(id);
      const start = parkingAction(d, initial(id), "open")!;
      expect(start.position).toBe(0);
      expect(start.target).toBe(100);
      const mid = advanceParkingState(d, start, start.duration * 500);
      expect(mid.position).toBeCloseTo(50);
      expect(parkingIsMoving(d, mid)).toBe(true);
      const pause = parkingAction(d, mid, "pause")!;
      expect(advanceParkingState(d, pause, 100000)).toBe(pause);
      const end = advanceParkingState(
        d,
        parkingAction(d, pause, "resume")!,
        100000,
      );
      expect(end.position).toBe(100);
      expect(end.active).toBe(false);
      const closed = advanceParkingState(
        d,
        parkingAction(d, end, "close")!,
        100000,
      );
      expect(closed.position).toBe(0);
      expect(closed.active).toBe(false);
    },
  );
  it.each([
    "vehicle_barrier",
    "motorized_gate",
    "retractable_bollard",
    "parking_space_lock",
    "speed_gate",
  ])(
    "blocks closing and reverses a closing %s after an example obstruction",
    (id) => {
      const d = device(id);
      const opened = advanceParkingState(
        d,
        parkingAction(d, initial(id), "open")!,
        100000,
      );
      const closing = advanceParkingState(
        d,
        parkingAction(d, opened, "close")!,
        500,
      );
      const blocked = parkingAction(d, closing, "alarm")!;
      expect(blocked.alert).toBe(true);
      expect(blocked.target).toBe(100);
      const end = advanceParkingState(d, blocked, 100000);
      expect(end.position).toBe(100);
      expect(parkingAction(d, end, "close")!.active).toBe(false);
      const clear = parkingAction(d, end, "restore")!;
      expect(clear.active).toBe(false);
      expect(parkingAction(d, clear, "close")!.active).toBe(true);
    },
  );
  it("indexes a tripod exactly 120 degrees per passage without continuous spin", () => {
    const d = device("turnstile");
    let s = initial(d.id);
    for (let i = 1; i <= 3; i++) {
      s = advanceParkingState(d, parkingAction(d, s, "start")!, 100000);
      expect(s.position * 1.2).toBe(120);
      expect(s.channels).toBe(i);
      expect(s.active).toBe(false);
      expect(advanceParkingState(d, s, 100000)).toBe(s);
    }
  });
  it("clamps requested travel and guidance counts, preserving the capacity identity", () => {
    const d = device("motorized_gate");
    expect(parkingRange(d, initial(d.id), "target", -4)!.target).toBe(0);
    expect(parkingRange(d, initial(d.id), "target", 400)!.target).toBe(100);
    expect(parkingRange(d, initial(d.id), "target", Number.NaN)).toEqual(
      initial(d.id),
    );
    const sign = device("parking_guidance_sign");
    for (const count of [-2, 0, 42, 120, 140]) {
      const m = deviceInterface(
        sign,
        parkingRange(sign, initial(sign.id), "level", count)!,
      );
      expect(Number(m.primary.value) + Number(m.metrics[0].value)).toBe(120);
      expect(Number(m.primary.value)).toBeGreaterThanOrEqual(0);
    }
  });
  it.each([
    "parking_ticket_dispenser",
    "parking_payment_terminal",
    "vehicle_rfid_reader",
    "license_plate_recognition_camera",
  ])("finishes the bounded %s example and stops its timer", (id) => {
    const d = device(id);
    const a =
      id === "parking_ticket_dispenser"
        ? "dispense"
        : id === "parking_payment_terminal"
          ? "test"
          : "sample";
    const start = parkingAction(d, initial(id), a)!;
    expect(start.active).toBe(true);
    expect(start.progress).toBe(0);
    const end = advanceParkingState(d, start, 100000);
    expect(end.progress).toBe(100);
    expect(end.active).toBe(false);
    expect(advanceParkingState(d, end, 100000)).toBe(end);
    expect(parkingAction(d, end, "stop")!.program).toBe("idle");
  });
  it("orders dock deck and lip motion and holds the same pose while paused", () => {
    const d = device("loading_dock_controller");
    let s = parkingAction(d, initial(d.id), "start")!;
    expect(parkingDockPose(s.program, 0)).toEqual({ deck: 0, lip: -90 });
    s = advanceParkingState(d, s, 3000);
    expect(parkingPhase(d, s)).toBe("lip_extend");
    const pose = parkingDockPose(s.program, s.progress);
    expect(pose.deck).toBe(18);
    expect(pose.lip).toBeGreaterThan(-90);
    const held = parkingAction(d, s, "pause")!;
    expect(advanceParkingState(d, held, 100000)).toBe(held);
    s = advanceParkingState(d, parkingAction(d, held, "resume")!, 100000);
    expect(s.program).toBe("docked");
    expect(parkingDockPose(s.program, s.progress)).toEqual({
      deck: -3,
      lip: 0,
    });
    s = advanceParkingState(d, parkingAction(d, s, "close")!, 100000);
    expect(s.program).toBe("idle");
    expect(s.active).toBe(false);
    expect(parkingDockPose(s.program, s.progress)).toEqual({
      deck: 0,
      lip: -90,
    });
  });
  it("keeps unknown, zero, and unavailable feedback distinct", () => {
    const d = device("vehicle_barrier");
    const entity = {
      ...mockEntity,
      entity_id: "cover.barrier",
      state: "opening",
      attributes: {},
    };
    const unknown = parkingVisualState(
      d,
      entityVisual(entity),
      undefined,
      entity,
    );
    expect(unknown.hasPosition).toBe(false);
    expect(unknown.active).toBe(false);
    const reportedOpen = { ...entity, state: "open" };
    expect(
      parkingVisualState(d, entityVisual(reportedOpen), undefined, reportedOpen)
        .hasPosition,
    ).toBe(false);
    const zero = { ...entity, attributes: { current_position: 0 } };
    expect(
      parkingVisualState(d, entityVisual(zero), undefined, zero).hasPosition,
    ).toBe(true);
    const invalid = { ...entity, attributes: { current_position: 120 } };
    expect(
      parkingVisualState(d, entityVisual(invalid), undefined, invalid)
        .hasPosition,
    ).toBe(false);
    const unavailable = { ...zero, state: "unavailable" };
    const hidden = parkingVisualState(
      d,
      entityVisual(unavailable),
      undefined,
      unavailable,
    );
    expect(hidden.hasTelemetry).toBe(false);
    expect(hidden.hasPosition).toBe(false);
  });
  it("uses only valid reported parking counts and explicit occupancy", () => {
    const d = device("parking_guidance_sign");
    const actual = {
      ...mockEntity,
      attributes: { occupied_spaces: 120, capacity: 120 },
    };
    const v = parkingVisualState(d, entityVisual(actual), undefined, actual);
    expect(v.hasTelemetry).toBe(true);
    expect(v.level).toBe(0);
    const bad = {
      ...actual,
      attributes: { occupied_spaces: 121, capacity: 120 },
    };
    expect(
      parkingVisualState(d, entityVisual(bad), undefined, bad).hasTelemetry,
    ).toBe(false);
    const sensor = {
      ...mockEntity,
      entity_id: "binary_sensor.bay",
      state: "off",
    };
    expect(
      parkingVisualState(
        device("parking_occupancy_sensor"),
        entityVisual(sensor),
        undefined,
        sensor,
      ).mode,
    ).toBe("parking_free");
  });
  it.each(
    PARKING_DEVICES.filter(
      (id) =>
        ![
          "vehicle_barrier",
          "motorized_gate",
          "retractable_bollard",
          "parking_space_lock",
        ].includes(id),
    ),
  )("keeps connected %s monitoring-only", async (id) => {
    const card = await mount(id);
    card.card = { ...card.card, entity: mockEntity.entity_id };
    card.entity = mockEntity;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
      true,
    );
  });
  it("retains native capability-based cover controls for a connected barrier", async () => {
    const card = await mount("vehicle_barrier");
    card.card = { ...card.card, entity: "cover.barrier" };
    card.entity = {
      ...mockEntity,
      entity_id: "cover.barrier",
      state: "closed",
      attributes: { supported_features: 15, current_position: 0 },
    };
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
      false,
    );
    expect(
      card.shadowRoot!.querySelector(".primary-reading")!.textContent,
    ).toContain("0");
  });
  it.each([
    "parking_ticket_dispenser",
    "vehicle_rfid_reader",
    "parking_guidance_controller",
    "loading_dock_controller",
  ])(
    "does not draw synthetic results or counts for a connected %s",
    async (id) => {
      const card = await mount(id);
      card.card = { ...card.card, entity: mockEntity.entity_id };
      card.entity = mockEntity;
      await card.updateComplete;
      expect(
        card.shadowRoot!.querySelector(".parking-issued-ticket"),
      ).toBeNull();
      expect(card.shadowRoot!.querySelector(".parking-example-tag")).toBeNull();
      expect(
        card.shadowRoot!.querySelector(".parking-example-trailer"),
      ).toBeNull();
      if (id === "parking_guidance_controller") {
        expect(
          card.shadowRoot!.querySelector(".screen-label")!.textContent,
        ).toBe("—");
      }
    },
  );
  it("keeps all tripod arms below the housing and above the floor throughout a passage", () => {
    for (let position = 0; position <= 100; position += 2) {
      const tips = parkingTripodTips(position);
      expect(tips).toHaveLength(3);
      for (const tip of tips) {
        expect(tip[2]).toBeGreaterThan(5);
        expect(tip[2]).toBeLessThan(65);
      }
    }
  });
});

describe("Occupancy sensing and room equipment", () => {
  const device = (id: string) => catalogDevice(id)!;
  const initial = (id: string) => initialDeviceState(device(id));
  it.each([...OCCUPANCY_DEVICES])(
    "renders dedicated geometry and bilingual controls for %s",
    async (id) => {
      const card = await mount(id);
      const model = deviceInterface(device(id), initial(id));
      expect(
        card
          .shadowRoot!.querySelector(".realistic-occupancy")
          ?.getAttribute("data-room-device"),
      ).toBe(id);
      expect(card.shadowRoot!.querySelector(".fan-rotor")).toBeNull();
      expect(model.chart).toBe(false);
      expect(model.metrics.map((m) => m.label)).not.toContain("device_battery");
      for (const lang of [en, ar]) {
        for (const label of [
          model.primary.label,
          model.status,
          ...model.metrics.map((m) => m.label),
          ...model.controls.flatMap((c) => ("label" in c ? [c.label] : [])),
        ]) {
          expect(lang.ui.panel["emad-dashboard"][label]).toBeTruthy();
        }
        for (const c of model.controls) {
          if (c.kind === "choices") {
            for (const option of c.options) {
              expect(
                lang.ui.panel["emad-dashboard"][optionTextKey(option)],
              ).toBeTruthy();
            }
          }
        }
      }
    },
  );
  it("distinguishes infrared, radar, optical counter and pressure hardware", async () => {
    await Promise.all(
      Object.entries({
        occupancy_sensor: ".room-fresnel-lens",
        millimeter_wave_presence_sensor: ".room-radome",
        people_counter: ".room-tof-window",
        directional_people_counter: ".room-beam-node",
        desk_occupancy_sensor: ".room-underdesk-sensor",
        seat_occupancy_sensor: ".room-seat-pressure-pad",
        bed_occupancy_sensor: ".room-bed-pressure-strip",
      }).map(async ([id, signature]) => {
        const card = await mount(id);
        expect(card.shadowRoot!.querySelector(signature)).not.toBeNull();
      }),
    );
  });
  it("holds PIR detection after the crossing, then clears and stops", () => {
    const d = device("occupancy_sensor");
    const start = occupancyAction(d, initial(d.id), "sample")!;
    expect(occupancyPhase(d, start)).toBe("motion_detected");
    const held = advanceOccupancyState(d, start, 2600);
    expect(occupancyPhase(d, held)).toBe("hold_time");
    const paused = occupancyAction(d, held, "pause")!;
    expect(advanceOccupancyState(d, paused, 9000)).toBe(paused);
    const end = advanceOccupancyState(
      d,
      occupancyAction(d, paused, "resume")!,
      9000,
    );
    expect(end.mode).toBe("room_vacant");
    expect(end.active).toBe(false);
    expect(occupancyIsMoving(d, end)).toBe(false);
  });
  it("retains radar presence after an example person stops moving", () => {
    const d = device("millimeter_wave_presence_sensor");
    const start = occupancyChoice(d, initial(d.id), "mode", "room_moving")!;
    const end = advanceOccupancyState(d, start, 9000);
    expect(end.mode).toBe("room_still");
    expect(end.active).toBe(false);
    expect(occupancyChoice(d, end, "mode", "room_vacant")!.mode).toBe(
      "room_vacant",
    );
    expect(occupancyChoice(d, end, "mode", "invalid")).toBe(end);
  });
  it.each(["seat_occupancy_sensor", "bed_occupancy_sensor"])(
    "bounds %s loading, holds compression when paused, and releases",
    (id) => {
      const d = device(id);
      const start = occupancyChoice(d, initial(id), "mode", "room_occupied")!;
      const mid = advanceOccupancyState(d, start, 450);
      expect(mid.position).toBeCloseTo(50);
      const pause = occupancyAction(d, mid, "pause")!;
      expect(advanceOccupancyState(d, pause, 9999)).toBe(pause);
      const loaded = advanceOccupancyState(
        d,
        occupancyAction(d, pause, "resume")!,
        9999,
      );
      expect(loaded.position).toBe(100);
      const end = advanceOccupancyState(
        d,
        occupancyChoice(d, loaded, "mode", "room_vacant")!,
        9999,
      );
      expect(end.position).toBe(0);
      expect(end.active).toBe(false);
      expect(deviceInterface(d, end).metrics.some((m) => m.unit === "kg")).toBe(
        false,
      );
    },
  );
  it("counts one completed optical crossing exactly once", () => {
    const d = device("people_counter");
    const start = occupancyAction(d, initial(d.id), "sample")!;
    const mid = advanceOccupancyState(d, start, 1000);
    expect(mid.channels).toBe(0);
    const end = advanceOccupancyState(d, mid, 9000);
    expect(end.channels).toBe(1);
    expect(advanceOccupancyState(d, end, 9000)).toBe(end);
  });
  it("conserves directional count and blocks leaving an empty example room", () => {
    const d = device("directional_people_counter");
    let s = initial(d.id);
    s = advanceOccupancyState(d, occupancyAction(d, s, "open")!, 9000);
    expect(s.value).toBe(4);
    expect(s.channels).toBe(1);
    for (let i = 0; i < 4; i++) {
      s = advanceOccupancyState(d, occupancyAction(d, s, "close")!, 9000);
    }
    expect(s.value).toBe(0);
    expect(s.level).toBe(4);
    expect(3 + s.channels - s.level).toBe(s.value);
    expect(occupancyActionDisabled(d, s, "close")).toBe(true);
    expect(occupancyAction(d, s, "close")).toBe(s);
  });
  it("separates example reservations from check-in and releases the room", () => {
    const d = device("room_booking_panel");
    let s = initial(d.id);
    s = advanceOccupancyState(d, occupancyAction(d, s, "open")!, 9000);
    expect(s.mode).toBe("room_reserved");
    s = advanceOccupancyState(d, occupancyAction(d, s, "sample")!, 9000);
    expect(s.mode).toBe("room_in_use");
    s = advanceOccupancyState(d, occupancyAction(d, s, "close")!, 9000);
    expect(s.mode).toBe("room_available");
    expect(s.active).toBe(false);
    const display = device("room_availability_display");
    expect(
      occupancyChoice(display, initial(display.id), "mode", "room_reserved")!
        .mode,
    ).toBe("room_reserved");
  });
  it("issues a queue number only after a completed print, including pause and cancel", () => {
    const d = device("queue_management_terminal");
    const start = occupancyAction(d, initial(d.id), "dispense")!;
    const mid = advanceOccupancyState(d, start, 900);
    const pause = occupancyAction(d, mid, "pause")!;
    expect(deviceInterface(d, pause).primary.value).toBe("Q043");
    expect(pause.channels).toBe(42);
    const cancel = occupancyAction(d, pause, "stop")!;
    expect(cancel.channels).toBe(42);
    const end = advanceOccupancyState(
      d,
      occupancyAction(d, cancel, "dispense")!,
      9000,
    );
    expect(end.channels).toBe(43);
    expect(end.program).toBe("ticket_ready");
    expect(occupancyAction(d, end, "stop")!.program).toBe("idle");
  });
  it.each([
    "visitor_management_terminal",
    "asset_tracking_tag",
    "asset_tracking_gateway",
  ])("finishes the finite %s sequence once", (id) => {
    const d = device(id);
    const start = occupancyAction(
      d,
      initial(id),
      id === "visitor_management_terminal" ? "test" : "sample",
    )!;
    expect(start.active).toBe(true);
    expect(occupancyAction(d, start, "sample")).toBe(start);
    const end = advanceOccupancyState(d, start, 9000);
    expect(end.channels).toBe(1);
    expect(end.active).toBe(false);
    expect(advanceOccupancyState(d, end, 9000)).toBe(end);
  });
  it("latches an assistance call through acknowledgement until reset", () => {
    const d = device("assistance_call_button");
    let s = advanceOccupancyState(
      d,
      occupancyAction(d, initial(d.id), "alarm")!,
      9000,
    );
    expect(s.alert).toBe(true);
    expect(s.program).toBe("pending");
    s = advanceOccupancyState(d, occupancyAction(d, s, "test")!, 9000);
    expect(s.alert).toBe(true);
    expect(s.program).toBe("acknowledged");
    s = occupancyAction(d, s, "restore")!;
    expect(s.alert).toBe(false);
    expect(s.program).toBe("idle");
  });
  it.each([
    "occupancy_sensor",
    "millimeter_wave_presence_sensor",
    "desk_occupancy_sensor",
    "seat_occupancy_sensor",
    "bed_occupancy_sensor",
  ])("keeps vacant, unknown and unavailable %s feedback distinct", (id) => {
    const d = device(id);
    const off = {
      ...mockEntity,
      entity_id: "binary_sensor.room",
      state: "off",
      attributes: {},
    };
    const vacant = occupancyLive(d, off);
    expect(vacant.known).toBe(true);
    expect(vacant.mode).toBe("room_vacant");
    expect(vacant.metrics).toEqual([]);
    const unknown = { ...off, state: "unknown" };
    expect(occupancyLive(d, unknown).known).toBe(false);
    const unavailable = { ...off, state: "unavailable" };
    const v = occupancyVisualState(
      d,
      entityVisual(unavailable),
      undefined,
      unavailable,
    );
    expect(v.active).toBe(false);
    expect(v.hasTelemetry).toBe(false);
  });
  it("validates integer count units, zero, battery range and explicit RSSI units", () => {
    const d = device("people_counter");
    const zero = {
      ...mockEntity,
      entity_id: "sensor.crossings",
      state: "0",
      attributes: {
        unit_of_measurement: "people",
        battery_level: 0,
        rssi: -58,
        rssi_unit: "dBm",
      },
    };
    const live = occupancyLive(d, zero);
    expect(live.known).toBe(true);
    expect(live.primary!.value).toBe(0);
    expect(live.metrics).toHaveLength(2);
    for (const state of ["", "-1", "1.2", "NaN"]) {
      expect(occupancyLive(d, { ...zero, state }).known).toBe(false);
    }
    expect(
      occupancyLive(d, { ...zero, attributes: { unit_of_measurement: "°C" } })
        .known,
    ).toBe(false);
    expect(
      occupancyLive(d, {
        ...zero,
        attributes: { battery_level: 101, rssi: -58 },
      }).metrics,
    ).toEqual([]);
  });
  it("keeps a reported reservation separate from occupancy and retains acknowledged call feedback", () => {
    const e = {
      ...mockEntity,
      entity_id: "sensor.room_booking",
      state: "reserved",
      attributes: {},
    };
    expect(occupancyLive(device("room_booking_panel"), e).mode).toBe(
      "room_reserved",
    );
    expect(occupancyLive(device("occupancy_sensor"), e).known).toBe(false);
    const ack = { ...e, state: "acknowledged" };
    expect(occupancyLive(device("assistance_call_button"), ack).alert).toBe(
      true,
    );
  });
  it.each([...OCCUPANCY_DEVICES])(
    "keeps connected %s monitoring-only without synthetic results",
    async (id) => {
      const card = await mount(id);
      card.card = { ...card.card, entity: mockEntity.entity_id };
      card.entity = mockEntity;
      await card.updateComplete;
      expect(card.shadowRoot!.querySelector("emad-ui-device")!.disabled).toBe(
        true,
      );
      expect(card.shadowRoot!.querySelector(".room-issued-paper")).toBeNull();
      expect(card.shadowRoot!.querySelector(".room-example-person")).toBeNull();
      if (
        ["visitor_management_terminal", "queue_management_terminal"].includes(
          id,
        )
      ) {
        expect(
          card.shadowRoot!.querySelector(".screen-label")!.textContent,
        ).toBe("—");
      }
    },
  );
  it("settles finite occupancy examples immediately for reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    try {
      const card = await mount("people_counter");
      (
        card.shadowRoot!.querySelector(
          '[data-action="sample"]',
        ) as HTMLButtonElement
      ).click();
      await card.updateComplete;
      await card.updateComplete;
      expect(
        card.shadowRoot!.querySelector(".primary-reading")!.textContent,
      ).toContain("1");
      expect(card.shadowRoot!.querySelector(".room-example-person")).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("cancels the example frame when disabled or disconnected", async () => {
    const request = vi.fn(() => 77);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    try {
      const card = await mount("people_counter");
      (
        card.shadowRoot!.querySelector(
          '[data-action="sample"]',
        ) as HTMLButtonElement
      ).click();
      await card.updateComplete;
      expect(request).toHaveBeenCalled();
      card.disabled = true;
      await card.updateComplete;
      expect(cancel).toHaveBeenCalledWith(77);
      card.remove();
      expect(card.isConnected).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it.each([
    "occupancy_sensor",
    "millimeter_wave_presence_sensor",
    "people_counter",
    "directional_people_counter",
  ])("retains the same person pose when pausing %s", async (id) => {
    let callback: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      callback = fn;
      return 77;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    try {
      const card = await mount(id);
      const button =
        id === "millimeter_wave_presence_sensor"
          ? card.shadowRoot!.querySelector('[data-value="room_moving"]')
          : card.shadowRoot!.querySelector(
              `[data-action="${id === "directional_people_counter" ? "open" : "sample"}"]`,
            );
      (button as HTMLButtonElement).click();
      await card.updateComplete;
      callback!(performance.now() + 900);
      await card.updateComplete;
      const before = card
        .shadowRoot!.querySelector(".room-example-person")!
        .querySelector("polyline")!
        .getAttribute("points");
      (
        card.shadowRoot!.querySelector(
          '[data-action="pause"]',
        ) as HTMLButtonElement
      ).click();
      await card.updateComplete;
      expect(
        card
          .shadowRoot!.querySelector(".room-example-person")
          ?.querySelector("polyline")
          ?.getAttribute("points"),
      ).toBe(before);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("does not display a synthetic duration for a reported room reservation", async () => {
    const card = await mount("room_booking_panel");
    card.card = { ...card.card, entity: "sensor.booking" };
    card.entity = {
      ...mockEntity,
      entity_id: "sensor.booking",
      state: "reserved",
      attributes: {},
    };
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector(".screen-label")!.textContent).toBe(
      "—",
    );
    expect(
      card.shadowRoot!.querySelector(".primary-reading")!.textContent,
    ).toContain("Reserved");
    expect(card.shadowRoot!.querySelector(".metric-grid")).toBeNull();
  });
});

describe("Catalog card state across responsive sizes", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each(DEVICE_CATALOG)(
    "preserves %s controls and local state across extreme card sizes",
    async (device) => {
      vi.stubGlobal(
        "requestAnimationFrame",
        vi.fn(() => 1),
      );
      vi.stubGlobal("cancelAnimationFrame", vi.fn());
      vi.stubGlobal("matchMedia", () => ({ matches: false }));
      const card = await mount(device.id);
      const root = card.shadowRoot!;
      const sent = vi.fn();
      card.addEventListener("emad-device-command", sent);
      const range = root.querySelector<HTMLInputElement>(
        '.specific-controls input[type="range"]:not(:disabled)',
      );
      if (range) {
        const low = Number(range.min || 0);
        const high = Number(range.max || 100);
        const step = Number(range.step || 1);
        range.value = String(Math.min(high, low + step * 2));
        range.dispatchEvent(new Event("input", { bubbles: true }));
        range.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        const buttons = [
          ...root.querySelectorAll<HTMLButtonElement>(
            ".specific-controls button:not(:disabled)",
          ),
        ];
        (
          buttons.find((b) => b.getAttribute("aria-pressed") === "false") ??
          buttons[0]
        )?.click();
      }
      await card.updateComplete;
      await card.updateComplete;
      const controls = () => [
        ...root.querySelectorAll<
          HTMLInputElement | HTMLButtonElement | HTMLSelectElement
        >(
          ".specific-controls input,.specific-controls button,.specific-controls select",
        ),
      ];
      const values = () =>
        controls().map((n) => ({
          value: n.value,
          disabled: n.disabled,
          pressed: n.getAttribute("aria-pressed"),
          checked: n instanceof HTMLInputElement ? n.checked : undefined,
        }));
      const original = controls();
      const state = values();
      for (const [w, h] of [
        [240, 204],
        [1200, 204],
        [240, 1200],
        [1200, 1200],
      ]) {
        card.card = { ...card.card, w, h };
        // Rendering must finish before resizing this same live card again.
        // eslint-disable-next-line no-await-in-loop
        await card.updateComplete;
        expect(controls()).toEqual(original);
        expect(values()).toEqual(state);
        expect(
          root.querySelector('[role="region"]')?.getAttribute("tabindex"),
        ).toBe("0");
        expect(root.querySelector(".primary-reading")).not.toBeNull();
      }
      expect(sent).not.toHaveBeenCalled();
    },
  );
});
