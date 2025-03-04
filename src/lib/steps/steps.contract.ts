import type { FetchRemoteEntries } from "./1-fetch-remote-entries"
import type { CreateImportMap } from "./2-create-import-map"
import type { ExposeModuleLoader } from "./3-expose-module-loader"
import type { Handlers } from "../handlers/handlers.contract"

type StepFactory<Tstep> = (h: Handlers) => Tstep

type StepFactories = {
    fetchRemoteEntries: StepFactory<FetchRemoteEntries>,
    createImportMap: StepFactory<CreateImportMap>,
    exposeModuleLoader: StepFactory<ExposeModuleLoader>
}

export {StepFactories, StepFactory}
