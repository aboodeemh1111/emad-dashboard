import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HaPanelEmadDashboard } from "../src/dashboard/emad-dashboard-view";
import { hasCardCollisions } from "../src/dashboard/dashboard-model";
import type {
  DashboardCard,
  DashboardSnapshot,
} from "../src/dashboard/dashboard-model";
import type { HomeAssistant } from "../src/platform/types";
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
let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;
beforeEach(() => {
  frames = new Map();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(++nextFrame, cb);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {
        return undefined;
      }
      disconnect() {
        return undefined;
      }
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {
      return undefined;
    },
    removeEventListener() {
      return undefined;
    },
  }));
});
afterEach(() => {
  document.body.replaceChildren();
  window.history.replaceState(null, "", "#");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const textCard = (
  id: string,
  x = 0,
  y = 0,
  w = 384,
  h = 348,
): DashboardCard => ({ id, kind: "text", title: id, text: id, x, y, w, h });
const defaults = () => [
  textCard("a"),
  textCard("b", 408),
  textCard("c", 408, 360),
];
async function mount(cards = defaults(), language = "en", edit = true) {
  const snapshot: DashboardSnapshot = {
    revision: 1,
    config: {
      version: 1,
      views: [
        { id: "home", name: "Home", cards },
        { id: "other", name: "Other", cards: [] },
      ],
    },
  };
  const c = new HaPanelEmadDashboard();
  const strings = (language === "ar" ? ar : en).ui.panel["emad-dashboard"];
  const localize = (
    key: string,
    values: Record<string, string | number> = {},
  ) => {
    let text =
      strings[
        key.replace("ui.panel.emad-dashboard.", "") as keyof typeof strings
      ] || key;
    for (const [k, v] of Object.entries(values)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
    return text;
  };
  const save = vi.fn(
    async (message: { config: DashboardSnapshot["config"] }) => ({
      revision: 2,
      config: message.config,
    }),
  );
  c.hass = {
    connected: true,
    language,
    user: { is_admin: true },
    states: {},
    entities: {},
    devices: {},
    areas: {},
    panels: {},
    services: {},
    localize,
    translationMetadata: {
      translations: { en: { isRTL: false }, ar: { isRTL: true } },
    },
    loadFragmentTranslation: async () => undefined,
    connection: {
      subscribeMessage: async (fn: (s: DashboardSnapshot) => void) => {
        fn(structuredClone(snapshot));
        return () => undefined;
      },
    },
    callWS: save,
  } as unknown as HomeAssistant;
  document.body.append(c);
  await c.updateComplete;
  await Promise.resolve();
  await c.updateComplete;
  await c.updateComplete;
  const click = async (key: keyof typeof strings) => {
    const button = [
      ...c.shadowRoot!.querySelectorAll<HTMLButtonElement>("button"),
    ].find(
      (b) =>
        b.textContent?.trim() === strings[key] ||
        b.getAttribute("aria-label") === strings[key],
    );
    expect(button, key).toBeDefined();
    button!.click();
    await c.updateComplete;
  };
  if (edit) await click("edit");
  return { c, click, save, snapshot };
}
function handle(c: HaPanelEmadDashboard, id = "a", resize = false) {
  const b = c.shadowRoot!.querySelector<HTMLButtonElement>(
    `button.${resize ? "resize" : "drag"}[data-card="${id}"]`,
  )!;
  b.setPointerCapture = vi.fn();
  b.hasPointerCapture = () => true;
  b.releasePointerCapture = vi.fn();
  return b;
}
function pointer(
  b: HTMLElement,
  type: string,
  x = 0,
  y = 0,
  id = 1,
  shiftKey = false,
) {
  b.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      pointerId: id,
      button: 0,
      clientX: x,
      clientY: y,
      shiftKey,
    }),
  );
}
function flush() {
  const pending = [...frames.values()];
  frames.clear();
  for (const fn of pending) fn(performance.now() + 16);
}
function boxes(c: HaPanelEmadDashboard): DashboardCard[] {
  return [...c.shadowRoot!.querySelectorAll<HTMLElement>("section.card")].map(
    (el) => {
      const pos = el.style.transform.match(
        /translate3d\((-?[\d.]+)px,\s*([\d.]+)px/,
      )!;
      const rtl = c.hass.language === "ar";
      return textCard(
        el.dataset.cardId!,
        Number(pos[1]) * (rtl ? -1 : 1),
        Number(pos[2]),
        parseFloat(el.style.width),
        parseFloat(el.style.height),
      );
    },
  );
}
describe("Dashboard card gestures", () => {
  it("follows the pointer without grid stepping and previews displaced neighbors, then commits one undo step", async () => {
    const { c, click, save } = await mount();
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 197);
    flush();
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")!.x).toBe(197);
    expect(boxes(c).find((x) => x.id === "b")!.y).toBe(360);
    expect(c.shadowRoot!.querySelector(".drop-placeholder")).not.toBeNull();
    expect(save).not.toHaveBeenCalled();
    pointer(b, "pointerup", 197);
    await c.updateComplete;
    const result = boxes(c);
    expect(result.find((x) => x.id === "a")!.x).toBe(192);
    expect(hasCardCollisions(result)).toBe(false);
    await click("undo");
    expect(boxes(c)).toEqual(defaults());
    expect(
      c.shadowRoot!.querySelector('[role="status"]')!.textContent,
    ).toContain(en.ui.panel["emad-dashboard"].layout_undone);
    const undo = c.shadowRoot!.querySelector<HTMLButtonElement>(
      `button[aria-label="${en.ui.panel["emad-dashboard"].undo}"]`,
    )!;
    expect(undo.disabled).toBe(true);
    await click("redo");
    expect(boxes(c)).toEqual(result);
  });
  it("flushes a final pointer position even when no animation frame ran before release", async () => {
    const { c } = await mount();
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 250);
    pointer(b, "pointerup", 408);
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")!.x).toBe(408);
    expect(hasCardCollisions(boxes(c))).toBe(false);
    expect(frames.size).toBe(0);
  });
  it("does not make a click or small pointer jitter into an undoable drag", async () => {
    const { c } = await mount();
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 1, 1);
    flush();
    pointer(b, "pointerup", 1, 1);
    await c.updateComplete;
    expect(boxes(c)).toEqual(defaults());
    expect(c.shadowRoot!.querySelector(".drop-placeholder")).toBeNull();
  });
  it.each(["pointercancel", "lostpointercapture", "escape", "blur"])(
    "restores all card positions on %s and leaves no pending frame",
    async (event) => {
      const { c, save } = await mount();
      const b = handle(c);
      pointer(b, "pointerdown");
      pointer(b, "pointermove", 408);
      flush();
      await c.updateComplete;
      pointer(b, "pointermove", 500);
      if (event === "escape") {
        b.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            composed: true,
          }),
        );
      } else if (event === "blur") window.dispatchEvent(new Event("blur"));
      else pointer(b, event, 408);
      await c.updateComplete;
      expect(boxes(c)).toEqual(defaults());
      expect(frames.size).toBe(0);
      expect(save).not.toHaveBeenCalled();
    },
  );
  it("ignores other pointers during an active gesture", async () => {
    const { c } = await mount();
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 408, 0, 2);
    flush();
    pointer(b, "pointerup", 408, 0, 2);
    await c.updateComplete;
    expect(boxes(c)).toEqual(defaults());
    pointer(b, "pointerup", 408);
    await c.updateComplete;
    expect(hasCardCollisions(boxes(c))).toBe(false);
  });
  it("reflows neighbors while resizing and keeps the result within the canvas", async () => {
    const { c } = await mount();
    const b = handle(c, "a", true);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 408, 372);
    flush();
    pointer(b, "pointerup", 408, 372);
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")).toMatchObject({
      w: 792,
      h: 720,
    });
    expect(hasCardCollisions(boxes(c))).toBe(false);
  });
  it("rejects an impossible drop instead of clipping at the canvas end", async () => {
    const initial = [
      textCard("a", 0, 0, 1200, 1200),
      textCard("b", 0, 20000, 1200, 1200),
    ];
    const { c } = await mount(initial);
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 0, 20000);
    flush();
    await c.updateComplete;
    expect(
      c.shadowRoot!.querySelector(".drop-placeholder.blocked"),
    ).not.toBeNull();
    pointer(b, "pointerup", 0, 20000);
    await c.updateComplete;
    expect(boxes(c)).toEqual(initial);
    expect(
      c.shadowRoot!.querySelector('[role="status"]')!.textContent,
    ).toContain(en.ui.panel["emad-dashboard"].layout_full);
  });
  it("moves in the correct physical direction in Arabic and preserves collision spacing", async () => {
    const { c } = await mount(defaults(), "ar");
    const b = handle(c);
    pointer(b, "pointerdown", 1000);
    pointer(b, "pointerup", 592);
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")!.x).toBe(408);
    expect(hasCardCollisions(boxes(c))).toBe(false);
    expect(
      c.shadowRoot!.querySelector('[role="status"]')!.textContent,
    ).not.toMatch(/layout_|\{x\}|\{y\}/);
  });
  it("routes keyboard movement and numeric settings through the same collision rules", async () => {
    const { c } = await mount([textCard("a"), textCard("b", 396)]);
    const b = handle(c);
    b.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")!.x).toBe(12);
    expect(hasCardCollisions(boxes(c))).toBe(false);
    const input = c.shadowRoot!.querySelector<HTMLInputElement>(
      'input[data-dimension="h"]',
    )!;
    input.value = "720";
    input.dispatchEvent(new Event("change"));
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")!.h).toBe(720);
    expect(hasCardCollisions(boxes(c))).toBe(false);
  });
  it("preserves custom dimensions while duplicating a card", async () => {
    const { c, click } = await mount([textCard("a", 0, 0, 792, 720)]);
    await click("duplicate");
    const result = boxes(c);
    expect(result).toHaveLength(2);
    expect(result.every((x) => x.w === 792 && x.h === 720)).toBe(true);
    expect(hasCardCollisions(result)).toBe(false);
  });
  it("repairs old overlaps for display and only persists them on explicit save", async () => {
    const { c, save, snapshot, click } = await mount([
      textCard("a"),
      textCard("b"),
    ]);
    expect(hasCardCollisions(boxes(c))).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(snapshot.config.views[0].cards[1].y).toBe(0);
    expect(
      c.shadowRoot!.querySelector('[role="status"]')!.textContent,
    ).toContain(en.ui.panel["emad-dashboard"].layout_repaired);
    await click("save");
    expect(save).toHaveBeenCalledOnce();
    expect(hasCardCollisions(save.mock.calls[0][0].config.views[0].cards)).toBe(
      false,
    );
  });
  it("cancels pointer work when the panel is disconnected", async () => {
    const { c } = await mount();
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointermove", 408);
    expect(frames.size).toBe(1);
    c.remove();
    expect(frames.size).toBe(0);
    expect(b.releasePointerCapture).toHaveBeenCalledOnce();
  });
  it("uses Shift for a pixel-precise drop while still making room for neighbors", async () => {
    const { c } = await mount();
    const b = handle(c);
    pointer(b, "pointerdown");
    pointer(b, "pointerup", 197, 0, 1, true);
    await c.updateComplete;
    expect(boxes(c).find((x) => x.id === "a")!.x).toBe(197);
    expect(hasCardCollisions(boxes(c))).toBe(false);
  });
  it("keeps all 17 catalog additions at their final height without overlap", async () => {
    const { c, click } = await mount();
    await click("catalog");
    c.shadowRoot!.querySelector("emad-ui-device-library")!.dispatchEvent(
      new CustomEvent("emad-catalog-system", {
        detail: { category: "cleaning" },
        bubbles: true,
        composed: true,
      }),
    );
    await c.updateComplete;
    expect(boxes(c)).toHaveLength(17);
    expect(boxes(c).every((x) => x.h === 720)).toBe(true);
    expect(hasCardCollisions(boxes(c))).toBe(false);
  });
  it("preserves a card's dimensions and ID when moving it to another view", async () => {
    const { c, click } = await mount([textCard("a", 0, 0, 792, 720)]);
    await click("settings");
    const label = [...c.shadowRoot!.querySelectorAll("label")].find((x) =>
      x.textContent?.includes(en.ui.panel["emad-dashboard"].move_to_view),
    )!;
    const select = label.querySelector("select")!;
    select.value = "other";
    select.dispatchEvent(new Event("change"));
    await c.updateComplete;
    c.shadowRoot!.querySelector<HTMLButtonElement>(
      'nav button[data-view="other"]',
    )!.click();
    await c.updateComplete;
    expect(boxes(c)).toEqual([textCard("a", 0, 0, 792, 720)]);
  });
  it("scrolls the containing panel at the edge and accounts for scroll distance without a new pointer move", async () => {
    const { c } = await mount();
    c.style.overflowY = "auto";
    const bounds = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1200,
      bottom: 700,
      width: 1200,
      height: 700,
      toJSON: () => ({}),
    };
    vi.spyOn(c, "getBoundingClientRect").mockReturnValue(bounds);
    vi.spyOn(
      c.shadowRoot!.querySelector(".canvas-viewport")!,
      "getBoundingClientRect",
    ).mockReturnValue(bounds);
    const b = handle(c);
    pointer(b, "pointerdown", 100, 100);
    pointer(b, "pointermove", 100, 650);
    flush();
    await c.updateComplete;
    expect(c.scrollTop).toBeGreaterThan(0);
    expect(boxes(c).find((x) => x.id === "a")!.y).toBeGreaterThanOrEqual(550);
    pointer(b, "pointercancel", 100, 650);
    await c.updateComplete;
    expect(frames.size).toBe(0);
    expect(boxes(c)).toEqual(defaults());
  });
});

describe("Wall-panel viewport adaptation", () => {
  it.each([320, 480, 576, 800, 1024, 1199, 1200])(
    "reflows at %i pixels without shrinking the device UI or saving a new layout",
    async (width) => {
      let resize: ResizeObserverCallback | undefined;
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: ResizeObserverCallback) {
            resize = callback;
          }
          observe() {
            return undefined;
          }
          disconnect() {
            return undefined;
          }
        },
      );
      const { c, save, snapshot } = await mount(defaults(), "en", false);
      const first = c.shadowRoot!.querySelector("emad-ui-device");
      expect(resize).toBeDefined();
      resize!(
        [{ contentRect: { width } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
      flush();
      await c.updateComplete;
      const canvas = c.shadowRoot!.querySelector<HTMLElement>(".canvas")!;
      expect(canvas.classList.contains("fluid")).toBe(width < 1200);
      expect(canvas.style.transform).toBe(width < 1200 ? "" : "scale(1)");
      expect(c.shadowRoot!.querySelector("emad-ui-device")).toBe(first);
      expect(c.shadowRoot!.querySelectorAll("section.card")).toHaveLength(3);
      expect(save).not.toHaveBeenCalled();
      expect(snapshot.config.views[0].cards).toEqual(defaults());
    },
  );
});

describe("Home Assistant device binding and dispatch", () => {
  const bindingCard = (): DashboardCard => ({
    id: "washer",
    kind: "device",
    deviceType: "washing_machine",
    x: 0,
    y: 0,
    w: 384,
    h: 720,
  });
  const state = (
    id: string,
    value: string,
    attributes: Record<string, unknown> = {},
  ) => ({
    entity_id: id,
    state: value,
    attributes,
    last_changed: "2026-11-07T00:00:00Z",
    last_updated: "2026-11-07T00:00:00Z",
    context: { id: "test", user_id: null, parent_id: null },
  });
  async function boundPanel(edit = true) {
    const result = await mount([bindingCard()], "en", edit);
    const { c } = result;
    const callService = vi.fn(async () => undefined);
    c.hass = {
      ...c.hass,
      states: {
        "sensor.washer": state("sensor.washer", "running"),
        "select.program": state("select.program", "eco", {
          options: ["eco", "cotton"],
        }),
        "button.start": state("button.start", "unknown"),
        "switch.other": state("switch.other", "on"),
      },
      entities: {
        "sensor.washer": { device_id: "washer-device" },
        "select.program": { device_id: "washer-device" },
        "button.start": { device_id: "washer-device" },
        "switch.other": { device_id: "other-device" },
      },
      devices: {
        "washer-device": { id: "washer-device", name: "Laundry washer" },
        "other-device": { id: "other-device", name: "Other device" },
      },
      services: {
        button: { press: {} },
        select: { select_option: {} },
        switch: { turn_off: {} },
      },
      callService,
      formatEntityState: (entity: { state: string }) => entity.state,
    } as unknown as HomeAssistant;
    await c.updateComplete;
    return { ...result, callService };
  }
  async function chooseDevice(c: HaPanelEmadDashboard) {
    const select = c.shadowRoot!.querySelector<HTMLSelectElement>(
      `select[aria-label="${en.ui.panel["emad-dashboard"].ha_bind_device}"]`,
    )!;
    expect(select).not.toBeNull();
    select.value = "washer-device";
    select.dispatchEvent(new Event("change"));
    await c.updateComplete;
  }
  it("saves the actual registered device and primary entity, including undo/redo", async () => {
    const { c, click, save } = await boundPanel();
    await click("settings");
    await chooseDevice(c);
    const primary = [...c.shadowRoot!.querySelectorAll("label")]
      .find((label) =>
        label.textContent?.includes(en.ui.panel["emad-dashboard"].catalog_bind),
      )!
      .querySelector("select")!;
    expect(primary.value).toBe("sensor.washer");
    await click("undo");
    await click("redo");
    await click("save");
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0].config.views[0].cards[0]).toMatchObject({
      deviceId: "washer-device",
      entity: "sensor.washer",
    });
  });
  it("dispatches related controls only to the selected physical device", async () => {
    const { c, click, callService } = await boundPanel();
    await click("settings");
    await chooseDevice(c);
    await click("save");
    const catalog = c.shadowRoot!.querySelector("emad-ui-catalog-device")!;
    catalog.dispatchEvent(
      new CustomEvent("emad-device-command", {
        bubbles: true,
        composed: true,
        detail: { entity: "button.start", service: "press" },
      }),
    );
    await Promise.resolve();
    await c.updateComplete;
    expect(callService).toHaveBeenCalledWith("button", "press", {
      entity_id: "button.start",
    });
    callService.mockClear();
    catalog.dispatchEvent(
      new CustomEvent("emad-device-command", {
        bubbles: true,
        composed: true,
        detail: { entity: "switch.other", service: "turn_off" },
      }),
    );
    await Promise.resolve();
    expect(callService).not.toHaveBeenCalled();
  });
  it("revalidates changed program options and shows service failures", async () => {
    const { c, click, callService } = await boundPanel();
    await click("settings");
    await chooseDevice(c);
    await click("save");
    const catalog = c.shadowRoot!.querySelector("emad-ui-catalog-device")!;
    const send = (option: string) =>
      catalog.dispatchEvent(
        new CustomEvent("emad-device-command", {
          bubbles: true,
          composed: true,
          detail: {
            entity: "select.program",
            service: "select_option",
            data: { option },
          },
        }),
      );
    send("removed_program");
    await Promise.resolve();
    expect(callService).not.toHaveBeenCalled();
    callService.mockRejectedValueOnce(new Error("Service failed"));
    send("cotton");
    await Promise.resolve();
    await Promise.resolve();
    await c.updateComplete;
    expect(callService).toHaveBeenCalledWith("select", "select_option", {
      entity_id: "select.program",
      option: "cotton",
    });
    expect(catalog.relatedErrors["select.program"]).toBe(
      en.ui.panel["emad-dashboard"].command_failed,
    );
  });
});
