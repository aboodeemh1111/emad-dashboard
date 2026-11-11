// Each entry is a device UI type, not a claim of hardware compatibility.
import type { DashboardTextKey } from "./dashboard-model";

export type DeviceFamily =
  | "climate"
  | "plant"
  | "fan"
  | "sensor"
  | "light"
  | "shade"
  | "meter"
  | "power"
  | "energy"
  | "pump"
  | "tank"
  | "valve"
  | "quality"
  | "safety"
  | "access"
  | "lift"
  | "camera"
  | "parking"
  | "presence"
  | "weather"
  | "irrigation"
  | "appliance"
  | "robot"
  | "media"
  | "network"
  | "condition"
  | "gateway"
  | "motor";
export interface CatalogDevice {
  id: string;
  category: string;
  family: DeviceFamily;
}
export const DEVICE_CATEGORIES = [
  "room_climate",
  "central_plant",
  "ventilation",
  "air_sensors",
  "lighting",
  "shading",
  "electrical",
  "backup_power",
  "renewables",
  "water_supply",
  "valves",
  "drainage",
  "water_treatment",
  "fire_detection",
  "fire_protection",
  "gas",
  "access",
  "transport",
  "security",
  "parking",
  "occupancy",
  "weather",
  "irrigation",
  "pool",
  "appliances",
  "cleaning",
  "av",
  "it",
  "specialist",
  "controllers",
] as const;
export const DEVICE_CATALOG: readonly CatalogDevice[] = [
  {
    id: "thermostat",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "split_air_conditioner",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "ducted_air_conditioner",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "packaged_air_conditioner",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "vrf_indoor_unit",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "vrf_outdoor_unit",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "fan_coil_unit",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "air_handling_unit",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "fresh_air_handling_unit",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "rooftop_unit",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "vav_terminal",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "cav_terminal",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "chilled_beam",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "radiator",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "thermostatic_radiator_valve",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "underfloor_heating",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "electric_heater",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "unit_heater",
    category: "room_climate",
    family: "climate",
  },
  {
    id: "air_cooled_chiller",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "water_cooled_chiller",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "absorption_chiller",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "heat_pump",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "boiler",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "steam_boiler",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "cooling_tower",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "dry_cooler",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "heat_exchanger",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "district_cooling_substation",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "district_heating_substation",
    category: "central_plant",
    family: "plant",
  },
  {
    id: "buffer_tank",
    category: "central_plant",
    family: "tank",
  },
  {
    id: "thermal_storage_tank",
    category: "central_plant",
    family: "tank",
  },
  {
    id: "ice_storage_tank",
    category: "central_plant",
    family: "tank",
  },
  {
    id: "supply_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "return_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "exhaust_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "inline_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "ceiling_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "pedestal_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "jet_fan",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "kitchen_extraction_hood",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "makeup_air_unit",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "heat_recovery_ventilator",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "energy_recovery_ventilator",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "air_curtain",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "air_damper",
    category: "ventilation",
    family: "valve",
  },
  {
    id: "humidifier",
    category: "ventilation",
    family: "climate",
  },
  {
    id: "dehumidifier",
    category: "ventilation",
    family: "climate",
  },
  {
    id: "air_purifier",
    category: "ventilation",
    family: "fan",
  },
  {
    id: "evaporative_cooler",
    category: "ventilation",
    family: "climate",
  },
  {
    id: "room_temperature_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "duct_temperature_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "outdoor_temperature_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "humidity_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "carbon_dioxide_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "carbon_monoxide_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "nitrogen_dioxide_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "oxygen_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "voc_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "pm2_5_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "pm10_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "indoor_air_quality_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "air_pressure_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "differential_pressure_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "airflow_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "air_velocity_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "filter_differential_pressure_sensor",
    category: "air_sensors",
    family: "sensor",
  },
  {
    id: "refrigerant_leak_detector",
    category: "air_sensors",
    family: "safety",
  },
  {
    id: "smart_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "dimmable_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "tunable_white_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "rgb_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "rgbw_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "led_strip",
    category: "lighting",
    family: "light",
  },
  {
    id: "led_driver",
    category: "lighting",
    family: "light",
  },
  {
    id: "lighting_relay",
    category: "lighting",
    family: "light",
  },
  {
    id: "dimmer",
    category: "lighting",
    family: "light",
  },
  {
    id: "lighting_control_panel",
    category: "lighting",
    family: "light",
  },
  {
    id: "dali_controller",
    category: "lighting",
    family: "light",
  },
  {
    id: "dmx_controller",
    category: "lighting",
    family: "light",
  },
  {
    id: "floodlight",
    category: "lighting",
    family: "light",
  },
  {
    id: "landscape_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "streetlight",
    category: "lighting",
    family: "light",
  },
  {
    id: "emergency_light",
    category: "lighting",
    family: "light",
  },
  {
    id: "exit_sign",
    category: "lighting",
    family: "light",
  },
  {
    id: "daylight_sensor",
    category: "lighting",
    family: "sensor",
  },
  {
    id: "illuminance_sensor",
    category: "lighting",
    family: "sensor",
  },
  {
    id: "lighting_keypad",
    category: "lighting",
    family: "gateway",
  },
  {
    id: "roller_blind",
    category: "shading",
    family: "shade",
  },
  {
    id: "venetian_blind",
    category: "shading",
    family: "shade",
  },
  {
    id: "motorized_curtain",
    category: "shading",
    family: "shade",
  },
  {
    id: "roller_shutter",
    category: "shading",
    family: "shade",
  },
  {
    id: "solar_shade",
    category: "shading",
    family: "shade",
  },
  {
    id: "motorized_awning",
    category: "shading",
    family: "shade",
  },
  {
    id: "motorized_louver",
    category: "shading",
    family: "shade",
  },
  {
    id: "skylight",
    category: "shading",
    family: "shade",
  },
  {
    id: "motorized_window",
    category: "shading",
    family: "shade",
  },
  {
    id: "roof_vent",
    category: "shading",
    family: "shade",
  },
  {
    id: "electrochromic_glass",
    category: "shading",
    family: "shade",
  },
  {
    id: "movable_fa_ade_panel",
    category: "shading",
    family: "shade",
  },
  {
    id: "electricity_meter",
    category: "electrical",
    family: "meter",
  },
  {
    id: "power_quality_meter",
    category: "electrical",
    family: "meter",
  },
  {
    id: "branch_circuit_monitor",
    category: "electrical",
    family: "meter",
  },
  {
    id: "distribution_board",
    category: "electrical",
    family: "power",
  },
  {
    id: "switchgear",
    category: "electrical",
    family: "power",
  },
  {
    id: "circuit_breaker",
    category: "electrical",
    family: "power",
  },
  {
    id: "contactor",
    category: "electrical",
    family: "power",
  },
  {
    id: "protection_relay",
    category: "electrical",
    family: "power",
  },
  {
    id: "residual_current_device",
    category: "electrical",
    family: "power",
  },
  {
    id: "insulation_monitor",
    category: "electrical",
    family: "meter",
  },
  {
    id: "transformer_monitor",
    category: "electrical",
    family: "meter",
  },
  {
    id: "phase_monitor",
    category: "electrical",
    family: "meter",
  },
  {
    id: "voltage_sensor",
    category: "electrical",
    family: "meter",
  },
  {
    id: "current_sensor",
    category: "electrical",
    family: "meter",
  },
  {
    id: "capacitor_bank",
    category: "electrical",
    family: "power",
  },
  {
    id: "power_factor_controller",
    category: "electrical",
    family: "power",
  },
  {
    id: "harmonic_filter",
    category: "electrical",
    family: "power",
  },
  {
    id: "generator",
    category: "backup_power",
    family: "power",
  },
  {
    id: "generator_controller",
    category: "backup_power",
    family: "power",
  },
  {
    id: "automatic_transfer_switch",
    category: "backup_power",
    family: "power",
  },
  {
    id: "automatic_mains_failure_panel",
    category: "backup_power",
    family: "power",
  },
  {
    id: "static_transfer_switch",
    category: "backup_power",
    family: "power",
  },
  {
    id: "uninterruptible_power_supply",
    category: "backup_power",
    family: "power",
  },
  {
    id: "ups_battery_bank",
    category: "backup_power",
    family: "power",
  },
  {
    id: "battery_charger",
    category: "backup_power",
    family: "power",
  },
  {
    id: "rectifier",
    category: "backup_power",
    family: "power",
  },
  {
    id: "automatic_voltage_regulator",
    category: "backup_power",
    family: "power",
  },
  {
    id: "generator_fuel_level_sensor",
    category: "backup_power",
    family: "tank",
  },
  {
    id: "fuel_flow_meter",
    category: "backup_power",
    family: "meter",
  },
  {
    id: "solar_photovoltaic_array",
    category: "renewables",
    family: "energy",
  },
  {
    id: "solar_inverter",
    category: "renewables",
    family: "energy",
  },
  {
    id: "solar_charge_controller",
    category: "renewables",
    family: "energy",
  },
  {
    id: "battery_energy_storage_system",
    category: "renewables",
    family: "energy",
  },
  {
    id: "battery_management_system",
    category: "renewables",
    family: "energy",
  },
  {
    id: "bidirectional_inverter",
    category: "renewables",
    family: "energy",
  },
  {
    id: "solar_thermal_collector",
    category: "renewables",
    family: "energy",
  },
  {
    id: "solar_tracker",
    category: "renewables",
    family: "energy",
  },
  {
    id: "wind_turbine",
    category: "renewables",
    family: "energy",
  },
  {
    id: "ac_ev_charger",
    category: "renewables",
    family: "energy",
  },
  {
    id: "dc_ev_charger",
    category: "renewables",
    family: "energy",
  },
  {
    id: "vehicle_to_grid_charger",
    category: "renewables",
    family: "energy",
  },
  {
    id: "ev_load_controller",
    category: "renewables",
    family: "energy",
  },
  {
    id: "energy_diverter",
    category: "renewables",
    family: "energy",
  },
  {
    id: "water_meter",
    category: "water_supply",
    family: "meter",
  },
  {
    id: "water_flow_sensor",
    category: "water_supply",
    family: "sensor",
  },
  {
    id: "water_pressure_sensor",
    category: "water_supply",
    family: "sensor",
  },
  {
    id: "water_supply_pump",
    category: "water_supply",
    family: "pump",
  },
  {
    id: "booster_pump",
    category: "water_supply",
    family: "pump",
  },
  {
    id: "hot_water_circulation_pump",
    category: "water_supply",
    family: "pump",
  },
  {
    id: "borehole_pump",
    category: "water_supply",
    family: "pump",
  },
  {
    id: "water_tank",
    category: "water_supply",
    family: "tank",
  },
  {
    id: "tank_level_sensor",
    category: "water_supply",
    family: "tank",
  },
  {
    id: "float_switch",
    category: "water_supply",
    family: "presence",
  },
  {
    id: "water_heater",
    category: "water_supply",
    family: "climate",
  },
  {
    id: "calorifier",
    category: "water_supply",
    family: "plant",
  },
  {
    id: "expansion_vessel",
    category: "water_supply",
    family: "tank",
  },
  {
    id: "water_leak_detector",
    category: "water_supply",
    family: "safety",
  },
  {
    id: "leak_detection_cable",
    category: "water_supply",
    family: "safety",
  },
  {
    id: "motorized_ball_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "motorized_butterfly_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "solenoid_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "modulating_control_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "two_way_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "three_way_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "pressure_independent_control_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "pressure_reducing_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "thermostatic_mixing_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "balancing_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "isolation_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "emergency_shutoff_valve",
    category: "valves",
    family: "safety",
  },
  {
    id: "valve_position_sensor",
    category: "valves",
    family: "sensor",
  },
  {
    id: "backflow_prevention_monitor",
    category: "valves",
    family: "sensor",
  },
  {
    id: "energy_valve",
    category: "valves",
    family: "valve",
  },
  {
    id: "sump_pump",
    category: "drainage",
    family: "pump",
  },
  {
    id: "drainage_pump",
    category: "drainage",
    family: "pump",
  },
  {
    id: "sewage_pump",
    category: "drainage",
    family: "pump",
  },
  {
    id: "sewage_ejector",
    category: "drainage",
    family: "pump",
  },
  {
    id: "macerator",
    category: "drainage",
    family: "pump",
  },
  {
    id: "lift_station",
    category: "drainage",
    family: "pump",
  },
  {
    id: "septic_tank_monitor",
    category: "drainage",
    family: "tank",
  },
  {
    id: "grease_interceptor_monitor",
    category: "drainage",
    family: "tank",
  },
  {
    id: "oil_separator_monitor",
    category: "drainage",
    family: "tank",
  },
  {
    id: "wastewater_level_sensor",
    category: "drainage",
    family: "tank",
  },
  {
    id: "effluent_meter",
    category: "drainage",
    family: "meter",
  },
  {
    id: "aeration_blower",
    category: "drainage",
    family: "fan",
  },
  {
    id: "sludge_pump",
    category: "drainage",
    family: "pump",
  },
  {
    id: "sewage_treatment_plant",
    category: "drainage",
    family: "plant",
  },
  {
    id: "water_softener",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "water_filter",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "sand_filter",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "activated_carbon_filter",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "reverse_osmosis_unit",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "ultrafiltration_unit",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "uv_disinfection_unit",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "ozone_generator",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "chlorinator",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "dosing_pump",
    category: "water_treatment",
    family: "pump",
  },
  {
    id: "ph_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "orp_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "conductivity_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "total_dissolved_solids_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "turbidity_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "chlorine_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "dissolved_oxygen_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "salinity_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "water_hardness_sensor",
    category: "water_treatment",
    family: "quality",
  },
  {
    id: "fire_alarm_control_panel",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "smoke_detector",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "heat_detector",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "multisensor_fire_detector",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "flame_detector",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "beam_smoke_detector",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "aspirating_smoke_detector",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "manual_call_point",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "fire_alarm_sounder",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "fire_alarm_beacon",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "voice_evacuation_system",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "fire_alarm_interface_module",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "fire_alarm_repeater",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "fire_alarm_gateway",
    category: "fire_detection",
    family: "safety",
  },
  {
    id: "fire_pump",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "jockey_pump",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "fire_pump_controller",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "fire_water_tank",
    category: "fire_protection",
    family: "tank",
  },
  {
    id: "sprinkler_flow_switch",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "valve_tamper_switch",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "fire_extinguisher_monitor",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "clean_agent_suppression_panel",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "water_mist_system",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "fire_damper",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "smoke_damper",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "smoke_extract_fan",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "stair_pressurization_fan",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "smoke_control_panel",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "fire_door_hold_open_device",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "emergency_lighting_test_system",
    category: "fire_protection",
    family: "safety",
  },
  {
    id: "gas_meter",
    category: "gas",
    family: "meter",
  },
  {
    id: "gas_pressure_sensor",
    category: "gas",
    family: "sensor",
  },
  {
    id: "natural_gas_detector",
    category: "gas",
    family: "safety",
  },
  {
    id: "lpg_detector",
    category: "gas",
    family: "safety",
  },
  {
    id: "hydrogen_detector",
    category: "gas",
    family: "safety",
  },
  {
    id: "ammonia_detector",
    category: "gas",
    family: "safety",
  },
  {
    id: "oxygen_deficiency_monitor",
    category: "gas",
    family: "safety",
  },
  {
    id: "gas_shutoff_valve",
    category: "gas",
    family: "safety",
  },
  {
    id: "gas_regulator_monitor",
    category: "gas",
    family: "sensor",
  },
  {
    id: "gas_manifold_monitor",
    category: "gas",
    family: "sensor",
  },
  {
    id: "lpg_tank_level_sensor",
    category: "gas",
    family: "tank",
  },
  {
    id: "fuel_tank_monitor",
    category: "gas",
    family: "tank",
  },
  {
    id: "smart_lock",
    category: "access",
    family: "access",
  },
  {
    id: "door_access_controller",
    category: "access",
    family: "access",
  },
  {
    id: "electric_strike",
    category: "access",
    family: "access",
  },
  {
    id: "electromagnetic_lock",
    category: "access",
    family: "access",
  },
  {
    id: "door_contact_sensor",
    category: "access",
    family: "presence",
  },
  {
    id: "request_to_exit_sensor",
    category: "access",
    family: "presence",
  },
  {
    id: "exit_button",
    category: "access",
    family: "presence",
  },
  {
    id: "card_reader",
    category: "access",
    family: "access",
  },
  {
    id: "rfid_reader",
    category: "access",
    family: "access",
  },
  {
    id: "nfc_reader",
    category: "access",
    family: "access",
  },
  {
    id: "access_keypad",
    category: "access",
    family: "access",
  },
  {
    id: "fingerprint_reader",
    category: "access",
    family: "access",
  },
  {
    id: "facial_recognition_terminal",
    category: "access",
    family: "access",
  },
  {
    id: "automatic_door",
    category: "access",
    family: "shade",
  },
  {
    id: "garage_door",
    category: "access",
    family: "shade",
  },
  {
    id: "roller_door",
    category: "access",
    family: "shade",
  },
  {
    id: "high_speed_door",
    category: "access",
    family: "shade",
  },
  {
    id: "video_intercom",
    category: "access",
    family: "camera",
  },
  {
    id: "smart_doorbell",
    category: "access",
    family: "camera",
  },
  {
    id: "visitor_kiosk",
    category: "access",
    family: "gateway",
  },
  {
    id: "smart_locker",
    category: "access",
    family: "access",
  },
  {
    id: "passenger_elevator",
    category: "transport",
    family: "lift",
  },
  {
    id: "service_elevator",
    category: "transport",
    family: "lift",
  },
  {
    id: "freight_elevator",
    category: "transport",
    family: "lift",
  },
  {
    id: "platform_lift",
    category: "transport",
    family: "lift",
  },
  {
    id: "wheelchair_lift",
    category: "transport",
    family: "lift",
  },
  {
    id: "dumbwaiter",
    category: "transport",
    family: "lift",
  },
  {
    id: "escalator",
    category: "transport",
    family: "lift",
  },
  {
    id: "moving_walkway",
    category: "transport",
    family: "lift",
  },
  {
    id: "vehicle_lift",
    category: "transport",
    family: "lift",
  },
  {
    id: "destination_control_terminal",
    category: "transport",
    family: "lift",
  },
  {
    id: "elevator_monitoring_gateway",
    category: "transport",
    family: "lift",
  },
  {
    id: "ip_camera",
    category: "security",
    family: "camera",
  },
  {
    id: "ptz_camera",
    category: "security",
    family: "camera",
  },
  {
    id: "thermal_camera",
    category: "security",
    family: "camera",
  },
  {
    id: "network_video_recorder",
    category: "security",
    family: "camera",
  },
  {
    id: "digital_video_recorder",
    category: "security",
    family: "camera",
  },
  {
    id: "video_analytics_appliance",
    category: "security",
    family: "camera",
  },
  {
    id: "intrusion_alarm_panel",
    category: "security",
    family: "safety",
  },
  {
    id: "pir_motion_detector",
    category: "security",
    family: "presence",
  },
  {
    id: "microwave_motion_detector",
    category: "security",
    family: "presence",
  },
  {
    id: "glass_break_detector",
    category: "security",
    family: "safety",
  },
  {
    id: "vibration_intrusion_sensor",
    category: "security",
    family: "safety",
  },
  {
    id: "tamper_sensor",
    category: "security",
    family: "safety",
  },
  {
    id: "infrared_perimeter_beam",
    category: "security",
    family: "safety",
  },
  {
    id: "electric_fence_monitor",
    category: "security",
    family: "safety",
  },
  {
    id: "perimeter_radar",
    category: "security",
    family: "presence",
  },
  {
    id: "panic_button",
    category: "security",
    family: "safety",
  },
  {
    id: "duress_button",
    category: "security",
    family: "safety",
  },
  {
    id: "security_siren",
    category: "security",
    family: "safety",
  },
  {
    id: "security_strobe",
    category: "security",
    family: "safety",
  },
  {
    id: "vehicle_barrier",
    category: "parking",
    family: "parking",
  },
  {
    id: "motorized_gate",
    category: "parking",
    family: "parking",
  },
  {
    id: "retractable_bollard",
    category: "parking",
    family: "parking",
  },
  {
    id: "parking_space_lock",
    category: "parking",
    family: "parking",
  },
  {
    id: "turnstile",
    category: "parking",
    family: "parking",
  },
  {
    id: "speed_gate",
    category: "parking",
    family: "parking",
  },
  {
    id: "parking_occupancy_sensor",
    category: "parking",
    family: "presence",
  },
  {
    id: "inductive_loop_detector",
    category: "parking",
    family: "presence",
  },
  {
    id: "vehicle_radar",
    category: "parking",
    family: "presence",
  },
  {
    id: "license_plate_recognition_camera",
    category: "parking",
    family: "camera",
  },
  {
    id: "parking_ticket_dispenser",
    category: "parking",
    family: "gateway",
  },
  {
    id: "parking_payment_terminal",
    category: "parking",
    family: "gateway",
  },
  {
    id: "vehicle_rfid_reader",
    category: "parking",
    family: "access",
  },
  {
    id: "parking_guidance_controller",
    category: "parking",
    family: "gateway",
  },
  {
    id: "parking_guidance_sign",
    category: "parking",
    family: "media",
  },
  {
    id: "parking_space_indicator",
    category: "parking",
    family: "light",
  },
  {
    id: "loading_dock_controller",
    category: "parking",
    family: "gateway",
  },
  {
    id: "occupancy_sensor",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "millimeter_wave_presence_sensor",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "people_counter",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "directional_people_counter",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "desk_occupancy_sensor",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "seat_occupancy_sensor",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "bed_occupancy_sensor",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "room_booking_panel",
    category: "occupancy",
    family: "gateway",
  },
  {
    id: "room_availability_display",
    category: "occupancy",
    family: "media",
  },
  {
    id: "queue_management_terminal",
    category: "occupancy",
    family: "gateway",
  },
  {
    id: "visitor_management_terminal",
    category: "occupancy",
    family: "gateway",
  },
  {
    id: "asset_tracking_tag",
    category: "occupancy",
    family: "presence",
  },
  {
    id: "asset_tracking_gateway",
    category: "occupancy",
    family: "gateway",
  },
  {
    id: "assistance_call_button",
    category: "occupancy",
    family: "safety",
  },
  {
    id: "weather_station",
    category: "weather",
    family: "weather",
  },
  {
    id: "weather_temperature_sensor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "weather_humidity_sensor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "barometer",
    category: "weather",
    family: "sensor",
  },
  {
    id: "anemometer",
    category: "weather",
    family: "weather",
  },
  {
    id: "wind_direction_sensor",
    category: "weather",
    family: "weather",
  },
  {
    id: "rain_sensor",
    category: "weather",
    family: "weather",
  },
  {
    id: "rain_gauge",
    category: "weather",
    family: "weather",
  },
  {
    id: "solar_irradiance_sensor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "uv_sensor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "lightning_detector",
    category: "weather",
    family: "safety",
  },
  {
    id: "frost_sensor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "snow_sensor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "flood_sensor",
    category: "weather",
    family: "safety",
  },
  {
    id: "roof_drain_monitor",
    category: "weather",
    family: "sensor",
  },
  {
    id: "irrigation_controller",
    category: "irrigation",
    family: "irrigation",
  },
  {
    id: "irrigation_valve",
    category: "irrigation",
    family: "valve",
  },
  {
    id: "irrigation_pump",
    category: "irrigation",
    family: "pump",
  },
  {
    id: "soil_moisture_sensor",
    category: "irrigation",
    family: "sensor",
  },
  {
    id: "soil_temperature_sensor",
    category: "irrigation",
    family: "sensor",
  },
  {
    id: "soil_conductivity_sensor",
    category: "irrigation",
    family: "sensor",
  },
  {
    id: "fertilizer_dosing_system",
    category: "irrigation",
    family: "quality",
  },
  {
    id: "greenhouse_controller",
    category: "irrigation",
    family: "irrigation",
  },
  {
    id: "greenhouse_vent",
    category: "irrigation",
    family: "shade",
  },
  {
    id: "greenhouse_shade",
    category: "irrigation",
    family: "shade",
  },
  {
    id: "grow_light",
    category: "irrigation",
    family: "light",
  },
  {
    id: "hydroponic_controller",
    category: "irrigation",
    family: "irrigation",
  },
  {
    id: "robot_lawn_mower",
    category: "irrigation",
    family: "robot",
  },
  {
    id: "pool_circulation_pump",
    category: "pool",
    family: "pump",
  },
  {
    id: "pool_filter",
    category: "pool",
    family: "quality",
  },
  {
    id: "pool_heater",
    category: "pool",
    family: "climate",
  },
  {
    id: "pool_heat_pump",
    category: "pool",
    family: "climate",
  },
  {
    id: "pool_chlorinator",
    category: "pool",
    family: "quality",
  },
  {
    id: "pool_dosing_controller",
    category: "pool",
    family: "quality",
  },
  {
    id: "pool_level_sensor",
    category: "pool",
    family: "tank",
  },
  {
    id: "pool_cover",
    category: "pool",
    family: "shade",
  },
  {
    id: "pool_light",
    category: "pool",
    family: "light",
  },
  {
    id: "fountain_pump",
    category: "pool",
    family: "pump",
  },
  {
    id: "spa_controller",
    category: "pool",
    family: "climate",
  },
  {
    id: "sauna_controller",
    category: "pool",
    family: "climate",
  },
  {
    id: "steam_room_controller",
    category: "pool",
    family: "climate",
  },
  {
    id: "washing_machine",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "clothes_dryer",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "dishwasher",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "refrigerator",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "freezer",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "cold_room_controller",
    category: "appliances",
    family: "climate",
  },
  {
    id: "refrigerated_display_case",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "ice_machine",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "oven",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "microwave_oven",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "induction_hob",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "smart_cooker_hood",
    category: "appliances",
    family: "fan",
  },
  {
    id: "air_fryer",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "smart_kettle",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "coffee_machine",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "water_dispenser",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "vending_machine",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "commercial_warewasher",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "blast_chiller",
    category: "appliances",
    family: "appliance",
  },
  {
    id: "robot_vacuum",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "robot_mop",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "floor_scrubber",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "window_cleaning_robot",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "delivery_robot",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "inspection_robot",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "security_robot",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "robot_docking_station",
    category: "cleaning",
    family: "robot",
  },
  {
    id: "smart_waste_bin",
    category: "cleaning",
    family: "tank",
  },
  {
    id: "waste_fill_level_sensor",
    category: "cleaning",
    family: "tank",
  },
  {
    id: "waste_compactor",
    category: "cleaning",
    family: "appliance",
  },
  {
    id: "waste_chute_controller",
    category: "cleaning",
    family: "gateway",
  },
  {
    id: "soap_dispenser_monitor",
    category: "cleaning",
    family: "tank",
  },
  {
    id: "paper_dispenser_monitor",
    category: "cleaning",
    family: "tank",
  },
  {
    id: "smart_tap",
    category: "cleaning",
    family: "valve",
  },
  {
    id: "smart_toilet",
    category: "cleaning",
    family: "appliance",
  },
  {
    id: "smart_urinal",
    category: "cleaning",
    family: "appliance",
  },
  {
    id: "smart_television",
    category: "av",
    family: "media",
  },
  {
    id: "commercial_display",
    category: "av",
    family: "media",
  },
  {
    id: "digital_signage_player",
    category: "av",
    family: "media",
  },
  {
    id: "projector",
    category: "av",
    family: "media",
  },
  {
    id: "motorized_projection_screen",
    category: "av",
    family: "shade",
  },
  {
    id: "smart_speaker",
    category: "av",
    family: "media",
  },
  {
    id: "amplifier",
    category: "av",
    family: "media",
  },
  {
    id: "av_receiver",
    category: "av",
    family: "media",
  },
  {
    id: "audio_dsp",
    category: "av",
    family: "media",
  },
  {
    id: "audio_matrix",
    category: "av",
    family: "media",
  },
  {
    id: "video_matrix",
    category: "av",
    family: "media",
  },
  {
    id: "paging_system",
    category: "av",
    family: "media",
  },
  {
    id: "background_music_system",
    category: "av",
    family: "media",
  },
  {
    id: "conference_room_system",
    category: "av",
    family: "media",
  },
  {
    id: "video_wall_controller",
    category: "av",
    family: "media",
  },
  {
    id: "voice_assistant",
    category: "av",
    family: "media",
  },
  {
    id: "master_clock",
    category: "av",
    family: "gateway",
  },
  {
    id: "slave_clock",
    category: "av",
    family: "gateway",
  },
  {
    id: "server",
    category: "it",
    family: "network",
  },
  {
    id: "network_switch",
    category: "it",
    family: "network",
  },
  {
    id: "poe_switch",
    category: "it",
    family: "network",
  },
  {
    id: "router",
    category: "it",
    family: "network",
  },
  {
    id: "firewall_appliance",
    category: "it",
    family: "network",
  },
  {
    id: "wireless_access_point",
    category: "it",
    family: "network",
  },
  {
    id: "network_attached_storage",
    category: "it",
    family: "network",
  },
  {
    id: "rack_power_distribution_unit",
    category: "it",
    family: "power",
  },
  {
    id: "rack_environmental_monitor",
    category: "it",
    family: "network",
  },
  {
    id: "rack_lock",
    category: "it",
    family: "access",
  },
  {
    id: "rack_door_sensor",
    category: "it",
    family: "presence",
  },
  {
    id: "crac_unit",
    category: "it",
    family: "climate",
  },
  {
    id: "crah_unit",
    category: "it",
    family: "climate",
  },
  {
    id: "in_row_cooling_unit",
    category: "it",
    family: "climate",
  },
  {
    id: "liquid_cooling_distribution_unit",
    category: "it",
    family: "plant",
  },
  {
    id: "data_center_leak_detector",
    category: "it",
    family: "safety",
  },
  {
    id: "rack_temperature_sensor",
    category: "it",
    family: "sensor",
  },
  {
    id: "vibration_sensor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "accelerometer",
    category: "specialist",
    family: "condition",
  },
  {
    id: "tilt_sensor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "strain_gauge",
    category: "specialist",
    family: "condition",
  },
  {
    id: "crack_sensor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "displacement_sensor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "load_cell",
    category: "specialist",
    family: "condition",
  },
  {
    id: "seismic_sensor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "corrosion_sensor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "bearing_temperature_sensor",
    category: "specialist",
    family: "sensor",
  },
  {
    id: "motor_condition_monitor",
    category: "specialist",
    family: "condition",
  },
  {
    id: "air_compressor",
    category: "specialist",
    family: "plant",
  },
  {
    id: "compressed_air_dryer",
    category: "specialist",
    family: "plant",
  },
  {
    id: "vacuum_pump",
    category: "specialist",
    family: "pump",
  },
  {
    id: "medical_gas_alarm_panel",
    category: "specialist",
    family: "safety",
  },
  {
    id: "medical_gas_manifold",
    category: "specialist",
    family: "safety",
  },
  {
    id: "fume_hood_controller",
    category: "specialist",
    family: "fan",
  },
  {
    id: "cleanroom_pressure_monitor",
    category: "specialist",
    family: "sensor",
  },
  {
    id: "laboratory_freezer",
    category: "specialist",
    family: "appliance",
  },
  {
    id: "incubator",
    category: "specialist",
    family: "appliance",
  },
  {
    id: "autoclave",
    category: "specialist",
    family: "appliance",
  },
  {
    id: "sterilizer",
    category: "specialist",
    family: "appliance",
  },
  {
    id: "nurse_call_system",
    category: "specialist",
    family: "safety",
  },
  {
    id: "site_controller",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "direct_digital_controller",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "programmable_logic_controller",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "room_controller",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "remote_i_o_module",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "analog_input_module",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "digital_input_module",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "analog_output_module",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "relay_output_module",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "variable_frequency_drive",
    category: "controllers",
    family: "motor",
  },
  {
    id: "motor_starter",
    category: "controllers",
    family: "motor",
  },
  {
    id: "bacnet_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "modbus_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "knx_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "dali_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "m_bus_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "mqtt_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "zigbee_coordinator",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "z_wave_controller",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "thread_border_router",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "bluetooth_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "lorawan_gateway",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "infrared_bridge",
    category: "controllers",
    family: "gateway",
  },
  {
    id: "rf_bridge",
    category: "controllers",
    family: "gateway",
  },
];
const byId = new Map(DEVICE_CATALOG.map((item) => [item.id, item]));
export const catalogDevice = (id?: string) => (id ? byId.get(id) : undefined);
export const deviceNameKey = (item: CatalogDevice) =>
  `catalog_device_${item.id}` as DashboardTextKey;
export const categoryNameKey = (category: string) =>
  `catalog_category_${category}` as DashboardTextKey;
export function filterCatalog(
  category: string,
  search: string,
  text: (key: DashboardTextKey) => string,
): CatalogDevice[] {
  const words = search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return DEVICE_CATALOG.filter(
    (item) =>
      (!category || item.category === category) &&
      words.every((word) =>
        `${text(deviceNameKey(item))} ${text(categoryNameKey(item.category))} ${item.id.replaceAll("_", " ")} ${item.family}`
          .toLocaleLowerCase()
          .includes(word),
      ),
  );
}
export interface CatalogReading {
  value: number;
  unit: string;
  label: DashboardTextKey;
  min: number;
  max: number;
  step: number;
}
export function catalogReading(item: CatalogDevice): CatalogReading {
  const base = {
    value: 68,
    unit: "%",
    label: "catalog_reading" as DashboardTextKey,
    min: 0,
    max: 100,
    step: 1,
  };
  const id = item.id;
  if (/temperature|thermometer/.test(id)) {
    return { ...base, value: 23.8, unit: "°C", min: -20, max: 80, step: 0.1 };
  }
  if (/carbon_dioxide/.test(id)) {
    return { ...base, value: 520, unit: "ppm", max: 2000 };
  }
  if (/carbon_monoxide|nitrogen_dioxide|chlorine|ammonia|hydrogen/.test(id)) {
    return { ...base, value: 0, unit: "ppm", max: 100 };
  }
  if (/pm2_5|pm10/.test(id)) {
    return { ...base, value: 12, unit: "µg/m³", max: 150 };
  }
  if (/ph_sensor/.test(id)) {
    return { ...base, value: 7.2, unit: "pH", max: 14, step: 0.1 };
  }
  if (/orp/.test(id)) return { ...base, value: 720, unit: "mV", max: 1000 };
  if (/conductivity/.test(id)) {
    return { ...base, value: 450, unit: "µS/cm", max: 2000 };
  }
  if (/turbidity/.test(id)) {
    return { ...base, value: 0.6, unit: "NTU", max: 10, step: 0.1 };
  }
  if (/dissolved_solids|hardness|salinity/.test(id)) {
    return { ...base, value: 180, unit: "ppm", max: 1000 };
  }
  if (/oxygen/.test(id)) return { ...base, value: 20.9, unit: "%", step: 0.1 };
  if (/illuminance|daylight|irradiance/.test(id)) {
    return {
      ...base,
      value: 450,
      unit: id.includes("irradiance") ? "W/m²" : "lx",
      max: 2000,
    };
  }
  if (/voltage/.test(id)) return { ...base, value: 230, unit: "V", max: 260 };
  if (/current_sensor/.test(id)) {
    return { ...base, value: 12.4, unit: "A", max: 100, step: 0.1 };
  }
  if (/barometer/.test(id)) {
    return { ...base, value: 1013, unit: "hPa", min: 900, max: 1100 };
  }
  if (/pressure/.test(id)) {
    return {
      ...base,
      value: 24,
      unit: item.category === "water_supply" ? "kPa" : "Pa",
      max: 100,
    };
  }
  if (/flow|velocity/.test(id)) {
    return {
      ...base,
      value: 2.4,
      unit: id.includes("air") ? "m/s" : "m³/h",
      max: 10,
      step: 0.1,
    };
  }
  if (/vibration|accelerometer/.test(id)) {
    return { ...base, value: 1.2, unit: "mm/s", max: 10, step: 0.1 };
  }
  if (/tilt/.test(id)) {
    return { ...base, value: 0.4, unit: "°", max: 10, step: 0.1 };
  }
  if (/strain/.test(id)) return { ...base, value: 120, unit: "µε", max: 1000 };
  if (/crack|displacement/.test(id)) {
    return { ...base, value: 0.2, unit: "mm", max: 5, step: 0.1 };
  }
  if (/load_cell/.test(id)) {
    return { ...base, value: 250, unit: "kg", max: 1000 };
  }
  if (item.family === "sensor" && !/humidity|moisture/.test(id)) {
    return { ...base, value: 24, unit: "", max: 100 };
  }
  if (item.family === "climate") {
    return {
      ...base,
      value: 23,
      unit: "°C",
      label: "temperature",
      min: 16,
      max: 30,
      step: 0.5,
    };
  }
  if (item.family === "fan") return { ...base, value: 65, label: "fan_speed" };
  if (item.family === "light") {
    return { ...base, value: 75, label: "brightness" };
  }
  if (["valve", "shade", "parking"].includes(item.family)) {
    return { ...base, value: 65, label: "position" };
  }
  if (item.family === "motor") {
    return {
      ...base,
      value: 42,
      unit: "Hz",
      label: "catalog_frequency",
      max: 60,
    };
  }
  if (item.family === "lift") {
    return {
      ...base,
      value: 3,
      unit: "",
      label: "catalog_floor",
      min: 0,
      max: 12,
    };
  }
  if (item.family === "media") return { ...base, value: 35, label: "volume" };
  if (item.family === "meter") {
    return {
      ...base,
      value: 12.8,
      unit: /water|gas|fuel|effluent/.test(id) ? "m³" : "kWh",
      max: 100,
      step: 0.1,
    };
  }
  if (item.family === "energy") {
    return {
      ...base,
      value: 8.4,
      unit: "kW",
      label: "catalog_output",
      max: 20,
      step: 0.1,
    };
  }
  if (item.family === "network") {
    return {
      ...base,
      value: 12,
      unit: "ms",
      label: "catalog_latency",
      max: 100,
    };
  }
  if (item.family === "gateway") {
    return { ...base, value: 16, unit: "", label: "catalog_channels", max: 32 };
  }
  if (item.family === "pump") {
    return {
      ...base,
      value: 2.4,
      unit: "m³/h",
      label: "catalog_flow",
      max: 10,
      step: 0.1,
    };
  }
  if (item.family === "appliance") {
    return { ...base, value: 42, label: "catalog_progress" };
  }
  if (item.family === "tank") {
    return { ...base, value: 68, label: "catalog_level" };
  }
  if (item.family === "weather") {
    return { ...base, value: 11, unit: "km/h", max: 80 };
  }
  return base;
}
