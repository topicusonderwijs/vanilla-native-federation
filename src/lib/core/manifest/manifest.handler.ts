import type { Manifest, ManifestHandler } from "./manifest.contract"

const manifestHandlerFactory = (

): ManifestHandler => {
    const fetchIfUrl = async (remotesOrManifestUrl: Manifest|string): Promise<Manifest> => {
        if (typeof remotesOrManifestUrl !== 'string') 
            return Promise.resolve(remotesOrManifestUrl);

        return fetch(remotesOrManifestUrl).then(r => r.json());
    }

    return {
        fetchIfUrl
    };
}

export { manifestHandlerFactory }