import type { StepFactories } from "./steps/steps.contract";
import { resolver } from "./steps/steps.resolver";
import { defaultConfig } from "./utils/config/config";
import type { Config } from "./utils/config/config.contract";

const initFederation = (
    remotesOrManifestUrl: string | Record<string, string> = {},
    override: {options?: Partial<Config>, steps?: Partial<StepFactories>} = {}
) => {   
    const steps = resolver(
        defaultConfig(override?.options ?? {}), 
        override?.steps ?? {}
    );

    return steps.fetchImportMaps(remotesOrManifestUrl)
        .then(steps.mergeImportMaps)
        .then(steps.updateDOM)
        .then(steps.exposeModuleLoader)
}

export { initFederation };