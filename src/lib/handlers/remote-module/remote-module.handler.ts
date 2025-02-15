import type { RemoteModuleHandler } from "./remote-module.contract";
import type { ModuleLoaderConfig } from "../../utils/config/config.contract";

const remoteModuleHandlerFactory = (
    {loadModuleFn}: ModuleLoaderConfig
): RemoteModuleHandler => {

    function importModule(moduleUrl: string){ 
        return loadModuleFn(moduleUrl);
    }


    return {importModule};
}

export {remoteModuleHandlerFactory };