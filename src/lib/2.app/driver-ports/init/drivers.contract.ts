import type { ForCommittingChanges } from './for-committing-changes.port';
import type { ForDeterminingSharedExternals } from './for-determining-shared-externals.port';
import type { ForExposingModuleLoader } from './for-exposing-module-loader.port';
import type { ForGeneratingImportMap } from './for-generating-import-map';
import type { ForGettingRemoteEntries } from './for-getting-remote-entries.port';
import type { ForProcessingRemoteEntries } from './for-processing-remote-entries.port';
import type { ConfigContract } from 'lib/2.app/config';
import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';

export type InitDriversContract = {
  getRemoteEntries: ForGettingRemoteEntries;
  processRemoteEntries: ForProcessingRemoteEntries;
  determineSharedExternals: ForDeterminingSharedExternals;
  generateImportMap: ForGeneratingImportMap;
  commitChanges: ForCommittingChanges;
  exposeModuleLoader: ForExposingModuleLoader;
};

export type InitDriversFactory = (
  config: ConfigContract,
  adapters: DrivingContract
) => InitDriversContract;
