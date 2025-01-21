import type { ExposedModule } from "../handlers/exposed-module/exposed-module.contract";
import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"
import { NFError } from "../native-federation.error";
import * as _path from "../utils/path";

type LoadRemoteModule = (importMap: ImportMap) => Promise<{
    load: (optionsOrRemoteName: ExposedModule | string, exposedModule?: string) => Promise<any>, 
    importMap: ImportMap
}>

const loadRemoteModule = (
    {sharedInfoHandler, remoteInfoHandler, logHandler, exposedModuleHandler }: Handlers
): LoadRemoteModule => {

    const load = (
        remoteNameOrModule: ExposedModule | string,
        exposedModule?: string
    ): Promise<unknown> => {
        const remoteModule = exposedModuleHandler.mapFrom(remoteNameOrModule, exposedModule);
        logHandler.debug(`Loading module ${JSON.stringify(remoteModule)}`)

        if(!remoteModule.remoteName || remoteModule.remoteName === "") throw new NFError('remoteName cannot be empty');
        return remoteInfoHandler
            .get(remoteModule.remoteEntry, remoteModule.remoteName)
            .then(remoteInfoHandler.addToCache)
            .then(sharedInfoHandler.addToCache)
            .then(info => exposedModuleHandler.getUrl(info, remoteModule.exposedModule))
            .then(url => logHandler.debug("Importing module: " + url))
            .then(m => (globalThis as any).importShim(m))
    }

    return (importMap: ImportMap) => Promise.resolve({ importMap, load });
}


export {LoadRemoteModule, loadRemoteModule}