import type { RemoteEntry } from 'lib/1.domain';

export type ForConvertingToImportMap = (
  remoteEntry: RemoteEntry,
  strictVersion: boolean
) => Promise<void>;
