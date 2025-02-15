import type { LogHandler, LogType } from "../../handlers/logging/log.contract"
import type { NfCache, StorageEntryCreator } from "../../handlers/storage/storage.contract"


type StorageConfig<TCache extends NfCache = NfCache> = {
    cache: TCache,
    toStorageEntry: StorageEntryCreator,
}

type LoggingConfig = {
    logger: LogHandler,
    logLevel: LogType,
}

type BuilderType = 'vite'|'default';

type ModuleLoaderConfig = {
    builderType: BuilderType,
    importMapType: string,
    loadModuleFn: (url: string) => unknown
}

type Config<TCache extends NfCache = NfCache> = StorageConfig<TCache> & LoggingConfig & ModuleLoaderConfig

export { Config, StorageConfig, LoggingConfig, BuilderType, ModuleLoaderConfig }