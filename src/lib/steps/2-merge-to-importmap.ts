import type { Remote } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"

type MergeToImportMap = (remotes: Remote[]) => Promise<ImportMap>;

const mergeToImportMap = (
    { importMapHandler }: Handlers
): MergeToImportMap => 
    (importMaps: Remote[]) => {
        return Promise.resolve(importMapHandler.toImportMap(importMaps));
    }

export {MergeToImportMap, mergeToImportMap}