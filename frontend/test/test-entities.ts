import type { HassEntity } from "home-assistant-js-websocket";

export const testEntity = (
  id: string,
  state: string,
  attributes: HassEntity["attributes"] = {},
): HassEntity => ({
  entity_id: id,
  state,
  attributes,
  last_changed: "2026-11-07T00:00:00Z",
  last_updated: "2026-11-07T00:00:00Z",
  context: { id: "test", parent_id: null, user_id: null },
});
