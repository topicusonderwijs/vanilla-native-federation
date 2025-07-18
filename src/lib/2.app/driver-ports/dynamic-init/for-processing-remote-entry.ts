import type { RemoteEntry, SharedInfoActions } from 'lib/1.domain';

export type ForProcessingRemoteEntry = ({
  entry,
  actions,
}: {
  entry: RemoteEntry;
  actions: SharedInfoActions;
}) => Promise<RemoteEntry>;
