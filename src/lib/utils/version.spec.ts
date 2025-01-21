import { compareVersions, addLatestTag, getLatestVersion, getLatestVersionBefore } from './version';

describe('compareVersions', () => {
    it('should correctly compare simple version numbers', () => {
        expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
        expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
        expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should handle patch version differences', () => {
        expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
        expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
        expect(compareVersions('1.0.1', '1.0.1')).toBe(0);
    });

    it('should handle flag type version differences', () => {
        expect(compareVersions('1.0.0-patch', '1.0.0')).toBe(1);
        expect(compareVersions('1.0.0', '1.0.0-patch')).toBe(-1);
        expect(compareVersions('1.0.0-patch', '1.0.0-patch')).toBe(0);
        expect(compareVersions('1.0.0-b', '1.0.0-a')).toBe(1);

    });

    it('should handle minor version differences', () => {
        expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
        expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
        expect(compareVersions('1.1.0', '1.1.0')).toBe(0);
    });

    it('should fallback to string comparison for invalid version strings', () => {
        expect(compareVersions('abc', 'def')).toBe(-1);
        expect(compareVersions('def', 'abc')).toBe(1);
        expect(compareVersions('abc', 'abc')).toBe(0);
    });

    it('should handle empty strings and special characters', () => {
        expect(compareVersions('', '')).toBe(0);
        expect(typeof compareVersions('1.0-alpha', '1.0-beta')).toBe('number');
        expect(typeof compareVersions('!@#', '$%^')).toBe('number');
    });
});

describe('addLatestTag', () => {
    it('should add latest tag to single remote', () => {
        expect(addLatestTag(['remote1'])).toEqual({
            'remote1': 'latest'
        });
    });

    it('should add latest tag to multiple remotes', () => {
        expect(addLatestTag(['remote1', 'remote2', 'remote3'])).toEqual({
            'remote1': 'latest',
            'remote2': 'latest',
            'remote3': 'latest'
        });
    });

    it('should handle empty array', () => {
        expect(addLatestTag([])).toEqual({});
    });

    it('should handle array with empty strings', () => {
        expect(addLatestTag([''])).toEqual({
            '': 'latest'
        });
    });
});

describe('getLatestVersion', () => {
    it('should return the latest version from a list', () => {
        expect(getLatestVersion(['1.0.0', '2.0.0', '1.5.0'])).toBe('2.0.0');
    });

    it('should handle single version', () => {
        expect(getLatestVersion(['1.0.0'])).toBe('1.0.0');
    });

    it('should handle empty array', () => {
        expect(getLatestVersion([])).toBeUndefined();
    });

    it('should handle complex version numbers', () => {
        const versions = ['1.0.0', '1.0.3', '1.3.0', '2.0.0'];
        expect(getLatestVersion(versions)).toBe('2.0.0');
    });
});

describe('getLatestVersionBefore', () => {
    it('should return the latest version before specified version', () => {
        const versions = ['1.0.0', '2.0.0', '1.5.0', '3.0.0'];
        expect(getLatestVersionBefore(versions, '2.0.0')).toBe('1.5.0');
    });

    it('should return undefined if no versions before specified version', () => {
        const versions = ['2.0.0', '3.0.0', '4.0.0'];
        expect(getLatestVersionBefore(versions, '1.0.0')).toBeUndefined();
    });

    it('should handle single version', () => {
        expect(getLatestVersionBefore(['1.0.0'], '2.0.0')).toBe('1.0.0');
    });

    it('should handle empty array', () => {
        expect(getLatestVersionBefore([], '1.0.0')).toBeUndefined();
    });

    it('should handle complex version scenarios', () => {
        const versions = ['1.0.0', '1.1.0', '2.0.0', '1.0.3', '1.5.0'];
        expect(getLatestVersionBefore(versions, '1.5.0')).toBe('1.1.0');
    });

    it('should handle identical versions', () => {
        const versions = ['1.0.0', '1.0.0', '2.0.0'];
        expect(getLatestVersionBefore(versions, '2.0.0')).toBe('1.0.0');
    });
});