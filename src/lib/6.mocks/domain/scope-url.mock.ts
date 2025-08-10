/**
 * --------------------------------------
 *  SCOPE URLS
 * --------------------------------------
 */

export const mockScopeUrl = (base: string, o: { file?: string; folder?: string } = {}) =>
  base + (o.folder ? `${o.folder}/` : '') + (o.file ? `${o.file}` : '');

export const mockScopeUrl_MFE1 = (o: { file?: string; folder?: string } = {}) =>
  mockScopeUrl('http://my.service/mfe1/', o);
export const mockScopeUrl_MFE2 = (o: { file?: string; folder?: string } = {}) =>
  mockScopeUrl('http://my.service/mfe2/', o);
export const mockScopeUrl_MFE3 = (o: { file?: string; folder?: string } = {}) =>
  mockScopeUrl('http://my.service/mfe3/', o);
export const mockScopeUrl_HOST = (o: { file?: string; folder?: string } = {}) =>
  mockScopeUrl('http://host.service/', o);
