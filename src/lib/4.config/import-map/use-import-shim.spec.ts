import { useShimImportMap } from './use-import-shim';

describe('useShimImportMap', () => {
  it('should set the importMapType to "importmap-shim" when shimMode is true', () => {
    const result = useShimImportMap({ shimMode: true });
    expect(result.importMapType).toBe('importmap-shim');
  });

  it('should set the importMapType to "importmap" when shimMode is false', () => {
    const result = useShimImportMap({ shimMode: false });
    expect(result.importMapType).toBe('importmap');
  });
  it('should use importShim for loadModuleFn', () => {
    (global as any).importShim = jest.fn().mockImplementation(url => ({ url }));
    const mockUrl = 'https://example.com/module.js';
    const result = useShimImportMap({ shimMode: true });
    expect(result.loadModuleFn(mockUrl)).toBeDefined();
  });
});
