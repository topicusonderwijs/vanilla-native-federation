import type { SharedExternal, SharedExternals, SharedVersion } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForStoringSharedExternalsStorage = {
    tryGetVersions: (external: string) => Optional<SharedVersion[]>,
    getAll: () => SharedExternals,
    contains: (external: string) => boolean,
    addOrUpdate: (name: string, external: SharedExternal) => ForStoringSharedExternalsStorage,
    set: (externals: SharedExternals) => ForStoringSharedExternalsStorage,    
    commit: () => ForStoringSharedExternalsStorage
}