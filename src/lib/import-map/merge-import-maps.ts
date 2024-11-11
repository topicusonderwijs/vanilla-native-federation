import { createEmptyImportMap } from "./create-empty-import-map";
import type { ImportMap } from "./import-map.contract";

const mergeImportMaps = (maps: ImportMap[]) => {
    return maps.reduce(
        (acc: ImportMap, map: ImportMap) => ({
            imports: { ...acc.imports, ...map.imports },
            scopes: { ...acc.scopes, ...map.scopes },
        }),
        createEmptyImportMap()
    );
}

export { mergeImportMaps};