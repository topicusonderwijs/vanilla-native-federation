import type { FetchImportMaps } from "./1-fetch-import-maps"
import type { MergeImportMaps } from "./2-merge-import-maps"
import type { UpdateDOM } from "./3-update-dom"
import type { ReturnLoader } from "./4-return-loader"
import type { Handlers } from "../handlers/handlers.contract"

type StepFactory<Tstep> = (h: Handlers) => Tstep

type StepFactories = {
    fetchImportMaps: StepFactory<FetchImportMaps>,
    mergeImportMaps: StepFactory<MergeImportMaps>,
    updateDOM: StepFactory<UpdateDOM>
    returnLoader: StepFactory<ReturnLoader>
}

export {StepFactories, StepFactory}