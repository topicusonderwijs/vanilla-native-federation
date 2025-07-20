import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import type { ConfigContract } from 'lib/2.app/config/config.contract';
import { createGetRemoteEntry } from 'lib/2.app/flows/dynamic-init/get-remote-entry';
import type { DynamicInitDriversContract } from 'lib/2.app/driver-ports/dynamic-init/drivers.contract';
import { createUpdateCache } from 'lib/2.app/flows/dynamic-init/update-cache';
import { createConvertToImportMap } from 'lib/2.app/flows/dynamic-init/convert-to-import-map';
import { createProcessRemoteEntry } from 'lib/2.app/flows/dynamic-init/process-remote-entry';

export const createDynamicInitDrivers = (
  config: ConfigContract,
  adapters: DrivingContract
): DynamicInitDriversContract => ({
  getRemoteEntry: createGetRemoteEntry(config, adapters),
  updateCache: createUpdateCache(config, adapters),
  processRemoteEntry: createProcessRemoteEntry(config),
  convertToImportMap: createConvertToImportMap(config),
});
