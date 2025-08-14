import type { ImportMapConfig, ImportMapOptions } from 'lib/2.app/config/import-map.contract';
import { useDefaultImportMap } from './use-default';

export const createImportMapConfig = (o: Partial<ImportMapOptions>): ImportMapConfig => {
  const fallback = useDefaultImportMap();
  return {
    setImportMap: o.setImportMap ?? fallback.setImportMap,
    loadModuleFn: o.loadModuleFn ?? fallback.loadModuleFn,
  };
};
