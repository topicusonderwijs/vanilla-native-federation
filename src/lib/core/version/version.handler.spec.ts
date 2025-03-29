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

    describe('isValid', () => {
        it('should accept correct semver versions', () => {
            expect(versionHandler.isValid("1.0.0")).toBe(true);
            expect(versionHandler.isValid("0.1.0")).toBe(true);
            expect(versionHandler.isValid("0.0.1")).toBe(true);
            expect(versionHandler.isValid("12.34.56")).toBe(true);
        });

        it('should accept valid pre-release versions', () => {
            expect(versionHandler.isValid("1.0.0-alpha")).toBe(true);
            expect(versionHandler.isValid("1.0.0-alpha.1")).toBe(true);
            expect(versionHandler.isValid("1.0.0-0.3.7")).toBe(true);
            expect(versionHandler.isValid("1.0.0-beta.11")).toBe(true);
            expect(versionHandler.isValid("1.0.0-rc.1")).toBe(true);
            expect(versionHandler.isValid("1.0.0-1alpha")).toBe(true); 
            expect(versionHandler.isValid("1.0.0-111111")).toBe(true);
            expect(versionHandler.isValid("1.0.0-alpha.beta.gamma.delta.epsilon")).toBe(true); 
            expect(versionHandler.isValid("1.0.0-alpha-beta-gamma")).toBe(true); 
        });
        
        it('should accept valid versions with build metadata', () => {
            expect(versionHandler.isValid("1.0.0+build.1")).toBe(true);
            expect(versionHandler.isValid("1.0.0+20130313144700")).toBe(true);
            expect(versionHandler.isValid("1.0.0-beta+exp.sha.5114f85")).toBe(true);
        });
        
        it('should handle versions with leading v', () => {
            expect(versionHandler.isValid("v1.0.0")).toBe(true);
            expect(versionHandler.isValid("v1.2.3-alpha.1+build.2")).toBe(true);
        });
        
        it('should correctly handle zeros in version numbers', () => {
            expect(versionHandler.isValid("0.0.0")).toBe(true);
            expect(versionHandler.isValid("1.0.0-0")).toBe(true);
            expect(versionHandler.isValid("1.0.0-0a")).toBe(true);
        });
        
        it('should decline invalid semver versions', () => {
            expect(versionHandler.isValid("")).toBe(false);
            expect(versionHandler.isValid("1")).toBe(false);
            expect(versionHandler.isValid("1.0")).toBe(false);
            expect(versionHandler.isValid("a.b.c")).toBe(false);
            expect(versionHandler.isValid("1.0.0.0")).toBe(false);
            expect(versionHandler.isValid(">=1.0.0")).toBe(false); 
            expect(versionHandler.isValid("~1.0.0")).toBe(false); 
            expect(versionHandler.isValid("^1.0.0")).toBe(false); 
            expect(versionHandler.isValid("9999999999.9999999999.9999999999")).toBe(true); 
        });
        
        it('should decline versions with invalid pre-release or build metadata', () => {
            expect(versionHandler.isValid("1.0.0-")).toBe(false);
            expect(versionHandler.isValid("1.0.0+")).toBe(false);
            expect(versionHandler.isValid("1.0.0-alpha..1")).toBe(false);
            expect(versionHandler.isValid("1.0.0-alpha!")).toBe(false);
            expect(versionHandler.isValid("1.0.0+build!")).toBe(false);
            expect(versionHandler.isValid("1.0.0-alpha..beta")).toBe(false); 
            expect(versionHandler.isValid("1.0.0+build..123")).toBe(false); 
        });
        
        it('should decline versions with leading zeros in numeric identifiers', () => {
            expect(versionHandler.isValid("01.0.0")).toBe(false);
            expect(versionHandler.isValid("1.01.0")).toBe(false);
            expect(versionHandler.isValid("1.0.01")).toBe(false);
            expect(versionHandler.isValid("1.0.0-01")).toBe(false);
        });
        
        it('should handle whitespace correctly', () => {
            expect(versionHandler.isValid(" 1.0.0")).toBe(true);
            expect(versionHandler.isValid("1.0.0 ")).toBe(true);
            expect(versionHandler.isValid("1.0.0-alpha ")).toBe(true);
        });
        
        it('should handle edge cases with negative numbers and version parts', () => {
            expect(versionHandler.isValid("-1.0.0")).toBe(false);
            expect(versionHandler.isValid("1.-0.0")).toBe(false);
            expect(versionHandler.isValid("1.0.-0")).toBe(false);
            expect(versionHandler.isValid("..1")).toBe(false); // missing major and minor
            expect(versionHandler.isValid("1..")).toBe(false); // missing minor and patch
            expect(versionHandler.isValid(".1.")).toBe(false); // missing major and patch
        });
        
        it('should handle special characters in identifiers correctly', () => {
            expect(versionHandler.isValid("1.0.0+build.11.e0f985a")).toBe(true);
            expect(versionHandler.isValid("1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay")).toBe(true);
            expect(versionHandler.isValid("1.0.0-rc.1+build.123")).toBe(true);
            expect(versionHandler.isValid("1.0.0-alpha_beta")).toBe(false); // underscore not allowed
            expect(versionHandler.isValid("1.0.0+alpha.beta.1+build")).toBe(false); // multiple + signs
            expect(versionHandler.isValid("1.0.0-αβγ")).toBe(false); // non-ASCII characters
            expect(versionHandler.isValid("1.0.0+构建")).toBe(false); // non-ASCII in build
            expect(versionHandler.isValid("1.0.0-0x123")).toBe(true); // hex-like identifier (valid)
            expect(versionHandler.isValid("1.0.0+0x123")).toBe(true); // hex-like in build (valid)
        });
        
        it('should handle various forms of input correctly', () => {
            expect(versionHandler.isValid(null as any)).toBe(false);
            expect(versionHandler.isValid(undefined as any)).toBe(false);
            expect(versionHandler.isValid({} as any)).toBe(false);
            expect(versionHandler.isValid([] as any)).toBe(false);
            expect(versionHandler.isValid(123 as any)).toBe(false);
         });
    });

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
            expect(versionHandler.compareVersions('1.0.0-patch', '1.0.0')).toBe(-1);
            expect(versionHandler.compareVersions('1.0.0', '1.0.0-patch')).toBe(1);
            expect(versionHandler.compareVersions('1.0.0-patch', '1.0.0-patch')).toBe(0);
            expect(versionHandler.compareVersions('1.0.0-b', '1.0.0-a')).toBe(1);
        });

        it('should throw an TypeError if version is not Semver', () => {
            expect(() => versionHandler.compareVersions('~1.1.0', '1.0.0')).toThrow(TypeError);
            expect(() => versionHandler.compareVersions('1.1.0', '~1.0.0')).toThrow(TypeError);
            expect(() => versionHandler.compareVersions('abc', '1.0.0')).toThrow(TypeError);
            expect(() => versionHandler.compareVersions('', '1.0.0')).toThrow(TypeError);
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
        it('should handle ~', () => {
            expect(versionHandler.isCompatible("1.1.0","~1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1","~1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.2","~1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.3","~1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.2.1","~1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("2.1.1","~1.1.1")).toBe(false);
        })
    
        it('should handle ^', () => {
            expect(versionHandler.isCompatible("1.1.0","^1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1","^1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.2","^1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.2.1","^1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.2.2","^1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("2.1.1","^1.1.1")).toBe(false);
        })
    
        it('should not accept pre-release versions in a regular version range', () => {
            expect(versionHandler.isCompatible("1.1.1-patch", "~1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.2-patch", "~1.1.1")).toBe(false);
    
            expect(versionHandler.isCompatible("1.1.0-patch","^1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1-patch","^1.1.1")).toBe(false);
    
            expect(versionHandler.isCompatible("1.1.2-patch", "^1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.2.0-patch", "^1.1.1")).toBe(false);
        });
    
        it('should accept pre-release versions in a range with the same pre-release tag', () => {
            // src: https://github.com/npm/node-semver/blob/30c438bb46c74f319aa8783f96d233ebf5f4a90d/classes/range.js#L528C5-L532C65 
            expect(versionHandler.isCompatible("1.1.1-patch", "~1.1.1-patch")).toBe(true);
            expect(versionHandler.isCompatible("1.1.2-patch", "~1.1.1-patch")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1-patch", "^1.1.1-patch")).toBe(true);
            expect(versionHandler.isCompatible("1.2.0-patch", "^1.1.1-patch")).toBe(false);

            expect(versionHandler.isCompatible("1.1.1-beta", "~1.1.1-alpha")).toBe(true); 
            expect(versionHandler.isCompatible("1.1.1-alpha", "~1.1.1-beta")).toBe(false); 
        });
     
        it('should handle exact version specifications', () => {
            expect(versionHandler.isCompatible("1.1.1", "1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.2", "1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.0", "1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1-patch", "1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1", "1.1.1-patch")).toBe(false);
            expect(versionHandler.isCompatible("1.1.1-patch", "1.1.1-patch")).toBe(true);
        });
     
        it('should handle version ranges with comparison operators', () => {
            expect(versionHandler.isCompatible("1.1.2", ">1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.1", ">1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.0", ">1.1.1")).toBe(false);
         
            expect(versionHandler.isCompatible("1.1.2", ">=1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.1", ">=1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.0", ">=1.1.1")).toBe(false);
         
            expect(versionHandler.isCompatible("1.1.0", "<1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.1", "<1.1.1")).toBe(false);
            expect(versionHandler.isCompatible("1.1.2", "<1.1.1")).toBe(false);
         
            expect(versionHandler.isCompatible("1.1.0", "<=1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.1", "<=1.1.1")).toBe(true);
            expect(versionHandler.isCompatible("1.1.2", "<=1.1.1")).toBe(false);
        });
     
        it('should handle complex version ranges', () => {
            // Hyphen ranges
            expect(versionHandler.isCompatible("1.1.1", "1.1.1 - 1.2.0")).toBe(true);
            expect(versionHandler.isCompatible("1.1.2", "1.1.1 - 1.2.0")).toBe(true);
            expect(versionHandler.isCompatible("1.2.0", "1.1.1 - 1.2.0")).toBe(true);
            expect(versionHandler.isCompatible("1.2.1", "1.1.1 - 1.2.0")).toBe(false);
            expect(versionHandler.isCompatible("1.0.0", "1.1.1 - 1.2.0")).toBe(false);
         
            // OR ranges (||)
            expect(versionHandler.isCompatible("1.0.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionHandler.isCompatible("1.1.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionHandler.isCompatible("2.0.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionHandler.isCompatible("2.1.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionHandler.isCompatible("3.0.0", "^1.0.0 || ^2.0.0")).toBe(false);
         
            // AND ranges (space between)
            expect(versionHandler.isCompatible("1.2.3", ">1.2.2 <1.3.0")).toBe(true);
            expect(versionHandler.isCompatible("1.2.2", ">1.2.2 <1.3.0")).toBe(false);
            expect(versionHandler.isCompatible("1.3.0", ">1.2.2 <1.3.0")).toBe(false);
        });
     
        it('should handle * and x as wildcards', () => {
            expect(versionHandler.isCompatible("1.1.1", "1.1.*")).toBe(true);
            expect(versionHandler.isCompatible("1.1.9", "1.1.*")).toBe(true);
            expect(versionHandler.isCompatible("1.2.1", "1.1.*")).toBe(false);
         
            expect(versionHandler.isCompatible("1.1.1", "1.x")).toBe(true);
            expect(versionHandler.isCompatible("1.9.9", "1.x")).toBe(true);
            expect(versionHandler.isCompatible("2.0.0", "1.x")).toBe(false);
         
            expect(versionHandler.isCompatible("1.1.1", "*")).toBe(true);
            expect(versionHandler.isCompatible("99.99.99", "*")).toBe(true);
        });

        it('should accept only regular versions when left empty', () => {
            expect(versionHandler.isCompatible("1.1.1", "")).toBe(true);
            expect(versionHandler.isCompatible("99.99.99", "")).toBe(true);
            
            expect(versionHandler.isCompatible("1.2.3-patch", "")).toBe(false);
        });

        it('should handle unusual but valid version ranges', () => {
            // Multiple complex ranges
            expect(versionHandler.isCompatible("2.0.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(true);
            expect(versionHandler.isCompatible("1.1.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(false);
            expect(versionHandler.isCompatible("1.2.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(true); 
            expect(versionHandler.isCompatible("1.3.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(false);

            // Caret for 0.x versions (only patch changes allowed)
            expect(versionHandler.isCompatible("0.1.1", "^0.1.0")).toBe(true);
            expect(versionHandler.isCompatible("0.1.9", "^0.1.0")).toBe(true);
            expect(versionHandler.isCompatible("0.2.0", "^0.1.0")).toBe(false);
         
            // Tilde for 0.x.y versions
            expect(versionHandler.isCompatible("0.1.1", "~0.1.0")).toBe(true);
            expect(versionHandler.isCompatible("0.1.9", "~0.1.0")).toBe(true);
            expect(versionHandler.isCompatible("0.2.0", "~0.1.0")).toBe(false);
        });
     
        it('should handle edge cases with invalid inputs', () => {
            expect(versionHandler.isCompatible("not.a.version", "^1.0.0")).toBe(false);
            expect(versionHandler.isCompatible("1.0.0", "not-a-range")).toBe(false);
            expect(versionHandler.isCompatible("invalid", "also-invalid")).toBe(false);
        
            expect(versionHandler.isCompatible(null as any, "^1.0.0")).toBe(false);
            expect(versionHandler.isCompatible("1.0.0", null as any)).toBe(false);
 
            expect(versionHandler.isCompatible(undefined as any, "^1.0.0")).toBe(false);
            expect(versionHandler.isCompatible("1.0.0", undefined as any)).toBe(false);
        });
    });

    describe('getSmallestVersionRange', () => {
        it('should return the newRange if the currentRange is empty', () => {
            expect(versionHandler.getSmallestVersionRange("~1.1.0", null as any)).toBe("~1.1.0");
            expect(versionHandler.getSmallestVersionRange("~1.1.0", undefined as any)).toBe("~1.1.0");
            expect(versionHandler.getSmallestVersionRange("~1.1.0", "bad-range" as any)).toBe("~1.1.0");
        });

        it('should throw an error if the newRange is invalid or empty', () => {
            expect(() => versionHandler.getSmallestVersionRange(null as any, "~1.1.0")).toThrow(TypeError);
            expect(() => versionHandler.getSmallestVersionRange(undefined as any, "~1.1.0")).toThrow(TypeError);
            expect(() => versionHandler.getSmallestVersionRange("bad-range" as any, "~1.1.0")).toThrow(TypeError);
        });

        it('should return currentRange if subset of newRange', () => {
            expect(versionHandler.getSmallestVersionRange("^1.1.0", "~1.1.0")).toBe("~1.1.0");
            expect(versionHandler.getSmallestVersionRange("^1.1.0", "~1.2.0")).toBe("~1.2.0");
            expect(versionHandler.getSmallestVersionRange("^1.1.0", "~1.1.1")).toBe("~1.1.1");
        });

        it('should return newRange if subset of currentRange', () => {
            expect(versionHandler.getSmallestVersionRange("~1.1.0", "^1.1.0")).toBe("~1.1.0");
            expect(versionHandler.getSmallestVersionRange("~1.2.0", "^1.1.0")).toBe("~1.2.0");
            expect(versionHandler.getSmallestVersionRange("~1.1.1", "^1.1.0")).toBe("~1.1.1");
        });

        it('should choose newRange if not fully subset of currentRange but minVersion is smaller', () => {
            expect(versionHandler.getSmallestVersionRange("~1.0.0", "~1.1.0")).toBe("~1.0.0");
            expect(versionHandler.getSmallestVersionRange("~1.0.0", "^1.1.0")).toBe("~1.0.0");
            expect(versionHandler.getSmallestVersionRange("~0.9.0", "^1.1.0")).toBe("~0.9.0");
            expect(versionHandler.getSmallestVersionRange(">1.0.0 <1.1.5", "~1.1.0")).toBe(">1.0.0 <1.1.5");
        });

        it('should choose currentRange if not fully subset of newRange but minversion is equal or smaller', () => {
            expect(versionHandler.getSmallestVersionRange("~1.1.0", "~1.0.0")).toBe("~1.0.0");
            expect(versionHandler.getSmallestVersionRange("^1.1.0", "~1.0.0")).toBe("~1.0.0");
            expect(versionHandler.getSmallestVersionRange("^1.1.0", "~0.9.0")).toBe("~0.9.0");
            expect(versionHandler.getSmallestVersionRange("~1.1.0", ">1.0.0 <1.1.5")).toBe(">1.0.0 <1.1.5");
        });
    });

});
