import type { SharedExternal, SharedExternals } from "lib/1.domain/externals/external.contract";
import type { StorageConfig, StorageEntry } from "lib/2.app/config/storage.contract";
import type { ForSharedExternalsStorage } from "lib/2.app/driving-ports/for-shared-externals-storage.port";
import { Optional } from "lib/utils/optional";

const createSharedExternalsRepository = (
    config: StorageConfig,
): ForSharedExternalsStorage => {
    const STORAGE: StorageEntry<SharedExternals> = config.storage(config.storageNamespace)("shared-externals", {});

    if (config.clearStorage) STORAGE.clear();

    const _cache: SharedExternals = STORAGE.get()!;

    return {
        getAll: function () {
            return {..._cache};
        },
        addOrUpdate: function (externalName: string, external: SharedExternal) {
            _cache[externalName] = external;
            return this;
        },
        tryGetVersions: function (external: string) {
            return Optional.of(_cache[external]?.versions);
        },
        commit: function () {
            STORAGE.set(_cache);
            return this;
        }
    };
}

export {createSharedExternalsRepository};