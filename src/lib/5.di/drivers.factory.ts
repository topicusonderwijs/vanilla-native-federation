import { createCommitChanges } from "lib/2.app/commit-changes";
import { createDetermineSharedExternals } from "lib/2.app/determine-shared-externals";
import type { DriversContract } from "lib/2.app/driver-ports/drivers.contract";
import type { DrivingContract } from "lib/2.app/driving-ports/driving.contract";
import { createGenerateImportMap } from "lib/2.app/generate-import-map";
import { createGetRemoteEntries } from "lib/2.app/get-remote-entries";
import type { Config } from "lib/2.app/config/config.contract";
import { createProcessRemoteEntries } from "lib/2.app/process-remote-entries";
import { createExposeModuleLoader } from "lib/2.app/expose-module-loader";

export const createDrivers = (config: Config, adapters: DrivingContract): DriversContract => ({
    getRemoteEntries: createGetRemoteEntries(config,adapters),
    processRemoteEntries: createProcessRemoteEntries(config,adapters),
    determineSharedExternals: createDetermineSharedExternals(config,adapters),
    generateImportMap: createGenerateImportMap(config, adapters),
    commitChanges: createCommitChanges(adapters),
    exposeModuleLoader: createExposeModuleLoader(config, adapters)
});