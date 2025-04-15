import type { ImportMapConfig } from "lib/2.app/config/import-map.contract";

export const createImportMapConfig = (override: Partial<ImportMapConfig>): ImportMapConfig => ({
    loadModuleFn: url => import(url),
    importMapType: "importmap",
    ...override
});