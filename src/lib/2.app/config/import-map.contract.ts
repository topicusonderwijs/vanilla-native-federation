

export type ImportMapConfig = {
    importMapType: string,
    loadModuleFn: (url: string) => unknown
}

export type ImportMapOptions = Partial<ImportMapConfig>