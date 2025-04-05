import { getDir, join } from './path';

describe('getDir', () => {
  it('should return the directory path from a full URL', () => {
    expect(getDir('https://example.com/path/to/file.txt')).toBe('https://example.com/path/to/');
  });

  it('should handle paths with multiple segments', () => {
    expect(getDir('/a/b/c/d/file.txt')).toBe('/a/b/c/d/');
  });

  it('should return empty string for root-level files', () => {
    expect(getDir('file.txt')).toBe('');
  });

  it('should handle paths with no file extension', () => {
    expect(getDir('/path/to/directory')).toBe('/path/to/directory/');
  });

  it('should handle paths ending with slash', () => {
    expect(getDir('/path/to/directory/')).toBe('/path/to/directory/');
  });

  it('should handle empty strings', () => {
    expect(getDir('')).toBe('');
  });

  it('should handle null or undefined inputs', () => {
    expect(getDir(null as any)).toBe('');
    expect(getDir(undefined as any)).toBe('');
  });

  it('should handle root path', () => {
    expect(getDir('/')).toBe('/');
  });

  it('should handle paths with query parameters', () => {
    expect(getDir('https://example.com/path/file.txt?query=value')).toBe('https://example.com/path/');
  });

  it('should handle paths with hash fragments', () => {
    expect(getDir('https://example.com/path/file.txt#section')).toBe('https://example.com/path/');
  });

  it('should handle file paths with dots in directory names', () => {
    expect(getDir('/path/to/version.1/file.txt')).toBe('/path/to/version.1/');
  });

  it('should handle file names with multiple extensions', () => {
    expect(getDir('/path/to/archive.tar.gz')).toBe('/path/to/');
  });

  it('should handle Windows-style paths if they use forward slashes', () => {
    expect(getDir('C:/Users/username/Documents/file.txt')).toBe('C:/Users/username/Documents/');
  });

  it('should handle relative paths', () => {
    expect(getDir('./file.txt')).toBe('./');
    expect(getDir('../file.txt')).toBe('../');
    expect(getDir('../../file.txt')).toBe('../../');
  });

  it('should handle complex relative paths', () => {
    expect(getDir('./path/to/file.txt')).toBe('./path/to/');
    expect(getDir('../path/to/file.txt')).toBe('../path/to/');
  });

  it('should handle file URLs', () => {
    expect(getDir('file:///home/user/documents/file.txt')).toBe('file:///home/user/documents/');
  });

  it('should handle URLs with port numbers', () => {
    expect(getDir('http://example.com:8080/path/to/file.txt')).toBe('http://example.com:8080/path/to/');
  });

  it('should handle paths that only contain a directory name (no slashes)', () => {
    expect(getDir('directory')).toBe('directory/');
  });

  it('should handle edge cases with dots', () => {
    expect(getDir('/path/to/.')).toBe('/path/to/');
    expect(getDir('/path/to/..')).toBe('/path/to/');
    expect(getDir('/path/to/...')).toBe('/path/to/');
  });
});

describe('join', () => {
  it('should join two path segments with a slash', () => {
    expect(join('path/to', 'file.txt')).toBe('path/to/file.txt');
  });

  it('should handle trailing slash in first path', () => {
    expect(join('path/to/', 'file.txt')).toBe('path/to/file.txt');
  });

  it('should handle leading slash in second path', () => {
    expect(join('path/to', '/directory')).toBe('path/to/directory');
  });

  it('should handle both leading and trailing slashes', () => {
    expect(join('path/to/', '/directory')).toBe('path/to/directory');
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