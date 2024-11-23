import type { LoadRemoteModule, RemoteModuleOptions } from "./remote-module/remote-module.contract";
import { remoteModuleHandlerFactory } from "./remote-module/remote-module.handler";
import { type Config, defaultConfig, resolver } from "./resolver";

const loadRemoteModule: LoadRemoteModule = (
    remoteNameOrModule: RemoteModuleOptions | string,exposedModule?: string,
    options: Partial<Config> = {}
) => {
    const {
        logHandler,
        remoteInfoHandler, 
        domHandler
    } = resolver(defaultConfig(options));

    const moduleLoader = remoteModuleHandlerFactory(logHandler, remoteInfoHandler, domHandler);
    return moduleLoader.load(remoteNameOrModule, exposedModule);
}

export { loadRemoteModule }