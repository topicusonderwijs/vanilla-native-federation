import { PathHandler } from "../../2.app/handlers/path.contract";
import { createPathHandler } from "./path.handler";

describe('pathHandler', () => {
    let pathHandler: PathHandler;

    beforeEach(() => {
        pathHandler = createPathHandler();
    });

    describe('getScope', () => {
        it('should return the directory path from a full URL', () => {
            expect(pathHandler.getScope('https://example.com/path/to/file.txt')).toBe('https://example.com/path/to/');
        });

        it('should handle paths with multiple segments', () => {
            expect(pathHandler.getScope('/a/b/c/d/file.txt')).toBe('/a/b/c/d/');
        });

        it('should return empty string for root-level files', () => {
            expect(pathHandler.getScope('file.txt')).toBe('');
        });

        it('should handle paths with no file extension', () => {
            expect(pathHandler.getScope('/path/to/directory')).toBe('/path/to/directory/');
        });

        it('should handle paths ending with slash', () => {
            expect(pathHandler.getScope('/path/to/directory/')).toBe('/path/to/directory/');
        });

        it('should handle empty strings', () => {
            expect(pathHandler.getScope('')).toBe('');
        });

        it('should handle null or undefined inputs', () => {
            expect(pathHandler.getScope(null as any)).toBe('');
            expect(pathHandler.getScope(undefined as any)).toBe('');
        });

        it('should handle root path', () => {
            expect(pathHandler.getScope('/')).toBe('/');
        });

        it('should handle paths with query parameters', () => {
            expect(pathHandler.getScope('https://example.com/path/file.txt?query=value')).toBe('https://example.com/path/');
        });

        it('should handle paths with hash fragments', () => {
            expect(pathHandler.getScope('https://example.com/path/file.txt#section')).toBe('https://example.com/path/');
        });

        it('should handle file paths with dots in directory names', () => {
            expect(pathHandler.getScope('/path/to/version.1/file.txt')).toBe('/path/to/version.1/');
        });

        it('should handle file names with multiple extensions', () => {
            expect(pathHandler.getScope('/path/to/archive.tar.gz')).toBe('/path/to/');
        });

        it('should handle Windows-style paths if they use forward slashes', () => {
            expect(pathHandler.getScope('C:/Users/username/Documents/file.txt')).toBe('C:/Users/username/Documents/');
        });

        it('should handle relative paths', () => {
            expect(pathHandler.getScope('./file.txt')).toBe('./');
            expect(pathHandler.getScope('../file.txt')).toBe('../');
            expect(pathHandler.getScope('../../file.txt')).toBe('../../');
        });

        it('should handle complex relative paths', () => {
            expect(pathHandler.getScope('./path/to/file.txt')).toBe('./path/to/');
            expect(pathHandler.getScope('../path/to/file.txt')).toBe('../path/to/');
        });

        it('should handle file URLs', () => {
            expect(pathHandler.getScope('file:///home/user/documents/file.txt')).toBe('file:///home/user/documents/');
        });

        it('should handle URLs with port numbers', () => {
            expect(pathHandler.getScope('http://example.com:8080/path/to/file.txt')).toBe('http://example.com:8080/path/to/');
        });

        it('should handle paths that only contain a directory name (no slashes)', () => {
            expect(pathHandler.getScope('directory')).toBe('directory/');
        });

        it('should handle edge cases with dots', () => {
            expect(pathHandler.getScope('/path/to/.')).toBe('/path/to/');
            expect(pathHandler.getScope('/path/to/..')).toBe('/path/to/');
            expect(pathHandler.getScope('/path/to/...')).toBe('/path/to/');
        });
    });

    describe('join', () => {
        it('should join two path segments with a slash', () => {
            expect(pathHandler.join('path/to', 'file.txt')).toBe('path/to/file.txt');
        });
    
        it('should handle trailing slash in first path', () => {
            expect(pathHandler.join('path/to/', 'file.txt')).toBe('path/to/file.txt');
        });
    
        it('should handle leading slash in second path', () => {
            expect(pathHandler.join('path/to', '/directory')).toBe('path/to/directory');
        });
    
        it('should handle both leading and trailing slashes', () => {
            expect(pathHandler.join('path/to/', '/directory')).toBe('path/to/directory');
        });
    
        it('should handle single segment paths', () => {
            expect(pathHandler.join('path', 'file.txt')).toBe('path/file.txt');
        });
    
        it('should handle empty first path', () => {
            expect(pathHandler.join('', 'file.txt')).toBe('/file.txt');
        });
    
        it('should handle empty second path', () => {
            expect(pathHandler.join('path/to', '')).toBe('path/to/');
        });
    
        it('should handle both paths empty', () => {
            expect(pathHandler.join('', '')).toBe('/');
        });
    
        it('should maintain correct slashes with multiple segments', () => {
            expect(pathHandler.join('a/b/c', 'd/e/f')).toBe('a/b/c/d/e/f');
        });
    });
});