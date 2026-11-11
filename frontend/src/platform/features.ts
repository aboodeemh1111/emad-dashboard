// Home Assistant feature contracts (Apache-2.0); see NOTICE.

export enum ClimateEntityFeature {
  TARGET_TEMPERATURE = 1,
  TARGET_TEMPERATURE_RANGE = 2,
  TARGET_HUMIDITY = 4,
  FAN_MODE = 8,
  PRESET_MODE = 16,
  SWING_MODE = 32,
  AUX_HEAT = 64,
  TURN_OFF = 128,
  TURN_ON = 256,
  SWING_HORIZONTAL_MODE = 512,
}

export enum CoverEntityFeature {
  OPEN = 1,
  CLOSE = 2,
  SET_POSITION = 4,
  STOP = 8,
  OPEN_TILT = 16,
  CLOSE_TILT = 32,
  STOP_TILT = 64,
  SET_TILT_POSITION = 128,
}

export enum MediaPlayerEntityFeature {
  PAUSE = 1,
  SEEK = 2,
  VOLUME_SET = 4,
  VOLUME_MUTE = 8,
  PREVIOUS_TRACK = 16,
  NEXT_TRACK = 32,

  TURN_ON = 128,
  TURN_OFF = 256,
  PLAY_MEDIA = 512,
  VOLUME_STEP = 1024,
  SELECT_SOURCE = 2048,
  STOP = 4096,
  CLEAR_PLAYLIST = 8192,
  PLAY = 16384,
  SHUFFLE_SET = 32768,
  SELECT_SOUND_MODE = 65536,
  BROWSE_MEDIA = 131072,
  REPEAT_SET = 262144,
  GROUPING = 524288,
}

export enum FanEntityFeature {
  SET_SPEED = 1,
  OSCILLATE = 2,
  DIRECTION = 4,
  PRESET_MODE = 8,
  TURN_OFF = 16,
  TURN_ON = 32,
}

export enum VacuumEntityFeature {
  TURN_ON = 1,
  TURN_OFF = 2,
  PAUSE = 4,
  STOP = 8,
  RETURN_HOME = 16,
  FAN_SPEED = 32,
  BATTERY = 64,
  STATUS = 128,
  SEND_COMMAND = 256,
  LOCATE = 512,
  CLEAN_SPOT = 1024,
  MAP = 2048,
  STATE = 4096,
  START = 8192,
  CLEAN_AREA = 16384,
}
