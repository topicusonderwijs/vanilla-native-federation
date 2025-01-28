import type { Config } from "./config.contract"
import { noopLogger } from "../../handlers/logging/noop.logger"
import { globalThisStorageEntry } from "../../handlers/storage/global-this-storage"
import { createCache, type NfCache } from "../../handlers/storage/storage.contract"

const defaultConfig = <TCache extends NfCache>(o: Partial<Config<TCache>>): Config<TCache> => {
    return {
        cache: (o.cache ?? createCache()) as TCache,
        storageType: o.storageType ?? globalThisStorageEntry,
        logger: o.logger ?? noopLogger,
        logLevel: o.logLevel ?? "error"
    }
}

export { defaultConfig}
