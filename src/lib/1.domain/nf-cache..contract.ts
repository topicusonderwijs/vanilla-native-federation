import type { ScopedExternals, SharedExternals } from "./externals/externals.contract"
import type { Remotes } from "./remote/remote-info.contract"

export type NFCache = {
    "remotes": Remotes,
    "shared-externals": SharedExternals,
    "scoped-externals": ScopedExternals
}