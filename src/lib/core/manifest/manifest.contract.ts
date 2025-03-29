import { RemoteName, RemoteEntry } from "../remote-info";

type Manifest = Record<RemoteName, RemoteEntry>

type ManifestHandler = {
    fetchIfUrl: (remotesOrManifestUrl: Manifest|string) => Promise<Manifest>
}

export { RemoteName, RemoteEntry, Manifest, ManifestHandler };