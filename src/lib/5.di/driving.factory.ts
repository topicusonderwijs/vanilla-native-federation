import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import type { ConfigContract } from 'lib/2.app/config/config.contract';
import { createBrowser } from 'lib/3.adapters/browser/browser';
import { createVersionCheck } from 'lib/3.adapters/checks/version.check';
import { createManifestProvider } from 'lib/3.adapters/http/manifest-provider';
import { createRemoteEntryProvider } from 'lib/3.adapters/http/remote-entry-provider';
import { createRemoteInfoRepository } from 'lib/3.adapters/storage/remote-info.repository';
import { createScopedExternalsRepository } from 'lib/3.adapters/storage/scoped-externals.repository';
import { createSharedExternalsRepository } from 'lib/3.adapters/storage/shared-externals.repository';
import { createSSEHandler } from 'lib/3.adapters/browser/sse-handler';
import { createChunkRepository } from 'lib/3.adapters/storage/chunk.repository';

export const createDriving = (
  config: ConfigContract
): { adapters: DrivingContract; config: ConfigContract } => {
  const adapters = {
    versionCheck: createVersionCheck(),

    manifestProvider: createManifestProvider(),

    remoteEntryProvider: createRemoteEntryProvider(),

    remoteInfoRepo: createRemoteInfoRepository(config),
    scopedExternalsRepo: createScopedExternalsRepository(config),
    sharedExternalsRepo: createSharedExternalsRepository(config),
    sharedChunksRepo: createChunkRepository(config),

    browser: createBrowser(config),
    sse: createSSEHandler(config),
  };
  return { adapters, config };
};
