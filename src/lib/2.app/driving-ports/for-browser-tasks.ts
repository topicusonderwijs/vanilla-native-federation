import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';

export type ForBrowserTasks = {
  setImportMap: (importMap: ImportMap, opt?: { override?: boolean }) => ImportMap;
  importModule: (url: string) => Promise<unknown>;
};
