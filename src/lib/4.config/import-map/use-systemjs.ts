import { ImportMapConfig } from "lib/2.app";


export const useSystemJS = (): ImportMapConfig => ({
    importMapType: "systemjs-importmap",
    
    loadModuleFn: (url) => (window as any).System.import(url)
});