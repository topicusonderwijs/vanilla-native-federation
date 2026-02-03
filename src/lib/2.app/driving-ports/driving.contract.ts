import type { ForVersionChecking } from './for-version-checking.port';
import type { ForBrowserTasks } from './for-browser-tasks';
import type { ForProvidingManifest } from './for-providing-manifest.port';
import type { ForProvidingRemoteEntries } from './for-providing-remote-entries.port';
import type { ForRemoteInfoStorage } from './for-remote-info-storage.port';
import type { ForScopedExternalsStorage } from './for-scoped-externals-storage.port';
import type { ForSharedExternalsStorage } from './for-shared-externals-storage.port';
import type { ForSSE } from './for-sse.port';
import { ForSharedChunksStorage } from './for-shared-chunks-storage.port';

export type DrivingContract = {
  versionCheck: ForVersionChecking;
  manifestProvider: ForProvidingManifest;
  remoteEntryProvider: ForProvidingRemoteEntries;
  remoteInfoRepo: ForRemoteInfoStorage;
  scopedExternalsRepo: ForScopedExternalsStorage;
  sharedExternalsRepo: ForSharedExternalsStorage;
  sharedChunksRepo: ForSharedChunksStorage;
  browser: ForBrowserTasks;
  sse: ForSSE;
};
