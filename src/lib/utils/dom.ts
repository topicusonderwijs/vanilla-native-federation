import type { ImportMap } from "../handlers/import-map/import-map.contract";

const appendImportMapToDOM = (map: ImportMap): ImportMap => {
    console.log(map);
    document.head.appendChild(
        Object.assign(document.createElement('script'), {
            type: 'importmap-shim',
            innerHTML: JSON.stringify(map),
        })
    );
    return map;
}

export {appendImportMapToDOM};