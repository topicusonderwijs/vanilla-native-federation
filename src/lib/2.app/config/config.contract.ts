import type { LoggingConfig } from "lib/2.app/config/log.contract"
import type { StorageConfig } from "./storage.contract"
import type { ImportMapConfig } from "./import-map.contract"
import type { HostConfig } from "./host.contract"
import type { ModeConfig } from "./mode.contract"

export type Config = StorageConfig & LoggingConfig & ImportMapConfig & HostConfig & ModeConfig

export type Options = Partial<Config> 