import type { Options } from "./2.app/config/config.contract";
import { CREATE_NF_APP } from "./create-nf-app";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string>,
    options: Options
) => {  
    const {app, config} = CREATE_NF_APP(options);

    return app.getRemoteEntries(remotesOrManifestUrl)
        .then(app.processRemoteEntries)
        .then(app.determineSharedExternals)
        .then(app.generateImportMap)
        .then(app.commitChanges)
        .then(app.exposeModuleLoader)
        .then(loadRemoteModule => ({
            loadRemoteModule,
            config
        }))
        .catch(e => {
            config.log.error("Init failed: ", e);
            return Promise.reject(e);
        })
}

export { initFederation };
