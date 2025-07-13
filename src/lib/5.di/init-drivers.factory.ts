import { createCommitChanges } from 'lib/2.app/flows/init/commit-changes';
import { createDetermineSharedExternals } from 'lib/2.app/flows/init/determine-shared-externals';
import type { DriversContract } from 'lib/2.app/driver-ports/init/drivers.contract';
import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import { createGenerateImportMap } from 'lib/2.app/flows/init/generate-import-map';
import { createGetRemoteEntries } from 'lib/2.app/flows/init/get-remote-entries';
import type { ConfigContract } from 'lib/2.app/config/config.contract';
import { createProcessRemoteEntries } from 'lib/2.app/flows/init/process-remote-entries';
import { createExposeModuleLoader } from 'lib/2.app/flows/init/expose-module-loader';

export const createInitDrivers = (
  config: ConfigContract,
  adapters: DrivingContract
): DriversContract => ({
  getRemoteEntries: createGetRemoteEntries(config, adapters),
  processRemoteEntries: createProcessRemoteEntries(config, adapters),
  determineSharedExternals: createDetermineSharedExternals(config, adapters),
  generateImportMap: createGenerateImportMap(config, adapters),
  commitChanges: createCommitChanges(adapters),
  exposeModuleLoader: createExposeModuleLoader(config, adapters),
});
