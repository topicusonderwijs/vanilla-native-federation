import type { Manifest } from "lib/1.domain";
import type { ForProvidingManifest } from "lib/2.app/driving-ports/for-providing-manifest.port";

const createManifestProvider = (): ForProvidingManifest => {

    function provide(remotesOrManifestUrl: string|Manifest)
        : Promise<Manifest> {
            return (typeof remotesOrManifestUrl === 'string')
                ? fetch(remotesOrManifestUrl).then(r => r.json())
                : Promise.resolve(remotesOrManifestUrl)
        }

    return {
        provide
    }
}

export { createManifestProvider }