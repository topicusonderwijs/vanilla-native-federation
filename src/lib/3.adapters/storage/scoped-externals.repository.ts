import type { ScopedExternals } from "lib/1.domain/externals/external.contract";
import type { StorageConfig, StorageEntry } from "lib/2.app/config/storage.contract";
import { Optional } from "lib/utils/optional";
import type { ForScopedExternalsStorage } from "lib/2.app/driving-ports/for-scoped-externals-storage.port";
import type { Version } from "lib/1.domain";

const createScopedExternalsRepository = (
    config: StorageConfig,
): ForScopedExternalsStorage => {
    const STORAGE: StorageEntry<ScopedExternals> = config.storage("scoped-externals", {  });
    if (config.clearCache) STORAGE.clear();

    const _cache: ScopedExternals = STORAGE.get() ?? {};

    return {
        clearScope: function (scope: string) {
            _cache[scope] = {};
            return this;
        },
        contains: function (scope: string, name: string) {
            return !!_cache[scope]?.[name];
        },
        addExternal: function (scope: string, external: string, version: Version) {
            if(!_cache[scope]) _cache[scope] = {};
            _cache[scope][external] = version;
            return this;
        },
        tryGetScope: function (scope: string) {
            return Optional.of(_cache[scope]);
        },
        getAll: function () {
            return _cache;
        },
        commit: function () {
            STORAGE.set(_cache);
            return this;
        }
    }
}

export {createScopedExternalsRepository};