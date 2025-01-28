import type { LogHandler, LogType } from "../../handlers/logging/log.contract"
import type { NfCache, StorageEntryCreator } from "../../handlers/storage/storage.contract"

type Config<TCache extends NfCache = NfCache> = {
    cache: TCache,
    storage: StorageEntryCreator,
    logger: LogHandler,
    logLevel: LogType
}

export { Config }