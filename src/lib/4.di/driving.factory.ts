import type { DrivingContract } from "lib/2.app/driving-ports/driving.contract";
import { createVersionCheck } from "lib/3.adapters/checks/version.check";
import { createManifestProvider } from "lib/3.adapters/http/manifest-provider";
import { createPathResolver } from "lib/3.adapters/http/path-resolver";
import { createRemoteEntryProvider } from "lib/3.adapters/http/remote-entry-provider";
import { createLogger } from "lib/3.adapters/logging/logger";
import type { LoggingConfig } from "lib/3.adapters/logging/logging.contract";
import { createRemoteInfoRepository } from "lib/3.adapters/storage/remote-info.repository";
import { createScopedExternalsRepository } from "lib/3.adapters/storage/scoped-externals.repository";
import { createSharedExternalsRepository } from "lib/3.adapters/storage/shared-externals.repository";
import type { StorageConfig } from "lib/3.adapters/storage/storage.contract";

export const createDriving = (cfg: LoggingConfig & StorageConfig): DrivingContract => ({
    versionCheck: createVersionCheck(),

    logger: createLogger(cfg),

    manifestProvider: createManifestProvider(),

    remoteEntryProvider: createRemoteEntryProvider(),

    pathResolver: createPathResolver(),

    remoteInfoRepo: createRemoteInfoRepository(cfg),
    scopedExternalsRepo: createScopedExternalsRepository(cfg),
    sharedExternalsRepo: createSharedExternalsRepository(cfg)
})