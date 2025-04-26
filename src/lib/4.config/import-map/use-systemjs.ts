import type { ImportMapConfig } from "lib/2.app/public_api";


export const useSystemJSImportMap = (): ImportMapConfig => ({
    importMapType: "systemjs-importmap",

    // @ts-ignore
    loadModuleFn: (url) => (window as any).System.import(url)
});