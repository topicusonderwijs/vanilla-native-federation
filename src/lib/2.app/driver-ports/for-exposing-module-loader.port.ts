import type { LoadRemoteModule } from "lib/1.domain/public_api";


export type ForExposingModuleLoader = () => Promise<{loadRemoteModule: LoadRemoteModule}>
