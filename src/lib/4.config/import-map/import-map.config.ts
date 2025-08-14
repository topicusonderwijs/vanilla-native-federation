import type { ImportMapConfig, ImportMapOptions } from 'lib/2.app/config/import-map.contract';
import { useDefaultImportMap } from './use-default';

export const createImportMapConfig = (o: Partial<ImportMapOptions>): ImportMapConfig => {
  const fallback = useDefaultImportMap();
  return {
    replaceImportMap: o.replaceImportMap ?? fallback.replaceImportMap,
    loadModuleFn: o.loadModuleFn ?? fallback.loadModuleFn,
  };
};
