import type { ForConvertingToImportMap } from './for-converting-to-import-map';
import type { ForGettingRemoteEntry } from './for-getting-remote-entry.port';
import type { ForProcessingDynamicRemoteEntry } from './for-processing-dynamic-remote-entry';

export type DynamicInitDriversContract = {
  getRemoteEntries: ForGettingRemoteEntry;
  processRemoteEntries: ForProcessingDynamicRemoteEntry;
  convertToImportMap: ForConvertingToImportMap;
};
