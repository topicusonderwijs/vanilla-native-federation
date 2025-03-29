import { fetchRemoteEntries } from "./1-fetch-remote-entries";
import { createImportMap } from "./2-create-import-map";
import { exposeModuleLoader } from "./3-expose-module-loader";
import type { StepFactories } from "./steps.contract";
import { resolveHandlers } from "../core/handlers.resolver";
import type { NfCache } from "../core/storage/storage.contract";
import type { Config } from "../config/config.contract";

const resolver = <TCache extends NfCache>(
    config: Config<TCache>,
    stepsOverride: Partial<StepFactories> = {}
) => {
    const handlers = resolveHandlers<TCache>(config);
    return {
        fetchRemoteEntries: (stepsOverride?.fetchRemoteEntries ?? fetchRemoteEntries)(handlers),
        createImportMap:    (stepsOverride?.createImportMap    ?? createImportMap)(handlers),
        exposeModuleLoader: (stepsOverride?.exposeModuleLoader ?? exposeModuleLoader)(handlers)
    };
}

export {resolver};
