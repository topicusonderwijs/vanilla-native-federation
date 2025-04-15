import type { SharedExternal, SharedExternals, SharedVersion } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForStoringSharedExternals = {
    tryGetVersions: (external: string) => Optional<SharedVersion[]>,
    getAll: () => SharedExternals,
    contains: (external: string) => boolean,
    addOrUpdate: (name: string, external: SharedExternal) => ForStoringSharedExternals,
    set: (externals: SharedExternals) => ForStoringSharedExternals,    
    commit: () => ForStoringSharedExternals
}