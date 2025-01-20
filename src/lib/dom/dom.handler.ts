import type { DomHandler } from "./dom.contract";
import type { ImportMap } from "../import-map/import-map.contract";

/**
 * DOM Handler
 * - Responsible of handling all DOM related tasks
 */
const domHandlerFactory = (): DomHandler => {
    const appendImportMap = (map: ImportMap): ImportMap => {
        document.head.appendChild(
            Object.assign(document.createElement('script'), {
                type: 'importmap-shim',
                innerHTML: JSON.stringify(map),
            })
        );
        return map;
    }
    return {appendImportMap};
}

export {domHandlerFactory};