import type { ForBrowserTasks } from "lib/2.app/driving-ports/for-browser-tasks";
import type { ImportMap } from "lib/1.domain/import-map/import-map.contract";
import type { ImportMapHandler } from "lib/2.app/config/import-map.contract";

const createBrowser = (
    config: {importMap: ImportMapHandler}
): ForBrowserTasks => {
    return {
        setImportMap: function (importMap: ImportMap) {
            document.head
                .querySelectorAll(`script[type="${config.importMap.getType()}"]`)
                .forEach(importMap => importMap.remove());
    
            document.head.appendChild(
                Object.assign(document.createElement('script'), {
                    type: config.importMap.getType(),
                    innerHTML: JSON.stringify(importMap),
                })
            );
            return importMap;
        }
    } 
}

export { createBrowser }