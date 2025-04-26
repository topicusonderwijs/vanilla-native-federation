import type { ImportMapConfig } from "lib/2.app/config/import-map.contract"

const useDefaultImportMap = (): ImportMapConfig => ({
    loadModuleFn: url => import(url),
    importMapType: "importmap",
})

export {useDefaultImportMap}