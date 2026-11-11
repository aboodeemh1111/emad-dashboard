import { customElement } from "../platform/element";
import {
  mdiPlus,
  mdiPencilOutline,
  mdiViewDashboardOutline,
  mdiUndo,
  mdiRedo,
  mdiContentCopy,
  mdiClose,
  mdiDrag,
  mdiArrowBottomRight,
} from "@mdi/js";
import type { UnsubscribeFunc } from "home-assistant-js-websocket";
import type { PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import type { LocalizeFunc } from "../platform/types";
import { ShortcutManager } from "../platform/navigation";
import { computeRTLDirection } from "../platform/runtime";
import "../platform/ui";
import "../platform/ui";
import "../platform/ui";
import "../platform/ui";
import type { HomeAssistant, PanelInfo, Route } from "../platform/types";
import "./emad-ui-device";
import "./emad-ui-catalog-device";
import {
  counterpartEntity,
  deviceEntities,
  primaryDeviceEntity,
  cardOwnsEntity,
  catalogAllowsCommand,
  prepareEntityCommand,
  withTemperatureUnit,
} from "./home-assistant-compat";
import "./emad-ui-device-library";
import {
  DEVICE_CATALOG,
  catalogDevice,
  categoryNameKey,
  deviceNameKey,
} from "./device-catalog";
import "../platform/ui";
import "../platform/emad-ui-isometric-scene";
import { dashboardIsometricStyles } from "./dashboard-design-styles";
import { PreventUnsavedMixin } from "../platform/navigation";
import { showConfirmationDialog } from "../platform/dialog";
import {
  CANVAS_WIDTH,
  GRID,
  SUPPORTED_DOMAINS,
  cloneConfig,
  domainOf,
  emptyDashboard,
  entitiesForArea,
  hasCardCollisions,
  resolveCardLayout,
  moveCard,
  placeCard,
  uid,
} from "./dashboard-model";
import type {
  CardKind,
  DashboardTextKey,
  DashboardCard,
  DashboardConfig,
  DashboardSnapshot,
  DeviceCommand,
} from "./dashboard-model";

@customElement("emad-dashboard-view")
export class HaPanelEmadDashboard extends PreventUnsavedMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public narrow = false;
  @property({ attribute: false }) public route!: Route;
  @property({ attribute: false }) public panel!: PanelInfo;
  @state() public isDirtyState = false;
  @state() private _saved: DashboardConfig = emptyDashboard();
  @state() private _draft?: DashboardConfig;
  @state() private _revision = 0;
  @state() private _viewId = "home";
  @state() private _loaded = false;
  @state() private _ready = false;
  @state() private _saving = false;
  @state() private _error = "";
  @state() private _conflict = false;
  @state() private _library = window.location.hash === "#library";
  @state() private _search = "";
  @state() private _area = "";
  @state() private _selected = "";
  @state() private _history: DashboardConfig[] = [];
  @state() private _future: DashboardConfig[] = [];
  @state() private _width = CANVAS_WIDTH;
  @state() private _now = new Date();
  @state() private _busy = new Set<string>();
  @state() private _deviceErrors: Record<string, string> = {};
  @state() private _viewName = "";
  @state() private _kiosk = new URLSearchParams(window.location.search).has(
    "kiosk",
  );
  @query(".canvas-viewport") private _viewport?: HTMLElement;
  private _observer?: ResizeObserver;
  private _resizeFrame?: number;
  private _clock?: number;
  private _subscription?: Promise<UnsubscribeFunc>;
  private _generation = 0;
  private _shortcuts = new ShortcutManager();
  @state() private _layoutMessage = "";
  @state() private _dragState?: {
    id: string;
    resize: boolean;
    floating: DashboardCard;
    candidate: DashboardCard;
    cards?: DashboardCard[];
    valid: boolean;
  };
  private _moveFrame?: number;
  private _gesture?: {
    card: DashboardCard;
    cards: DashboardCard[];
    view: string;
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
    shift: boolean;
    resize: boolean;
    moved: boolean;
    target: HTMLElement;
    pointerId: number;
    scroll: HTMLElement;
    scrollTop: number;
    scale: number;
    direction: number;
    lastFrame: number;
  };

  private _t = (
    key: DashboardTextKey,
    values?: Record<string, string | number>,
  ) =>
    (this.hass.localize as LocalizeFunc<string>)(
      `ui.panel.emad-dashboard.${key}`,
      values,
    );
  private get _config() {
    return this._draft ?? this._saved;
  }
  private get _view() {
    const view =
      this._config.views.find((v) => v.id === this._viewId) ??
      this._config.views[0];
    // Repair the display of older overlapping layouts without writing storage.
    return !this._draft && hasCardCollisions(view.cards)
      ? { ...view, cards: resolveCardLayout(view.cards) ?? view.cards }
      : view;
  }
  private get _canEdit() {
    return (
      this.hass?.user?.is_admin &&
      !new URLSearchParams(window.location.search).has("noedit")
    );
  }
  private get _mobile() {
    return this._width < 600;
  }
  private get _flowLayout() {
    return this._mobile || (!this._draft && this._width < CANVAS_WIDTH);
  }
  private get _flowColumns() {
    return this._mobile
      ? 1
      : Math.min(3, Math.max(1, Math.floor((this._width + 18) / 298)));
  }
  private get _scale() {
    return this._mobile ? 1 : Math.min(1, this._width / CANVAS_WIDTH);
  }

  public connectedCallback() {
    super.connectedCallback();
    this._clock = window.setInterval(() => {
      this._now = new Date();
    }, 30000);
    this._shortcuts.add({
      e: {
        handler: () => {
          if (this._canEdit && !this._draft && !this._kiosk) this._edit();
        },
      },
      "$mod+z": {
        handler: (ev) => {
          if (this._draft) {
            ev.preventDefault();
            this._undo();
          }
        },
      },
      "$mod+shift+z": {
        handler: (ev) => {
          if (this._draft) {
            ev.preventDefault();
            this._redo();
          }
        },
      },
    });
    if (this.hasUpdated) {
      this._observe();
      void this._connect();
    }
  }
  public disconnectedCallback() {
    this._cancelGesture();
    super.disconnectedCallback();
    this._generation++;
    this._subscription
      ?.then((unsubscribe) => unsubscribe())
      .catch(() => undefined);
    this._subscription = undefined;
    this._observer?.disconnect();
    window.cancelAnimationFrame(this._resizeFrame ?? 0);
    window.clearInterval(this._clock);
    this._shortcuts.remove();
  }
  protected willUpdate(changed: PropertyValues) {
    this.isDirtyState = !!this._draft;
    super.willUpdate(changed);
  }
  protected promptDiscardChanges(): Promise<boolean> {
    if (this._saving) return Promise.resolve(false);
    return showConfirmationDialog(this, {
      title: this._t("leave_title"),
      text: this._t("leave_hint"),
      confirmText: this._t("discard"),
      dismissText: this._t("keep_editing"),
    });
  }
  protected firstUpdated() {
    this._observe();
  }
  protected updated(changed: PropertyValues) {
    if (changed.has("hass") && this.hass) {
      if (!this.hass.connected) this._cancelGesture();
      const previous = changed.get("hass") as HomeAssistant | undefined;
      if (!previous || previous.connection !== this.hass.connection) {
        void this._connect();
      }
      if (previous?.language !== this.hass.language) {
        void this.hass
          .loadFragmentTranslation("emad-dashboard")
          .then(() => {
            this._ready = true;
            this.requestUpdate();
          })
          .catch(() => {
            this._error = this._t("load_failed");
          });
      }
    }
    if (!this._observer && this._viewport) this._observe();
  }
  private _observe() {
    if (!this._viewport) return;
    this._observer?.disconnect();
    this._observer = new ResizeObserver(([entry]) => {
      window.cancelAnimationFrame(this._resizeFrame ?? 0);
      // Apply layout changes outside the observer's delivery cycle.
      this._resizeFrame = window.requestAnimationFrame(() => {
        if (this._width !== entry.contentRect.width) this._cancelGesture();
        this._width = entry.contentRect.width;
      });
    });
    this._observer.observe(this._viewport);
  }
  private async _connect() {
    const generation = ++this._generation;
    this._subscription
      ?.then((unsubscribe) => unsubscribe())
      .catch(() => undefined);
    this._subscription = undefined;
    try {
      // Subscribing sends the initial snapshot too; there is no get/subscribe race.
      const subscription =
        this.hass.connection.subscribeMessage<DashboardSnapshot>(
          (snapshot) => {
            if (generation !== this._generation) return;
            if (this._draft && snapshot.revision !== this._revision) {
              this._conflict = true;
              return;
            }
            this._saved = snapshot.config;
            this._revision = snapshot.revision;
            this._loaded = true;
            this._error = "";
            const requested = window.location.hash.slice(1);
            if (
              !this._draft &&
              this._saved.views.some((view) => view.id === requested)
            ) {
              this._viewId = requested;
            }
          },
          { type: "emad_dashboard/dashboard/subscribe" },
        );
      this._subscription = subscription;
      await subscription;
    } catch {
      if (generation === this._generation) this._error = this._t("load_failed");
    }
  }
  private _edit() {
    if (!this._canEdit || !this._loaded) return;
    const draft = cloneConfig(this._saved);
    let repaired = false;
    for (const view of draft.views) {
      if (hasCardCollisions(view.cards)) {
        const cards = resolveCardLayout(view.cards);
        if (cards) {
          view.cards = cards;
          repaired = true;
        }
      }
    }
    this._draft = draft;
    this._layoutMessage = repaired ? this._t("layout_repaired") : "";
    this._history = [];
    this._future = [];
    this._conflict = false;
  }
  private _change(update: (config: DashboardConfig) => void) {
    if (!this._draft || this._saving) return;
    const next = cloneConfig(this._draft);
    update(next);
    if (JSON.stringify(next) === JSON.stringify(this._draft)) return;
    this._history = [...this._history.slice(-49), cloneConfig(this._draft)];
    this._future = [];
    this._draft = next;
  }
  private _undo() {
    this._cancelGesture();
    if (!this._draft || !this._history.length || this._saving) return;
    this._future = [...this._future, this._draft];
    this._draft = this._history[this._history.length - 1];
    this._history = this._history.slice(0, -1);
    this._layoutMessage = this._t("layout_undone");
  }
  private _redo() {
    this._cancelGesture();
    if (!this._draft || !this._future.length || this._saving) return;
    this._history = [...this._history, this._draft];
    this._draft = this._future[this._future.length - 1];
    this._future = this._future.slice(0, -1);
    this._layoutMessage = this._t("layout_redone");
  }
  private _cancel() {
    this._cancelGesture();
    this._draft = undefined;
    this._selected = "";
    this._error = "";
    this._conflict = false;
    void this._connect();
  }
  private async _save() {
    if (!this._draft || this._saving || this._conflict) return;
    this._cancelGesture();
    if (this._draft.views.some((v) => hasCardCollisions(v.cards))) {
      this._layoutMessage = this._t("layout_full");
      return;
    }
    this._saving = true;
    try {
      const snapshot = await this.hass.callWS<DashboardSnapshot>({
        type: "emad_dashboard/dashboard/save",
        revision: this._revision,
        config: this._draft,
      });
      this._saved = snapshot.config;
      this._revision = snapshot.revision;
      this._draft = undefined;
      this._selected = "";
      this._error = "";
      this._conflict = false;
    } catch (error: unknown) {
      if ((error as { code?: string }).code === "conflict") {
        this._conflict = true;
      } else this._error = this._t("save_failed");
    } finally {
      this._saving = false;
    }
  }
  private _switchView(id: string) {
    this._cancelGesture();
    this._viewId = id;
    this._selected = "";
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`,
    );
  }
  private _add(kind: CardKind, entity?: string, deviceType?: string) {
    if (this._view.cards.length >= 100) {
      this._error = this._t("card_limit");
      return;
    }
    const viewId = this._view.id;
    this._change((config) => {
      const cards = config.views.find((view) => view.id === viewId)!.cards;
      const card = placeCard(
        cards,
        kind,
        entity,
        deviceType ? { w: 384, h: 720 } : undefined,
      );
      if (!card) {
        this._layoutMessage = this._t("layout_full");
        return;
      }
      if (deviceType) card.deviceType = deviceType;
      cards.push(card);
      this._selected = card.id;
    });
  }
  private _openLibrary() {
    this._cancelGesture();
    this._library = true;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#library`,
    );
  }
  private _closeLibrary() {
    this._library = false;
    const selected = this._selected;
    this._switchView(this._view.id);
    this._selected = selected;
  }
  private _addCatalog(event: CustomEvent<{ deviceType: string }>) {
    if (
      !this._canEdit ||
      !this._loaded ||
      this._saving ||
      !catalogDevice(event.detail.deviceType)
    ) {
      return;
    }
    if (!this._draft) this._edit();
    this._add("device", undefined, event.detail.deviceType);
    this._closeLibrary();
  }
  private _addCatalogSystem(event: CustomEvent<{ category: string }>) {
    if (!this._canEdit || !this._loaded || this._saving) return;
    if (this._config.views.length >= 30) {
      this._error = this._t("catalog_view_limit");
      return;
    }
    const devices = DEVICE_CATALOG.filter(
      (item) => item.category === event.detail.category,
    );
    if (!devices.length) return;
    if (!this._draft) this._edit();
    const id = uid();
    this._change((config) => {
      const cards: DashboardCard[] = [];
      for (const device of devices) {
        const card = placeCard(cards, "device", undefined, { w: 384, h: 720 });
        if (card) cards.push({ ...card, deviceType: device.id });
      }
      config.views.push({
        id,
        name: this._t(categoryNameKey(event.detail.category)),
        cards,
      });
    });
    this._library = false;
    this._switchView(id);
  }
  private _bindCatalogEntity(event: Event) {
    const selected = this._view.cards.find(
      (card) => card.id === this._selected,
    );
    const device = catalogDevice(selected?.deviceType);
    const id = (event.currentTarget as HTMLSelectElement).value;
    if (
      id &&
      (!device ||
        !this.hass.states[id] ||
        (!selected?.deviceId &&
          !counterpartEntity(device, this.hass.states[id])) ||
        (selected?.deviceId &&
          this.hass.entities[id]?.device_id !== selected.deviceId))
    ) {
      return;
    }
    this._cardChange(this._selected, {
      entity: id || undefined,
      ...(!id ? { deviceId: undefined } : {}),
    });
  }
  private _bindHomeAssistantDevice(event: Event) {
    const selected = this._view.cards.find(
      (card) => card.id === this._selected,
    );
    const device = catalogDevice(selected?.deviceType);
    const id = (event.currentTarget as HTMLSelectElement).value;
    if (!device || !selected) return;
    if (!id) {
      this._cardChange(selected.id, { deviceId: undefined });
      return;
    }
    const entities = deviceEntities(id, this.hass.states, this.hass.entities);
    const primary =
      entities.find(
        (entity) =>
          entity.entity_id === selected.entity &&
          counterpartEntity(device, entity),
      ) ?? primaryDeviceEntity(device, entities);
    if (
      primary &&
      this.hass.devices[id] &&
      !this.hass.devices[id].disabled_by
    ) {
      this._cardChange(selected.id, {
        deviceId: id,
        entity: primary.entity_id,
      });
    }
  }
  private _addView() {
    if (!this._viewName.trim() || this._config.views.length >= 30) return;
    const id = uid();
    this._change((config) =>
      config.views.push({ id, name: this._viewName.trim(), cards: [] }),
    );
    this._viewName = "";
    this._switchView(id);
  }
  private _fillRoom() {
    if (!this._area || !this._draft) return;
    const ids = entitiesForArea(this.hass, this._area).filter(
      (id) => !this._view.cards.some((card) => card.entity === id),
    );
    const viewId = this._view.id;
    this._change((config) => {
      const cards = config.views.find((view) => view.id === viewId)!.cards;
      for (const id of ids.slice(0, 100 - cards.length)) {
        const card = placeCard(cards, "device", id);
        if (!card) {
          this._layoutMessage = this._t("layout_full");
          break;
        }
        cards.push(card);
      }
    });
  }
  private _cardChange(id: string, patch: Partial<DashboardCard>) {
    this._change((config) => {
      const view = config.views.find((v) => v.cards.some((c) => c.id === id));
      const card = view?.cards.find((c) => c.id === id);
      if (!view || !card) return;
      const candidate = { ...card, ...patch };
      const geometry = ["x", "y", "w", "h"].some((k) => k in patch);
      const cards = geometry
        ? resolveCardLayout(view.cards, candidate)
        : view.cards.map((c) => (c.id === id ? candidate : c));
      if (!cards) {
        this._layoutMessage = this._t("layout_full");
        return;
      }
      view.cards = cards;
      if (geometry) this._announcePlacement(candidate);
    });
  }
  private _remove(id: string) {
    const viewId = this._view.id;
    this._change((config) => {
      const view = config.views.find((item) => item.id === viewId)!;
      view.cards = view.cards.filter((card) => card.id !== id);
    });
    this._selected = "";
  }
  private _duplicate(card: DashboardCard) {
    if (this._view.cards.length >= 100) return;
    const viewId = this._view.id;
    this._change((config) => {
      const cards = config.views.find((view) => view.id === viewId)!.cards;
      const placement = placeCard(cards, card.kind, card.entity, card);
      if (!placement) {
        this._layoutMessage = this._t("layout_full");
        return;
      }
      cards.push({ ...card, ...placement });
      this._selected = placement.id;
    });
  }
  private _begin(event: PointerEvent, card: DashboardCard, resize = false) {
    if (
      !this._draft ||
      this._saving ||
      this._mobile ||
      event.button !== 0 ||
      this._gesture
    ) {
      return;
    }
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.focus({ preventScroll: true });
    const scroll = this._scrollContainer();
    this._selected = card.id;
    this._layoutMessage = "";
    this._gesture = {
      card: { ...card },
      view: this._view.id,
      cards: this._view.cards,
      x: event.clientX,
      y: event.clientY,
      pointerX: event.clientX,
      pointerY: event.clientY,
      shift: event.shiftKey,
      resize,
      moved: false,
      target,
      pointerId: event.pointerId,
      scroll,
      scrollTop: scroll.scrollTop,
      scale: this._scale,
      direction: computeRTLDirection(this.hass) === "rtl" ? -1 : 1,
      lastFrame: performance.now(),
    };
    target.setPointerCapture(event.pointerId);
    scroll.addEventListener("scroll", this._queueGesture, { passive: true });
    window.addEventListener("blur", this._cancelGesture);
  }
  private _scrollContainer(): HTMLElement {
    let node: Element | null = this._viewport ?? this;
    while (node) {
      if (
        node instanceof HTMLElement &&
        /auto|scroll/.test(getComputedStyle(node).overflowY)
      ) {
        return node;
      }
      const root = node.getRootNode();
      node =
        node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    }
    return (document.scrollingElement ??
      document.documentElement) as HTMLElement;
  }
  private _move(event: PointerEvent) {
    const g = this._gesture;
    if (!g || g.pointerId !== event.pointerId) return;
    g.pointerX = event.clientX;
    g.pointerY = event.clientY;
    g.shift = event.shiftKey;
    this._queueGesture();
  }
  private _queueGesture = () => {
    if (!this._gesture || this._moveFrame !== undefined) return;
    this._moveFrame = window.requestAnimationFrame(this._gestureFrame);
  };
  private _gestureFrame = (time: number) => {
    this._moveFrame = undefined;
    const g = this._gesture;
    if (!g) return;
    const dt = Math.min(32, Math.max(0, time - g.lastFrame));
    g.lastFrame = time;
    // The first coalesced pointer move can already be at the scrolling edge.
    g.moved ||=
      Math.hypot(
        g.pointerX - g.x,
        g.pointerY - g.y + g.scroll.scrollTop - g.scrollTop,
      ) >= 4;
    const viewport = this._viewport?.getBoundingClientRect();
    let scrolled = false;
    if (
      g.moved &&
      viewport &&
      g.pointerX >= viewport.left - 24 &&
      g.pointerX <= viewport.right + 24
    ) {
      const page = g.scroll === document.scrollingElement;
      const bounds = page
        ? { top: 0, bottom: window.innerHeight }
        : g.scroll.getBoundingClientRect();
      const top = Math.max(0, bounds.top) + 56;
      const bottom = Math.min(window.innerHeight, bounds.bottom) - 104;
      const edge = 64;
      const velocity =
        g.pointerY < top + edge
          ? -Math.min(1, (top + edge - g.pointerY) / edge)
          : g.pointerY > bottom - edge
            ? Math.min(1, (g.pointerY - bottom + edge) / edge)
            : 0;
      const previous = g.scroll.scrollTop;
      g.scroll.scrollTop += (velocity * 650 * dt) / 1000;
      scrolled = g.scroll.scrollTop !== previous;
    }
    this._previewGesture();
    if (scrolled) this._queueGesture();
  };
  private _previewGesture() {
    const g = this._gesture;
    if (!g || !this._draft) return;
    const screenY = g.pointerY - g.y + g.scroll.scrollTop - g.scrollTop;
    g.moved ||= Math.hypot(g.pointerX - g.x, screenY) >= 4;
    if (!g.moved) return;
    const dx = ((g.pointerX - g.x) / g.scale) * g.direction;
    const dy = screenY / g.scale;
    const floating = moveCard(g.card, dx, dy, g.resize, true);
    const candidate = moveCard(g.card, dx, dy, g.resize, g.shift);
    const old = this._dragState;
    const unchanged =
      old &&
      (["x", "y", "w", "h"] as const).every(
        (k) => old.candidate[k] === candidate[k],
      );
    const cards = unchanged ? old.cards : resolveCardLayout(g.cards, candidate);
    this._dragState = {
      id: g.card.id,
      resize: g.resize,
      floating,
      candidate,
      cards,
      valid: !!cards,
    };
  }
  private _end(event: PointerEvent) {
    const g = this._gesture;
    if (!g || event.pointerId !== g.pointerId) return;
    if (event.type !== "pointerup") {
      this._cancelGesture();
      return;
    }
    g.pointerX = event.clientX;
    g.pointerY = event.clientY;
    g.shift = event.shiftKey;
    this._previewGesture();
    const preview = this._dragState;
    this._cancelGesture();
    if (!g.moved || !preview) return;
    if (!preview.cards) {
      this._layoutMessage = this._t("layout_full");
      return;
    }
    this._change((config) => {
      config.views.find((v) => v.id === g.view)!.cards = preview.cards!;
    });
    this._announcePlacement(preview.candidate);
  }
  private _cancelGesture = () => {
    const g = this._gesture;
    this._gesture = undefined;
    window.cancelAnimationFrame(this._moveFrame ?? 0);
    this._moveFrame = undefined;
    this._dragState = undefined;
    if (g) {
      g.scroll.removeEventListener("scroll", this._queueGesture);
      if (g.target.hasPointerCapture(g.pointerId)) {
        g.target.releasePointerCapture(g.pointerId);
      }
    }
    window.removeEventListener("blur", this._cancelGesture);
  };
  private _gestureKey(event: KeyboardEvent) {
    if (event.key === "Escape" && this._gesture) {
      event.preventDefault();
      event.stopPropagation();
      this._cancelGesture();
      this._layoutMessage = this._t("layout_cancelled");
    }
  }
  private _announcePlacement(card: DashboardCard) {
    this._layoutMessage = this._t("layout_placed", { x: card.x, y: card.y });
  }
  private _cardStyle(card: DashboardCard) {
    if (this._flowLayout) {
      return {
        height: `${card.h}px`,
        minHeight: "204px",
        gridColumn: `span ${Math.min(this._flowColumns, Math.max(1, Math.round(card.w / 384)))}`,
      };
    }
    const c = this._dragState?.id === card.id ? this._dragState.floating : card;
    const direction = computeRTLDirection(this.hass) === "rtl" ? -1 : 1;
    return {
      width: `${c.w}px`,
      height: `${c.h}px`,
      transform: `translate3d(${direction * c.x}px, ${c.y}px, 0)`,
    };
  }
  private _nudge(event: KeyboardEvent, card: DashboardCard, resize = false) {
    if (this._gesture) return;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    this._selected = card.id;
    const [x, y] = directions[event.key];
    const delta = event.shiftKey ? 1 : GRID;
    this._cardChange(
      card.id,
      moveCard(
        card,
        x * delta * (computeRTLDirection(this.hass) === "rtl" ? -1 : 1),
        y * delta,
        resize,
        event.shiftKey,
      ),
    );
  }
  private async _command(event: CustomEvent<DeviceCommand>) {
    const { entity, service, data } = event.detail;
    if (this._draft || !this.hass.connected || this._busy.has(entity)) return;
    const domain = domainOf(entity);
    const entityState = this.hass.states[entity];
    const owner = this._view.cards.find(
      (card) =>
        cardOwnsEntity(card, entity, this.hass.states, this.hass.entities) &&
        entityState &&
        catalogAllowsCommand(card, entityState),
    );
    const payload =
      entityState && prepareEntityCommand(entityState, service, data);
    if (!owner || !payload || !this.hass.services[domain]?.[service]) {
      this._deviceErrors = {
        ...this._deviceErrors,
        [entity]: this._t("unsupported"),
      };
      return;
    }
    this._busy = new Set([...this._busy, entity]);
    this._deviceErrors = { ...this._deviceErrors, [entity]: "" };
    try {
      await this.hass.callService(domain, service, {
        ...payload,
        entity_id: entity,
      });
    } catch {
      this._deviceErrors = {
        ...this._deviceErrors,
        [entity]: this._t("command_failed"),
      };
    } finally {
      this._busy = new Set([...this._busy].filter((id) => id !== entity));
    }
  }
  private _areaName(entity: string) {
    const entry = this.hass.entities[entity];
    const id =
      entry?.area_id ??
      (entry?.device_id
        ? this.hass.devices[entry.device_id]?.area_id
        : undefined);
    return id ? this.hass.areas[id]?.name || "" : "";
  }
  private _eventCard(event: Event) {
    return this._view.cards.find(
      (card) => card.id === (event.currentTarget as HTMLElement).dataset.card,
    )!;
  }
  private _toggleKiosk() {
    this._cancelGesture();
    this._kiosk = !this._kiosk;
  }
  private _viewClick(event: Event) {
    this._switchView((event.currentTarget as HTMLElement).dataset.view!);
  }
  private _beginMove(event: PointerEvent) {
    this._begin(event, this._eventCard(event));
  }
  private _beginResize(event: PointerEvent) {
    this._begin(event, this._eventCard(event), true);
  }
  private _moveKey(event: KeyboardEvent) {
    this._nudge(event, this._eventCard(event));
  }
  private _resizeKey(event: KeyboardEvent) {
    this._nudge(event, this._eventCard(event), true);
  }
  private _selectCard(event: Event) {
    this._selected = this._eventCard(event).id;
  }
  private _duplicateClick(event: Event) {
    this._duplicate(this._eventCard(event));
  }
  private _removeClick(event: Event) {
    this._remove(this._eventCard(event).id);
  }
  private _clearSelection() {
    this._selected = "";
  }
  private _contentChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    this._cardChange(this._selected, { [input.dataset.field!]: input.value });
  }
  private _dimensionChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selected = this._view.cards.find(
      (card) => card.id === this._selected,
    );
    const key = input.dataset.dimension as "x" | "y" | "w" | "h";
    const raw = Number(input.value);
    if (!selected || !Number.isFinite(raw)) return;
    const delta = raw - selected[key];
    this._cardChange(
      selected.id,
      moveCard(
        selected,
        key === "x" || key === "w" ? delta : 0,
        key === "y" || key === "h" ? delta : 0,
        key === "w" || key === "h",
        true,
      ),
    );
  }
  private _moveToView(event: Event) {
    const target = (event.currentTarget as HTMLSelectElement).value;
    const selected = this._view.cards.find(
      (card) => card.id === this._selected,
    );
    if (!selected || target === this._view.id) return;
    if (
      this._config.views.find((view) => view.id === target)!.cards.length >= 100
    ) {
      this._error = this._t("card_limit");
      return;
    }
    const from = this._view.id;
    this._change((config) => {
      const cards = config.views.find((v) => v.id === target)!.cards;
      const placement = placeCard(
        cards,
        selected.kind,
        selected.entity,
        selected,
      );
      if (!placement) {
        this._layoutMessage = this._t("layout_full");
        return;
      }
      config.views.find((v) => v.id === from)!.cards = config.views
        .find((v) => v.id === from)!
        .cards.filter((c) => c.id !== selected.id);
      cards.push({ ...selected, x: placement.x, y: placement.y });
    });
    this._selected = "";
  }
  private _addWidget(event: Event) {
    this._add((event.currentTarget as HTMLElement).dataset.kind as CardKind);
  }
  private _searchChange(event: Event) {
    this._search = (event.currentTarget as HTMLInputElement).value;
  }
  private _areaChange(event: Event) {
    this._area = (event.currentTarget as HTMLSelectElement).value;
  }
  private _addDevice(event: Event) {
    this._add("device", (event.currentTarget as HTMLElement).dataset.entity!);
  }
  private _renameView(event: Event) {
    const name = (event.currentTarget as HTMLInputElement).value;
    const id = this._view.id;
    this._change((config) => {
      config.views.find((view) => view.id === id)!.name = name;
    });
  }
  private _viewNameChange(event: Event) {
    this._viewName = (event.currentTarget as HTMLInputElement).value;
  }
  private _viewNameKey(event: KeyboardEvent) {
    if (event.key === "Enter") this._addView();
  }
  private _removeView() {
    const id = this._view.id;
    this._change((config) => {
      config.views = config.views.filter((view) => view.id !== id);
    });
    this._switchView(this._config.views[0].id);
  }
  protected render() {
    if (!this.hass || !this._ready)
      return html`<emad-ui-spinner></emad-ui-spinner>`;
    if (this._library) {
      return html`<div class="dashboard" dir=${computeRTLDirection(this.hass)}>
        ${this._error ? html`<emad-ui-alert alert-type="error">${this._error}</emad-ui-alert>` : nothing}
        <emad-ui-device-library
          .localize=${this.hass.localize}
          .language=${this.hass.language}
          .canEdit=${!!this._canEdit && this._loaded && !this._saving}
          @emad-catalog-back=${this._closeLibrary}
          @emad-catalog-add=${this._addCatalog}
          @emad-catalog-system=${this._addCatalogSystem}
        ></emad-ui-device-library>
      </div>`;
    }
    const edit = !!this._draft;
    const layout = this._dragState?.cards ?? this._view.cards;
    const cards = this._flowLayout
      ? [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
      : layout;
    const height = Math.max(
      520,
      ...cards.map((card) => card.y + card.h + 24),
      this._dragState
        ? this._dragState.floating.y + this._dragState.floating.h + 24
        : 0,
    );
    return html`<div
      class="dashboard ${edit ? "editing" : ""} ${this._kiosk ? "kiosk" : ""}"
      dir=${computeRTLDirection(this.hass)}
    >
      <header class="topbar">
        <div class="brand">
          <emad-ui-menu-button
            .label=${this._t("toggle_sidebar")}
          ></emad-ui-menu-button
          ><span class="brand-icon"><emad-ui-logo></emad-ui-logo></span>
          <div>
            <p class="eyebrow">${this._t("product")}</p>
            <h1>${this._t("title")}</h1>
          </div>
        </div>
        <div class="top-actions">
          ${!this._kiosk ? html`<button @click=${this._openLibrary}>${this._t("catalog")}</button>` : nothing}
          <span class="connection ${this.hass.connected ? "online" : ""}"
            ><i></i
            >${this._t(this.hass.connected ? "local_connected" : "disconnected")}</span
          >${!edit && this._loaded && this._canEdit && !this._kiosk ? html`<button class="primary" @click=${this._edit}><emad-ui-svg-icon .path=${mdiPencilOutline}></emad-ui-svg-icon>${this._t("edit")}</button>` : nothing}${!edit ? html`<button class="kiosk-button" @click=${this._toggleKiosk}>${this._t(this._kiosk ? "exit_kiosk" : "kiosk")}</button>` : nothing}
        </div>
      </header>
      <div class="intro">
        <div class="intro-copy">
          <p class="eyebrow">${this._t(edit ? "design_mode" : "your_space")}</p>
          <h2>${this._view.name || this._t("home")}</h2>
          <p>${this._t(edit ? "edit_hint" : "overview_hint")}</p>
        </div>
        <emad-ui-isometric-scene></emad-ui-isometric-scene>
        <span class="date"
          >${this._now.toLocaleDateString(this.hass.language, { weekday: "short", day: "numeric", month: "short" })}</span
        >
      </div>
      <nav aria-label=${this._t("views")}>
        ${this._config.views.map((view) => html`<button class=${view.id === this._view.id ? "selected-view" : ""} aria-current=${view.id === this._view.id ? "page" : "false"} data-view=${view.id} @click=${this._viewClick}>${view.name || this._t("home")}<span>${view.cards.length}</span></button>`)}
      </nav>
      ${!this.hass.connected ? html`<emad-ui-alert alert-type="warning">${this._t("offline_hint")}</emad-ui-alert>` : nothing}
      ${this._error ? html`<emad-ui-alert alert-type="error">${this._error}<button slot="action" @click=${this._connect}>${this._t("retry")}</button></emad-ui-alert>` : nothing}
      ${this._conflict ? html`<emad-ui-alert alert-type="warning">${this._t("conflict")}<button slot="action" @click=${this._cancel}>${this._t("reload")}</button></emad-ui-alert>` : nothing}
      <div class="workspace">
        <main>
          ${
            edit
              ? html`<p class="layout-help" id="layout-help">
                    ${this._t(this._mobile ? "layout_mobile_hint" : "layout_hint")}
                  </p>
                  <p
                    class="layout-feedback"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    ${this._layoutMessage}
                  </p>`
              : nothing
          }
          <div class="canvas-viewport">
            <div
              class="canvas ${this._mobile ? "mobile" : ""} ${this._flowLayout ? "fluid" : ""}"
              @keydown=${this._gestureKey}
              style=${styleMap(this._flowLayout ? { "--emad-flow-columns": String(this._flowColumns) } : { width: `${CANVAS_WIDTH}px`, height: `${height}px`, transform: `scale(${this._scale})`, marginBottom: `${height * (this._scale - 1)}px` })}
            >
              ${this._dragState ? html`<div class="drop-placeholder ${this._dragState.valid ? "" : "blocked"}" aria-hidden="true" style=${styleMap({ width: `${this._dragState.candidate.w}px`, height: `${this._dragState.candidate.h}px`, transform: `translate3d(${(computeRTLDirection(this.hass) === "rtl" ? -1 : 1) * this._dragState.candidate.x}px, ${this._dragState.candidate.y}px, 0)` })}></div>` : nothing}
              ${repeat(
                cards,
                (card) => card.id,
                (card) =>
                  html`<section
                    class="card ${edit && this._selected === card.id ? "selected" : ""} ${this._dragState?.id === card.id ? "dragging" : ""}"
                    data-card-id=${card.id}
                    style=${styleMap(this._cardStyle(card))}
                  >
                    ${
                      edit
                        ? html`<div class="card-toolbar">
                            <button
                              class="drag"
                              ?disabled=${this._mobile || this._saving}
                              aria-describedby="layout-help"
                              aria-label=${this._t("move")}
                              data-card=${card.id}
                              @pointerdown=${this._beginMove}
                              @pointermove=${this._move}
                              @pointerup=${this._end}
                              @pointercancel=${this._end}
                              @lostpointercapture=${this._end}
                              @keydown=${this._moveKey}
                            >
                              <emad-ui-svg-icon
                                .path=${mdiDrag}
                              ></emad-ui-svg-icon></button
                            ><button
                              aria-label=${this._t("settings")}
                              data-card=${card.id}
                              @click=${this._selectCard}
                            >
                              <emad-ui-svg-icon
                                .path=${mdiPencilOutline}
                              ></emad-ui-svg-icon></button
                            ><button
                              aria-label=${this._t("duplicate")}
                              data-card=${card.id}
                              @click=${this._duplicateClick}
                            >
                              <emad-ui-svg-icon
                                .path=${mdiContentCopy}
                              ></emad-ui-svg-icon></button
                            ><button
                              aria-label=${this._t("remove")}
                              data-card=${card.id}
                              @click=${this._removeClick}
                            >
                              <emad-ui-svg-icon
                                .path=${mdiClose}
                              ></emad-ui-svg-icon>
                            </button>
                          </div>`
                        : nothing
                    }
                    ${
                      card.deviceType && catalogDevice(card.deviceType)
                        ? html`<emad-ui-catalog-device
                            .card=${card}
                            .cameraHass=${this.hass}
                            .relatedEntities=${deviceEntities(card.deviceId, this.hass.states, this.hass.entities).filter((entity) => entity.entity_id !== card.entity)}
                            .relatedBusy=${this._busy}
                            .relatedErrors=${this._deviceErrors}
                            .entity=${withTemperatureUnit(card.entity ? this.hass.states[card.entity] : undefined, this.hass.config?.unit_system?.temperature || "°C")}
                            .localize=${this.hass.localize}
                            .formatState=${this.hass.formatEntityState}
                            .language=${this.hass.language}
                            .services=${this.hass.services}
                            .temperatureUnit=${this.hass.config?.unit_system?.temperature || "°C"}
                            dir=${computeRTLDirection(this.hass)}
                            .disabled=${edit || !this.hass.connected}
                            .busy=${card.entity ? this._busy.has(card.entity) : false}
                            .error=${card.entity ? this._deviceErrors[card.entity] || "" : ""}
                            @emad-device-command=${this._command}
                          ></emad-ui-catalog-device>`
                        : html`<emad-ui-device
                            .card=${card}
                            .cameraHass=${this.hass}
                            .entity=${withTemperatureUnit(card.entity ? this.hass.states[card.entity] : undefined, this.hass.config?.unit_system?.temperature || "°C")}
                            .localize=${this.hass.localize}
                            .formatState=${this.hass.formatEntityState}
                            .area=${card.entity ? this._areaName(card.entity) : ""}
                            .language=${this.hass.language}
                            .services=${this.hass.services}
                            .temperatureUnit=${this.hass.config?.unit_system?.temperature || "°C"}
                            .disabled=${edit || !this.hass.connected}
                            .busy=${card.entity ? this._busy.has(card.entity) : false}
                            .error=${card.entity ? this._deviceErrors[card.entity] || "" : ""}
                            .now=${this._now}
                            @emad-device-command=${this._command}
                          ></emad-ui-device>`
                    }
                    ${edit && !this._mobile ? html`<button class="resize" aria-label=${this._t("resize")} data-card=${card.id} @pointerdown=${this._beginResize} @pointermove=${this._move} @pointerup=${this._end} @pointercancel=${this._end} @lostpointercapture=${this._end} @keydown=${this._resizeKey}><emad-ui-svg-icon .path=${mdiArrowBottomRight}></emad-ui-svg-icon></button>` : nothing}
                  </section>`,
              )}
              ${
                !cards.length
                  ? html`<div class="empty">
                      <span class="empty-icon"
                        ><emad-ui-svg-icon
                          .path=${mdiViewDashboardOutline}
                        ></emad-ui-svg-icon
                      ></span>
                      <h3>${this._t("empty_title")}</h3>
                      <p>
                        ${this._t(this._canEdit ? "empty_hint" : "empty_viewer")}
                      </p>
                      ${!edit && this._canEdit && !this._kiosk ? html`<button class="primary" @click=${this._edit}><emad-ui-svg-icon .path=${mdiPlus}></emad-ui-svg-icon>${this._t("build_dashboard")}</button>` : nothing}
                    </div>`
                  : nothing
              }
            </div>
          </div>
        </main>
        ${edit ? this._renderEditor() : nothing}
      </div>
      ${
        edit
          ? html`<div
              class="edit-bar"
              role="toolbar"
              aria-label=${this._t("editor")}
            >
              <span class="edit-label">${this._t("unsaved")}</span
              ><button
                aria-label=${this._t("undo")}
                ?disabled=${!this._history.length || this._saving}
                @click=${this._undo}
              >
                <emad-ui-svg-icon .path=${mdiUndo}></emad-ui-svg-icon></button
              ><button
                aria-label=${this._t("redo")}
                ?disabled=${!this._future.length || this._saving}
                @click=${this._redo}
              >
                <emad-ui-svg-icon .path=${mdiRedo}></emad-ui-svg-icon></button
              ><button ?disabled=${this._saving} @click=${this._cancel}>
                ${this._t("cancel")}</button
              ><button
                class="primary"
                ?disabled=${this._saving || this._conflict || !this.hass.connected}
                @click=${this._save}
              >
                ${this._t(this._saving ? "saving" : "save")}
              </button>
            </div>`
          : html`<div class="page-footer">
              <span>Emad</span><span>${this._t("footer")}</span>
            </div>`
      }
    </div>`;
  }
  private _renderEditor() {
    const selected = this._view.cards.find(
      (card) => card.id === this._selected,
    );
    const entities = Object.values(this.hass.states)
      .filter(
        (entity) =>
          SUPPORTED_DOMAINS.has(domainOf(entity.entity_id)) &&
          (!this._area ||
            this._areaName(entity.entity_id) ===
              this.hass.areas[this._area]?.name) &&
          `${entity.attributes.friendly_name || ""} ${entity.entity_id}`
            .toLowerCase()
            .includes(this._search.toLowerCase()),
      )
      .sort((a, b) =>
        String(a.attributes.friendly_name || a.entity_id).localeCompare(
          String(b.attributes.friendly_name || b.entity_id),
          this.hass.language,
        ),
      );
    const selectedDevice = catalogDevice(selected?.deviceType);
    const eligibleDevices = selectedDevice
      ? Object.values(this.hass.devices).filter(
          (device) =>
            !device.disabled_by &&
            deviceEntities(device.id, this.hass.states, this.hass.entities)
              .length > 0,
        )
      : [];
    return html`<aside aria-label=${this._t("editor")}>
      <div class="editor-heading">
        <span class="eyebrow">${this._t("build_your_view")}</span>
        <h3>${this._t(selected ? "card_settings" : "add_card")}</h3>
      </div>
      ${
        selected
          ? html`<div class="editor-section">
              <button class="back" @click=${this._clearSelection}>
                ← ${this._t("all_cards")}</button
              ><label
                >${this._t("card_title")}<input
                  .value=${selected.title || ""}
                  maxlength="120"
                  data-field="title"
                  @change=${this._contentChange} /></label
              >${selected.kind === "text" ? html`<label>${this._t("content")}<textarea rows="5" maxlength="4000" .value=${selected.text || ""} data-field="text" @change=${this._contentChange}></textarea></label>` : nothing}
              ${
                selected.deviceType
                  ? html`<p class="muted">
                        ${this._t("catalog_type")}:
                        ${catalogDevice(selected.deviceType) ? this._t(deviceNameKey(catalogDevice(selected.deviceType)!)) : selected.deviceType}
                      </p>
                      <label
                        >${this._t("ha_bind_device")}<select
                          aria-label=${this._t("ha_bind_device")}
                          .value=${selected.deviceId || ""}
                          @change=${this._bindHomeAssistantDevice}
                        >
                          <option value="">
                            ${this._t("ha_single_entity")}
                          </option>
                          ${selected.deviceId && !eligibleDevices.some((device) => device.id === selected.deviceId) ? html`<option value=${selected.deviceId}>${selected.deviceId}</option>` : nothing}
                          ${eligibleDevices.map((device) => html`<option value=${device.id} .selected=${selected.deviceId === device.id}>${device.name_by_user || device.name || device.model || device.id}</option>`)}
                        </select></label
                      >
                      <p class="muted">${this._t("ha_device_binding_hint")}</p>
                      <label
                        >${this._t("catalog_bind")}<select
                          .value=${selected.entity || ""}
                          @change=${this._bindCatalogEntity}
                        >
                          <option value="">
                            ${this._t("catalog_example")}
                          </option>
                          ${selected.entity && !this.hass.states[selected.entity] ? html`<option value=${selected.entity}>${selected.entity}</option>` : nothing}
                          ${Object.values(this.hass.states)
                            .filter(
                              (entity) =>
                                entity.entity_id === selected.entity ||
                                (selected.deviceId
                                  ? deviceEntities(
                                      selected.deviceId,
                                      this.hass.states,
                                      this.hass.entities,
                                    ).some(
                                      (point) =>
                                        point.entity_id === entity.entity_id,
                                    )
                                  : !!selectedDevice &&
                                    counterpartEntity(selectedDevice, entity)),
                            )
                            .map(
                              (entity) =>
                                html`<option
                                  value=${entity.entity_id}
                                  .selected=${selected.entity === entity.entity_id}
                                >
                                  ${entity.attributes.friendly_name || entity.entity_id}
                                  · ${entity.entity_id}
                                </option>`,
                            )}
                        </select></label
                      >
                      <p class="muted">${this._t("catalog_binding_hint")}</p>
                      ${!selected.deviceId && selected.entity && this.hass.states[selected.entity] && selectedDevice && !counterpartEntity(selectedDevice, this.hass.states[selected.entity]) ? html`<p role="status" class="muted">${this._t("ha_incompatible_entity")}</p>` : nothing}`
                  : nothing
              }
              <div class="dimensions">
                ${(["x", "y", "w", "h"] as const).map((key) => html`<label>${this._t(key)}<input type="number" min=${key === "w" ? 240 : key === "h" ? 204 : 0} max=${key === "y" ? 20000 : key === "x" ? 960 : 1200} step="12" .value=${String(selected[key])} data-dimension=${key} @change=${this._dimensionChange} /></label>`)}
              </div>
              ${
                this._config.views.length > 1
                  ? html`<label
                      >${this._t("move_to_view")}<select
                        .value=${this._view.id}
                        @change=${this._moveToView}
                      >
                        ${this._config.views.map((view) => html`<option value=${view.id} .selected=${view.id === this._view.id}>${view.name || this._t("home")}</option>`)}
                      </select></label
                    >`
                  : nothing
              }
            </div>`
          : nothing
      }
      <div class="editor-section">
        <button class="fill-room" @click=${this._openLibrary}>
          ${this._t("catalog")} · ${DEVICE_CATALOG.length}
        </button>
        <div class="widget-types">
          <button data-kind="clock" @click=${this._addWidget}>
            + ${this._t("clock")}</button
          ><button data-kind="text" @click=${this._addWidget}>
            + ${this._t("note")}
          </button>
        </div>
        <label
          >${this._t("search_devices")}<input
            type="search"
            .value=${this._search}
            @input=${this._searchChange} /></label
        ><label
          >${this._t("room")}<select
            .value=${this._area}
            @change=${this._areaChange}
          >
            <option value="">${this._t("all_rooms")}</option>
            ${Object.values(this.hass.areas).map((area) => html`<option value=${area.area_id}>${area.name}</option>`)}
          </select></label
        >${this._area ? html`<button class="fill-room" @click=${this._fillRoom}>${this._t("add_room")}</button>` : nothing}
        <div class="entity-list">
          ${entities.slice(0, 100).map(
            (entity) =>
              html`<button
                data-entity=${entity.entity_id}
                @click=${this._addDevice}
              >
                <span
                  ><b>${entity.attributes.friendly_name || entity.entity_id}</b
                  ><small
                    >${this._areaName(entity.entity_id) || entity.entity_id}</small
                  ></span
                ><emad-ui-svg-icon .path=${mdiPlus}></emad-ui-svg-icon>
              </button>`,
          )}${!entities.length ? html`<p class="muted">${this._t("no_devices")}</p>` : nothing}${entities.length > 100 ? html`<p class="muted">${this._t("refine_search")}</p>` : nothing}
        </div>
      </div>
      <div class="editor-section">
        <h3>${this._t("views")}</h3>
        <label
          >${this._t("view_name")}<input
            maxlength="120"
            .value=${this._view.name || ""}
            @change=${this._renameView} /></label
        ><label
          >${this._t("new_view")}<input
            maxlength="120"
            .value=${this._viewName}
            @input=${this._viewNameChange}
            @keydown=${this._viewNameKey} /></label
        ><button
          ?disabled=${!this._viewName.trim() || this._config.views.length >= 30}
          @click=${this._addView}
        >
          + ${this._t("create_view")}</button
        >${this._config.views.length > 1 && this._view.cards.length === 0 ? html`<button class="remove-view" @click=${this._removeView}>${this._t("remove_view")}</button>` : nothing}
      </div>
    </aside>`;
  }
  static styles = [
    css`
      :host {
        display: block;
        height: 100%;
        overflow: auto;
        background: var(--primary-background-color, #f5f7f4);
        font-family: var(--ha-font-family-body, "Space Grotesk", sans-serif);
      }
      * {
        box-sizing: border-box;
      }
      .dashboard {
        --emad-mint: #69e1b7;
        --emad-line: color-mix(
          in srgb,
          var(--primary-text-color, #181715) 13%,
          transparent
        );
        color: var(--primary-text-color, #181715);
        max-width: 1600px;
        margin: auto;
        padding: 24px 32px 40px;
      }
      button,
      input,
      select,
      textarea {
        font: inherit;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 40px;
        padding: 8px 14px;
        border: 1px solid var(--emad-line);
        border-radius: 5px;
        background: var(--card-background-color, #fff);
        color: inherit;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      }
      button:hover {
        border-color: var(--emad-mint);
        background: color-mix(
          in srgb,
          var(--emad-mint) 10%,
          var(--card-background-color, #fff)
        );
      }
      button:disabled {
        opacity: 0.45;
        cursor: default;
      }
      button:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        outline: 3px solid var(--emad-mint);
        outline-offset: 3px;
      }
      button.primary {
        background: var(--emad-mint);
        border-color: var(--emad-mint);
        color: #14291e;
      }
      emad-ui-svg-icon {
        --mdc-icon-size: 18px;
      }
      .topbar,
      .brand,
      .top-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .topbar {
        justify-content: space-between;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--emad-line);
      }
      .brand-icon {
        background: #183428;
        color: var(--emad-mint);
        padding: 12px;
        clip-path: polygon(0 0, 80% 0, 100% 20%, 100% 100%, 20% 100%, 0 80%);
      }
      .brand-icon emad-ui-svg-icon {
        --mdc-icon-size: 23px;
      }
      h1 {
        font-size: 19px;
        letter-spacing: -0.5px;
        margin: 4px 0 0;
        font-weight: 600;
      }
      .eyebrow {
        margin: 0;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: var(--secondary-text-color, #6d796e);
      }
      .connection {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-inline-end: 8px;
      }
      .connection i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--warning-color);
      }
      .connection.online i {
        background: #36976e;
      }
      .intro {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 32px 0 24px;
      }
      .intro h2 {
        font-size: 34px;
        line-height: 1.2;
        letter-spacing: -1px;
        margin: 8px 0;
        font-weight: 500;
      }
      .intro p:not(.eyebrow) {
        color: var(--secondary-text-color);
        font-size: 12px;
        margin: 0;
        line-height: 1.6;
      }
      .date {
        color: var(--secondary-text-color);
        font-size: 12px;
      }
      nav {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 0 0 24px;
      }
      nav button {
        white-space: nowrap;
        border-color: transparent;
        background: transparent;
        min-height: 36px;
      }
      nav .selected-view {
        background: #183428;
        border-color: #183428;
        color: #fff;
      }
      nav span {
        background: color-mix(in srgb, var(--emad-mint) 15%, transparent);
        min-width: 19px;
        padding: 2px 5px;
        font-size: 10px;
        border-radius: 3px;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 28px;
        align-items: start;
      }
      .editing .workspace {
        grid-template-columns: minmax(0, 1fr) 288px;
      }
      main {
        min-width: 0;
      }
      .canvas-viewport {
        width: 100%;
      }
      .canvas {
        position: relative;
        transform-origin: top left;
        margin-inline: auto;
      }
      [dir="rtl"] .canvas {
        transform-origin: top right;
      }
      .editing .canvas {
        background-image: radial-gradient(
          var(--emad-line) 1px,
          transparent 1px
        );
        background-size: 12px 12px;
        border-radius: 8px;
      }
      .card {
        position: absolute;
        border: 1px solid var(--emad-line);
        border-radius: 12px 3px 12px 3px;
        background: var(--card-background-color, #fff);
        box-shadow: 0 3px 0 color-mix(in srgb, var(--emad-mint) 9%, transparent);
      }
      .card.selected {
        outline: 2px solid var(--emad-mint);
        outline-offset: 2px;
      }
      .card-toolbar {
        position: absolute;
        z-index: 2;
        top: 6px;
        inset-inline-end: 6px;
        display: flex;
        gap: 3px;
        border: 1px solid var(--emad-line);
        border-radius: 5px;
        padding: 3px;
        background: var(--card-background-color, #fff);
        box-shadow: 0 2px 7px #0001;
      }
      .card-toolbar button {
        min-height: 30px;
        padding: 4px;
        min-width: 30px;
        border: 0;
      }
      .editing .card emad-ui-device,
      .editing .card emad-ui-catalog-device {
        padding-top: 32px;
      }
      .drag,
      .resize {
        touch-action: none;
      }
      .drag {
        cursor: grab;
      }
      .resize {
        position: absolute;
        bottom: 0;
        inset-inline-end: 0;
        min-height: 28px;
        padding: 4px;
        border: 0;
        background: transparent;
        cursor: nwse-resize;
      }
      [dir="rtl"] .resize {
        cursor: nesw-resize;
        transform: scaleX(-1);
      }
      .mobile {
        width: 100%;
        display: grid;
        gap: 18px;
      }
      .mobile .card {
        position: relative;
        width: 100%;
      }
      .empty {
        position: relative;
        min-height: 450px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 12px;
        border: 1px dashed var(--emad-line);
        border-radius: 12px;
        padding: 32px;
      }
      .empty-icon {
        padding: 20px;
        background: color-mix(in srgb, var(--emad-mint) 12%, transparent);
        border-radius: 50%;
      }
      .empty-icon emad-ui-svg-icon {
        --mdc-icon-size: 32px;
        color: var(--emad-mint);
      }
      .empty h3 {
        font-size: 24px;
        font-weight: 500;
        margin: 6px 0 0;
      }
      .empty p {
        font-size: 13px;
        color: var(--secondary-text-color);
        max-width: 360px;
        line-height: 1.7;
        margin: 0 0 8px;
      }
      aside {
        border: 1px solid var(--emad-line);
        background: var(--card-background-color, #fff);
        border-radius: 10px 3px 10px 3px;
        overflow: hidden;
        position: sticky;
        top: 12px;
        max-height: calc(100vh - 110px);
        overflow-y: auto;
      }
      .editor-heading {
        padding: 22px 20px 14px;
      }
      h3 {
        margin: 8px 0;
        font-size: 16px;
      }
      .editor-section {
        padding: 16px 20px;
        border-top: 1px solid var(--emad-line);
      }
      .editor-section label {
        display: block;
        margin: 0 0 14px;
        font-size: 11px;
        color: var(--secondary-text-color);
      }
      input,
      select,
      textarea {
        display: block;
        width: 100%;
        min-width: 0;
        min-height: 40px;
        margin-top: 6px;
        border: 1px solid var(--emad-line);
        border-radius: 4px;
        padding: 9px;
        color: var(--primary-text-color);
        background: var(--primary-background-color);
        font-size: 12px;
      }
      .dimensions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .dimensions label {
        min-width: 0;
      }
      .widget-types {
        display: flex;
        gap: 8px;
        margin-bottom: 18px;
      }
      .widget-types button {
        flex: 1;
      }
      .back {
        padding: 0;
        min-height: 30px;
        margin-bottom: 12px;
        border: 0;
        background: transparent;
      }
      .fill-room {
        width: 100%;
        margin-bottom: 12px;
      }
      .entity-list {
        max-height: 300px;
        overflow: auto;
        scrollbar-width: thin;
      }
      .entity-list button {
        width: 100%;
        justify-content: space-between;
        border: 0;
        background: transparent;
        text-align: start;
        padding: 10px 0;
        border-bottom: 1px solid var(--emad-line);
        border-radius: 0;
      }
      .entity-list span {
        display: block;
        min-width: 0;
      }
      .entity-list b {
        display: block;
        font-size: 12px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .entity-list small {
        display: block;
        font-size: 10px;
        color: var(--secondary-text-color);
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .entity-list emad-ui-svg-icon {
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }
      .muted {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .edit-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        align-items: center;
        background: #183428;
        border: 1px solid #315b43;
        box-shadow: 0 8px 30px #0003;
        padding: 10px 14px;
        border-radius: 10px;
        z-index: 5;
        color: #fff;
      }
      .edit-label {
        padding: 0 12px;
        font-size: 11px;
        white-space: nowrap;
      }
      .edit-bar > button:not(.primary) {
        background: transparent;
        color: #fff;
        border-color: #ffffff30;
      }
      .editing {
        padding-bottom: 120px;
      }
      .remove-view {
        display: block;
        margin-top: 12px;
        color: var(--error-color);
      }
      .page-footer {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--emad-line);
        margin-top: 36px;
        padding-top: 18px;
        font-size: 10px;
        color: var(--secondary-text-color);
      }
      .page-footer span:first-child {
        font-size: 14px;
        font-weight: 650;
        color: var(--primary-text-color);
      }
      emad-ui-alert {
        display: block;
        margin-bottom: 16px;
      }
      .kiosk .brand,
      .kiosk .connection,
      .kiosk .intro,
      .kiosk .page-footer {
        display: none;
      }
      .kiosk .topbar {
        justify-content: flex-end;
        padding-bottom: 12px;
        border: 0;
      }
      .kiosk-button {
        font-size: 10px;
      }
      @media (max-width: 1000px) {
        .dashboard {
          padding: 20px;
        }
        .editing .workspace {
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 18px;
        }
      }
      @media (max-width: 750px) {
        .editing .workspace {
          grid-template-columns: minmax(0, 1fr);
        }
        aside {
          position: static;
          max-height: none;
        }
        .dashboard {
          padding: 16px;
        }
        .topbar {
          align-items: start;
          gap: 10px;
        }
        .top-actions {
          flex-wrap: wrap;
          justify-content: end;
          gap: 8px;
        }
        .connection,
        .date {
          display: none;
        }
        .kiosk-button {
          min-height: 30px;
          padding: 4px 8px;
        }
        .brand-icon {
          display: none;
        }
        .eyebrow {
          letter-spacing: 1px;
          font-size: 8px;
        }
        h1 {
          font-size: 16px;
        }
        .intro {
          margin-top: 24px;
        }
        .intro h2 {
          font-size: 28px;
        }
        .edit-bar {
          width: calc(100% - 20px);
          justify-content: center;
          padding: 8px;
          bottom: 10px;
          gap: 6px;
        }
        .edit-label {
          display: none;
        }
        .edit-bar button {
          padding: 8px 12px;
        }
        .page-footer {
          gap: 16px;
        }
      }
    `,
    dashboardIsometricStyles,
    css`
      .card {
        container-type: size;
        container-name: emad-slot;
      }
      .card,
      .drop-placeholder {
        inset-inline-start: 0;
        top: 0;
      }
      .canvas:not(.mobile) .card {
        animation: none;
      }
      .editing .card {
        transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .editing .card.dragging {
        z-index: 4;
        transition: none;
        will-change: transform;
        cursor: grabbing;
      }
      .card.dragging::before {
        background: color-mix(
          in srgb,
          var(--emad-mint) 42%,
          var(--primary-background-color)
        );
      }
      .card.dragging .drag {
        cursor: grabbing;
      }
      .editing .card-toolbar button {
        min-width: 44px;
        min-height: 44px;
      }
      .editing .card emad-ui-device,
      .editing .card emad-ui-catalog-device {
        padding-top: 48px;
      }
      .resize {
        min-width: 44px;
        min-height: 44px;
      }
      .drag:disabled {
        cursor: default;
        opacity: 0.35;
      }
      .drop-placeholder {
        position: absolute;
        box-sizing: border-box;
        pointer-events: none;
        border: 2px dashed var(--emad-mint);
        background: color-mix(in srgb, var(--emad-mint) 12%, transparent);
        border-radius: 8px;
      }
      .drop-placeholder.blocked {
        border-color: var(--error-color);
        background: color-mix(in srgb, var(--error-color) 8%, transparent);
      }
      .layout-help {
        margin: 0 0 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .layout-feedback {
        min-height: 18px;
        margin: 0 0 12px;
        font-size: 12px;
        color: var(--primary-text-color);
      }
      .mobile .card {
        inset-inline-start: auto;
        top: auto;
      }
      .dashboard:not(.editing) .card {
        transition: none;
        animation: none;
      }
      .dashboard:not(.editing) .fluid .card {
        transform: none;
      }
      .canvas.fluid {
        display: grid;
        grid-template-columns: repeat(
          var(--emad-flow-columns, 1),
          minmax(0, 1fr)
        );
        gap: 18px;
        width: 100%;
        transform: none;
        margin: 0;
        padding-inline-end: 8px;
      }
      .fluid .card {
        position: relative;
        inline-size: auto;
        min-inline-size: 0;
        container-type: size;
        top: auto;
        inset-inline-start: auto;
      }
      .dashboard {
        padding-block-start: max(16px, env(safe-area-inset-top, 0px));
        padding-inline-start: max(16px, env(safe-area-inset-left, 0px));
        padding-inline-end: max(16px, env(safe-area-inset-right, 0px));
        padding-block-end: max(32px, env(safe-area-inset-bottom, 0px));
      }
      .dashboard button,
      .dashboard input,
      .dashboard select,
      .dashboard textarea {
        min-block-size: 48px;
      }
      .topbar,
      .top-actions,
      nav {
        flex-wrap: wrap;
      }
      nav button {
        max-inline-size: 100%;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      .kiosk .dashboard,
      .dashboard.kiosk {
        padding-block-start: max(12px, env(safe-area-inset-top, 0px));
      }
      .kiosk .workspace {
        gap: 12px;
      }
      @media (prefers-reduced-motion: reduce) {
        .editing .card {
          transition: none;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "emad-dashboard-view": HaPanelEmadDashboard;
  }
}
