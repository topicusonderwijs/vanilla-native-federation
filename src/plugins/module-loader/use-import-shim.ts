import type { ModuleLoaderConfig } from "../../lib/utils/config/config.contract"

declare function importShim<T>(url: string): T;

const useImportMapShim = (): ModuleLoaderConfig => ({
    importMapType: "importmap",
    loadModuleFn: (url) => importShim(url)
})

export {useImportMapShim}
