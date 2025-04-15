import type { LogHandler } from "lib/2.app/config/log.contract"
import type { StorageEntryHandler } from "./storage.contract"
import type { ImportMapHandler } from "./import-map.contract"

export type ConfigHandlers = {
    log: LogHandler,
    storage: StorageEntryHandler,
    importMap: ImportMapHandler
}