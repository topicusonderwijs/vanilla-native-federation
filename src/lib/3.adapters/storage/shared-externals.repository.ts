import { type SharedExternal, type SharedExternals, GLOBAL_SCOPE } from "lib/1.domain/externals/external.contract";
import type { StorageConfig, StorageEntry } from "lib/2.app/config/storage.contract";
import type { ForSharedExternalsStorage } from "lib/2.app/driving-ports/for-shared-externals-storage.port";
import { Optional } from "lib/utils/optional";

const createSharedExternalsRepository = (
    config: StorageConfig,
): ForSharedExternalsStorage => {
    const STORAGE: StorageEntry<SharedExternals> = config.storage<SharedExternals>("shared-externals", {[GLOBAL_SCOPE]: {}});

    if (config.clearStorage) STORAGE.clear();

    const _cache: SharedExternals = STORAGE.get()!;

    return {
        getAll: function (sharedScope?: string) {
            return {..._cache[sharedScope ?? GLOBAL_SCOPE]};
        },
        addOrUpdate: function (externalName: string, external: SharedExternal, sharedScope?: string) {
            if(!_cache[sharedScope ?? GLOBAL_SCOPE]) _cache[sharedScope ?? GLOBAL_SCOPE] = {};
            _cache[sharedScope ?? GLOBAL_SCOPE]![externalName] = external;
            return this;
        },
        getScopes: function(o = {includeGlobal: true}) {
            if (o.includeGlobal) return Object.keys(_cache);
            return Object.keys(_cache).filter(s => s !== GLOBAL_SCOPE);
        },
        tryGetVersions: function (external: string, sharedScope?: string) {
            return Optional.of(_cache[sharedScope ?? GLOBAL_SCOPE]?.[external]?.versions);
        },
        commit: function () {
            STORAGE.set(_cache);
            return this;
        }
    };
}

export {createSharedExternalsRepository};