import type { ExternalsScope, ScopedExternals } from "lib/1.domain/externals/externals.contract";
import type { StorageEntry, StorageConfig } from "./storage.contract";
import { Optional } from "../../utils/optional";
import type { ForStoringScopedExternals } from "lib/2.app/driving-ports/for-storing-scoped-externals.port";
import type { Version } from "lib/1.domain";

const createScopedExternalsRepository = (
    {toStorageEntry}: StorageConfig
): ForStoringScopedExternals => {
    const STORAGE: StorageEntry<ScopedExternals> = toStorageEntry("scoped-externals", {  });

    function getScope(scope: string): ExternalsScope|undefined {
        return (STORAGE.get() ?? {})[scope];
    };

    function addExternalToScope(scope: string, external: string, version: Version): void {
        STORAGE.mutate(val => ({
            ...val, 
            [scope]: { ...(val[scope] ?? {}), [external]: version }
        }));
    }   

    return {
        clearScope: function (scope: string) {
            STORAGE.mutate(val => ({...val, [scope]: {}}));
            return this;
        },
        contains: function (scope: string, name: string) {
            return !!getScope(scope)?.[name];
        },
        addExternal: function (scope: string, external: string, version: Version) {
            addExternalToScope(scope, external, version);
            return this;
        },
        tryGetScope: function (name: string) {
            return Optional.of(getScope(name));
        }
    }
}

export {createScopedExternalsRepository};