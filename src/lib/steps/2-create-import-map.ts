import type { Remote } from "../handlers";
import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"

type CreateImportMap = (remotes: Remote[]) => Promise<ImportMap>;

const createImportMap = (
    { importMapHandler, externalsHandler }: Handlers
): CreateImportMap => 
    (remotes: Remote[]) => {
        remotes.forEach(externalsHandler.addToStorage);
        return Promise.resolve(importMapHandler.createFromStorage(remotes));
    }

export {CreateImportMap, createImportMap}