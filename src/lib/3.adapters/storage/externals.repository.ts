import type { Externals, ExternalsScope } from "lib/1.domain/externals/externals.contract";
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

    // function getShared(dep: string)
    //     : SharedVersion[]|undefined {
    //         return (STORAGE.get()?.["shared"] ?? {})[dep];
    //     };

    function getScope(scope: string)
        : ExternalsScope|undefined {
            return (STORAGE.get()?.["scoped"] ?? {})[scope];
        };

    function tryGetScope(name: string) 
        : Optional<ExternalsScope> {
            return Optional.of(getScope(name))
        }


    return {tryGetScope};
}

export {createExternalsRepository};