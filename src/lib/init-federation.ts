import type {
  InitFederationResult,
  LazyInitFederationResult,
  LoadRemoteModule,
} from './1.domain/init-federation.contract';
import type { NFOptions } from './2.app/config/config.contract';
import { CREATE_NF_APP } from './create-nf-app';

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

      const initRemoteEntry = (remoteEntryUrl: string, remoteName?: string) =>
        dynamicInit
          .getRemoteEntries(remoteEntryUrl, remoteName)
          .then(dynamicInit.processRemoteEntries)
          .then(dynamicInit.convertToImportMap)
          .then(init.commitChanges)
          .then(() => ({
            ...output,
            initRemoteEntry,
          })) as Promise<LazyInitFederationResult>;

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
