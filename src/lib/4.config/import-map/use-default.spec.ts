import { useDefaultImportMap } from './use-default';

describe('useDefaultImportMap', () => {
  it('should set the importMapType to "importmap"', () => {
    const result = useDefaultImportMap();
    expect(result.importMapType).toBe('importmap');
  });
});
