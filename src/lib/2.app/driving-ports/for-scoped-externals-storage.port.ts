import type { ScopedExternals, Version } from "lib/1.domain/public_api";

export type ForScopedExternalsStorage = {
    addExternal: (scope: string, external: string, version: Version) => ForScopedExternalsStorage,
    getAll: () => ScopedExternals,
    commit: () => ForScopedExternalsStorage

}