import type { FetchImportMaps } from "./1-fetch-import-maps"
import type { MergeToImportMap } from "./2-merge-to-importmap"
import type { UpdateDOM } from "./3-update-dom"
import type { ExposeModuleLoader } from "./4-expose-module-loader"
import type { Handlers } from "../handlers/handlers.contract"

type StepFactory<Tstep> = (h: Handlers) => Tstep

type StepFactories = {
    fetchImportMaps: StepFactory<FetchImportMaps>,
    mergeToImportMap: StepFactory<MergeToImportMap>,
    updateDOM: StepFactory<UpdateDOM>
    exposeModuleLoader: StepFactory<ExposeModuleLoader>
}

export {StepFactories, StepFactory}