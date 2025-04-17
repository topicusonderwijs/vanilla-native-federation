import { createManifestProvider } from './manifest-provider';
import { Manifest } from '../../1.domain/remote-entry/manifest.contract';
import { LogHandler } from "../../2.app/config/log.contract";
import { ForProvidingManifest } from "../../2.app/driving-ports/for-providing-manifest.port";
import { createMockLogHandler } from "../../6.mocks/handlers/log.handler";
import { NFError } from '../../native-federation.error';

describe('createManifestProvider', () => {
    let mockLogger: LogHandler;
    let manifestProvider: ForProvidingManifest;

    const mockFetchAPI = (response: Manifest) => {
        global.fetch = jest.fn((url) => {
            if(url === "http://my.service/manifest.json") 
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve(response),
                } as Response);
            
            return Promise.resolve({
                ok: false,
                status: 404,
                statusText: "Not Found"
            } as Response);
        }) as jest.Mock;
    };

    beforeEach(() => {
        mockFetchAPI({});
        mockLogger = createMockLogHandler();
        manifestProvider = createManifestProvider({log: mockLogger});
    });

    describe('initialization', () => {
        it('should create a valid provider instance', () => {
            expect(manifestProvider).toBeDefined();
            expect(typeof manifestProvider.provide).toBe('function');
        });
    });

    describe('provide', () => {
        it('should return the manifest directly when provided with an object', async () => {
            const manifest = {
                "team/mfe1": "https://my.service/remoteEntry.json"
            };

            const result = await manifestProvider.provide(manifest);

            expect(result).toEqual(manifest);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should fetch the manifest from URL when provided with a string', async () => {
            const manifest = {
                "team/mfe1": "https://my.service/remoteEntry.json"
            };
            mockFetchAPI(manifest);

            const manifestUrl = 'http://my.service/manifest.json';
            
            const result = await manifestProvider.provide(manifestUrl);

            expect(fetch).toHaveBeenCalledWith(manifestUrl);
            expect(result).toEqual(manifest);
        });

        it('should handle fetch errors properly', async () => {
            const manifestUrl = 'http://bad.service/manifest.json';
            
            await expect(manifestProvider.provide(manifestUrl))
                .rejects
                .toEqual(new NFError("Could not fetch manifest."));
        });
    });
});