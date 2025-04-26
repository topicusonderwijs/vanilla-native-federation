import type { ImportMapConfig } from "lib/2.app/public_api"

declare function importShim<T>(url: string): T;

const useShimImportMap = (cfg: {shimMode: boolean} = {shimMode: false}): ImportMapConfig => ({
    importMapType: cfg.shimMode ? "importmap-shim" : "importmap",
    loadModuleFn: (url) => importShim(url)
})

export {useShimImportMap}