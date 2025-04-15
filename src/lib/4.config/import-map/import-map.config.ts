import type { ImportMapConfig, ImportMapHandler } from "lib/2.app/config/import-map.contract";

const createImportMapConfig = ({importMapType, loadModuleFn}: ImportMapConfig): ImportMapHandler => {
    return {
        getType: function () {
            return importMapType;
        },
        importModule: loadModuleFn
    }
}

export { createImportMapConfig }