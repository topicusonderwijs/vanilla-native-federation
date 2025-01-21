import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"

type MergeImportMaps = (importMaps: ImportMap[]) => Promise<ImportMap>;

const mergeImportMaps = (
    { importMapHandler }: Handlers
): MergeImportMaps => 
    (importMaps: ImportMap[]) => {
        return Promise.resolve(importMapHandler.merge(importMaps));
    }

export {MergeImportMaps, mergeImportMaps}