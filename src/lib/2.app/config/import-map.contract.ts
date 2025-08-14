import type { ImportMap } from 'lib/1.domain';

export type ImportMapConfig = {
  loadModuleFn: (url: string) => Promise<unknown>;
  setImportMap: SetImportMap;
};

export type SetImportMap = (
  importMap: ImportMap,
  opts?: { override?: boolean }
) => Promise<ImportMap>;

export type ImportMapOptions = Partial<ImportMapConfig>;
