import { createDetermineSharedExternals } from "lib/2.app/determine-shared-externals";
import type { DriversContract } from "lib/2.app/driver-ports/drivers.contract";
import type { DrivingContract } from "lib/2.app/driving-ports/driving.contract";
import { createGetRemoteEntries } from "lib/2.app/get-remote-entries";
import type { HandlersContract } from "lib/2.app/handlers/handlers.contract";
import { createSaveRemoteEntries } from "lib/2.app/save-remote-entries";

export const createDrivers = (handlers: HandlersContract, adapters: DrivingContract): DriversContract => ({
    getRemoteEntries: createGetRemoteEntries(handlers,adapters),
    saveRemoteEntries: createSaveRemoteEntries(handlers,adapters),
    determineSharedExternals: createDetermineSharedExternals(handlers,adapters)
});