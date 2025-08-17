import type { ImportMap } from 'lib/1.domain/import-map/import-map.contract';

export type ForBrowserTasks = {
  setImportMapFn: (importMap: ImportMap, opt?: { override?: boolean }) => Promise<ImportMap>;
  importModule: (url: string) => Promise<unknown>;
};
