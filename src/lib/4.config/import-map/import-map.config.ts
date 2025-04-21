import type { ImportMapConfig, ImportMapOptions } from "lib/2.app/config/import-map.contract";
import { useDefaultImportMap } from "./use-default";

export const createImportMapConfig = (override: Partial<ImportMapOptions>): ImportMapConfig => ({
    ...useDefaultImportMap(),
    ...override
});