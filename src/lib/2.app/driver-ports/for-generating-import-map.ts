import type { ImportMap } from "lib/1.domain/import-map.contract";

export type ForGeneratingImportMap = () => Promise<ImportMap>
