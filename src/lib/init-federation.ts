import type {
  InitFederationResult,
  LazyInitFederationResult,
  LoadRemoteModule,
} from './init-federation.contract';
import type { RemoteEntry } from './1.domain/remote-entry/remote-entry.contract';
import type { NFOptions } from './2.app/config/config.contract';
import { CREATE_NF_APP } from './create-nf-app';

const initFederation = (
  remotesOrManifestUrl: string | Record<string, string>,
  options: NFOptions = {}
): Promise<LazyInitFederationResult> => {
  const { init, dynamicInit, config, adapters } = CREATE_NF_APP(options);

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

  return init
    .getRemoteEntries(remotesOrManifestUrl)
    .then(init.processRemoteEntries)
    .then(init.determineSharedExternals)
    .then(init.generateImportMap)
    .then(init.commitChanges)
    .then(init.exposeModuleLoader)
    .then(loadRemoteModule => {
      const output: InitFederationResult = {
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

      const processDynamicRemoteEntry = async (remoteEntry: RemoteEntry) => {
        dynamicInit
          .updateCache(remoteEntry)
          .then(dynamicInit.convertToImportMap)
          .then(init.commitChanges);
      };

      const initRemoteEntry = async (
        remoteEntryUrl: string,
        remoteName?: string
      ): Promise<LazyInitFederationResult> =>
        dynamicInit
          .getRemoteEntry(remoteEntryUrl, remoteName)
          .then(entry => entry.map(processDynamicRemoteEntry).orElse(Promise.resolve()))
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
