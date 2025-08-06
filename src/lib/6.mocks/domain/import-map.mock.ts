import { ImportMap } from 'lib/1.domain';
import { mockScopeUrl_host, mockScopeUrl_MFE1, mockScopeUrl_MFE2 } from './scope-url.mock';

/**
 * --------------------------------------
 *  IMPORT_MAP
 * --------------------------------------
 */

export const mockImportMap = (): ImportMap => ({
  imports: {
    'dep-b': `${mockScopeUrl_MFE1()}dep-b.js`,
    'dep-c': `${mockScopeUrl_host()}dep-c.js`,
    'dep-d': `${mockScopeUrl_host()}dep-d.js`,
  },
  scopes: {
    [mockScopeUrl_MFE1()]: {
      'dep-a': `${mockScopeUrl_MFE1()}dep-a.js`,
    },
    [mockScopeUrl_MFE2()]: {
      'dep-d': `${mockScopeUrl_MFE1()}dep-d.js`,
    },
  },
});
