import type { ImportMapConfig, ImportMapHandler } from "lib/2.app/handlers/import-map.contract";

const createImportMapHandler = ({importMapType, loadModuleFn}: ImportMapConfig): ImportMapHandler => {
    return {
        getType: function () {
            return importMapType;
        },
        importModule: loadModuleFn
    }
}

export { createImportMapHandler }