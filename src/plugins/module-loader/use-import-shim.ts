import type { BuilderType, ModuleLoaderConfig } from "../../lib/utils/config/config.contract"

declare function importShim<T>(url: string): T;

const useImportMapShim = (builderType: BuilderType = 'default'): ModuleLoaderConfig => ({
    builderType,
    importMapType: "importmap",
    loadModuleFn: (url) => importShim(url)
})

export {useImportMapShim}