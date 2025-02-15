import type { Handlers } from "../handlers/handlers.contract";
import type { RemoteEntry, RemoteName } from "../handlers/remote-info/remote-info.contract";
import * as _path from "../utils/path";

type LoadRemoteModule = (remoteName: string, exposedModule: string) => Promise<unknown>

type ExposeModuleLoader = (manifest: Record<RemoteName, RemoteEntry>) => Promise<{
    load: LoadRemoteModule, 
    manifest: Record<RemoteName, RemoteEntry>
}>

const exposeModuleLoader = (
    { logHandler, remoteInfoHandler, remoteModuleHandler}: Handlers
): ExposeModuleLoader => {
    function load(
        remoteName: string, exposedModule: string
    ): Promise<unknown> {
        const remoteModule = remoteInfoHandler.fromStorage(remoteName, exposedModule);
        logHandler.debug(`Loading module ${JSON.stringify(remoteModule)}`)

        return Promise.resolve(remoteModuleHandler.importModule(remoteModule.url));
    }

    return (manifest: Record<RemoteName, RemoteEntry>) => Promise.resolve({ manifest, load });
}

export {ExposeModuleLoader, exposeModuleLoader, LoadRemoteModule}