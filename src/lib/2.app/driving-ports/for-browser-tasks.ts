import type { ImportMap } from "lib/1.domain/import-map/import-map.contract";

export type ForBrowserTasks = {
    setImportMap: (importMap: ImportMap) => void,
    // importModule: (url: string) => unknown
}
