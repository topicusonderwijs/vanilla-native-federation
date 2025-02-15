import type { ModuleLoaderConfig } from "../../lib/utils/config/config.contract"

declare function importShim<T>(url: string): T;

const useImportMapShim = (builderType: 'default'|'vite'): ModuleLoaderConfig => ({
    builderType,
    importMapType: "importmap-shim",
    loadModuleFn: (url) => importShim(url)
})

export {useImportMapShim}