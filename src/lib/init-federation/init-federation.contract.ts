import type { ImportMap } from "../import-map/import-map.contract"
import type { LoadRemoteModule } from "../remote-module/remote-module.contract"

type InitFederation = (
    remotesOrManifestUrl: string | Record<string, string>
) => Promise<{ load: LoadRemoteModule, importMap: ImportMap }>

type InitFederationHandler = {
    init: InitFederation
}

export { InitFederation, InitFederationHandler }