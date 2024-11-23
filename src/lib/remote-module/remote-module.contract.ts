
type RemoteModuleOptions = {
    remoteName?: string;
    remoteEntry?: string;
    exposedModule: string;
}

type RemoteModule = Required<RemoteModuleOptions>;

type LoadRemoteModule = (optionsOrRemoteName: RemoteModuleOptions | string, exposedModule?: string ) => Promise<any>

export {RemoteModuleOptions, RemoteModule, LoadRemoteModule}