import type { Handlers } from "../handlers/handlers.contract";
import type { RemoteEntry, RemoteName } from "../handlers/remote-info/remote-info.contract";
import * as _path from "../utils/path";

type LoadRemoteModule = (remoteName: string, exposedModule: string) => Promise<unknown>

type ExposeModuleLoader = (manifest: Record<RemoteName, RemoteEntry>) => Promise<{
    load: LoadRemoteModule, 
    manifest: Record<RemoteName, RemoteEntry>
}>

declare function importShim<T>(url: string): T;

const exposeModuleLoader = (
    {logHandler, remoteInfoHandler }: Handlers
): ExposeModuleLoader => {

    function _importModule(url: string) {
        return typeof importShim !== 'undefined'
          ? importShim<unknown>(url)
          : import(url);
    }

    function load(
        remoteName: string, exposedModule: string
    ): Promise<unknown> {
        const remoteModule = remoteInfoHandler.fromStorage(remoteName, exposedModule);
        logHandler.debug(`Loading module ${JSON.stringify(remoteModule)}`)

        return Promise.resolve(_importModule(remoteModule.url));
    }

    return (manifest: Record<RemoteName, RemoteEntry>) => Promise.resolve({ manifest, load });
}

export {ExposeModuleLoader, exposeModuleLoader, LoadRemoteModule}