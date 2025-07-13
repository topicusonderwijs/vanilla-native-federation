import type { RemoteEntry } from 'lib/1.domain/remote-entry/remote-entry.contract';

export type ForGettingRemoteEntry = (
  remoteEntryUrl: string,
  remoteName?: string
) => Promise<RemoteEntry[]>;
