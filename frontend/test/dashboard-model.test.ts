import { describe, expect, it } from "vitest";
import {
  CANVAS_WIDTH,
  cardsCollide,
  hasCardCollisions,
  resolveCardLayout,
  cloneConfig,
  emptyDashboard,
  entitiesForArea,
  moveCard,
  placeCard,
} from "../src/dashboard/dashboard-model";
import type { DashboardCard } from "../src/dashboard/dashboard-model";

const card: DashboardCard = {
  id: "a",
  kind: "device",
  entity: "light.lobby",
  x: 24,
  y: 24,
  w: 384,
  h: 348,
};
describe("Emad dashboard placement", () => {
  it("keeps cards within the canvas when dragging beyond every edge", () => {
    expect(moveCard(card, -500, -500, false)).toMatchObject({ x: 0, y: 0 });
    expect(moveCard(card, 5000, 50000, false)).toMatchObject({
      x: CANVAS_WIDTH - card.w,
      y: 20000,
    });
  });
  it("enforces usable card sizes when resizing", () => {
    expect(moveCard(card, -500, -500, true)).toMatchObject({ w: 240, h: 204 });
    expect(moveCard(card, 5000, 5000, true)).toMatchObject({
      w: 1176,
      h: 1200,
    });
  });
  it("snaps movement and allows pixel precision with Shift", () => {
    expect(moveCard(card, 7, 7, false)).toMatchObject({ x: 36, y: 36 });
    expect(moveCard(card, 7, 7, false, true)).toMatchObject({ x: 31, y: 31 });
  });
  it("finds free placements without moving existing cards", () => {
    const cards: DashboardCard[] = [];
    for (let i = 0; i < 12; i++) {
      cards.push(placeCard(cards, "device", `light.room_${i}`)!);
    }
    for (const [index, c] of cards.entries()) {
      for (const other of cards.slice(index + 1)) {
        expect(
          c.x >= other.x + other.w ||
            c.x + c.w <= other.x ||
            c.y >= other.y + other.h ||
            c.y + c.h <= other.y,
        ).toBe(true);
      }
    }
    expect(new Set(cards.map((c) => c.id)).size).toBe(12);
  });
  it("keeps edited drafts isolated from saved layouts", () => {
    const saved = emptyDashboard();
    const draft = cloneConfig(saved);
    draft.views[0].cards.push(card);
    expect(saved.views[0].cards).toHaveLength(0);
  });
  it("uses entity room overrides before device room assignments and hides hidden entities", () => {
    const hass = {
      states: {
        "light.one": {},
        "sensor.two": {},
        "switch.hidden": {},
        "automation.no": {},
      },
      entities: {
        "light.one": { area_id: "b", device_id: "d" },
        "sensor.two": { device_id: "d" },
        "switch.hidden": { area_id: "a", hidden: true },
      },
      devices: { d: { area_id: "a" } },
    };
    expect(
      entitiesForArea(
        hass as unknown as Parameters<typeof entitiesForArea>[0],
        "a",
      ),
    ).toEqual(["sensor.two"]);
  });
});

describe("Collision-free dashboard layouts", () => {
  const box = (
    id: string,
    x: number,
    y: number,
    w = 384,
    h = 348,
  ): DashboardCard => ({ id, kind: "device", x, y, w, h });
  const clear = (cards: DashboardCard[]) => {
    expect(hasCardCollisions(cards)).toBe(false);
    for (const c of cards) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(CANVAS_WIDTH);
      expect(c.y).toBeLessThanOrEqual(20000);
    }
  };
  it("reserves room for card depth without treating an exact gap as overlap", () => {
    expect(cardsCollide(box("a", 0, 0), box("b", 396, 0))).toBe(false);
    expect(cardsCollide(box("a", 0, 0), box("b", 395, 0))).toBe(true);
    expect(cardsCollide(box("a", 0, 0), box("b", 0, 360))).toBe(false);
  });
  it("pins the moved card and cascades neighbors without overlap or source mutation", () => {
    const cards = [
      box("a", 0, 0),
      box("b", 408, 0),
      box("c", 408, 360),
      box("d", 816, 0),
    ];
    const before = structuredClone(cards);
    const result = resolveCardLayout(cards, { ...cards[0], x: 408 })!;
    clear(result);
    expect(result.find((c) => c.id === "a")).toMatchObject({ x: 408, y: 0 });
    expect(result.find((c) => c.id === "b")!.y).toBe(360);
    expect(result.find((c) => c.id === "c")!.y).toBe(720);
    expect(result.find((c) => c.id === "d")).toEqual(cards[3]);
    expect(result.map((c) => c.id)).toEqual(cards.map((c) => c.id));
    expect(cards).toEqual(before);
  });
  it("recomputes previews from the starting layout instead of accumulating displacement", () => {
    const cards = [box("a", 0, 0), box("b", 408, 0)];
    resolveCardLayout(cards, { ...cards[0], x: 408 });
    expect(resolveCardLayout(cards, cards[0])).toEqual(cards);
  });
  it("resolves growing cards using their full new width and height", () => {
    const cards = [box("a", 0, 0), box("b", 408, 0), box("c", 0, 360)];
    const result = resolveCardLayout(cards, { ...cards[0], w: 792, h: 720 })!;
    clear(result);
    expect(result.find((c) => c.id === "a")).toMatchObject({ w: 792, h: 720 });
    expect(result.filter((c) => c.id !== "a").every((c) => c.y >= 732)).toBe(
      true,
    );
  });
  it("repairs legacy overlapping placements deterministically and idempotently", () => {
    const cards = [box("a", 0, 0), box("b", 0, 0), box("c", 0, 200)];
    const result = resolveCardLayout(cards)!;
    clear(result);
    expect(resolveCardLayout(result)).toEqual(result);
    expect(resolveCardLayout(cards)).toEqual(result);
  });
  it("leaves valid custom positions and dimensions unchanged", () => {
    const cards = [box("a", 17, 23, 300, 267), box("b", 350, 23, 274, 251)];
    expect(resolveCardLayout(cards)).toEqual(cards);
  });
  it("rejects a cascade beyond the storage boundary instead of clipping or losing cards", () => {
    const cards = [box("a", 0, 20000, 1200, 1200), box("b", 0, 0, 1200, 1200)];
    expect(resolveCardLayout(cards, { ...cards[1], y: 20000 })).toBeUndefined();
    expect(cards[0].y).toBe(20000);
  });
  it("uses the catalog card's final size when finding a free slot", () => {
    const cards = [box("a", 0, 372), box("b", 408, 372), box("c", 816, 372)];
    const added = placeCard(cards, "device", undefined, { w: 384, h: 720 })!;
    expect(added.h).toBe(720);
    clear([...cards, added]);
    expect(added.y).toBeGreaterThanOrEqual(732);
  });
  it("returns no slot for a full canvas instead of the old overlapping fallback", () => {
    const cards = Array.from({ length: 18 }, (_, i) =>
      box(String(i), 0, i * 1212, 1200, 1200),
    );
    expect(
      placeCard(cards, "device", undefined, { w: 1200, h: 1200 }),
    ).toBeUndefined();
  });
  it("packs and resolves 100 mixed-size cards with stable identities", () => {
    const cards: DashboardCard[] = [];
    for (let i = 0; i < 100; i++) {
      const added = placeCard(cards, "device", undefined, {
        w: i % 3 === 0 ? 504 : 300,
        h: i % 2 ? 348 : 720,
      });
      expect(added).toBeDefined();
      cards.push(added!);
    }
    clear(cards);
    const result = resolveCardLayout(cards, { ...cards[99], x: 0, y: 0 })!;
    clear(result);
    expect(new Set(result.map((c) => c.id)).size).toBe(100);
  });
  it.each([
    { w: NaN, h: 720 },
    { w: Infinity, h: 720 },
    { w: 0, h: 720 },
    { w: 1201, h: 720 },
    { w: 384, h: NaN },
    { w: 384, h: Infinity },
    { w: 384, h: 0 },
    { w: 384, h: 1201 },
  ])(
    "rejects invalid placement dimensions %o without an unbounded search",
    (size) => {
      expect(placeCard([], "device", undefined, size)).toBeUndefined();
    },
  );
});
