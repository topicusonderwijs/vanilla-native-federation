import type { ForDeterminingSharedExternals } from "./for-determining-shared-externals.port"
import type { ForGettingRemoteEntries } from "./for-getting-remote-entries.port"
import type { ForSavingRemoteEntries } from "./for-saving-remote-entries.port"

export type DriversContract = {
    getRemoteEntries: ForGettingRemoteEntries,
    saveRemoteEntries: ForSavingRemoteEntries,
    determineSharedExternals: ForDeterminingSharedExternals,
    // generateImportMap: ForGeneratingImportMap,
}