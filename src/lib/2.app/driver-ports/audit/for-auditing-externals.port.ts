import type { RemoteEntry } from 'lib/1.domain';

export type ForAuditingExternals = (remoteEntry: RemoteEntry) => Promise<void>;
