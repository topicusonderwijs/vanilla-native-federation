import type { ExposedModule } from "../handlers/exposed-module/exposed-module.contract";
import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"
import { NFError } from "../native-federation.error";
import * as _path from "../utils/path";
import { tap } from "../utils/tap";

type ExposeModuleLoader = (importMap: ImportMap) => Promise<{
    load: (optionsOrRemoteName: ExposedModule | string, exposedModule?: string) => Promise<any>, 
    importMap: ImportMap
}>

const exposeModuleLoader = (
    {remoteInfoHandler, logHandler, exposedModuleHandler }: Handlers
): ExposeModuleLoader => {

    const load = (
        remoteNameOrModule: ExposedModule | string,
        exposedModule?: string
    ): Promise<unknown> => {
        const remoteModule = exposedModuleHandler.mapFrom(remoteNameOrModule, exposedModule);
        logHandler.debug(`Loading module ${JSON.stringify(remoteModule)}`)

        if(!remoteModule.remoteName || remoteModule.remoteName === "") throw new NFError('remoteName cannot be empty');
        return remoteInfoHandler.getFromCache(remoteModule.remoteEntry, remoteModule.remoteName)
                .catch(e => {
                    logHandler.warn("Cache lookup failed: "+e.message)
                    return remoteInfoHandler.getFromEntry(remoteModule.remoteEntry!)
                })
            .then(info => exposedModuleHandler.getUrl(info, remoteModule.exposedModule))
            .then(tap(url => logHandler.debug("Importing module: " + url)))
            .then(m => (globalThis as any).importShim(m))
    }

    return (importMap: ImportMap) => Promise.resolve({ importMap, load });
}

export {ExposeModuleLoader, exposeModuleLoader}