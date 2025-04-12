import type { ExternalsScope, Version } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForStoringScopedExternals = {
    tryGetScope: (scope: string) => Optional<ExternalsScope>,
    contains: (scope: string, external: string) => boolean,
    clearScope: (scope: string) => ForStoringScopedExternals,
    addExternal: (scope: string, external: string, version: Version) => ForStoringScopedExternals
}