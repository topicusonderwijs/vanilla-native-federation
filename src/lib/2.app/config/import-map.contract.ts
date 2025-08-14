import type { ImportMap } from 'lib/1.domain';

export type ImportMapConfig = {
  loadModuleFn: (url: string) => Promise<unknown>;
  replaceImportMap: ReplaceImportMap;
};

export type ReplaceImportMap = (
  importMap: ImportMap,
  opts?: { override?: boolean }
) => Promise<ImportMap>;

export type ImportMapOptions = Partial<ImportMapConfig>;
