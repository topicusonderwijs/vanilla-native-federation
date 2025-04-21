import type { DrivingContract } from "./driving-ports/driving.contract";
import type { ForExposingModuleLoader } from "./driver-ports/for-exposing-module-loader.port";
import { NFError } from "lib/native-federation.error";
import type { LoggingConfig } from "./config/log.contract";
import * as _path from "lib/utils/path";
const createExposeModuleLoader = (
    config: LoggingConfig,
    ports: Pick<DrivingContract, 'remoteInfoRepo'|'browser'>
): ForExposingModuleLoader => { 

    function loadRemoteModule(
        remoteName: string, exposedModule: string
    ): Promise<unknown> {
        try{
            if(!ports.remoteInfoRepo.contains(remoteName)) {
                throw new NFError(`Remote '${remoteName}' is not initialized.`);
            }

            const remoteModuleUrl = ports.remoteInfoRepo.tryGetModule(remoteName, exposedModule)
                .orThrow(new NFError(`Exposed module '${exposedModule}' from remote '${remoteName}' not found in storage.`));

            config.log.debug(`Loading initialized module '${remoteModuleUrl}'`);

            return ports.browser.importModule(remoteModuleUrl);
        }catch(err) {
            config.log.error(`Failed to load module ${_path.join(remoteName, exposedModule)}: `, err);

            return Promise.reject(new NFError(`Failed to load module ${_path.join(remoteName, exposedModule)}`));
        }
 
    }

    return () => Promise.resolve({loadRemoteModule})
};

export { createExposeModuleLoader }