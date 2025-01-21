import { getDir, join } from './path';

describe('getDir', () => {
  it('should return the directory path from a full URL', () => {
    expect(getDir('https://example.com/path/to/file.txt')).toBe('https://example.com/path/to');
  });

  it('should handle paths with multiple segments', () => {
    expect(getDir('/a/b/c/d/file.txt')).toBe('/a/b/c/d');
  });

  it('should return empty string for root-level files', () => {
    expect(getDir('file.txt')).toBe('');
  });

  it('should handle paths with no file extension', () => {
    expect(getDir('/path/to/directory')).toBe('/path/to');
  });

  it('should handle paths ending with slash', () => {
    expect(getDir('/path/to/directory/')).toBe('/path/to/directory');
  });

  it('should handle empty strings', () => {
    expect(getDir('')).toBe('');
  });
});

describe('join', () => {
  it('should join two path segments with a slash', () => {
    expect(join('path/to', 'file.txt')).toBe('path/to/file.txt');
  });

  it('should handle leading slash in first path', () => {
    expect(join('/path/to', 'file.txt')).toBe('path/to/file.txt');
  });

  it('should handle trailing slash in second path', () => {
    expect(join('path/to', 'directory/')).toBe('path/to/directory');
  });

  it('should handle both leading and trailing slashes', () => {
    expect(join('/path/to', 'directory/')).toBe('path/to/directory');
  });

  it('should handle single segment paths', () => {
    expect(join('path', 'file.txt')).toBe('path/file.txt');
  });

  it('should handle empty first path', () => {
    expect(join('', 'file.txt')).toBe('/file.txt');
  });

  it('should handle empty second path', () => {
    expect(join('path/to', '')).toBe('path/to/');
  });

  it('should handle both paths empty', () => {
    expect(join('', '')).toBe('/');
  });

  it('should maintain correct slashes with multiple segments', () => {
    expect(join('a/b/c', 'd/e/f')).toBe('a/b/c/d/e/f');
  });
});