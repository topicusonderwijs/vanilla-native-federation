import type { Externals, ExternalsScope, SharedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import { Optional } from "../../utils/optional";
import type { ForStoringExternals } from "lib/2.app/driving-ports/for-storing-externals.port";

const createExternalsRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringExternals => {
    const STORAGE: StorageEntry<Externals> = toStorageEntry("externals", {
        "shared": {},
        "scoped": {}
    });

    function getShared()
        : SharedExternals {
            return (STORAGE.get()?.["shared"] ?? {});
        };

    function getScope(scope: string)
        : ExternalsScope|undefined {
            return (STORAGE.get()?.["scoped"] ?? {})[scope];
        };

    function tryGetScope(name: string) 
        : Optional<ExternalsScope> {
            return Optional.of(getScope(name))
        }


    return {tryGetScope, getShared};
}

export {createExternalsRepository};