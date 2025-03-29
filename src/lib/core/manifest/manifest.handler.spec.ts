import { manifestHandlerFactory } from './manifest.handler'; 
import { Manifest } from './manifest.contract'; 


const actualFetchMethod = global.fetch;

describe('ManifestHandler', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = actualFetchMethod;
    jest.resetAllMocks();
  })

  describe('fetchIfUrl', () => {
    it('should fetch and parse JSON when provided a URL string', async () => {
        const manifestHandler = manifestHandlerFactory();
        const mockUrl = 'http://example.com/manifest.json';
        const mockManifest: Manifest = {
          '@team/mfe1': 'http://localhost:3001/remoteEntry.js',
          '@team/mfe2': 'http://localhost:3002/remoteEntry.js'
        };
  
        const mockResponse = {
          json: jest.fn().mockResolvedValue(mockManifest)
        };
        (fetch as jest.Mock).mockResolvedValue(mockResponse);
  
        const result = await manifestHandler.fetchIfUrl(mockUrl);
  
        expect(fetch).toHaveBeenCalledWith(mockUrl);
        expect(mockResponse.json).toHaveBeenCalled();
        expect(result).toEqual(mockManifest);
      });
  
      it('should handle an empty manifest correctly', async () => {
        const manifestHandler = manifestHandlerFactory();
        const emptyManifest: Manifest = {};
  
        const result = await manifestHandler.fetchIfUrl(emptyManifest);
  
        expect(result).toEqual({});
        expect(fetch).not.toHaveBeenCalled();
      });

    it('should return the provided Manifest object directly when not a URL', async () => {
      const manifestHandler = manifestHandlerFactory();
      const mockManifest: Manifest = {
        '@team/mfe1': 'http://localhost:3001/remoteEntry.js',
        '@team/mfe2': 'http://localhost:3002/remoteEntry.js'
      };

      const result = await manifestHandler.fetchIfUrl(mockManifest);

      expect(result).toBe(mockManifest);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should maintain the structure of complex manifests', async () => {
      const manifestHandler = manifestHandlerFactory();
      const complexManifest: Manifest = {
        '@team/mfe1': 'http://localhost:3001/remoteEntry.js',
        '@team/mfe2': 'http://localhost:3002/remoteEntry.js',
        '@team/mfe3': 'http://localhost:3003/remoteEntry.js',
        '@team/mfe4': 'http://localhost:3004/remoteEntry.js',
        '@team/mfe5': 'http://localhost:3005/remoteEntry.js'
      };

      const result = await manifestHandler.fetchIfUrl(complexManifest);

      expect(result).toEqual(complexManifest);
      expect(Object.keys(result).length).toBe(5);
    });
  });
});