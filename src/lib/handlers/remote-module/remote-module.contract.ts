
type RemoteModuleOptions = {
    remoteName?: string;
    remoteEntry?: string;
    exposedModule: string;
}

type RemoteModule = Required<RemoteModuleOptions>;

type LoadRemoteModule = (optionsOrRemoteName: RemoteModuleOptions | string, exposedModule?: string ) => Promise<any>

type RemoteModuleHandler = {
    load: LoadRemoteModule
}

export {RemoteModuleOptions, RemoteModule, LoadRemoteModule, RemoteModuleHandler}