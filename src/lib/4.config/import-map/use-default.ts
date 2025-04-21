import type { ImportMapConfig } from "lib/2.app"

const useDefaultImportMap = (): ImportMapConfig => ({
    loadModuleFn: url => import(url),
    importMapType: "importmap",
})

export {useDefaultImportMap}