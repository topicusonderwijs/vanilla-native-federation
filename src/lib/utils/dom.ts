import type { ImportMap } from "../import-map/import-map.contract";

const appendImportMapToBody = (map: ImportMap): ImportMap => {
    document.head.appendChild(
        Object.assign(document.createElement('script'), {
            type: 'importmap-shim',
            innerHTML: JSON.stringify(map),
        })
    );
    return map;
}

export { appendImportMapToBody };