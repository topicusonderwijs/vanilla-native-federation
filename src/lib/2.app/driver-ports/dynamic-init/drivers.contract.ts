import type { ConfigContract } from 'lib/2.app/config';
import type { ForConvertingToImportMap } from './for-converting-to-import-map';
import type { ForGettingRemoteEntry } from './for-getting-remote-entry.port';
import type { ForUpdatingCache } from './for-updating-cache';
import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import type { ForCommittingChanges } from '../init';

export type DynamicInitDriversContract = {
  getRemoteEntry: ForGettingRemoteEntry;
  updateCache: ForUpdatingCache;
  convertToImportMap: ForConvertingToImportMap;
  commitChanges: ForCommittingChanges;
};

export type DynamicInitDriversFactory = (
  config: ConfigContract,
  adapters: DrivingContract
) => DynamicInitDriversContract;
