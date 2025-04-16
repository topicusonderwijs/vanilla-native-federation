import type { ForCommittingChanges } from "./for-committing-changes.port"
import type { ForDeterminingSharedExternals } from "./for-determining-shared-externals.port"
import type { ForExposingModuleLoader } from "./for-exposing-module-loader.port"
import type { ForGeneratingImportMap } from "./for-generating-import-map"
import type { ForGettingRemoteEntries } from "./for-getting-remote-entries.port"
import type { ForProcessingRemoteEntries } from "./for-processing-remote-entries.port"

export type DriversContract = {
    getRemoteEntries: ForGettingRemoteEntries,
    processRemoteEntries: ForProcessingRemoteEntries,
    determineSharedExternals: ForDeterminingSharedExternals,
    generateImportMap: ForGeneratingImportMap,
    commitChanges: ForCommittingChanges,
    exposeModuleLoader: ForExposingModuleLoader
}