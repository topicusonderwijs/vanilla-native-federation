import { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import { mockBrowser } from './adapters/browser.mock';
import { mockRemoteInfoRepository } from './adapters/remote-info.repository.mock';
import { mockScopedExternalsRepository } from './adapters/scoped-externals.repository.mock';
import { mockSharedExternalsRepository } from './adapters/shared-externals.repository.mock';
import { mockVersionCheck } from './adapters/version-check.mock';
import { mockManifestProvider } from './adapters/manifest-provider.mock';
import { mockRemoteEntryProvider } from './adapters/remote-entry-provider.mock';
import { mockSSE } from './adapters/sse.mock';

export const mockAdapters = (): DrivingContract => ({
  remoteInfoRepo: mockRemoteInfoRepository(),
  sharedExternalsRepo: mockSharedExternalsRepository(),
  scopedExternalsRepo: mockScopedExternalsRepository(),
  versionCheck: mockVersionCheck(),
  browser: mockBrowser(),
  manifestProvider: mockManifestProvider(),
  remoteEntryProvider: mockRemoteEntryProvider(),
  sse: mockSSE(),
});
