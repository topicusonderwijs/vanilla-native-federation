import type { LoadRemoteModule } from "lib/1.domain";


export type ForExposingModuleLoader = () => Promise<{loadRemoteModule: LoadRemoteModule}>
