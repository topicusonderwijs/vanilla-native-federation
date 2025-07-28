import type { RemoteEntry, SharedInfoActions } from 'lib/1.domain';
import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';

export type ForConvertingToImportMap = ({
  entry,
  actions,
}: {
  entry: RemoteEntry;
  actions: SharedInfoActions;
}) => Promise<ImportMap>;
