import type { SharedExternal, SharedExternals, SharedVersion } from "lib/1.domain";
import type { Optional } from "lib/utils/optional";

export type ForSharedExternalsStorage = {
    tryGetVersions: (external: string) => Optional<SharedVersion[]>,
    getAll: () => SharedExternals,
    addOrUpdate: (name: string, external: SharedExternal) => ForSharedExternalsStorage,
    commit: () => ForSharedExternalsStorage
}