import type { Externals, RemoteName } from "lib/1.domain";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import { Optional } from "../../utils/optional";
import type { ForStoringExternals } from "lib/2.app/driving-ports/for-storing-externals.port";

const createExternalsRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringExternals => {
    const STORAGE: StorageEntry<Record<string, Externals>> = toStorageEntry("externals", {});

    function get(scope: RemoteName)
        : Externals|undefined {
            return (STORAGE.get() ?? {})[scope];
        };

    function tryGetScope(name: RemoteName) 
        : Optional<Externals> {
            return Optional.of(get(name))
        }


    return {tryGetScope};
}

export {createExternalsRepository};