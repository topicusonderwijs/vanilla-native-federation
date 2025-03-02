import type { ModuleLoaderConfig } from "../../lib/utils/config/config.contract"

declare global {
    interface Window {
      System: {
        import(url: string): Promise<unknown>;
      }
    }
  }

const useSystemJS = (): ModuleLoaderConfig => ({
    importMapType: "systemjs-importmap",
    loadModuleFn: (url) => window.System.import(url)
})

export {useSystemJS}
