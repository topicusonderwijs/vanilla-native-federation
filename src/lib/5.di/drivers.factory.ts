import { createCommitChanges } from "lib/2.app/commit-changes";
import { createDetermineSharedExternals } from "lib/2.app/determine-shared-externals";
import type { DriversContract } from "lib/2.app/driver-ports/drivers.contract";
import type { DrivingContract } from "lib/2.app/driving-ports/driving.contract";
import { createGenerateImportMap } from "lib/2.app/generate-import-map";
import { createGetRemoteEntries } from "lib/2.app/get-remote-entries";
import type { ConfigHandlers } from "lib/2.app/config/config.contract";
import { createSaveRemoteEntries } from "lib/2.app/save-remote-entries";

export const createDrivers = (config: ConfigHandlers, adapters: DrivingContract): DriversContract => ({
    getRemoteEntries: createGetRemoteEntries(config,adapters),
    saveRemoteEntries: createSaveRemoteEntries(config,adapters),
    determineSharedExternals: createDetermineSharedExternals(config,adapters),
    generateImportMap: createGenerateImportMap(adapters),
    commitChanges: createCommitChanges(config, adapters)
});