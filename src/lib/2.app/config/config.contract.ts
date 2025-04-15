import type { LoggingConfig } from "lib/2.app/config/log.contract"
import type { StorageEntryHandler } from "./storage.contract"
import type { ImportMapConfig } from "./import-map.contract"
import type { HostConfig } from "./host.contract"

export type Config = {
    storage: StorageEntryHandler,
} & LoggingConfig & ImportMapConfig & HostConfig

export type Options = Partial<Config> 