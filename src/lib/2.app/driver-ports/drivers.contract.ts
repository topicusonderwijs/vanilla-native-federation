import type { ForCommittingChanges } from "./for-committing-changes.port"
import type { ForDeterminingSharedExternals } from "./for-determining-shared-externals.port"
import type { ForExposingModuleLoader } from "./for-exposing-module-loader.port"
import type { ForGeneratingImportMap } from "./for-generating-import-map"
import type { ForGettingRemoteEntries } from "./for-getting-remote-entries.port"
import type { ForSavingRemoteEntries } from "./for-saving-remote-entries.port"

export type DriversContract = {
    getRemoteEntries: ForGettingRemoteEntries,
    saveRemoteEntries: ForSavingRemoteEntries,
    determineSharedExternals: ForDeterminingSharedExternals,
    generateImportMap: ForGeneratingImportMap,
    commitChanges: ForCommittingChanges,
    exposeModuleLoader: ForExposingModuleLoader
}