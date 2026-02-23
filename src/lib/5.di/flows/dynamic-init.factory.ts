import type { RemoteEntry } from 'lib/1.domain';
import type { DynamicInitFlow } from 'lib/2.app/driver-ports/dynamic-init/flow.contract';
import type { FLOW_FACTORY } from 'lib/2.app/driver-ports/flow-factory.contract';
import { createConvertToImportMap } from 'lib/2.app/flows/dynamic-init/convert-to-import-map';
import { createGetRemoteEntry } from 'lib/2.app/flows/dynamic-init/get-remote-entry';
import { createUpdateCache } from 'lib/2.app/flows/dynamic-init/update-cache';
import { createCommitChanges } from 'lib/2.app/flows/init/commit-changes';
import type { DynamicInitDriversContract } from 'lib/audit.index';
import type { DrivingContract } from '../../2.app/driving-ports/driving.contract';
import type { ConfigContract } from '../../2.app/config/config.contract';

export const createDynamicInitDrivers = ({
  config,
  adapters,
}: {
  config: ConfigContract;
  adapters: DrivingContract;
}): DynamicInitDriversContract => ({
  getRemoteEntry: createGetRemoteEntry(config, adapters),
  updateCache: createUpdateCache(config, adapters),
  convertToImportMap: createConvertToImportMap(config, adapters),
  commitChanges: createCommitChanges(config, adapters),
});

export const DYNAMIC_INIT_FLOW_FACTORY = ({
  config,
  adapters,
}: {
  config: ConfigContract;
  adapters: DrivingContract;
}): FLOW_FACTORY<DynamicInitDriversContract> => {
  const flow = createDynamicInitDrivers({ config, adapters });

  return {
    flow,
    adapters,
    config,
  };
};

export const createDynamicInitFlow = ({
  flow,
  adapters,
  config,
}: FLOW_FACTORY<DynamicInitDriversContract>): DynamicInitFlow => {
  const processDynamicRemoteEntry = async (remoteEntry: RemoteEntry) => {
    return flow.updateCache(remoteEntry).then(flow.convertToImportMap).then(flow.commitChanges);
  };
  const initRemoteEntry: DynamicInitFlow = (remoteEntryUrl, remoteName) =>
    flow
      .getRemoteEntry(remoteEntryUrl, remoteName)
      .then(entry => entry.map(processDynamicRemoteEntry).orElse(Promise.resolve()))
      .then(() => ({
        config,
        adapters,
        initRemoteEntry,
      }));

  return initRemoteEntry;
};
