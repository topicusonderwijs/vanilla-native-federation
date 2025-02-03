import type { LogHandler, LogType } from "../../handlers/logging/log.contract"
import type { NfCache, StorageEntryCreator } from "../../handlers/storage/storage.contract"

type BuilderType = 'vite'|'default';

type Config<TCache extends NfCache = NfCache> = {
    cache: TCache,
    toStorageEntry: StorageEntryCreator,
    logger: LogHandler,
    logLevel: LogType,
    builderType: BuilderType
}

export { Config, BuilderType }