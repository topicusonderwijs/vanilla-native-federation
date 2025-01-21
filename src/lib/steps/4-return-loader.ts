import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"
import type { LoadRemoteModule } from "../handlers/remote-module/remote-module.contract";

type ReturnLoader = (importMap: ImportMap) => Promise<{load: LoadRemoteModule, importMap: ImportMap}>

const returnLoader = (
    {remoteModuleHandler}: Handlers
): ReturnLoader => 
    (importMap: ImportMap) => {
        return Promise.resolve({
            importMap,
            load: remoteModuleHandler.load
        });
    }

export {ReturnLoader, returnLoader}