import type { LoadRemoteModule, NativeFederationResult } from './init-federation.contract';
import type { NFOptions } from './2.app/config/config.contract';
import { createInitFlow, INIT_FLOW_FACTORY } from './5.di/flows/init.factory';
import { createDriving } from './5.di/driving.factory';
import { createConfigHandlers } from './5.di/config.factory';
import {
  createDynamicInitFlow,
  DYNAMIC_INIT_FLOW_FACTORY,
} from './5.di/flows/dynamic-init.factory';

const initFederation = (
  remotesOrManifestUrl: string | Record<string, string>,
  options: NFOptions = {}
): Promise<NativeFederationResult> => {
  const { adapters, config } = createDriving(createConfigHandlers(options));

  const stateDump = (msg: string) =>
    config.log.debug(0, msg, {
      remotes: { ...adapters.remoteInfoRepo.getAll() },
      'shared-externals': adapters.sharedExternalsRepo
        .getScopes({ includeGlobal: true })
        .reduce(
          (acc, scope) => ({ ...acc, [scope]: adapters.sharedExternalsRepo.getFromScope(scope) }),
          {}
        ),
      'scoped-externals': adapters.scopedExternalsRepo.getAll(),
    });

  const initFlow = createInitFlow(INIT_FLOW_FACTORY({ adapters, config }));
  const dynamicInitFlow = createDynamicInitFlow(DYNAMIC_INIT_FLOW_FACTORY({ config, adapters }));

  return initFlow(remotesOrManifestUrl)
    .then(({ loadRemoteModule }) => {
      const output = {
        config,
        adapters,
        loadRemoteModule,
        as: <TModule = unknown>() => ({
          loadRemoteModule: loadRemoteModule as LoadRemoteModule<TModule>,
        }),
        remote: <TModule = unknown>(remoteName: string) => ({
          loadModule: (exposedModule: string) =>
            loadRemoteModule(remoteName, exposedModule) as Promise<TModule>,
        }),
      };

      const initRemoteEntry = async (
        remoteEntryUrl: string,
        remoteName?: string
      ): Promise<NativeFederationResult> =>
        dynamicInitFlow(remoteEntryUrl, remoteName)
          .catch(e => {
            stateDump(`[dynamic-init][${remoteName ?? remoteEntryUrl}] STATE DUMP`);
            if (config.strict.strictRemoteEntry) return Promise.reject(e);
            else console.warn('Failed to initialize remote entry, continuing anyway.');
            return Promise.resolve();
          })
          .then(() => ({
            ...output,
            initRemoteEntry,
          }));

      return {
        ...output,
        initRemoteEntry,
      };
    })
    .catch(e => {
      stateDump(`[init] STATE DUMP`);
      return Promise.reject(e);
    });
};

export { initFederation };
