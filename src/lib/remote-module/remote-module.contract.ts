
type RemoteModuleOptions = {
    remoteName?: string;
    remoteEntry?: string;
    exposedModule: string;
}

type RemoteModule = Required<RemoteModuleOptions>;

export {RemoteModuleOptions, RemoteModule}