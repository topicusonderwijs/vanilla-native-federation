import type { ExposedModule } from "./exposed-module.contract";
import { NFError } from "../../native-federation.error";
import * as _path from '../../utils/path';
import type { LogHandler } from "../logging";
import type { Remote } from "../remote-info";

const exposedModuleHandlerFactory = (
    log: LogHandler,
) => {
    const mapFrom = (
        optionsOrRemoteName: ExposedModule | string,
        exposedModule?: string
    ): ExposedModule =>  {
        if (typeof optionsOrRemoteName === 'string' && exposedModule) {
            return {
                remoteName: optionsOrRemoteName,
                exposedModule,
            };
        } else if (typeof optionsOrRemoteName === 'object' && !exposedModule) {
            return optionsOrRemoteName;
        }
        log.error(`Failed to load remote module: exposedModule and/or remoteName not provided`)
        throw new NFError('Failed to load remote module');
    }

    const getUrl = (remoteInfo: Remote, exposedModule: string): string => {    
        const exposed = remoteInfo.exposes.find(m => m.key === exposedModule);
        if (!exposed) {
            log.error(`Module '${exposedModule}'is not exposed in remote '${remoteInfo.name}'`)
            throw new NFError('Failed to load remote module');
        }
    
        return _path.join(remoteInfo.baseUrl, exposed.outFileName);
    }

    return { mapFrom, getUrl }
}

export { exposedModuleHandlerFactory }