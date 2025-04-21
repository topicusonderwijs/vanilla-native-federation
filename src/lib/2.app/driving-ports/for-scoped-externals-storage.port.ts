import type { ScopedExternals, Version } from "lib/1.domain";

export type ForScopedExternalsStorage = {
    addExternal: (scope: string, external: string, version: Version) => ForScopedExternalsStorage,
    getAll: () => ScopedExternals,
    commit: () => ForScopedExternalsStorage

}