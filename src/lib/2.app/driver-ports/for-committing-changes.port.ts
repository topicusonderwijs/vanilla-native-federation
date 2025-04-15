import type { ImportMap } from "lib/1.domain/import-map/import-map.contract";

export type ForCommittingChanges = (importMap: ImportMap) => Promise<void>
