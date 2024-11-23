
import type { DomHandler } from "../dom/dom.handler";
import type { LogHandler } from "../logging/log.handler";
import { NFError } from "../native-federation.error";
import type { RemoteModuleOptions } from "./remote-module.contract";
import type { RemoteInfo } from "../remote-entry/remote-info.contract";
import type { RemoteInfoHandler } from "../remote-entry/remote-info.handler";
import { defaultConfig, resolver, type Config } from "../resolver";
import * as _path from "../utils/path";


type LoadRemoteModule = (optionsOrRemoteName: RemoteModuleOptions | string, exposedModule?: string ) => Promise<void>

type RemoteModuleLoader = {
    load: LoadRemoteModule
}

const remoteModuleLoaderFactory = (
    logger: LogHandler,
    remoteInfoHandler: RemoteInfoHandler,
    domHandler: DomHandler
): RemoteModuleLoader => {

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

    const getExposedModuleUrl = (remoteInfo: RemoteInfo, exposedModule: string): string => {    
        const exposed = remoteInfo.exposes.find(e => e.key === exposedModule);
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
        logger.debug(`Loading module ${remoteModule.exposedModule} from ${remoteModule.remoteName}@${remoteModule.remoteEntry}`)

        if(!remoteModule.remoteName || remoteModule.remoteName === "") throw new NFError('remoteName cannot be empty');
        return remoteInfoHandler
            .loadRemoteInfo(remoteModule.remoteEntry, remoteModule.remoteName)
            .then(info => getExposedModuleUrl(info, remoteModule.exposedModule))
            .then(url => {logger.debug("Importing module: " + url); return url})
            .then(domHandler.importModule)
    }

    return { load }
}

const loadRemoteModule: LoadRemoteModule = (
    remoteNameOrModule: RemoteModuleOptions | string,exposedModule?: string,
    options: Partial<Config> = {}
) => {
    const {
        logHandler,
        remoteInfoHandler, 
        domHandler
    } = resolver(defaultConfig(options));

    const moduleLoader = remoteModuleLoaderFactory(logHandler, remoteInfoHandler, domHandler);
    return moduleLoader.load(remoteNameOrModule, exposedModule);
}

export { loadRemoteModule, remoteModuleLoaderFactory, LoadRemoteModule, RemoteModuleOptions, RemoteModuleLoader };