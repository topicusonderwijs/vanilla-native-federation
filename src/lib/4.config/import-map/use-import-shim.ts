import { ImportMapConfig } from "lib/2.app"

declare function importShim<T>(url: string): T;

const useImportMapShim = (cfg: {shimMode: boolean} = {shimMode: false}): ImportMapConfig => ({
    importMapType: cfg.shimMode ? "importmap-shim" : "importmap",
    loadModuleFn: (url) => importShim(url)
})

export {useImportMapShim}