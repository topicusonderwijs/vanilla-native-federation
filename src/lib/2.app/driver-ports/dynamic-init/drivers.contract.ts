import type { ConfigContract } from 'lib/2.app/config';
import type { ForConvertingToImportMap } from './for-converting-to-import-map';
import type { ForGettingRemoteEntry } from './for-getting-remote-entry.port';
import type { ForProcessingDynamicRemoteEntry } from './for-processing-dynamic-remote-entry';
import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';

export type DynamicInitDriversContract = {
  getRemoteEntries: ForGettingRemoteEntry;
  processRemoteEntries: ForProcessingDynamicRemoteEntry;
  convertToImportMap: ForConvertingToImportMap;
};

export type DynamicInitDriversFactory = (
  config: ConfigContract,
  adapters: DrivingContract
) => DynamicInitDriversContract;
