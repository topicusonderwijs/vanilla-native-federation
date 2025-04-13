import type { DrivingContract } from "lib/2.app/driving-ports/driving.contract";
import type { HandlersContract } from "lib/2.app/handlers/handlers.contract";
import { createVersionCheck } from "lib/3.adapters/checks/version.check";
import { createManifestProvider } from "lib/3.adapters/http/manifest-provider";
import { createRemoteEntryProvider } from "lib/3.adapters/http/remote-entry-provider";
import { createRemoteInfoRepository } from "lib/3.adapters/storage/remote-info.repository";
import { createScopedExternalsRepository } from "lib/3.adapters/storage/scoped-externals.repository";
import { createSharedExternalsRepository } from "lib/3.adapters/storage/shared-externals.repository";

export const createDriving = (handlers: HandlersContract): DrivingContract => ({
    versionCheck: createVersionCheck(),

    manifestProvider: createManifestProvider(),

    remoteEntryProvider: createRemoteEntryProvider(),

    remoteInfoRepo: createRemoteInfoRepository(handlers),
    scopedExternalsRepo: createScopedExternalsRepository(handlers),
    sharedExternalsRepo: createSharedExternalsRepository(handlers)
})