/**
 * --------------------------------------
 *  SCOPE URLS
 * --------------------------------------
 */
export const mockScopeUrl_MFE1 = (o: { file: string } = { file: '' }) =>
  'http://my.service/mfe1/' + o.file;
export const mockScopeUrl_MFE2 = (o: { file: string } = { file: '' }) =>
  'http://my.service/mfe2/' + o.file;
export const mockScopeUrl_MFE3 = (o: { file: string } = { file: '' }) =>
  'http://my.service/mfe3/' + o.file;
export const mockScopeUrl_HOST = (o: { file: string } = { file: '' }) =>
  'http://host.service/' + o.file;
