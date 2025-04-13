import type { SharedExternals, SharedVersion } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForStoringSharedExternals = {
    tryGetVersions: (external: string) => Optional<SharedVersion[]>,
    getAll: () => SharedExternals,
    contains: (external: string) => boolean,
    addOrUpdate: (external: string, versions: SharedVersion[]) => ForStoringSharedExternals,
    set: (externals: SharedExternals) => ForStoringSharedExternals,    
    commit: () => ForStoringSharedExternals
}