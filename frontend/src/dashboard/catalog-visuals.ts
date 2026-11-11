import {
  mdiSnowflake,
  mdiFactory,
  mdiFan,
  mdiGauge,
  mdiLightbulbOutline,
  mdiBlindsHorizontal,
  mdiCounter,
  mdiFlashOutline,
  mdiSolarPower,
  mdiPump,
  mdiStorageTank,
  mdiValve,
  mdiWaterCheck,
  mdiShieldCheckOutline,
  mdiLockOutline,
  mdiElevator,
  mdiCctv,
  mdiParking,
  mdiAccountGroupOutline,
  mdiWeatherPartlyCloudy,
  mdiSprinklerVariant,
  mdiWashingMachine,
  mdiRobotVacuum,
  mdiSpeaker,
  mdiServerNetwork,
  mdiPulse,
  mdiChip,
  mdiEngineOutline,
} from "@mdi/js";
import { svg } from "lit";
import type { CatalogDevice, DeviceFamily } from "./device-catalog";

import { physicalProfile } from "./device-physical-profiles";
import type { DeviceVisualState } from "./device-visual-state";
import { cleaningVisual } from "./physical-cleaning";
import { realisticApplianceVisual } from "./physical-appliance-realism";
import { wellnessVisual } from "./physical-wellness";
import { weatherVisual } from "./physical-weather";
import { lightingVisual } from "./physical-lighting";
import { occupancyVisual } from "./physical-occupancy";
import { parkingVisual } from "./physical-parking";
import { treatmentVisual } from "./physical-treatment";
import { waterVisual } from "./physical-water";
import { mechanicalVisual } from "./physical-mechanical";
import { electricalVisual } from "./physical-electrical";
import { architectureVisual } from "./physical-architecture";
import { sensorVisual } from "./physical-sensors";
import { applianceVisual } from "./physical-appliances";

export const FAMILY_ICONS: Record<DeviceFamily, string> = {
  climate: mdiSnowflake,
  plant: mdiFactory,
  fan: mdiFan,
  sensor: mdiGauge,
  light: mdiLightbulbOutline,
  shade: mdiBlindsHorizontal,
  meter: mdiCounter,
  power: mdiFlashOutline,
  energy: mdiSolarPower,
  pump: mdiPump,
  tank: mdiStorageTank,
  valve: mdiValve,
  quality: mdiWaterCheck,
  safety: mdiShieldCheckOutline,
  access: mdiLockOutline,
  lift: mdiElevator,
  camera: mdiCctv,
  parking: mdiParking,
  presence: mdiAccountGroupOutline,
  weather: mdiWeatherPartlyCloudy,
  irrigation: mdiSprinklerVariant,
  appliance: mdiWashingMachine,
  robot: mdiRobotVacuum,
  media: mdiSpeaker,
  network: mdiServerNetwork,
  condition: mdiPulse,
  gateway: mdiChip,
  motor: mdiEngineOutline,
};

export function catalogVisual(
  device: CatalogDevice,
  state: DeviceVisualState,
  instanceId = device.id,
) {
  const profile = physicalProfile(device);
  const drawing =
    cleaningVisual(device, state, instanceId) ??
    realisticApplianceVisual(device, state, instanceId) ??
    wellnessVisual(device, state, instanceId) ??
    weatherVisual(device, state) ??
    lightingVisual(device, state, instanceId) ??
    occupancyVisual(device, state) ??
    parkingVisual(device, state) ??
    treatmentVisual(device, state) ??
    waterVisual(device, state) ??
    mechanicalVisual(device, profile, state) ??
    electricalVisual(device, profile, state) ??
    architectureVisual(device, profile, state) ??
    sensorVisual(device, profile, state) ??
    applianceVisual(device, profile, state);
  if (!drawing) {
    throw new Error(`No physical geometry for ${device.id} (${profile.shape})`);
  }
  const scale = [
    "ph_sensor",
    "orp_sensor",
    "conductivity_sensor",
    "total_dissolved_solids_sensor",
    "dissolved_oxygen_sensor",
    "salinity_sensor",
  ].includes(device.id)
    ? 1.3
    : [
          "water_supply",
          "water_treatment",
          "parking",
          "occupancy",
          "weather",
          "lighting",
        ].includes(device.category)
      ? 1
      : [
            "thermostat",
            "wall_sensor",
            "pressure_sensor",
            "card_reader",
            "fingerprint",
            "pipe_pressure",
            "light_sensor",
            "parking_puck",
            "leak_puck",
            "control_board",
            "usb_radio",
          ].includes(profile.shape)
        ? 1.45
        : 1;
  return svg`<svg class="iso-scene ${state.active && state.available ? "active" : ""} ${state.alert ? "alert" : ""} ${state.available ? "" : "unavailable"} ${state.hasTelemetry ? "" : "telemetry-unknown"}" data-shape=${profile.shape} viewBox="0 0 280 190" aria-hidden="true" focusable="false" style="--spin-direction:${state.mode === "reverse" ? "reverse" : "normal"};--light-color:${state.color};--light-opacity:${state.active ? state.level / 100 : 0}">
    <ellipse class="device-shadow" cx="140" cy="147" rx="85" ry="26"/>
    <path class="floor-grid" d="m32 132 108-54 108 54-108 54Z M59 118l108 54m-81-67 108 54m-81-67 108 54M59 145l108-54m-81 67 108-54m-81 68 108-54"/>
    <g class="physical-device" transform="translate(140 105) scale(${scale}) translate(-140 -105)">${drawing}</g>
  </svg>`;
}
