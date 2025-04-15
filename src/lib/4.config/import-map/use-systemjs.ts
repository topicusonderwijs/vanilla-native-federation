import type { ImportMapConfig } from "lib/2.app";


export const useSystemJS = (): ImportMapConfig => ({
    importMapType: "systemjs-importmap",

    // @ts-ignore
    loadModuleFn: (url) => (window as any).System.import(url)
});