export type ImportMapConfig = {
  importMapType: string;
  loadModuleFn: (url: string) => Promise<unknown>;
};

export type ImportMapOptions = Partial<ImportMapConfig>;
