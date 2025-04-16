import type { ImportMapConfig, ImportMapOptions } from "lib/2.app/config/import-map.contract";

export const createImportMapConfig = (override: Partial<ImportMapOptions>): ImportMapConfig => ({
    loadModuleFn: url => import(url),
    importMapType: "importmap",
    ...override
});