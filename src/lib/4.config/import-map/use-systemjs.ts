import type { ImportMapConfig } from 'lib/2.app/config/import-map.contract';

export const useSystemJSImportMap = (): ImportMapConfig => ({
  importMapType: 'systemjs-importmap',

  // @ts-ignore
  loadModuleFn: url => (window as any).System.import(url),
});
