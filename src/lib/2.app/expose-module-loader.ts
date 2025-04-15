import type { DrivingContract } from "./driving-ports/driving.contract";
import type { ForExposingModuleLoader } from "./driver-ports/for-exposing-module-loader.port";
import { NFError } from "lib/native-federation.error";
import type { LoggingConfig } from "./config/log.contract";

const createExposeModuleLoader = (
    config: LoggingConfig,
    { remoteInfoRepo, browser }: DrivingContract
): ForExposingModuleLoader => { 

    function loadRemoteModule(
        remoteName: string, exposedModule: string
    ): Promise<unknown> {
        if(!remoteInfoRepo.contains(remoteName)) {
            return Promise.reject(new NFError(`Remote '${remoteName}' is not initialized.`))
        }
        try{
            const remoteModule = remoteInfoRepo.tryGetModule(remoteName, exposedModule)
                .orThrow(new NFError(`Exposed module '${exposedModule}' from remote '${remoteName}' not found in storage.`));

            config.log.debug(`Loading initialized module '${JSON.stringify(remoteModule)}'`);

            return Promise.resolve(browser.importModule(remoteModule.url));
        }catch(e) {
            let errMsg = `Failed to load remote ${remoteName} module ${exposedModule}`;
            if (e instanceof Error) errMsg = e.message;
            if (typeof e === "string") errMsg = e;
            config.log.error("Module load failed: " + errMsg);

            return Promise.reject(`Could not import remote module`);
        }
 
    }

    return () => Promise.resolve({loadRemoteModule})
};

export { createExposeModuleLoader }