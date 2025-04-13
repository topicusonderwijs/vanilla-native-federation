import type { ForBrowserTasks } from "lib/2.app/driving-ports/for-browser-tasks";
import type { ImportMap } from "lib/1.domain/import-map/import-map.contract";
import type { ImportMapHandler } from "lib/2.app/handlers/import-map.contract";

const createBrowser = (
    handle: {importMap: ImportMapHandler}
): ForBrowserTasks => {
    return {
        setImportMap: function (importMap: ImportMap) {
            document.head
                .querySelectorAll(`script[type="${handle.importMap.getType()}"]`)
                .forEach(importMap => importMap.remove());
    
            document.head.appendChild(
                Object.assign(document.createElement('script'), {
                    type: handle.importMap.getType(),
                    innerHTML: JSON.stringify(importMap),
                })
            );
            return importMap;
        }
    } 
}

export { createBrowser }