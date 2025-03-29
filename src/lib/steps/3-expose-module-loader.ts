import type { Handlers } from "../core/handlers.contract";
import type { RemoteEntry, RemoteName } from "../core/remote-info/remote-info.contract";
import * as _path from "../utils/path";

type LoadRemoteModule = (remoteName: string, exposedModule: string) => Promise<unknown>

type ExposeModuleLoader = (manifest: Record<RemoteName, RemoteEntry>) => Promise<{
    loadRemoteModule: LoadRemoteModule, 
    manifest: Record<RemoteName, RemoteEntry>
}>

const exposeModuleLoader = (
    { logHandler, remoteModuleHandler, remoteInfoHandler }: Handlers
): ExposeModuleLoader => {
    function loadRemoteModule(
        remoteName: string, exposedModule: string
    ): Promise<unknown> {
        if(!remoteInfoHandler.inStorage(remoteName)) {
            return Promise.reject(new Error(`Remote '${remoteName}' is not initialized.`))
        }
        try{
            const remoteModule = remoteModuleHandler.fromStorage(remoteName, exposedModule);
            logHandler.debug(`Loading initialized module '${JSON.stringify(remoteModule)}'`);
            return Promise.resolve(remoteModuleHandler.importModule(remoteModule.url));
        }catch(e) {
            let errMsg = `Failed to load remote ${remoteName} module ${exposedModule}`;
            if (e instanceof Error) errMsg = e.message;
            if (typeof e === "string") errMsg = e;
            logHandler.error("Module load failed: " + errMsg);

            return Promise.reject(`Could not import remote module`);
        }
 
    }

    return (manifest: Record<RemoteName, RemoteEntry>) => Promise.resolve({ manifest, loadRemoteModule });
}

export {ExposeModuleLoader, exposeModuleLoader, LoadRemoteModule}
