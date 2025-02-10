import type { FetchManifest } from "./1-fetch-manifest"
import type { FetchRemoteEntries } from "./2-fetch-remote-entries"
import type { CreateImportMap } from "./3-create-import-map"
import type { ExposeModuleLoader } from "./4-expose-module-loader"
import type { Handlers } from "../handlers/handlers.contract"

type StepFactory<Tstep> = (h: Handlers) => Tstep

type StepFactories = {
    fetchManifest: StepFactory<FetchManifest>,
    fetchRemoteEntries: StepFactory<FetchRemoteEntries>,
    createImportMap: StepFactory<CreateImportMap>,
    exposeModuleLoader: StepFactory<ExposeModuleLoader>
}

export {StepFactories, StepFactory}