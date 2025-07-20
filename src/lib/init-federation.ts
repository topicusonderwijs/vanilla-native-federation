import type {
  InitFederationResult,
  LazyInitFederationResult,
  LoadRemoteModule,
} from './1.domain/init-federation.contract';
import type { RemoteEntry } from './1.domain/remote-entry/remote-entry.contract';
import type { NFOptions } from './2.app/config/config.contract';
import { CREATE_NF_APP } from './create-nf-app';
import { NFError } from './native-federation.error';

const initFederation = (
  remotesOrManifestUrl: string | Record<string, string>,
  options: NFOptions = {}
): Promise<LazyInitFederationResult> => {
  const { init, dynamicInit, config } = CREATE_NF_APP(options);

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
          .then(dynamicInit.processRemoteEntry)
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
            config.log.debug('Dynamic init failed:', e);
            if (config.strict) throw new NFError('Failed to initialize remote entry.');
            else config.log.warn('Failed to initialize remote entry, continuing anyway.');
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
      config.log.error('Init failed: ', e);
      return Promise.reject(e);
    });
};

export { initFederation };
