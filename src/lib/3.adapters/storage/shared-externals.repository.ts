import type { SharedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import type { ForStoringSharedExternals } from "lib/2.app/driving-ports/for-storing-shared-externals.port";
import type { SharedVersion } from "lib/1.domain";
import { Optional } from "../../utils/optional";

const createSharedExternalsRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringSharedExternals => {
    const STORAGE: StorageEntry<SharedExternals> = toStorageEntry("shared-externals", {});

    function get(external: string): SharedVersion[]|undefined {
        return (STORAGE.get() ?? {})[external];
    };

    const addOrUpdateExternal = (external: string, version: SharedVersion[]) => (cache: SharedExternals) => {
        cache[external] = version;
        return cache;
    }

    return {
        getAll: function () {
            return STORAGE.get();
        }, 
        contains: function (external: string) {
            const versions = get(external);
            return !!versions && versions.length > 0;
        },
        addOrUpdate: function (external: string, versions: SharedVersion[]) {
            STORAGE.mutate(addOrUpdateExternal(external,versions));
            return this;
        },
        tryGetVersions: function (external: string) {
            return Optional.of(get(external));
        },
        set: function (externals: SharedExternals) {
            STORAGE.set(externals);
            return this;
        }
    };
}

export {createSharedExternalsRepository};