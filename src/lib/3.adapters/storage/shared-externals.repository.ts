import type { SharedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import type { ForStoringSharedExternals } from "lib/2.app/driving-ports/for-storing-shared-externals.port";
import type { SharedVersion } from "lib/1.domain";

const createSharedExternalsRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringSharedExternals => {
    const STORAGE: StorageEntry<SharedExternals> = toStorageEntry("shared-externals", {});

    function get(externalName: string)
        : SharedVersion[]|undefined {
            return (STORAGE.get() ?? {})[externalName];
        };
    function getAll()
        : SharedExternals {
            return (STORAGE.get() ?? {});
        };

    function contains(name: string)
        : boolean {
            const versions = get(name);
            return !!versions && versions.length > 0;
        };

    return {getAll, contains};
}

export {createSharedExternalsRepository};