import type { ModuleLoaderConfig } from "../../lib/config/config.contract"

declare function importShim<T>(url: string): T;

const useImportMapShim = (cfg: {shimMode: boolean} = {shimMode: false}): ModuleLoaderConfig => ({
    importMapType: cfg.shimMode ? "importmap-shim" : "importmap",
    loadModuleFn: (url) => importShim(url)
})

export {useImportMapShim}
