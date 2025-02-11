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
        it("should return true if the version is within the range", () => {
            expect ( versionHandler.isCompatible("1.2.1", ["1.2.0","2.2.2"]) ).toBe(true);
            expect ( versionHandler.isCompatible("1.2.1-patch", ["1.2.0","2.2.2"]) ).toBe(true);
            expect ( versionHandler.isCompatible("1.2.0-patch", ["1.2.0","2.2.2"]) ).toBe(true);
            expect ( versionHandler.isCompatible("1.3.0", ["1.2.0","2.4.0"]) ).toBe(true);
            expect ( versionHandler.isCompatible("2.1.2", ["1.0.0","3.0.0"]) ).toBe(true);
        });
        it("should return false if the version is outside of the range", () => {
            expect ( versionHandler.isCompatible("1.1.0", ["1.2.0","1.4.0"]) ).toBe(false);
            expect ( versionHandler.isCompatible("1.5.0", ["1.2.0","1.4.0"]) ).toBe(false);
            expect ( versionHandler.isCompatible("1.4.1", ["1.2.0","1.4.0"]) ).toBe(false);
            expect ( versionHandler.isCompatible("2.3.0", ["1.2.0","1.4.0"]) ).toBe(false);
            expect ( versionHandler.isCompatible("1.1.999", ["1.2.0","1.4.0"]) ).toBe(false);
        });
        it("should be inclusive for min and exclusive for max", () => {
            expect ( versionHandler.isCompatible("2.2.0", ["2.2.0","2.2.2"]) ).toBe(true);
            expect ( versionHandler.isCompatible("2.2.2", ["2.2.0","2.2.2"]) ).toBe(false);
        })
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

    /**
     * Within the range, the min is inclusive and the max is exclusive
     */
    describe('toRange', () => {
        it('should convert ~ versions to a range', () => {
            expect( versionHandler.toRange("~1.1.1") ).toEqual(["1.1.1", "1.2.0"]);
            expect( versionHandler.toRange("~1.2.3") ).toEqual(["1.2.3", "1.3.0"]);
            expect( versionHandler.toRange("~1.2.4-patch") ).toEqual(["1.2.4-patch", "1.3.0"]);

        })
        it('should convert ^ versions to a range', () => {
            expect( versionHandler.toRange("^1.1.1") ).toEqual(["1.1.1", "2.0.0"]);
            expect( versionHandler.toRange("^1.2.3-patch") ).toEqual(["1.2.3-patch", "2.0.0"]);
        })

        it('should handle a version range', () => {
            expect( versionHandler.toRange(">=1.1.1 <=2.0.0") ).toEqual(["1.1.1", "2.0.1"]);
            expect( versionHandler.toRange(">1.1.1 <=2.0.0") ).toEqual(["1.1.2", "2.0.1"]);
            expect( versionHandler.toRange(">=1.1.1 <2.0.0") ).toEqual(["1.1.1", "2.0.0"]);
            expect( versionHandler.toRange(">1.1.1 <2.0.0") ).toEqual(["1.1.2", "2.0.0"]);

            expect( versionHandler.toRange(">=1.1.1-patch <=2.0.0-patch") ).toEqual(["1.1.1-patch", "2.0.1"]);
            expect( versionHandler.toRange(">1.1.1-patch <=2.0.0-patch") ).toEqual(["1.1.2", "2.0.1"]);
            expect( versionHandler.toRange(">=1.1.1-patch <2.0.0-patch") ).toEqual(["1.1.1-patch", "2.0.0-patch"]);
            expect( versionHandler.toRange(">1.1.1-patch <2.0.0-patch") ).toEqual(["1.1.2", "2.0.0-patch"]);

            expect( () => versionHandler.toRange(">abc <1.1.1") ).toThrow("Invalid min version '>abc <1.1.1'");
            expect( () => versionHandler.toRange(">1.1.1 <abc") ).toThrow("Invalid max version '>1.1.1 <abc'");

        })

        it('should handle single versions', () => {
            expect( versionHandler.toRange("1.1.1") ).toEqual(["1.1.1", "1.1.2"]);
            expect( versionHandler.toRange("2.0.0-patch") ).toEqual(["2.0.0-patch", "2.0.1"]);
        });

        it('should fail otherwise', () => {
            expect( () => versionHandler.toRange("<1.1.1 >1.5.0") ).toThrow("Could not convert '<1.1.1 >1.5.0' to a version range.");
            expect( () => versionHandler.toRange("<=1.1.1 >=1.5.0") ).toThrow("Could not convert '<=1.1.1 >=1.5.0' to a version range.");
            expect( () => versionHandler.toRange("1.1.1 1.5.0") ).toThrow("Could not convert '1.1.1 1.5.0' to a version range.");
            expect( () => versionHandler.toRange("123") ).toThrow("Could not convert '123' to a version range.");
            expect( () => versionHandler.toRange("abc") ).toThrow("Could not convert 'abc' to a version range.");

        });
    });
});