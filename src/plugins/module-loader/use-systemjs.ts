import type { BuilderType, ModuleLoaderConfig } from "../../lib/utils/config/config.contract"

declare global {
    interface Window {
      System: {
        import(url: string): Promise<unknown>;
      }
    }
  }

const useSystemJS = (builderType: BuilderType): ModuleLoaderConfig => ({
    builderType,
    importMapType: "systemjs-importmap",
    loadModuleFn: (url) => window.System.import(url)
})

export {useSystemJS}