type RemoteModule = {
    moduleName: string, 
    url: string
}

type RemoteModuleHandler = {
    importModule: (url: string) => unknown,
    fromStorage: (remoteName: string, remoteModuleName: string) => RemoteModule
}

export {RemoteModuleHandler, RemoteModule }
