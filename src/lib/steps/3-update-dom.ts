import type { Handlers } from "../handlers/handlers.contract";
import type { ImportMap } from "../handlers/import-map/import-map.contract"
import { appendImportMapToDOM } from "../utils/dom";

type UpdateDOM = (importMap: ImportMap) => Promise<ImportMap>

const updateDOM = (
    {}: Handlers
): UpdateDOM => 
    (importMap: ImportMap) => {
        return Promise.resolve(appendImportMapToDOM(importMap));
    }

export {UpdateDOM, updateDOM}