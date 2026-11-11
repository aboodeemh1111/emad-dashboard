import type { HassEntity, HomeAssistant } from "./types";

export function fireEvent<T>(
  node: HTMLElement | Window,
  type: string,
  detail?: T,
  options: EventInit = {},
): CustomEvent<T> {
  const event = new CustomEvent(type, {
    detail,
    bubbles: true,
    composed: true,
    ...options,
  });
  node.dispatchEvent(event);
  return event;
}
export const supportsFeature = (entity: HassEntity, feature: number) =>
  ((entity.attributes.supported_features || 0) & feature) === feature;
export const computeRTLDirection = (hass: HomeAssistant) =>
  (hass.translationMetadata?.translations[hass.language]?.isRTL ??
  /^(ar|he|fa|ur)(-|$)/i.test(hass.language))
    ? "rtl"
    : "ltr";
