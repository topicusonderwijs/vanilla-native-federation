import type { Config } from "./config.contract"
import { noopLogger } from "../core/logging/noop.logger"
import { globalThisStorageEntry } from "../core/storage/global-this-storage"
import { createCache, type NfCache } from "../core/storage/storage.contract"

const defaultConfig = <TCache extends NfCache>(o: Partial<Config<TCache>>): Config<TCache> => {
    return {
        cache: (o.cache ?? createCache()) as TCache,
        toStorageEntry: o.toStorageEntry ?? globalThisStorageEntry,
        
        logger: o.logger ?? noopLogger,
        logLevel: o.logLevel ?? "error",
        hostRemoteEntry: o.hostRemoteEntry ?? false,
        importMapType: o.importMapType ?? "importmap",
        loadModuleFn: o.loadModuleFn ?? (url => import(url))
    }
}

export { defaultConfig}
