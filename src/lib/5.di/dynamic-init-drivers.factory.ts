import type { DrivingContract } from 'lib/2.app/driving-ports/driving.contract';
import type { ConfigContract } from 'lib/2.app/config/config.contract';
import { createGetDynamicRemoteEntry } from 'lib/2.app/flows/dynamic-init/fetch-remote-entry';
import type { DynamicInitDriversContract } from 'lib/2.app/driver-ports/dynamic-init/drivers.contract';
import { createProcessDynamicRemoteEntry } from 'lib/2.app/flows/dynamic-init/process-dynamic-remote-entry';

export const createDynamicInitDrivers = (
  config: ConfigContract,
  adapters: DrivingContract
): DynamicInitDriversContract => ({
  getRemoteEntries: createGetDynamicRemoteEntry(config, adapters),
  processRemoteEntries: createProcessDynamicRemoteEntry(config, adapters),
});
