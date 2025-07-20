import type { RemoteEntry } from 'lib/1.domain';
import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';

export type ForConvertingToImportMap = (remoteEntry: RemoteEntry) => Promise<ImportMap>;
