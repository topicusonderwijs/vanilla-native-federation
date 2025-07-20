import type { ConfigContract } from 'lib/2.app/config';
import type { ForConvertingToImportMap } from './for-converting-to-import-map';
import type { ForGettingRemoteEntry } from './for-getting-remote-entry.port';
import type { ForUpdatingCache } from './for-updating-cache';
import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import type { ForProcessingRemoteEntry } from './for-processing-remote-entry';

export type DynamicInitDriversContract = {
  getRemoteEntry: ForGettingRemoteEntry;
  updateCache: ForUpdatingCache;
  processRemoteEntry: ForProcessingRemoteEntry;
  convertToImportMap: ForConvertingToImportMap;
};

export type DynamicInitDriversFactory = (
  config: ConfigContract,
  adapters: DrivingContract
) => DynamicInitDriversContract;
