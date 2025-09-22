import type { FLOW_FACTORY } from 'lib/2.app/driver-ports/flow-factory.contract';
import type { InitDriversContract } from 'lib/2.app/driver-ports/init/drivers.contract';
import type { InitFlow } from 'lib/2.app/driver-ports/init/flow.contract';
import { createGetRemoteEntries } from '../../2.app/flows/init/get-remote-entries';
import { createProcessRemoteEntries } from '../../2.app/flows/init/process-remote-entries';
import { createDetermineSharedExternals } from '../../2.app/flows/init/determine-shared-externals';
import { createGenerateImportMap } from '../../2.app/flows/init/generate-import-map';
import { createCommitChanges } from '../../2.app/flows/init/commit-changes';
import { createExposeModuleLoader } from '../../2.app/flows/init/expose-module-loader';
import type { DrivingContract } from '../../2.app/driving-ports/driving.contract';
import type { ConfigContract } from '../../2.app/config/config.contract';

export const createInitDrivers = ({
  config,
  adapters,
}: {
  config: ConfigContract;
  adapters: DrivingContract;
}): InitDriversContract => ({
  getRemoteEntries: createGetRemoteEntries(config, adapters),
  processRemoteEntries: createProcessRemoteEntries(config, adapters),
  determineSharedExternals: createDetermineSharedExternals(config, adapters),
  generateImportMap: createGenerateImportMap(config, adapters),
  commitChanges: createCommitChanges(config, adapters),
  exposeModuleLoader: createExposeModuleLoader(config, adapters),
});

export const INIT_FLOW_FACTORY = ({
  config,
  adapters,
}: {
  config: ConfigContract;
  adapters: DrivingContract;
}): FLOW_FACTORY<InitDriversContract> => {
  const flow = createInitDrivers({ config, adapters });

  return {
    flow,
    adapters,
    config,
  };
};

export const createInitFlow = ({
  flow,
  adapters,
  config,
}: FLOW_FACTORY<InitDriversContract>): InitFlow => {
  return remotesOrManifestUrl =>
    flow
      .getRemoteEntries(remotesOrManifestUrl)
      .then(flow.processRemoteEntries)
      .then(flow.determineSharedExternals)
      .then(flow.generateImportMap)
      .then(flow.commitChanges)
      .then(flow.exposeModuleLoader)
      .then(loadRemoteModule => ({
        config,
        adapters,
        loadRemoteModule,
      }));
};
