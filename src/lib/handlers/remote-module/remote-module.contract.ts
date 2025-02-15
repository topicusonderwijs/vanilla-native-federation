type RemoteModule = {
    moduleName: string, 
    url: string
}

type RemoteModuleHandler = {
    importModule: (url: string) => unknown,
}

export {RemoteModuleHandler, RemoteModule }
