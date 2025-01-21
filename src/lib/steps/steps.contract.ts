import type { FetchImportMaps } from "./1-fetch-import-maps"
import type { MergeImportMaps } from "./2-merge-import-maps"
import type { UpdateDOM } from "./3-update-dom"
import type { LoadRemoteModule } from "./4-load-remote-module"
import type { Handlers } from "../handlers/handlers.contract"

type StepFactory<Tstep> = (h: Handlers) => Tstep

type StepFactories = {
    fetchImportMaps: StepFactory<FetchImportMaps>,
    mergeImportMaps: StepFactory<MergeImportMaps>,
    updateDOM: StepFactory<UpdateDOM>
    loadRemoteModule: StepFactory<LoadRemoteModule>
}

export {StepFactories, StepFactory}