import { fetchManifest } from "./1-fetch-manifest";
import { fetchRemoteEntries } from "./2-fetch-remote-entries";
import { createImportMap } from "./3-create-import-map";
import { exposeModuleLoader } from "./4-expose-module-loader";
import type { StepFactories } from "./steps.contract";
import { resolveHandlers } from "../handlers/handlers.resolver";
import type { NfCache } from "../handlers/storage/storage.contract";
import type { Config } from "../config/config.contract";

const resolver = <TCache extends NfCache>(
    config: Config<TCache>,
    stepsOverride: Partial<StepFactories> = {}
) => {
    const handlers = resolveHandlers<TCache>(config);
    return {
        fetchManifest:      (stepsOverride?.fetchManifest      ?? fetchManifest)(handlers),
        fetchRemoteEntries: (stepsOverride?.fetchRemoteEntries ?? fetchRemoteEntries)(handlers),
        createImportMap:    (stepsOverride?.createImportMap    ?? createImportMap)(handlers),
        exposeModuleLoader: (stepsOverride?.exposeModuleLoader ?? exposeModuleLoader)(handlers)
    };
}

export {resolver};
