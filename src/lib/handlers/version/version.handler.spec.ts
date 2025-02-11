import { Version, VersionHandler } from "./version.contract";
import { versionHandlerFactory } from "./version.handler";

/**
 *   === VERSION RULES ===
 *   ^               = patch AND minor can be higher
 *   ~               = only higher patch versions
 *   singleton       = in global 'imports' object, otherwise in scoped import
 *   strictVersion   = fail instead of warning (singleton mismatch)
 *   requiredVersion = '~1.1.0' || '^1.2.0' || '>=1.0.0 <3.0.0'
 */
describe('versionHandler', () => {
    let versionHandler: VersionHandler;

    beforeEach(() => {
        versionHandler = versionHandlerFactory();
    })

    describe('compareVersions', () => {
        describe('compareVersions', () => {
            it('should correctly compare simple version numbers', () => {
                expect(versionHandler.compareVersions('1.0.0', '2.0.0')).toBe(-1);
                expect(versionHandler.compareVersions('2.0.0', '1.0.0')).toBe(1);
                expect(versionHandler.compareVersions('1.0.0', '1.0.0')).toBe(0);
            });
        
            it('should handle minor version differences', () => {
                expect(versionHandler.compareVersions('1.1.0', '1.0.0')).toBe(1);
                expect(versionHandler.compareVersions('1.0.0', '1.1.0')).toBe(-1);
                expect(versionHandler.compareVersions('1.1.0', '1.1.0')).toBe(0);
            });

            it('should handle patch version differences', () => {
                expect(versionHandler.compareVersions('1.0.1', '1.0.0')).toBe(1);
                expect(versionHandler.compareVersions('1.0.0', '1.0.1')).toBe(-1);
                expect(versionHandler.compareVersions('1.0.1', '1.0.1')).toBe(0);
            });
        
            it('should handle flag type version differences', () => {
                expect(versionHandler.compareVersions('1.0.0-patch', '1.0.0')).toBe(1);
                expect(versionHandler.compareVersions('1.0.0', '1.0.0-patch')).toBe(-1);
                expect(versionHandler.compareVersions('1.0.0-patch', '1.0.0-patch')).toBe(0);
                expect(versionHandler.compareVersions('1.0.0-b', '1.0.0-a')).toBe(1);
            });

            it('should handle range prefixes', () => {
                expect(versionHandler.compareVersions('~1.1.0', '~1.0.0')).toBe(1);
                expect(versionHandler.compareVersions('^1.0.0', '^1.1.0')).toBe(-1);
                expect(versionHandler.compareVersions('~1.1.0', '1.1.0')).toBe(0);
                expect(versionHandler.compareVersions('1.2.0', '~1.2.0')).toBe(0);
            });
        
            it('should fallback to string comparison for invalid version strings', () => {
                expect(versionHandler.compareVersions('abc', 'def')).toBe(-1);
                expect(versionHandler.compareVersions('def', 'abc')).toBe(1);
                expect(versionHandler.compareVersions('abc', 'abc')).toBe(0);
            });
        
            it('should handle empty strings and special characters', () => {
                expect(versionHandler.compareVersions('', '')).toBe(0);
                expect(typeof versionHandler.compareVersions('1.0-alpha', '1.0-beta')).toBe('number');
                expect(typeof versionHandler.compareVersions('!@#', '$%^')).toBe('number');
            });
        });
    });
    describe('getLatestVersion', () => {
        it('should return the new version if it is higher', () => {
            const oldVersion: Version = {version: "1.2.0", url: "http://localhost:3001/"};
            const newVersion: Version = {version: "1.4.0", url: "http://localhost:3002/"};

            expect( versionHandler.getLatestVersion(newVersion, oldVersion) )
                .toEqual({version: "1.4.0", url: "http://localhost:3002/"});
        });

        it('should return the old version if it is higher', () => {
            const oldVersion: Version = {version: "1.4.0", url: "http://localhost:3001/"};
            const newVersion: Version = {version: "1.2.0", url: "http://localhost:3002/"};
            
            expect( versionHandler.getLatestVersion(newVersion, oldVersion) )
                .toEqual({version: "1.4.0", url: "http://localhost:3001/"});
        });

        it('should return the new version if the old is undefined', () => {
            const oldVersion: undefined = undefined;
            const newVersion: Version = {version: "1.4.0", url: "http://localhost:3002/"};
            
            expect( versionHandler.getLatestVersion(newVersion, oldVersion) )
                .toEqual({version: "1.4.0", url: "http://localhost:3002/"});
        });

        it('should return the old version if both versions are equal', () => {
            const oldVersion: Version = {version: "1.4.0", url: "http://localhost:3001/"};
            const newVersion: Version = {version: "1.4.0", url: "http://localhost:3002/"};
            
            expect( versionHandler.getLatestVersion(newVersion, oldVersion) )
                .toEqual({version: "1.4.0", url: "http://localhost:3001/"});
        });
    });

    describe('isCompatible', () => {
        it('should handle version ranges with ~', () => {
            expect ( versionHandler.isCompatible("2.2.1", "~2.2.1") ).toBe(true);

            expect ( versionHandler.isCompatible("2.2.2", "~2.2.1") ).toBe(true);
            expect ( versionHandler.isCompatible("2.2.0", "~2.2.1") ).toBe(false);

            expect ( versionHandler.isCompatible("2.3.1", "~2.2.1") ).toBe(false);
            expect ( versionHandler.isCompatible("2.1.1", "~2.2.1") ).toBe(false);

            expect ( versionHandler.isCompatible("3.2.1", "~2.2.1") ).toBe(false);
            expect ( versionHandler.isCompatible("1.2.1", "~2.2.1") ).toBe(false);
        });

        it('should handle version ranges with ^', () => {
            expect ( versionHandler.isCompatible("2.2.1", "^2.2.1") ).toBe(true);

            expect ( versionHandler.isCompatible("2.2.2", "^2.2.1") ).toBe(true);
            expect ( versionHandler.isCompatible("2.2.0", "^2.2.1") ).toBe(false);

            expect ( versionHandler.isCompatible("2.3.1", "^2.2.1") ).toBe(true);
            expect ( versionHandler.isCompatible("2.1.1", "^2.2.1") ).toBe(false);

            expect ( versionHandler.isCompatible("3.2.1", "^2.2.1") ).toBe(false);
            expect ( versionHandler.isCompatible("1.2.1", "^2.2.1") ).toBe(false);
        });

        it("should handle single versions", () => {
            expect ( versionHandler.isCompatible("2.2.2", "2.2.2") ).toBe(true);
            expect ( versionHandler.isCompatible("2.2.2-patch", "2.2.2-patch") ).toBe(true);

            expect ( versionHandler.isCompatible("3.2.2", "2.2.2") ).toBe(false);
            expect ( versionHandler.isCompatible("2.3.2", "2.2.2") ).toBe(false);
            expect ( versionHandler.isCompatible("2.2.3", "2.2.2") ).toBe(false);
            expect ( versionHandler.isCompatible("2.2.2-patch", "2.2.2") ).toBe(false);
        });
    });

    describe('stripVersionRange', () => {
        it('should not alter SEMVER versions', () => {
            const actual =versionHandler.stripVersionRange("1.2.3");
            expect(actual).toBe("1.2.3");
        });
        it('should remove ~ and ^', () => {
            expect( versionHandler.stripVersionRange("^1.2.3") ).toBe("1.2.3");
            expect( versionHandler.stripVersionRange("~1.2.3") ).toBe("1.2.3");
        });
        it('should remove >= and > and < and <=', () => {
            expect( versionHandler.stripVersionRange(">1.2.3") ).toBe("1.2.3");
            expect( versionHandler.stripVersionRange(">=1.2.3") ).toBe("1.2.3");
            expect( versionHandler.stripVersionRange("<=1.2.3") ).toBe("1.2.3");
            expect( versionHandler.stripVersionRange("<1.2.3") ).toBe("1.2.3");
        });
        it('should take the latest version from a range', () => {
            expect( versionHandler.stripVersionRange(">=1.2.3 <1.2.5") ).toBe("1.2.5");
            expect( versionHandler.stripVersionRange(">1.8.8 <=2.5.3") ).toBe("2.5.3");
        })
    });
});