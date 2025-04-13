import type { SharedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageEntryHandler } from "lib/2.app/handlers/storage.contract";
import type { ForStoringSharedExternals } from "lib/2.app/driving-ports/for-storing-shared-externals.port";
import type { SharedVersion } from "lib/1.domain";
import { Optional } from "../../utils/optional";

const createSharedExternalsRepository = (
    handle: {storage: StorageEntryHandler},
): ForStoringSharedExternals => {
    const STORAGE: StorageEntry<SharedExternals> = handle.storage("shared-externals", {});
    let _cache: SharedExternals = STORAGE.get();

    return {
        getAll: function () {
            return {..._cache};
        }, 
        contains: function (external: string) {
            const versions = _cache[external];
            return !!versions && versions.length > 0;
        },
        addOrUpdate: function (external: string, versions: SharedVersion[]) {
            _cache[external] = versions;
            return this;
        },
        tryGetVersions: function (external: string) {
            return Optional.of(_cache[external]);
        },
        set: function (externals: SharedExternals) {
            _cache = {...externals};
            return this;
        },
        commit: function () {
            STORAGE.set(_cache);
            return this;
        }
    };
}

export {createSharedExternalsRepository};