import type { HassEntities, HassEntity } from "home-assistant-js-websocket";

import type translations from "../translations/en.json";

export type DashboardTextKey =
  keyof (typeof translations.ui.panel)["emad-dashboard"];

export const CANVAS_WIDTH = 1200;
export const GRID = 12;
export const CARD_KINDS = ["device", "clock", "text"] as const;
export type CardKind = (typeof CARD_KINDS)[number];
export interface DashboardCard {
  id: string;
  kind: CardKind;
  entity?: string;
  deviceType?: string;
  deviceId?: string;
  title?: string;
  text?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface DashboardView {
  id: string;
  name: string;
  cards: DashboardCard[];
}
export interface DashboardConfig {
  version: 1;
  views: DashboardView[];
}
export interface DashboardSnapshot {
  revision: number;
  config: DashboardConfig;
}
export interface DeviceCommand {
  entity: string;
  service: string;
  data?: Record<string, unknown>;
}

export const SUPPORTED_DOMAINS = new Set([
  "light",
  "climate",
  "switch",
  "input_boolean",
  "cover",
  "fan",
  "lock",
  "vacuum",
  "media_player",
  "humidifier",
  "water_heater",
  "valve",
  "alarm_control_panel",
  "sensor",
  "binary_sensor",
  "weather",
  "scene",
  "script",
  "button",
  "input_button",
  "number",
  "input_number",
  "select",
  "input_select",
  "camera",
  "person",
  "device_tracker",
]);
export const domainOf = (entity: string) => entity.split(".")[0];
export const isAvailable = (entity?: HassEntity) =>
  !!entity &&
  entity.state !== "unavailable" &&
  (entity.state !== "unknown" ||
    ["button", "input_button", "scene"].includes(domainOf(entity.entity_id)));
export const uid = () => crypto.randomUUID();
export const emptyDashboard = (): DashboardConfig => ({
  version: 1,
  views: [{ id: "home", name: "", cards: [] }],
});
export const cloneConfig = (config: DashboardConfig): DashboardConfig =>
  structuredClone(config);
export const snap = (value: number, precise = false) =>
  precise ? Math.round(value) : Math.round(value / GRID) * GRID;

/** Spacing includes the card's offset mint depth and selection outline. */
export const CARD_GAP = GRID;
export const MAX_CARD_Y = 20000;

export function cardsCollide(a: DashboardCard, b: DashboardCard): boolean {
  return (
    a.x < b.x + b.w + CARD_GAP &&
    a.x + a.w + CARD_GAP > b.x &&
    a.y < b.y + b.h + CARD_GAP &&
    a.y + a.h + CARD_GAP > b.y
  );
}

export function hasCardCollisions(cards: DashboardCard[]): boolean {
  return cards.some((card, i) =>
    cards.slice(i + 1).some((other) => cardsCollide(card, other)),
  );
}

/** Pin the requested placement, then move only intersecting cards down.
 * Always evaluate against the gesture's starting layout, not its last preview.
 * Returning undefined keeps an impossible placement out of saved layouts.
 */
export function resolveCardLayout(
  cards: DashboardCard[],
  candidate?: DashboardCard,
): DashboardCard[] | undefined {
  if (candidate && !cards.some((c) => c.id === candidate.id)) return undefined;
  const source = cards.map((c) => (candidate?.id === c.id ? candidate : c));
  if (
    source.some(
      (c) =>
        ![c.x, c.y, c.w, c.h].every(Number.isFinite) ||
        c.x < 0 ||
        c.y < 0 ||
        c.y > MAX_CARD_Y ||
        c.w < 240 ||
        c.h < 204 ||
        c.h > 1200 ||
        c.x + c.w > CANVAS_WIDTH,
    )
  ) {
    return undefined;
  }
  const ordered = source
    .filter((c) => c.id !== candidate?.id)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const placed: DashboardCard[] = candidate ? [candidate] : [];
  for (const original of ordered) {
    let card = original;
    for (;;) {
      const collisions = placed.filter((other) => cardsCollide(card, other));
      if (!collisions.length) break;
      const y =
        Math.ceil(
          Math.max(...collisions.map((other) => other.y + other.h + CARD_GAP)) /
            GRID,
        ) * GRID;
      if (y > MAX_CARD_Y) return undefined;
      card = { ...card, y };
    }
    placed.push(card);
  }
  const byId = new Map(placed.map((c) => [c.id, c]));
  return source.map((c) => byId.get(c.id)!);
}

export function placeCard(
  cards: DashboardCard[],
  kind: CardKind,
  entity?: string,
  dimensions?: Pick<DashboardCard, "w" | "h">,
): DashboardCard | undefined {
  const defaults =
    kind === "clock"
      ? { w: 384, h: 228 }
      : {
          w: 384,
          h: ["light", "climate", "fan", "humidifier"].includes(
            domainOf(entity || ""),
          )
            ? 408
            : 348,
        };
  const { w, h } = dimensions ?? defaults;
  if (
    !Number.isFinite(w) ||
    !Number.isFinite(h) ||
    w < 240 ||
    w > CANVAS_WIDTH ||
    h < 204 ||
    h > 1200
  ) {
    return undefined;
  }
  const size = { w, h };
  const ys = [
    ...new Set([
      0,
      ...cards.map((c) => Math.ceil((c.y + c.h + CARD_GAP) / GRID) * GRID),
    ]),
  ]
    .filter((y) => y <= MAX_CARD_Y)
    .sort((a, b) => a - b);
  const xs = new Set<number>();
  for (
    let x = 0;
    x + size.w <= CANVAS_WIDTH;
    x += Math.ceil((size.w + 24) / GRID) * GRID
  ) {
    xs.add(x);
  }
  for (const c of cards) {
    xs.add(Math.ceil((c.x + c.w + CARD_GAP) / GRID) * GRID);
  }
  for (const y of ys) {
    for (const x of [...xs].sort((a, b) => a - b)) {
      if (x + size.w > CANVAS_WIDTH) continue;
      const candidate: DashboardCard = {
        id: "",
        kind,
        ...(entity ? { entity } : {}),
        x,
        y,
        ...size,
      };
      if (!cards.some((c) => cardsCollide(candidate, c))) {
        return { ...candidate, id: uid() };
      }
    }
  }
  return undefined;
}

export function moveCard(
  card: DashboardCard,
  dx: number,
  dy: number,
  resize: boolean,
  precise = false,
): DashboardCard {
  return resize
    ? {
        ...card,
        w: Math.max(
          240,
          Math.min(CANVAS_WIDTH - card.x, snap(card.w + dx, precise)),
        ),
        h: Math.max(204, Math.min(1200, snap(card.h + dy, precise))),
      }
    : {
        ...card,
        x: Math.max(
          0,
          Math.min(CANVAS_WIDTH - card.w, snap(card.x + dx, precise)),
        ),
        y: Math.max(0, Math.min(20000, snap(card.y + dy, precise))),
      };
}

export function entitiesForArea(
  hass: {
    states: HassEntities;
    entities: Record<
      string,
      {
        area_id?: string | null;
        device_id?: string | null;
        hidden?: boolean | null;
      }
    >;
    devices: Record<string, { area_id?: string | null }>;
  },
  area: string,
): string[] {
  return Object.keys(hass.states).filter((id) => {
    const entry = hass.entities[id];
    return (
      SUPPORTED_DOMAINS.has(domainOf(id)) &&
      !entry?.hidden &&
      (entry?.area_id ??
        (entry?.device_id ? hass.devices[entry.device_id]?.area_id : null)) ===
        area
    );
  });
}
