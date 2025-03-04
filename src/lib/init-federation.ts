import type { StepFactories } from "./steps/steps.contract";
import { resolver } from "./steps/steps.resolver";
import { defaultConfig } from "./config/config";
import type { Config } from "./config/config.contract";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string> = {},
    override: Partial<Config> & {steps?: Partial<StepFactories>} = {}
) => {   
    const steps = resolver(
        defaultConfig(override ?? {}), 
        override?.steps ?? {}
    );

    return steps.fetchRemoteEntries(remotesOrManifestUrl)
        .then(steps.createImportMap)
        .then(steps.exposeModuleLoader)
}

export { initFederation };
