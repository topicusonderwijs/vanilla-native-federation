import type { ExternalsScope, ScopedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import { Optional } from "../../utils/optional";
import type { ForStoringScopedExternals } from "lib/2.app/driving-ports/for-storing-scoped-externals.port";

const createScopedExternalsRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringScopedExternals => {
    const STORAGE: StorageEntry<ScopedExternals> = toStorageEntry("scoped-externals", {  });

    function getScope(scope: string)
        : ExternalsScope|undefined {
            return (STORAGE.get() ?? {})[scope];
        };

    function contains(scope: string, name: string)
        : boolean {
            return !!getScope(scope)?.[name];
        };

    function tryGetScope(name: string) 
        : Optional<ExternalsScope> {
            return Optional.of(getScope(name))
        }

    

    return {tryGetScope, contains};
}

export {createScopedExternalsRepository};