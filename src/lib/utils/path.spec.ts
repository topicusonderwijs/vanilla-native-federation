import { join, getScope } from './path';

describe('pathHandler', () => {
  describe('getScope', () => {
    it('should return the directory path from a full URL', () => {
      expect(getScope('https://example.com/path/to/file.txt')).toBe('https://example.com/path/to/');
    });

    it('should handle paths with multiple segments', () => {
      expect(getScope('/a/b/c/d/file.txt')).toBe('/a/b/c/d/');
    });

    it('should return empty string for root-level files', () => {
      expect(getScope('file.txt')).toBe('');
    });

    it('should handle paths with no file extension', () => {
      expect(getScope('/path/to/directory')).toBe('/path/to/directory/');
    });

    it('should handle paths ending with slash', () => {
      expect(getScope('/path/to/directory/')).toBe('/path/to/directory/');
    });

    it('should handle empty strings', () => {
      expect(getScope('')).toBe('');
    });

    it('should handle null or undefined inputs', () => {
      expect(getScope(null as any)).toBe('');
      expect(getScope(undefined as any)).toBe('');
    });

    it('should handle root path', () => {
      expect(getScope('/')).toBe('/');
    });

    it('should handle paths with query parameters', () => {
      expect(getScope('https://example.com/path/file.txt?query=value')).toBe(
        'https://example.com/path/'
      );
    });

    it('should handle paths with hash fragments', () => {
      expect(getScope('https://example.com/path/file.txt#section')).toBe(
        'https://example.com/path/'
      );
    });

    it('should handle file paths with dots in directory names', () => {
      expect(getScope('/path/to/version.1/file.txt')).toBe('/path/to/version.1/');
    });

    it('should handle file names with multiple extensions', () => {
      expect(getScope('/path/to/archive.tar.gz')).toBe('/path/to/');
    });

    it('should handle relative paths', () => {
      expect(getScope('./file.txt')).toBe('./');
      expect(getScope('../file.txt')).toBe('../');
      expect(getScope('lib/file.txt')).toBe('lib/');
    });

    it('should handle complex relative paths', () => {
      expect(getScope('./path/to/file.txt')).toBe('./path/to/');
      expect(getScope('../path/to/file.txt')).toBe('../path/to/');
    });

    it('should handle file URLs', () => {
      expect(getScope('file:///home/user/documents/file.txt')).toBe('file:///home/user/documents/');
    });

    it('should handle URLs with port numbers', () => {
      expect(getScope('http://example.com:8080/path/to/file.txt')).toBe(
        'http://example.com:8080/path/to/'
      );
    });

    it('should handle paths that only contain a directory name (no slashes)', () => {
      expect(getScope('directory')).toBe('directory/');
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
});
