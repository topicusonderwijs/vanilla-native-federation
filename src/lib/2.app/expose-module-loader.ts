import type { DrivingContract } from "./driving-ports/driving.contract";
import type { ForExposingModuleLoader } from "./driver-ports/for-exposing-module-loader.port";
import { NFError } from "lib/native-federation.error";
import type { LoggingConfig } from "./config/log.contract";
import * as _path from "lib/utils/path";


export function createExposeModuleLoader(
    config: LoggingConfig,
    ports: Pick<DrivingContract, 'remoteInfoRepo'|'browser'>
): ForExposingModuleLoader { 

    /**
     * Step 6: expose module loader
     * 
     * The module loader can only be used after the importmap was generated and added to
     * the DOM, hence the module loader fn is exposed to the host after the final commit 
     * step. 
     * 
     * The loadRemoteModule is also a callback that is returned as a promise by the initFederation
     * function. This way the loadRemoteModule can be shared througout the host application using 
     * CustomEvents or by adding it to the global Window object for easy access. 
     * 
     * @param adapters 
     */
    return () => Promise.resolve(loadRemoteModule);


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
};
