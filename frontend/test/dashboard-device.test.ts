import type { HassEntity } from "home-assistant-js-websocket";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeAssistant } from "../src/platform/types";
import { testEntity as entity } from "./test-entities";
import { EmadDashboardDevice } from "../src/dashboard/emad-ui-device";
import type { DeviceCommand } from "../src/dashboard/dashboard-model";
import "../src/dashboard/emad-ui-device-entities";
import translations from "../src/translations/en.json";

vi.hoisted(() => {
  Object.assign(globalThis, {
    __STATIC_PATH__: "/",
    __BUILD__: "modern",
    __VERSION__: "test",
    __BACKWARDS_COMPAT__: false,
    __SUPERVISOR__: false,
    __NAMESPACE__: "frontend",
  });
});
async function mount(state: HassEntity) {
  const card = new EmadDashboardDevice();
  card.card = {
    id: "test",
    kind: "device",
    entity: state.entity_id,
    x: 0,
    y: 0,
    w: 384,
    h: 408,
  };
  card.entity = state;
  card.localize = (key) =>
    translations.ui.panel["emad-dashboard"][
      key.replace(
        "ui.panel.emad-dashboard.",
        "",
      ) as keyof (typeof translations.ui.panel)["emad-dashboard"]
    ] || "";
  card.formatState = (item) => item.state;
  document.body.append(card);
  await card.updateComplete;
  const sent = vi.fn(
    (event: Event) => (event as CustomEvent<DeviceCommand>).detail,
  );
  card.addEventListener("emad-device-command", sent);
  return { card, sent, root: card.shadowRoot! };
}
afterEach(() => document.body.replaceChildren());
const button = (root: ShadowRoot, label: string) =>
  [...root.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === label,
  )!;

describe("Emad web-style device controls", () => {
  it("sends only reported HVAC modes and fan names from the mode tiles", async () => {
    const { root, sent } = await mount(
      entity("climate.living", "cool", {
        temperature: 23,
        supported_features: 9,
        hvac_modes: ["off", "cool", "heat"],
        fan_mode: "quiet",
        fan_modes: ["quiet", "powerful"],
      }),
    );
    expect(button(root, "Cool").getAttribute("aria-pressed")).toBe("true");
    button(root, "Heat").click();
    expect(sent.mock.results[0].value).toEqual({
      entity: "climate.living",
      service: "set_hvac_mode",
      data: { hvac_mode: "heat" },
    });
    button(root, "powerful").click();
    expect(sent.mock.results[1].value.data).toEqual({ fan_mode: "powerful" });
  });
  it("previews slider movement without sending commands until the value is committed", async () => {
    const { card, root, sent } = await mount(
      entity("light.living", "on", {
        brightness: 184,
        supported_color_modes: ["brightness"],
      }),
    );
    const slider = root.querySelector<HTMLInputElement>('input[type="range"]')!;
    slider.value = "42";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    await card.updateComplete;
    expect(root.querySelector(".light-reading")?.textContent).toContain("42");
    expect(sent).not.toHaveBeenCalled();
    slider.dispatchEvent(new Event("change", { bubbles: true }));
    expect(sent.mock.results[0].value.data).toEqual({ brightness_pct: 42 });
    card.error = "Failed";
    await card.updateComplete;
    expect(root.querySelector(".light-reading")?.textContent).toContain("72");
  });
  it("converts a custom color to native RGB and indicates the actual palette selection", async () => {
    const { root, sent } = await mount(
      entity("light.living", "on", {
        supported_color_modes: ["rgb"],
        rgb_color: [79, 195, 247],
        brightness: 255,
      }),
    );
    expect(
      root
        .querySelector('button[data-color="#4FC3F7"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
    const color = root.querySelector<HTMLInputElement>('input[type="color"]')!;
    color.value = "#ff6b6b";
    color.dispatchEvent(new Event("change", { bubbles: true }));
    expect(sent.mock.results[0].value.data).toEqual({
      rgb_color: [255, 107, 107],
    });
  });
  it("disables commands while editing and does not add unsupported lighting controls", async () => {
    const { card, root, sent } = await mount(
      entity("light.simple", "on", { supported_color_modes: ["onoff"] }),
    );
    expect(root.querySelector('input[type="range"]')).toBeNull();
    expect(root.querySelector('input[type="color"]')).toBeNull();
    card.disabled = true;
    await card.updateComplete;
    const power = root.querySelector<HTMLButtonElement>(".power")!;
    expect(power.disabled).toBe(true);
    power.click();
    expect(sent).not.toHaveBeenCalled();
  });
  it("animates the lock state without implying that an unlocked door is open", async () => {
    const { card, root } = await mount(entity("lock.front", "locked"));
    expect(root.querySelector(".door-locked")).not.toBeNull();
    card.entity = entity("lock.front", "unlocked");
    await card.updateComplete;
    expect(root.querySelector(".door-locked")).toBeNull();
    expect(root.querySelector(".door-open")).toBeNull();
    card.entity = entity("lock.front", "unlocked", { door_state: "open" });
    await card.updateComplete;
    expect(root.querySelector(".door-open")).not.toBeNull();
  });
  it("starts and stops media animation with the reported playback state", async () => {
    const { card, root } = await mount(
      entity("media_player.living", "playing", { supported_features: 1 }),
    );
    expect(root.querySelector(".speaker-scene.playing")).not.toBeNull();
    card.entity = entity("media_player.living", "paused", {
      supported_features: 1,
    });
    await card.updateComplete;
    expect(root.querySelector(".speaker-scene.playing")).toBeNull();
  });
  it("keeps unavailable devices inert and displays no live device animation", async () => {
    const { root, sent } = await mount(
      entity("fan.living", "unavailable", {
        supported_features: 49,
        percentage: 50,
      }),
    );
    expect(root.querySelector(".offline-visual")).not.toBeNull();
    expect(root.querySelector(".spinning")).toBeNull();
    expect(root.querySelector<HTMLButtonElement>(".power")?.disabled).toBe(
      true,
    );
    expect(sent).not.toHaveBeenCalled();
  });
});

describe("Native card functions after resizing", () => {
  it.each([
    entity("light.panel", "on", {
      brightness: 184,
      supported_color_modes: ["brightness"],
    }),
    entity("climate.panel", "cool", {
      temperature: 23,
      min_temp: 16,
      max_temp: 30,
      hvac_modes: ["off", "cool", "heat"],
      supported_features: 9,
    }),
    entity("cover.panel", "open", {
      current_position: 65,
      supported_features: 15,
    }),
    entity("fan.panel", "on", { percentage: 45, supported_features: 51 }),
    entity("switch.panel", "on"),
    entity("vacuum.panel", "docked", {
      battery_level: 87,
      supported_features: 8308,
    }),
    entity("media_player.panel", "playing", {
      volume_level: 0.4,
      supported_features: 16437,
    }),
    entity("button.panel", "2026-11-07T04:00:00Z"),
  ])(
    "keeps $entity_id command payloads and focusable controls intact",
    async (state) => {
      const { card, root, sent } = await mount(state);
      const action = [
        ...root.querySelectorAll<HTMLButtonElement>("button"),
      ].find((b) => !b.disabled)!;
      action.click();
      expect(sent).toHaveBeenCalledOnce();
      const expected = sent.mock.results[0].value;
      sent.mockClear();
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
        expect(root.contains(action)).toBe(true);
        expect(action.disabled).toBe(false);
        action.click();
        expect(sent.mock.results[sent.mock.results.length - 1].value).toEqual(
          expected,
        );
      }
      expect(sent).toHaveBeenCalledTimes(4);
    },
  );
  it("preserves an uncommitted slider preview during a resize and sends it on commit", async () => {
    const { card, root, sent } = await mount(
      entity("light.panel", "on", {
        brightness: 184,
        supported_color_modes: ["brightness"],
      }),
    );
    const range = root.querySelector<HTMLInputElement>('input[type="range"]')!;
    range.value = "42";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await card.updateComplete;
    card.card = { ...card.card, w: 240, h: 204 };
    await card.updateComplete;
    expect(root.querySelector('input[type="range"]')).toBe(range);
    expect(range.value).toBe("42");
    expect(sent).not.toHaveBeenCalled();
    range.dispatchEvent(new Event("change", { bubbles: true }));
    expect(sent.mock.results[0].value.data).toEqual({ brightness_pct: 42 });
  });
});

describe("Home Assistant counterpart controls", () => {
  it("activates a never-pressed button and keeps an unavailable button inert", async () => {
    const { card, root, sent } = await mount(entity("button.start", "unknown"));
    button(root, "Press").click();
    expect(sent.mock.results[0].value.service).toBe("press");
    card.entity = entity("button.start", "unavailable");
    await card.updateComplete;
    expect(root.querySelector(".offline-visual")).not.toBeNull();
  });
  it("renders both targets for a heat/cool thermostat in Fahrenheit", async () => {
    const { card, root, sent } = await mount(
      entity("climate.dual", "heat_cool", {
        supported_features: 2,
        target_temp_low: 66,
        target_temp_high: 76,
        min_temp: 45,
        max_temp: 95,
        target_temp_step: 0.5,
        hvac_modes: ["off", "heat_cool"],
      }),
    );
    card.temperatureUnit = "°F";
    await card.updateComplete;
    const ranges = root.querySelectorAll<HTMLInputElement>(
      'input[type="range"]',
    );
    expect([...ranges].map((e) => e.dataset.field)).toEqual([
      "target_temp_low",
      "target_temp_high",
    ]);
    expect(ranges[0].step).toBe("0.5");
    expect(ranges[0].max).toBe("76");
    ranges[0].value = "68";
    ranges[0].dispatchEvent(new Event("change"));
    expect(sent.mock.results[0].value.data).toEqual({ target_temp_low: 68 });
    expect(root.textContent).toContain("°F");
    expect(root.querySelector(".temperature-value")!.textContent).toContain(
      "66–76",
    );
  });
  it("does not expose advertised fan/climate options without their supported features", async () => {
    const { root } = await mount(
      entity("climate.basic", "heat", {
        supported_features: 1,
        temperature: 23,
        hvac_modes: ["heat"],
        fan_modes: ["high"],
        preset_modes: ["eco"],
        swing_modes: ["on"],
      }),
    );
    expect(button(root, "high")).toBeUndefined();
    expect(root.querySelector("select")).toBeNull();
  });
  it("does not show fan power services without the corresponding native feature", async () => {
    const { root } = await mount(
      entity("fan.speed_only", "on", { supported_features: 1, percentage: 50 }),
    );
    expect(root.querySelector(".power")).toBeNull();
    expect(root.querySelector('input[type="range"]')).not.toBeNull();
  });
  it("supports a tilt-only cover with the native tilt payload", async () => {
    const { root, sent } = await mount(
      entity("cover.tilt", "open", {
        supported_features: 240,
        current_tilt_position: 40,
      }),
    );
    button(root, "Open tilt").click();
    expect(sent.mock.results[0].value.service).toBe("open_cover_tilt");
    const range = root.querySelector<HTMLInputElement>(
      'input[data-field="tilt_position"]',
    )!;
    range.value = "60";
    range.dispatchEvent(new Event("change"));
    expect(sent.mock.results[1].value).toMatchObject({
      service: "set_cover_tilt_position",
      data: { tilt_position: 60 },
    });
  });
  it("can choose color temperature while a dual-mode light currently reports RGB only", async () => {
    const { root, sent } = await mount(
      entity("light.dual", "on", {
        supported_color_modes: ["rgb", "color_temp"],
        rgb_color: [255, 0, 0],
        brightness: 255,
        color_temp_kelvin: null,
        min_color_temp_kelvin: 2000,
        max_color_temp_kelvin: 6500,
      }),
    );
    const range = root.querySelector<HTMLInputElement>(
      'input[data-field="color_temp_kelvin"]',
    )!;
    expect(range.disabled).toBe(false);
    range.value = "4000";
    range.dispatchEvent(new Event("change"));
    expect(sent.mock.results[0].value.data).toEqual({
      color_temp_kelvin: 4000,
    });
  });
  it("requires the supported color-temperature mode even if stale limits remain", async () => {
    const { root } = await mount(
      entity("light.basic", "on", {
        supported_color_modes: ["onoff"],
        min_color_temp_kelvin: 2000,
        max_color_temp_kelvin: 6500,
      }),
    );
    expect(
      root.querySelector('input[data-field="color_temp_kelvin"]'),
    ).toBeNull();
  });
  it("disables actions missing from the connected Home Assistant service registry", async () => {
    const { card, root, sent } = await mount(entity("switch.relay", "off"));
    card.services = {} as HomeAssistant["services"];
    await card.updateComplete;
    root.querySelector<HTMLButtonElement>(".large-power")!.click();
    expect(sent).not.toHaveBeenCalled();
    expect(
      root.querySelector<HTMLButtonElement>(".large-power")!.disabled,
    ).toBe(true);
  });
  it("opens native details for a code-protected lock", async () => {
    const { card, root, sent } = await mount(
      entity("lock.front", "locked", { code_format: "number" }),
    );
    const details = vi.fn();
    card.addEventListener("hass-more-info", details);
    button(root, "Security controls").click();
    expect(details).toHaveBeenCalledOnce();
    expect(sent).not.toHaveBeenCalled();
  });
});

describe("Controls from one registered device", () => {
  async function mountGroup(readOnly = false) {
    const group = document.createElement("emad-ui-device-entities");
    group.card = {
      id: "washer",
      kind: "device",
      deviceId: "washer-device",
      deviceType: "washing_machine",
      entity: "sensor.washer",
      x: 0,
      y: 0,
      w: 384,
      h: 720,
    };
    group.entities = [
      entity("button.start", "unknown", { friendly_name: "Start washer" }),
      entity("select.program", "eco", {
        friendly_name: "Program",
        options: ["eco", "cotton"],
      }),
      entity("sensor.energy", "1.2", {
        friendly_name: "Energy",
        unit_of_measurement: "kWh",
      }),
    ];
    group.localize = (key, values = {}) => {
      let result =
        translations.ui.panel["emad-dashboard"][
          key.replace(
            "ui.panel.emad-dashboard.",
            "",
          ) as keyof (typeof translations.ui.panel)["emad-dashboard"]
        ] || "";
      for (const [k, v] of Object.entries(values)) {
        result = result.replaceAll(`{${k}}`, String(v));
      }
      return result;
    };
    group.readOnly = readOnly;
    document.body.append(group);
    await group.updateComplete;
    const sent = vi.fn(
      (event: Event) => (event as CustomEvent<DeviceCommand>).detail,
    );
    group.addEventListener("emad-device-command", sent);
    const expand = async () => {
      const details = group.shadowRoot!.querySelector("details")!;
      details.open = true;
      details.dispatchEvent(new Event("toggle"));
      await group.updateComplete;
      await Promise.all(
        [...group.shadowRoot!.querySelectorAll("emad-ui-device")].map(
          (child) => child.updateComplete,
        ),
      );
    };
    return { group, sent, expand };
  }
  it("loads controls when expanded and sends the actual related entity target", async () => {
    const { group, sent, expand } = await mountGroup();
    expect(group.shadowRoot!.querySelector("emad-ui-device")).toBeNull();
    await expand();
    const controls = group.shadowRoot!.querySelectorAll("emad-ui-device");
    button(controls[0].shadowRoot!, "Press").click();
    expect(sent.mock.results[0].value).toMatchObject({
      entity: "button.start",
      service: "press",
    });
    const select = controls[1].shadowRoot!.querySelector("select")!;
    select.value = "cotton";
    select.dispatchEvent(new Event("change"));
    expect(sent.mock.results[1].value).toMatchObject({
      entity: "select.program",
      service: "select_option",
      data: { option: "cotton" },
    });
    expect(group.shadowRoot!.textContent).toContain("Energy");
  });
  it("keeps supervisory device entities read-only", async () => {
    const { group, sent, expand } = await mountGroup(true);
    await expand();
    expect(group.shadowRoot!.querySelector("emad-ui-device")).toBeNull();
    expect(sent).not.toHaveBeenCalled();
  });
  it("retains pending input and control identity when the containing card resizes", async () => {
    const { group, expand } = await mountGroup();
    await expand();
    const child = group.shadowRoot!.querySelectorAll("emad-ui-device")[1];
    const select = child.shadowRoot!.querySelector("select")!;
    group.style.width = "240px";
    group.card = { ...group.card, w: 240, h: 204 };
    await group.updateComplete;
    await child.updateComplete;
    expect(child.shadowRoot!.querySelector("select")).toBe(select);
    expect(select.value).toBe("eco");
  });
});
