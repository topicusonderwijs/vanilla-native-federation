import type { LoggingConfig, LoggingOptions } from 'lib/2.app/config/log.contract';
import type { StorageConfig, StorageOptions } from './storage.contract';
import type { ImportMapConfig, ImportMapOptions } from './import-map.contract';
import type { HostConfig, HostOptions } from './host.contract';
import type { ModeConfig, ModeOptions } from './mode.contract';

export type ConfigContract = StorageConfig &
  LoggingConfig &
  ImportMapConfig &
  HostConfig &
  ModeConfig;

export type NFOptions = StorageOptions &
  LoggingOptions &
  ImportMapOptions &
  HostOptions &
  ModeOptions;
