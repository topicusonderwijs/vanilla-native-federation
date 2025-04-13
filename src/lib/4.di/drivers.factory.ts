import { createDetermineSharedExternals } from "lib/2.app/determine-shared-externals";
import type { DriversContract } from "lib/2.app/driver-ports/drivers.contract";
import type { DrivingContract } from "lib/2.app/driving-ports/driving.contract";
import { createGetRemoteEntries } from "lib/2.app/get-remote-entries";
import { createSaveRemoteEntries } from "lib/2.app/save-remote-entries";


export const createDrivers = (adapters: DrivingContract): DriversContract => ({
    getRemoteEntries: createGetRemoteEntries(adapters),
    saveRemoteEntries: createSaveRemoteEntries(adapters),
    determineSharedExternals: createDetermineSharedExternals(adapters)
})