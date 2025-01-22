import type { Remote } from "../remote-info";

type ExposedModule = {
    remoteName?: string;
    remoteEntry?: string;
    exposedModule: string;
}

type ExposedModuleHandler ={
    mapFrom: (optionsOrRemoteName: ExposedModule | string,  exposedModule?: string) => ExposedModule,
    getUrl: (remoteInfo: Remote, exposedModule: string) => string
}

export {ExposedModule, ExposedModuleHandler}