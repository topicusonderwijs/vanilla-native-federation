import type { RemoteEntry } from 'lib/1.domain/remote-entry/remote-entry.contract';
import type { Optional } from 'lib/utils/optional';

export type ForGettingRemoteEntry = (
  remoteEntryUrl: string,
  remoteName?: string
) => Promise<Optional<RemoteEntry>>;
