import type { LogHandler, LogType } from "../../handlers/logging/log.contract"
import type { NfCache, StorageEntryCreator } from "../../handlers/storage/storage.contract"

type BuilderType = 'vite'|'default';

type StorageConfig<TCache extends NfCache = NfCache> = {
    cache: TCache,
    toStorageEntry: StorageEntryCreator,
}

type LoggingConfig = {
    logger: LogHandler,
    logLevel: LogType,
}

type BuilderConfig = {
    builderType: BuilderType
}

type Config<TCache extends NfCache = NfCache> = StorageConfig<TCache> & LoggingConfig & BuilderConfig

export { Config, StorageConfig, LoggingConfig, BuilderConfig }