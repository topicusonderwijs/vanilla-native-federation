import type { ImportMap } from "../import-map/import-map.contract";

type DomHandler = {
    createImportMap: (map: ImportMap) => ImportMap,
    importModule: (url: string) => Promise<any>
}

const domHandlerFactory = (): DomHandler => {

    const createImportMap = (map: ImportMap): ImportMap => {
        document.head.appendChild(
            Object.assign(document.createElement('script'), {
                type: 'importmap-shim',
                innerHTML: JSON.stringify(map),
            })
        );
        return map;
    }

    const importModule = async <T = any>(url: string): Promise<T> => {
        return (globalThis as any).importShim(url);
    }

    return {createImportMap, importModule};
}

export {domHandlerFactory, DomHandler};