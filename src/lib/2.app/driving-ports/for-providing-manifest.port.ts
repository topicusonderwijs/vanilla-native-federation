import type { Manifest } from "../../1.domain/manifest.contract";

export type ForProvidingManifest = {
    provide: (remotesOrManifestUrl: Manifest|string) => Promise<Manifest>
}
