import type {
  RemoteEntry,
  SharedInfoActions,
} from 'lib/1.domain/remote-entry/remote-entry.contract';

export type ForUpdatingCache = (remoteEntries: RemoteEntry) => Promise<{
  entry: RemoteEntry;
  actions: SharedInfoActions;
}>;
