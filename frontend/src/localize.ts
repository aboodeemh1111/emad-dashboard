import en from "./translations/en.json";
import ar from "./translations/ar.json";
import type { HomeAssistant, LocalizeFunc } from "./platform/types";

const prefix = "ui.panel.emad-dashboard.";
const cache = new WeakMap<LocalizeFunc, Map<string, LocalizeFunc>>();
export function panelLocalize(hass: HomeAssistant): LocalizeFunc {
  const language = /^ar(-|$)/i.test(hass.language) ? "ar" : "en";
  const existing = cache.get(hass.localize)?.get(language);
  if (existing) return existing;
  const strings = (language === "ar" ? ar : en).ui.panel["emad-dashboard"];
  const localize: LocalizeFunc = (key, values = {}) => {
    if (!key.startsWith(prefix)) return hass.localize(key, values) || "";
    const short = key.slice(prefix.length) as keyof typeof strings;
    let result: string =
      strings[short] ?? en.ui.panel["emad-dashboard"][short] ?? "";
    for (const [name, value] of Object.entries(values))
      result = result.replaceAll(`{${name}}`, String(value));
    return result;
  };
  const byLanguage =
    cache.get(hass.localize) ?? new Map<string, LocalizeFunc>();
  byLanguage.set(language, localize);
  cache.set(hass.localize, byLanguage);
  return localize;
}

/** An isolated view of hass. The native object's methods and localization stay intact. */
export function panelHass(hass: HomeAssistant): HomeAssistant {
  return {
    ...hass,
    entities: hass.entities ?? {},
    devices: hass.devices ?? {},
    areas: hass.areas ?? {},
    services: hass.services ?? {},
    localize: panelLocalize(hass),
    loadFragmentTranslation: (fragment) =>
      fragment === "emad-dashboard"
        ? Promise.resolve()
        : hass.loadFragmentTranslation(fragment),
    formatEntityState:
      hass.formatEntityState ??
      ((entity) =>
        `${entity.state}${entity.attributes.unit_of_measurement ? ` ${entity.attributes.unit_of_measurement}` : ""}`),
  };
}
