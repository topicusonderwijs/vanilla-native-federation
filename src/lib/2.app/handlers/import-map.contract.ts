

export type ImportMapConfig = {
    importMapType: string,
    loadModuleFn: (url: string) => unknown
}


export type ImportMapHandler = {
    getType: () => string;
    importModule: (url: string) => unknown
}