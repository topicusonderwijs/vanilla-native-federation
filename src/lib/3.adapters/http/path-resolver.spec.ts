import type { ForResolvingPaths } from "../../2.app/driving-ports/for-resolving-paths.port";
import { createPathResolver } from "./path-resolver";

describe('pathResolver', () => {
    let pathResolver: ForResolvingPaths;

    beforeEach(() => {
        pathResolver = createPathResolver();
    });

    describe('getScope', () => {
        it('should return the directory path from a full URL', () => {
            expect(pathResolver.getScope('https://example.com/path/to/file.txt')).toBe('https://example.com/path/to/');
        });

        it('should handle paths with multiple segments', () => {
            expect(pathResolver.getScope('/a/b/c/d/file.txt')).toBe('/a/b/c/d/');
        });

        it('should return empty string for root-level files', () => {
            expect(pathResolver.getScope('file.txt')).toBe('');
        });

        it('should handle paths with no file extension', () => {
            expect(pathResolver.getScope('/path/to/directory')).toBe('/path/to/directory/');
        });

        it('should handle paths ending with slash', () => {
            expect(pathResolver.getScope('/path/to/directory/')).toBe('/path/to/directory/');
        });

        it('should handle empty strings', () => {
            expect(pathResolver.getScope('')).toBe('');
        });

        it('should handle null or undefined inputs', () => {
            expect(pathResolver.getScope(null as any)).toBe('');
            expect(pathResolver.getScope(undefined as any)).toBe('');
        });

        it('should handle root path', () => {
            expect(pathResolver.getScope('/')).toBe('/');
        });

        it('should handle paths with query parameters', () => {
            expect(pathResolver.getScope('https://example.com/path/file.txt?query=value')).toBe('https://example.com/path/');
        });

        it('should handle paths with hash fragments', () => {
            expect(pathResolver.getScope('https://example.com/path/file.txt#section')).toBe('https://example.com/path/');
        });

        it('should handle file paths with dots in directory names', () => {
            expect(pathResolver.getScope('/path/to/version.1/file.txt')).toBe('/path/to/version.1/');
        });

        it('should handle file names with multiple extensions', () => {
            expect(pathResolver.getScope('/path/to/archive.tar.gz')).toBe('/path/to/');
        });

        it('should handle Windows-style paths if they use forward slashes', () => {
            expect(pathResolver.getScope('C:/Users/username/Documents/file.txt')).toBe('C:/Users/username/Documents/');
        });

        it('should handle relative paths', () => {
            expect(pathResolver.getScope('./file.txt')).toBe('./');
            expect(pathResolver.getScope('../file.txt')).toBe('../');
            expect(pathResolver.getScope('../../file.txt')).toBe('../../');
        });

        it('should handle complex relative paths', () => {
            expect(pathResolver.getScope('./path/to/file.txt')).toBe('./path/to/');
            expect(pathResolver.getScope('../path/to/file.txt')).toBe('../path/to/');
        });

        it('should handle file URLs', () => {
            expect(pathResolver.getScope('file:///home/user/documents/file.txt')).toBe('file:///home/user/documents/');
        });

        it('should handle URLs with port numbers', () => {
            expect(pathResolver.getScope('http://example.com:8080/path/to/file.txt')).toBe('http://example.com:8080/path/to/');
        });

        it('should handle paths that only contain a directory name (no slashes)', () => {
            expect(pathResolver.getScope('directory')).toBe('directory/');
        });

        it('should handle edge cases with dots', () => {
            expect(pathResolver.getScope('/path/to/.')).toBe('/path/to/');
            expect(pathResolver.getScope('/path/to/..')).toBe('/path/to/');
            expect(pathResolver.getScope('/path/to/...')).toBe('/path/to/');
        });
    });

    describe('join', () => {
        it('should join two path segments with a slash', () => {
            expect(pathResolver.join('path/to', 'file.txt')).toBe('path/to/file.txt');
        });
    
        it('should handle trailing slash in first path', () => {
            expect(pathResolver.join('path/to/', 'file.txt')).toBe('path/to/file.txt');
        });
    
        it('should handle leading slash in second path', () => {
            expect(pathResolver.join('path/to', '/directory')).toBe('path/to/directory');
        });
    
        it('should handle both leading and trailing slashes', () => {
            expect(pathResolver.join('path/to/', '/directory')).toBe('path/to/directory');
        });
    
        it('should handle single segment paths', () => {
            expect(pathResolver.join('path', 'file.txt')).toBe('path/file.txt');
        });
    
        it('should handle empty first path', () => {
            expect(pathResolver.join('', 'file.txt')).toBe('/file.txt');
        });
    
        it('should handle empty second path', () => {
            expect(pathResolver.join('path/to', '')).toBe('path/to/');
        });
    
        it('should handle both paths empty', () => {
            expect(pathResolver.join('', '')).toBe('/');
        });
    
        it('should maintain correct slashes with multiple segments', () => {
            expect(pathResolver.join('a/b/c', 'd/e/f')).toBe('a/b/c/d/e/f');
        });
    });
});