import type { RemoteModule, RemoteModuleHandler } from "./remote-module.contract";
import { NFError } from "../../native-federation.error";
import type { ModuleLoaderConfig } from "../../config/config.contract";
import type { NfCache, StorageHandler } from "../storage";

const remoteModuleHandlerFactory = (
    {loadModuleFn}: ModuleLoaderConfig,
    storageHandler: StorageHandler<NfCache> 
): RemoteModuleHandler => {

    function importModule(moduleUrl: string){ 
        return loadModuleFn(moduleUrl);
    }

    function fromStorage(remoteName: string, remoteModuleName: string): RemoteModule {
        const storage = storageHandler.fetch("remotes");
        if(!storage[remoteName]) throw new NFError(`Remote '${remoteName}' not found in storage.`);
    
        const remoteModule = storage[remoteName].exposes.find(m => m.moduleName === remoteModuleName);
        if(!remoteModule) throw new NFError(`Exposed module '${remoteModuleName}' from remote '${remoteName}' not found in storage.`);
    
        return remoteModule;
    }


    return {importModule, fromStorage};
}

export {remoteModuleHandlerFactory };
