
import type { DomHandler } from "../dom/dom.handler";
import type { LogHandler } from "../logging/log.handler";
import { NFError } from "../native-federation.error";
import type { LoadRemoteModule, RemoteModuleOptions } from "./remote-module.contract";
import type { Remote } from "../remote-entry/remote-info.contract";
import type { RemoteInfoHandler } from "../remote-entry/remote-info.handler";
import * as _path from "../utils/path";

type RemoteModuleHandler = {
    load: LoadRemoteModule
}

const remoteModuleHandlerFactory = (
    logger: LogHandler,
    remoteInfoHandler: RemoteInfoHandler,
    domHandler: DomHandler
): RemoteModuleHandler => {

    const mapToRemoteModule = (
        optionsOrRemoteName: RemoteModuleOptions | string,
        exposedModule?: string
    ): RemoteModuleOptions =>  {
        if (typeof optionsOrRemoteName === 'string' && exposedModule) {
            return {
                remoteName: optionsOrRemoteName,
                exposedModule,
            };
        } else if (typeof optionsOrRemoteName === 'object' && !exposedModule) {
            return optionsOrRemoteName;
        }
        logger.error(`Failed to load remote module: exposedModule and/or remoteName not provided`)
        throw new NFError('Failed to load remote module');
    }

    const getExposedModuleUrl = (remoteInfo: Remote, exposedModule: string): string => {    
        const exposed = remoteInfo.exposes.find(m => m.key === exposedModule);
        if (!exposed) {
            logger.error(`Module '${exposedModule}'is not exposed in remote '${remoteInfo.name}'`)
            throw new NFError('Failed to load remote module');
        }
    
        return _path.join(remoteInfo.baseUrl, exposed.outFileName);
    }

    const load = (
        remoteNameOrModule: RemoteModuleOptions | string,
        exposedModule?: string
    ): Promise<void> => {
        const remoteModule = mapToRemoteModule(remoteNameOrModule, exposedModule);
        logger.debug(`Loading module ${JSON.stringify(remoteModule)}`)

        if(!remoteModule.remoteName || remoteModule.remoteName === "") throw new NFError('remoteName cannot be empty');
        return remoteInfoHandler
            .loadRemoteInfo(remoteModule.remoteEntry, remoteModule.remoteName)
            .then(info => getExposedModuleUrl(info, remoteModule.exposedModule))
            .then(url => {logger.debug("Importing module: " + url); return url})
            .then(domHandler.importModule)
    }

    return { load }
}



export { remoteModuleHandlerFactory, RemoteModuleHandler, RemoteModuleOptions };