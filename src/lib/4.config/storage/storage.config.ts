import type { StorageConfig } from "lib/2.app";
import { globalThisStorageEntry } from "./global-this.storage";
import type { StorageOptions } from "lib/2.app/config/storage.contract";

export const createStorageConfig = (override: StorageOptions): StorageConfig => ({
    storage: globalThisStorageEntry,
    clearCache: false,
    ...override
});