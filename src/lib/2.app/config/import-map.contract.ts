

export type ImportMapConfig = {
    importMapType: string,
    loadModuleFn: (url: string) => unknown
}