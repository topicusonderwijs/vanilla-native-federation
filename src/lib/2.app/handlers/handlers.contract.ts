import type { LogHandler } from "lib/2.app/handlers/log.contract"
import type { StorageEntryHandler } from "./storage.contract"
import type { PathHandler } from "./path.contract"

export type HandlersContract = {
    log: LogHandler,
    storage: StorageEntryHandler,
    path: PathHandler
}