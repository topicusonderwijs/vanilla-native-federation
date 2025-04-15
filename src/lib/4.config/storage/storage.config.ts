import type { StorageConfig } from "lib/2.app";
import { globalThisStorageEntry } from "./global-this.storage";

export const createStorageConfig = (override: Partial<StorageConfig>): StorageConfig => ({
    storage: globalThisStorageEntry,
    ...override
});