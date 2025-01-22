import type { Config } from "./config.contract"
import { noopLogger } from "../../handlers/logging/noop.logger"
import { DEFAULT_STORAGE } from "../../handlers/storage/default-storage"
import type { NfStorage, StorageExtension } from "../../handlers/storage/storage.contract"

const defaultConfig = (o: Partial<Config<NfStorage & StorageExtension>>): Config<NfStorage & StorageExtension> => {
    return {
        cache: o.cache ?? DEFAULT_STORAGE,
        logger: o.logger ?? noopLogger,
        logLevel: o.logLevel ?? "error"
    }
}

export { defaultConfig}