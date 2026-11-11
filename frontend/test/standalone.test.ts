import { customElement } from "../src/platform/element";
import { afterEach, describe, expect, it, vi } from "vitest";
import { panelHass } from "../src/localize";
import {
  closeOwnedDialogs,
  showConfirmationDialog,
} from "../src/platform/dialog";
import { EmadCamera, EmadMenuButton } from "../src/platform/ui";
import type { HomeAssistant, NativeCard } from "../src/platform/types";
import { testEntity } from "./test-entities";
import "../src/index";

const host = (language = "en"): HomeAssistant => ({
  connected: true,
  language,
  states: {},
  entities: {},
  devices: {},
  areas: {},
  services: {},
  localize: vi.fn((key: string) => `native:${key}`),
  formatEntityState: (entity) => entity.state,
  loadFragmentTranslation: vi.fn(async () => undefined),
  connection: { subscribeMessage: vi.fn(async () => () => undefined) },
  callWS: vi.fn(),
  callService: vi.fn(),
});
afterEach(() => {
  document.body.replaceChildren();
  delete window.loadCardHelpers;
  vi.restoreAllMocks();
});

describe("standalone public panel boundary", () => {
  it("tolerates a newer hashed bundle in an already-connected HA tab", () => {
    class First extends HTMLElement {}
    class Updated extends HTMLElement {}
    customElement("emad-qa-upgrade")(First);
    expect(() => customElement("emad-qa-upgrade")(Updated)).not.toThrow();
    expect(customElements.get("emad-qa-upgrade")).toBe(First);
  });

  it("keeps host session and service methods intact without mutating native localization", async () => {
    const hass = host();
    const localize = hass.localize;
    const wrapped = panelHass(hass);
    expect(wrapped).not.toBe(hass);
    expect(hass.localize).toBe(localize);
    expect(wrapped.callService).toBe(hass.callService);
    expect(wrapped.connection).toBe(hass.connection);
    expect(wrapped.states).toBe(hass.states);
    expect(wrapped.localize("ui.panel.emad-dashboard.edit")).toBe(
      "Edit dashboard",
    );
    expect(wrapped.localize("native.title")).toBe("native:native.title");
    await wrapped.loadFragmentTranslation("emad-dashboard");
    expect(hass.loadFragmentTranslation).not.toHaveBeenCalled();
    await wrapped.loadFragmentTranslation("config");
    expect(hass.loadFragmentTranslation).toHaveBeenCalledWith("config");
  });
  it("loads Arabic locally and falls back to English for other languages", () => {
    expect(
      panelHass(host("ar-SA")).localize("ui.panel.emad-dashboard.edit"),
    ).not.toMatch(/Edit/);
    expect(panelHass(host("fr")).localize("ui.panel.emad-dashboard.edit")).toBe(
      "Edit dashboard",
    );
  });
  it("registers its own elements without reserving native Home Assistant names", () => {
    expect(customElements.get("emad-dashboard-panel")).toBeDefined();
    expect(customElements.get("emad-dashboard-view")).toBeDefined();
    for (const name of [
      "ha-panel-emad-dashboard",
      "ha-svg-icon",
      "ha-camera-stream",
      "ha-menu-button",
    ])
      expect(customElements.get(name)).toBeUndefined();
  });
  it("bubbles the native sidebar toggle through the shadow boundary", async () => {
    const menu = new EmadMenuButton();
    menu.label = "Open sidebar";
    document.body.append(menu);
    await menu.updateComplete;
    const listener = vi.fn();
    document.body.addEventListener("hass-toggle-menu", listener, {
      once: true,
    });
    menu.shadowRoot!.querySelector("button")!.click();
    expect(listener).toHaveBeenCalledOnce();
    expect(
      menu.shadowRoot!.querySelector("button")!.getAttribute("aria-label"),
    ).toBe("Open sidebar");
  });
});

describe("dialog lifecycle", () => {
  const open = async () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    });
    const owner = document.createElement("div");
    document.body.append(owner);
    const promise = showConfirmationDialog(owner, {
      title: "Unsaved changes",
      dismissText: "Keep editing",
      confirmText: "Discard",
    });
    const dialog = document.querySelector("emad-ui-confirmation")!;
    await dialog.updateComplete;
    return { owner, promise, dialog };
  };
  it("resolves confirmation and removes the modal", async () => {
    const { promise, dialog } = await open();
    dialog.shadowRoot!.querySelector<HTMLButtonElement>(".confirm")!.click();
    expect(await promise).toBe(true);
    expect(dialog.isConnected).toBe(false);
  });
  it("resolves escape as cancel", async () => {
    const { promise, dialog } = await open();
    dialog
      .shadowRoot!.querySelector("dialog")!
      .dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(await promise).toBe(false);
    expect(dialog.isConnected).toBe(false);
  });
  it("closes pending modals when their panel owner disconnects", async () => {
    const { owner, promise, dialog } = await open();
    closeOwnedDialogs(owner);
    expect(await promise).toBe(false);
    expect(dialog.isConnected).toBe(false);
  });
});

describe("authenticated native camera card adapter", () => {
  it("delegates live video to the host helper and updates the native hass object", async () => {
    const card = Object.assign(document.createElement("div"), { hass: host() });
    const create = vi.fn(() => card);
    window.loadCardHelpers = vi.fn(async () => ({ createCardElement: create }));
    const camera = new EmadCamera();
    camera.hass = host();
    camera.stateObj = testEntity("camera.lobby", "idle");
    document.body.append(camera);
    await camera.updateComplete;
    await Promise.resolve();
    await camera.updateComplete;
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "picture-entity",
        entity: "camera.lobby",
        camera_view: "live",
      }),
    );
    expect(card.hass).toBe(camera.hass);
    expect(camera.shadowRoot!.contains(card)).toBe(true);
    const next = host();
    camera.hass = next;
    await camera.updateComplete;
    expect(card.hass).toBe(next);
  });
  it("does not attach a native card after disconnection", async () => {
    let resolve!: (value: { createCardElement: () => NativeCard }) => void;
    window.loadCardHelpers = () =>
      new Promise((done) => {
        resolve = done;
      });
    const camera = new EmadCamera();
    camera.hass = host();
    camera.stateObj = testEntity("camera.lobby", "idle");
    document.body.append(camera);
    await camera.updateComplete;
    camera.remove();
    const create = vi.fn(() =>
      Object.assign(document.createElement("div"), { hass: host() }),
    );
    resolve({ createCardElement: create });
    await Promise.resolve();
    expect(create).not.toHaveBeenCalled();
  });
  it("uses HA's MJPEG proxy if the stock card helper has not loaded", async () => {
    const camera = new EmadCamera();
    camera.hass = panelHass(host());
    camera.stateObj = testEntity("camera.lobby", "idle", {
      entity_picture: "/api/camera_proxy/camera.lobby?token=qa",
    });
    document.body.append(camera);
    await camera.updateComplete;
    await Promise.resolve();
    await camera.updateComplete;
    expect(camera.shadowRoot!.querySelector("img")!.getAttribute("src")).toBe(
      "/api/camera_proxy_stream/camera.lobby?token=qa",
    );
    const listener = vi.fn();
    document.body.addEventListener("hass-more-info", listener, { once: true });
    camera.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { entityId: "camera.lobby" } }),
    );
  });
  it("shows a safe unavailable state if native helpers are absent", async () => {
    const camera = new EmadCamera();
    camera.hass = panelHass(host());
    camera.stateObj = testEntity("camera.lobby", "idle");
    document.body.append(camera);
    await camera.updateComplete;
    await Promise.resolve();
    await camera.updateComplete;
    expect(camera.shadowRoot!.textContent).toContain("Unavailable");
  });
});
