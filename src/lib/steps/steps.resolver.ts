import { fetchImportMaps } from "./1-fetch-import-maps";
import { mergeImportMaps } from "./2-merge-import-maps";
import { updateDOM } from "./3-update-dom";
import { returnLoader } from "./4-return-loader";
import type { StepFactories } from "./steps.contract";
import { resolveHandlers } from "../handlers/handlers.resolver";
import type { StorageExtension, NfStorage } from "../handlers/storage/storage.contract";
import type { Config } from "../utils/config/config.contract";

const resolver = <TCache extends NfStorage & StorageExtension>(
    config: Config<TCache>,
    stepsOverride: Partial<StepFactories> = {}
) => {
    const handlers = resolveHandlers(config);
    return {
        fetchImportMaps: (stepsOverride?.fetchImportMaps ?? fetchImportMaps)(handlers),
        mergeImportMaps: (stepsOverride?.mergeImportMaps ?? mergeImportMaps)(handlers),
        updateDOM:       (stepsOverride?.updateDOM       ?? updateDOM)(handlers),
        returnLoader:    (stepsOverride?.returnLoader    ?? returnLoader)(handlers)
    };
}

export {resolver};