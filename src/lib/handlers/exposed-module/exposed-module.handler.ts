import type { ExposedModule } from "./exposed-module.contract";
import { NFError } from "../../native-federation.error";
import * as _path from '../../utils/path';
import type { Remote } from "../remote-info";

const exposedModuleHandlerFactory = () => {
    const mapFrom = (
        optionsOrRemoteName: ExposedModule | string,
        exposedModule?: string
    ): ExposedModule =>  {
        if (typeof optionsOrRemoteName === 'string' && exposedModule) {
            return {
                remoteName: optionsOrRemoteName,
                exposedModule,
            };
        } else if (typeof optionsOrRemoteName === 'object') {
            if(!optionsOrRemoteName.exposedModule && !!exposedModule) {
                optionsOrRemoteName.exposedModule = exposedModule;
            }
            return optionsOrRemoteName;
        }
        throw new NFError('Failed to map remote module: exposedModule not provided');
    }

    const getUrl = (remoteInfo: Remote, exposedModule: string): string => {    
        const exposed = remoteInfo.exposes.find(m => m.key === exposedModule);

        if (!exposed) {
            throw new NFError(`Module '${exposedModule}' is not exposed in remote '${remoteInfo.name}'`);
        }
    
        return _path.join(remoteInfo.baseUrl, exposed.outFileName);
    }

    return { mapFrom, getUrl }
}

export { exposedModuleHandlerFactory }