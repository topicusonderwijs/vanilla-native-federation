import type { ExternalsScope, ScopedExternals, Version } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForScopedExternalsStorage = {
    tryGetScope: (scope: string) => Optional<ExternalsScope>,
    contains: (scope: string, external: string) => boolean,
    clearScope: (scope: string) => ForScopedExternalsStorage,
    addExternal: (scope: string, external: string, version: Version) => ForScopedExternalsStorage,
    getAll: () => ScopedExternals,
    commit: () => ForScopedExternalsStorage

}