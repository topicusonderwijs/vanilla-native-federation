import type { ImportMap } from "./import-map/import-map.contract";
import type { LoadRemoteModule } from "./remote-module/remote-module.contract";
import { type Config, defaultConfig, resolver } from "./resolver";


const initFederation = (
    remotesOrManifestUrl: string | Record<string, string> = {},
    options: Partial<Config> = {}
): Promise<{load: LoadRemoteModule, importMap: ImportMap}> => {   
    const { initFederationHandler } = resolver(defaultConfig(options));
    return initFederationHandler.init(remotesOrManifestUrl)
}

export { initFederation };