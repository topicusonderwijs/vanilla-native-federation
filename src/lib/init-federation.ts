import type { InitFederationResult, LoadRemoteModule } from "./1.domain/init-federation.contract";
import type { NFOptions } from "./2.app/config/config.contract";
import { CREATE_NF_APP } from "./create-nf-app";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    options: NFOptions = {}
): InitFederationResult => {  
    const {app, config} = CREATE_NF_APP(options);

    return app.getRemoteEntries(remotesOrManifestUrl)
        .then(app.processRemoteEntries)
        .then(app.determineSharedExternals)
        .then(app.generateImportMap)
        .then(app.commitChanges)
        .then(app.exposeModuleLoader)
        .then(loadRemoteModule => ({
            loadRemoteModule,
            as: <TModule = unknown>() => ({loadRemoteModule: loadRemoteModule as LoadRemoteModule<TModule>,}),
            remote: <TModule = unknown>(remoteName: string) => ({
                loadModule: (exposedModule: string) => loadRemoteModule(remoteName, exposedModule) as Promise<TModule>
            }),
            config
        }))
        .catch(e => {
            config.log.error("Init failed: ", e);
            return Promise.reject(e);
        })
}

export { initFederation };
