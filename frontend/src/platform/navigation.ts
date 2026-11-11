import type { PropertyValues } from "lit";
import { closeOwnedDialogs } from "./dialog";

export const PreventUnsavedMixin = (
  superClass: typeof import("lit").LitElement,
) =>
  class extends superClass {
    /** Provided by `DirtyStateProviderMixin`. */
    declare isDirtyState: boolean;

    private _handleClick = async (e: MouseEvent) => {
      // get the right target, otherwise the composedPath would return <home-assistant> in the new event
      const target = e.composedPath()[0];
      if (!isNavigationClick(e)) {
        return;
      }

      const result = await this.promptDiscardChanges();
      if (result) {
        this._removeListeners();
        if (target) {
          const newEvent = new MouseEvent(e.type, e);
          target.dispatchEvent(newEvent);
        }
      }
    };

    private _handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();

    private _removeListeners() {
      window.removeEventListener("click", this._handleClick, true);
      window.removeEventListener("beforeunload", this._handleUnload);
    }

    protected willUpdate(changedProperties: PropertyValues): void {
      super.willUpdate(changedProperties);

      if (this.isDirtyState) {
        window.addEventListener("click", this._handleClick, true);
        window.addEventListener("beforeunload", this._handleUnload);
      } else {
        this._removeListeners();
      }
    }

    public disconnectedCallback(): void {
      super.disconnectedCallback();

      this._removeListeners();
      closeOwnedDialogs(this);
    }

    protected async promptDiscardChanges(): Promise<boolean> {
      return true;
    }
  };

export const isNavigationClick = (e: MouseEvent, preventDefault = true) => {
  // Taken from polymer/pwa-helpers. BSD-3 licensed
  if (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey
  ) {
    return undefined;
  }

  const anchor = e
    .composedPath()
    .find((n) => (n as HTMLElement).tagName === "A") as
    HTMLAnchorElement | undefined;
  if (
    !anchor ||
    anchor.target ||
    anchor.hasAttribute("download") ||
    anchor.getAttribute("rel") === "external"
  ) {
    return undefined;
  }

  let url: URL;
  try {
    // anchor.href is always absolute; an empty or unparseable value throws.
    url = new URL(anchor.href);
  } catch {
    return undefined;
  }

  // Only intercept same-origin links. A different scheme, host, or port is a
  // different origin (e.g. another port like ":8123") and must trigger a full
  // browser navigation instead of an in-app route change. Non-http(s) schemes
  // such as mailto: resolve to a null origin and are excluded here too.
  if (url.origin !== window.location.origin) {
    return undefined;
  }

  if (preventDefault) {
    e.preventDefault();
  }
  return url.pathname + url.search + url.hash;
};

import { tinykeys } from "tinykeys";

/**
 * A function to handle a keyboard shortcut.
 */
export type ShortcutHandler = (event: KeyboardEvent) => void;

/**
 * Configuration for a keyboard shortcut.
 */
export interface ShortcutConfig {
  handler: ShortcutHandler;
  /**
   * If true, allows shortcuts even when text is selected.
   * Default is false to avoid interrupting copy/paste.
   */
  allowWhenTextSelected?: boolean;
  allowInInput?: boolean;
}

/**
 * Register keyboard shortcuts using tinykeys.
 * Automatically blocks shortcuts in input fields and during text selection.
 */
function registerShortcuts(
  shortcuts: Record<string, ShortcutConfig>,
): () => void {
  const wrappedShortcuts: Record<string, ShortcutHandler> = {};

  Object.entries(shortcuts).forEach(([key, config]) => {
    wrappedShortcuts[key] = (event: KeyboardEvent) => {
      if (
        !config.allowInInput &&
        !canOverrideAlphanumericInput(event.composedPath())
      ) {
        return;
      }
      if (!config.allowWhenTextSelected && window.getSelection()?.toString()) {
        return;
      }
      config.handler(event);
    };
  });

  return tinykeys(window, wrappedShortcuts);
}

/**
 * Manages keyboard shortcuts registration and cleanup.
 */
export class ShortcutManager {
  private _disposer?: () => void;

  /**
   * Register keyboard shortcuts.
   * Uses tinykeys syntax: https://github.com/jamiebuilds/tinykeys#usage
   */
  public add(shortcuts: Record<string, ShortcutConfig>) {
    this._disposer?.();
    this._disposer = registerShortcuts(shortcuts);
  }

  /**
   * Remove all registered shortcuts.
   */
  public remove() {
    this._disposer?.();
    this._disposer = undefined;
  }
}

export const canOverrideAlphanumericInput = (composedPath: EventTarget[]) => {
  if (
    composedPath.some(
      (el) =>
        "tagName" in el &&
        (el.tagName === "HA-MENU" || el.tagName === "HA-CODE-EDITOR"),
    )
  ) {
    return false;
  }

  const el = composedPath[0] as Element;

  if (
    (el instanceof HTMLElement && el.isContentEditable) ||
    el.tagName === "SELECT" ||
    el.tagName === "TEXTAREA" ||
    el.parentElement?.tagName === "HA-SELECT" ||
    el.parentElement?.tagName === "HA-DROPDOWN"
  ) {
    return false;
  }

  if (el.tagName !== "INPUT") {
    return true;
  }

  switch ((el as HTMLInputElement).type) {
    case "button":
    case "checkbox":
    case "hidden":
    case "radio":
    case "range":
      return true;
    default:
      return false;
  }
};
