/** The public custom-panel boundary. The dashboard owns no Home Assistant runtime. */
import type {
  HassEntity,
  HassEntities,
  UnsubscribeFunc,
} from "home-assistant-js-websocket";
export type { HassEntity, HassEntities, UnsubscribeFunc };
export type CameraEntity = HassEntity;
export type LocalizeFunc<T extends string = string> = (
  key: T,
  values?: Record<string, string | number>,
) => string;
export interface Route {
  prefix: string;
  path: string;
}
export interface PanelInfo {
  config?: Record<string, unknown>;
  title?: string;
  icon?: string;
}
export interface EntityEntry {
  device_id?: string | null;
  area_id?: string | null;
  hidden?: boolean | null;
  entity_category?: "config" | "diagnostic" | null;
}
export interface DeviceEntry {
  id: string;
  name?: string | null;
  name_by_user?: string | null;
  model?: string | null;
  area_id?: string | null;
  disabled_by?: string | null;
}
export interface HomeAssistant {
  connected: boolean;
  language: string;
  states: HassEntities;
  entities: Record<string, EntityEntry>;
  devices: Record<string, DeviceEntry>;
  areas: Record<string, { area_id: string; name: string }>;
  services: Record<string, Record<string, unknown>>;
  user?: { id?: string; name?: string; is_admin?: boolean };
  config?: { unit_system?: { temperature?: string }; version?: string };
  translationMetadata?: { translations: Record<string, { isRTL?: boolean }> };
  localize: LocalizeFunc;
  formatEntityState(entity: HassEntity, state?: string): string;
  loadFragmentTranslation(fragment: string): Promise<void>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>,
    ): Promise<UnsubscribeFunc>;
  };
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface NativeCard extends HTMLElement {
  hass: HomeAssistant;
}
export interface CardHelpers {
  createCardElement(config: Record<string, unknown>): NativeCard;
}
declare global {
  interface Window {
    loadCardHelpers?: () => Promise<CardHelpers>;
  }
}
