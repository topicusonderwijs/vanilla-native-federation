import type { ScopedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageEntryHandler } from "../../2.app/handlers/storage.contract";
import { Optional } from "../../utils/optional";
import type { ForStoringScopedExternals } from "lib/2.app/driving-ports/for-storing-scoped-externals.port";
import type { Version } from "lib/1.domain";

const createScopedExternalsRepository = (
    handle: {storage: StorageEntryHandler},
): ForStoringScopedExternals => {
    const STORAGE: StorageEntry<ScopedExternals> = handle.storage("scoped-externals", {  });
    
    const _cache: ScopedExternals = STORAGE.get();

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