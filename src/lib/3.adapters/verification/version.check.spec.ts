import { ForCheckingVersion } from '../../2.app/driving-ports/for-checking-version.port';
import { createVersionCheck } from './version.check';
/**
 *   === VERSION RULES ===
 *   ^               = patch AND minor can be higher
 *   ~               = only higher patch versions
 *   singleton       = in global 'imports' object, otherwise in scoped import
 *   strictVersion   = fail instead of warning (singleton mismatch)
 *   requiredVersion = '~1.1.0' || '^1.2.0' || '>=1.0.0 <3.0.0'
 */
describe('versionCheck', () => {
    let versionCheck: ForCheckingVersion;

    beforeEach(() => {
        versionCheck = createVersionCheck();
    })

    describe('isValidSemver', () => {
        it('should accept correct semver versions', () => {
            expect(versionCheck.isValidSemver("1.0.0")).toBe(true);
            expect(versionCheck.isValidSemver("0.1.0")).toBe(true);
            expect(versionCheck.isValidSemver("0.0.1")).toBe(true);
            expect(versionCheck.isValidSemver("12.34.56")).toBe(true);
        });

        it('should accept valid pre-release versions', () => {
            expect(versionCheck.isValidSemver("1.0.0-alpha")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-alpha.1")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-0.3.7")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-beta.11")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-rc.1")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-1alpha")).toBe(true); 
            expect(versionCheck.isValidSemver("1.0.0-111111")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-alpha.beta.gamma.delta.epsilon")).toBe(true); 
            expect(versionCheck.isValidSemver("1.0.0-alpha-beta-gamma")).toBe(true); 
        });
        
        it('should accept valid versions with build metadata', () => {
            expect(versionCheck.isValidSemver("1.0.0+build.1")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0+20130313144700")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-beta+exp.sha.5114f85")).toBe(true);
        });
        
        it('should handle versions with leading v', () => {
            expect(versionCheck.isValidSemver("v1.0.0")).toBe(true);
            expect(versionCheck.isValidSemver("v1.2.3-alpha.1+build.2")).toBe(true);
        });
        
        it('should correctly handle zeros in version numbers', () => {
            expect(versionCheck.isValidSemver("0.0.0")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-0")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-0a")).toBe(true);
        });
        
        it('should decline invalid semver versions', () => {
            expect(versionCheck.isValidSemver("")).toBe(false);
            expect(versionCheck.isValidSemver("1")).toBe(false);
            expect(versionCheck.isValidSemver("1.0")).toBe(false);
            expect(versionCheck.isValidSemver("a.b.c")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0.0")).toBe(false);
            expect(versionCheck.isValidSemver(">=1.0.0")).toBe(false); 
            expect(versionCheck.isValidSemver("~1.0.0")).toBe(false); 
            expect(versionCheck.isValidSemver("^1.0.0")).toBe(false); 
            expect(versionCheck.isValidSemver("9999999999.9999999999.9999999999")).toBe(true); 
        });
        
        it('should decline versions with invalid pre-release or build metadata', () => {
            expect(versionCheck.isValidSemver("1.0.0-")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0+")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0-alpha..1")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0-alpha!")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0+build!")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0-alpha..beta")).toBe(false); 
            expect(versionCheck.isValidSemver("1.0.0+build..123")).toBe(false); 
        });
        
        it('should decline versions with leading zeros in numeric identifiers', () => {
            expect(versionCheck.isValidSemver("01.0.0")).toBe(false);
            expect(versionCheck.isValidSemver("1.01.0")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.01")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.0-01")).toBe(false);
        });
        
        it('should handle whitespace correctly', () => {
            expect(versionCheck.isValidSemver(" 1.0.0")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0 ")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-alpha ")).toBe(true);
        });
        
        it('should handle edge cases with negative numbers and version parts', () => {
            expect(versionCheck.isValidSemver("-1.0.0")).toBe(false);
            expect(versionCheck.isValidSemver("1.-0.0")).toBe(false);
            expect(versionCheck.isValidSemver("1.0.-0")).toBe(false);
            expect(versionCheck.isValidSemver("..1")).toBe(false); // missing major and minor
            expect(versionCheck.isValidSemver("1..")).toBe(false); // missing minor and patch
            expect(versionCheck.isValidSemver(".1.")).toBe(false); // missing major and patch
        });
        
        it('should handle special characters in identifiers correctly', () => {
            expect(versionCheck.isValidSemver("1.0.0+build.11.e0f985a")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-rc.1+build.123")).toBe(true);
            expect(versionCheck.isValidSemver("1.0.0-alpha_beta")).toBe(false); // underscore not allowed
            expect(versionCheck.isValidSemver("1.0.0+alpha.beta.1+build")).toBe(false); // multiple + signs
            expect(versionCheck.isValidSemver("1.0.0-αβγ")).toBe(false); // non-ASCII characters
            expect(versionCheck.isValidSemver("1.0.0+构建")).toBe(false); // non-ASCII in build
            expect(versionCheck.isValidSemver("1.0.0-0x123")).toBe(true); // hex-like identifier (valid)
            expect(versionCheck.isValidSemver("1.0.0+0x123")).toBe(true); // hex-like in build (valid)
        });
        
        it('should handle various forms of input correctly', () => {
            expect(versionCheck.isValidSemver(null as any)).toBe(false);
            expect(versionCheck.isValidSemver(undefined as any)).toBe(false);
            expect(versionCheck.isValidSemver({} as any)).toBe(false);
            expect(versionCheck.isValidSemver([] as any)).toBe(false);
            expect(versionCheck.isValidSemver(123 as any)).toBe(false);
         });
    });

    describe('isCompatible', () => {
        it('should handle ~', () => {
            expect(versionCheck.isCompatible("1.1.0","~1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1","~1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.2","~1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.3","~1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.2.1","~1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("2.1.1","~1.1.1")).toBe(false);
        })
    
        it('should handle ^', () => {
            expect(versionCheck.isCompatible("1.1.0","^1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1","^1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.2","^1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.2.1","^1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.2.2","^1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("2.1.1","^1.1.1")).toBe(false);
        })
    
        it('should not accept pre-release versions in a regular version range', () => {
            expect(versionCheck.isCompatible("1.1.1-patch", "~1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.2-patch", "~1.1.1")).toBe(false);
    
            expect(versionCheck.isCompatible("1.1.0-patch","^1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1-patch","^1.1.1")).toBe(false);
    
            expect(versionCheck.isCompatible("1.1.2-patch", "^1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.2.0-patch", "^1.1.1")).toBe(false);
        });
    
        it('should accept pre-release versions in a range with the same pre-release tag', () => {
            // src: https://github.com/npm/node-semver/blob/30c438bb46c74f319aa8783f96d233ebf5f4a90d/classes/range.js#L528C5-L532C65 
            expect(versionCheck.isCompatible("1.1.1-patch", "~1.1.1-patch")).toBe(true);
            expect(versionCheck.isCompatible("1.1.2-patch", "~1.1.1-patch")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1-patch", "^1.1.1-patch")).toBe(true);
            expect(versionCheck.isCompatible("1.2.0-patch", "^1.1.1-patch")).toBe(false);

            expect(versionCheck.isCompatible("1.1.1-beta", "~1.1.1-alpha")).toBe(true); 
            expect(versionCheck.isCompatible("1.1.1-alpha", "~1.1.1-beta")).toBe(false); 
        });
     
        it('should handle exact version specifications', () => {
            expect(versionCheck.isCompatible("1.1.1", "1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.2", "1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.0", "1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1-patch", "1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1", "1.1.1-patch")).toBe(false);
            expect(versionCheck.isCompatible("1.1.1-patch", "1.1.1-patch")).toBe(true);
        });
     
        it('should handle version ranges with comparison operators', () => {
            expect(versionCheck.isCompatible("1.1.2", ">1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.1", ">1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.0", ">1.1.1")).toBe(false);
         
            expect(versionCheck.isCompatible("1.1.2", ">=1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.1", ">=1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.0", ">=1.1.1")).toBe(false);
         
            expect(versionCheck.isCompatible("1.1.0", "<1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.1", "<1.1.1")).toBe(false);
            expect(versionCheck.isCompatible("1.1.2", "<1.1.1")).toBe(false);
         
            expect(versionCheck.isCompatible("1.1.0", "<=1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.1", "<=1.1.1")).toBe(true);
            expect(versionCheck.isCompatible("1.1.2", "<=1.1.1")).toBe(false);
        });
     
        it('should handle complex version ranges', () => {
            // Hyphen ranges
            expect(versionCheck.isCompatible("1.1.1", "1.1.1 - 1.2.0")).toBe(true);
            expect(versionCheck.isCompatible("1.1.2", "1.1.1 - 1.2.0")).toBe(true);
            expect(versionCheck.isCompatible("1.2.0", "1.1.1 - 1.2.0")).toBe(true);
            expect(versionCheck.isCompatible("1.2.1", "1.1.1 - 1.2.0")).toBe(false);
            expect(versionCheck.isCompatible("1.0.0", "1.1.1 - 1.2.0")).toBe(false);
         
            // OR ranges (||)
            expect(versionCheck.isCompatible("1.0.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionCheck.isCompatible("1.1.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionCheck.isCompatible("2.0.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionCheck.isCompatible("2.1.0", "^1.0.0 || ^2.0.0")).toBe(true);
            expect(versionCheck.isCompatible("3.0.0", "^1.0.0 || ^2.0.0")).toBe(false);
         
            // AND ranges (space between)
            expect(versionCheck.isCompatible("1.2.3", ">1.2.2 <1.3.0")).toBe(true);
            expect(versionCheck.isCompatible("1.2.2", ">1.2.2 <1.3.0")).toBe(false);
            expect(versionCheck.isCompatible("1.3.0", ">1.2.2 <1.3.0")).toBe(false);
        });
     
        it('should handle * and x as wildcards', () => {
            expect(versionCheck.isCompatible("1.1.1", "1.1.*")).toBe(true);
            expect(versionCheck.isCompatible("1.1.9", "1.1.*")).toBe(true);
            expect(versionCheck.isCompatible("1.2.1", "1.1.*")).toBe(false);
         
            expect(versionCheck.isCompatible("1.1.1", "1.x")).toBe(true);
            expect(versionCheck.isCompatible("1.9.9", "1.x")).toBe(true);
            expect(versionCheck.isCompatible("2.0.0", "1.x")).toBe(false);
         
            expect(versionCheck.isCompatible("1.1.1", "*")).toBe(true);
            expect(versionCheck.isCompatible("99.99.99", "*")).toBe(true);
        });

        it('should accept only regular versions when left empty', () => {
            expect(versionCheck.isCompatible("1.1.1", "")).toBe(true);
            expect(versionCheck.isCompatible("99.99.99", "")).toBe(true);
            
            expect(versionCheck.isCompatible("1.2.3-patch", "")).toBe(false);
        });

        it('should handle unusual but valid version ranges', () => {
            // Multiple complex ranges
            expect(versionCheck.isCompatible("2.0.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(true);
            expect(versionCheck.isCompatible("1.1.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(false);
            expect(versionCheck.isCompatible("1.2.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(true); 
            expect(versionCheck.isCompatible("1.3.0", ">=1.2.0 <1.3.0 || >=2.0.0")).toBe(false);

            // Caret for 0.x versions (only patch changes allowed)
            expect(versionCheck.isCompatible("0.1.1", "^0.1.0")).toBe(true);
            expect(versionCheck.isCompatible("0.1.9", "^0.1.0")).toBe(true);
            expect(versionCheck.isCompatible("0.2.0", "^0.1.0")).toBe(false);
         
            // Tilde for 0.x.y versions
            expect(versionCheck.isCompatible("0.1.1", "~0.1.0")).toBe(true);
            expect(versionCheck.isCompatible("0.1.9", "~0.1.0")).toBe(true);
            expect(versionCheck.isCompatible("0.2.0", "~0.1.0")).toBe(false);
        });
     
        it('should handle edge cases with invalid inputs', () => {
            expect(versionCheck.isCompatible("not.a.version", "^1.0.0")).toBe(false);
            expect(versionCheck.isCompatible("1.0.0", "not-a-range")).toBe(false);
            expect(versionCheck.isCompatible("invalid", "also-invalid")).toBe(false);
        
            expect(versionCheck.isCompatible(null as any, "^1.0.0")).toBe(false);
            expect(versionCheck.isCompatible("1.0.0", null as any)).toBe(false);
 
            expect(versionCheck.isCompatible(undefined as any, "^1.0.0")).toBe(false);
            expect(versionCheck.isCompatible("1.0.0", undefined as any)).toBe(false);
        });
    });

    describe('compare', () => {
        it('should return 1 when A is larger than B', () => {
            expect(versionCheck.compare("1.1.1","1.1.0")).toBe(1);
            expect(versionCheck.compare("1.1.1","1.0.1")).toBe(1);
            expect(versionCheck.compare("1.1.1","0.1.1")).toBe(1);
        });
        it('should return 0 when both versions are equal', () => {
            expect(versionCheck.compare("1.1.1","1.1.1")).toBe(0);
            expect(versionCheck.compare("1.1.1","1.1.1")).toBe(0);
            expect(versionCheck.compare("1.1.1","1.1.1")).toBe(0);
        });
        it('should return -1 when A is smaller than B', () => {
            expect(versionCheck.compare("1.1.1","1.1.2")).toBe(-1);
            expect(versionCheck.compare("1.1.1","1.2.1")).toBe(-1);
            expect(versionCheck.compare("1.1.1","2.1.1")).toBe(-1);

        })
    });

});