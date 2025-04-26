import type { ImportMapConfig } from "lib/2.app/public_api"

const useDefaultImportMap = (): ImportMapConfig => ({
    loadModuleFn: url => import(url),
    importMapType: "importmap",
})

export {useDefaultImportMap}