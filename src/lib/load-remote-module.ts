
import { DEFAULT_CACHE } from "./cache";
import type { NativeFederationCache } from "./cache/cache.contract";
import { NativeFederationError } from "./native-federation.error";
import type { TRemoteInfo } from "./remote-entry/remote-info.contract";
import type { TRemoteInfoHandler } from "./remote-entry/remote-info.handler";
import { resolver } from "./resolver";
import * as _dom from "./utils/dom";
import * as _path from "./utils/path";

type RemoteModule = {
    remoteName?: string;
    remoteEntry?: string;
    exposedModule: string;
}

type TLoadRemoteModule = (optionsOrRemoteName: RemoteModule | string, exposedModule?: string ) => Promise<void>

type TRemoteModuleLoader = {
    load: TLoadRemoteModule
}

const remoteModuleLoaderFactory = (remoteInfoHandler: TRemoteInfoHandler): TRemoteModuleLoader => {

    const mapToRemoteModule = (
        optionsOrRemoteName: RemoteModule | string,
        exposedModule?: string
    ): RemoteModule =>  {
        if (typeof optionsOrRemoteName === 'string' && exposedModule) {
            return {
                remoteName: optionsOrRemoteName,
                exposedModule,
            };
        } else if (typeof optionsOrRemoteName === 'object' && !exposedModule) {
            return optionsOrRemoteName;
        }
        
        throw new NativeFederationError('unexpected arguments: please pass options or a remoteName/exposedModule-pair');
    }

    const getExposedModuleUrl = (remoteInfo: TRemoteInfo, exposedModule: string): string => {    
        const exposed = remoteInfo.exposes.find(e => e.key === exposedModule);
        if (!exposed) throw new NativeFederationError(`Unknown exposed module ${exposedModule} in remote ${remoteInfo.name}`);
    
        return _path.join(remoteInfo.baseUrl, exposed.outFileName);
    }

    const load = (
        remoteNameOrModule: RemoteModule | string,
        exposedModule?: string
    ): Promise<void> => {
        const remoteModule = mapToRemoteModule(remoteNameOrModule, exposedModule);
        if(!remoteModule.remoteName || remoteModule.remoteName === "") throw new NativeFederationError('remoteName cannot be empty');
        return remoteInfoHandler
            .loadRemoteInfo(remoteModule.remoteEntry, remoteModule.remoteName)
            .then(info => getExposedModuleUrl(info, remoteModule.exposedModule))
            .then(url => (globalThis as any).importShim(url))
    }

    return { load }
}

const loadRemoteModule: TLoadRemoteModule = (
    remoteNameOrModule: RemoteModule | string,exposedModule?: string,
    o: {cache?: NativeFederationCache} = {}
) => {
    const {remoteInfoHandler} = resolver(o.cache ?? DEFAULT_CACHE);

    const moduleLoader = remoteModuleLoaderFactory(remoteInfoHandler);
    return moduleLoader.load(remoteNameOrModule, exposedModule);
}

export { loadRemoteModule, remoteModuleLoaderFactory, TLoadRemoteModule, RemoteModule };