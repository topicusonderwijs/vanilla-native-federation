import { RemoteEntry, FederationInfo } from 'lib/1.domain';
import {
  mockScopeUrl_host,
  mockScopeUrl_MFE1,
  mockScopeUrl_MFE2,
  mockScopeUrl_MFE3,
} from '../scope-url.mock';
import {
  mockFederationInfo_HOST,
  mockFederationInfo_MFE1,
  mockFederationInfo_MFE2,
  mockFederationInfo_MFE3,
} from './federation-info.mock';

/**
 * --------------------------------------
 *  REMOTE_ENTRY
 * --------------------------------------
 */
export const mockRemoteEntry = (
  scopeUrl: string,
  federationInfo: FederationInfo,
  o: { host?: boolean; override?: boolean } = {}
): RemoteEntry => ({
  ...federationInfo,
  url: `${scopeUrl}remoteEntry.json`,
  host: o.host,
  override: o.override,
});

export const mockRemoteEntry_MFE1 = (
  federationInfo = mockFederationInfo_MFE1(),
  o: { host?: boolean; override?: boolean } = {}
): RemoteEntry => mockRemoteEntry(mockScopeUrl_MFE1(), federationInfo, o);

export const mockRemoteEntry_MFE2 = (
  federationInfo = mockFederationInfo_MFE2(),
  o: { host?: boolean; override?: boolean } = {}
): RemoteEntry => mockRemoteEntry(mockScopeUrl_MFE2(), federationInfo, o);

export const mockRemoteEntry_MFE3 = (
  federationInfo = mockFederationInfo_MFE3(),
  o: { host?: boolean; override?: boolean } = {}
): RemoteEntry => mockRemoteEntry(mockScopeUrl_MFE3(), federationInfo, o);

export const mockRemoteEntry_HOST = (
  federationInfo = mockFederationInfo_HOST(),
  o: { override?: boolean } = {}
): RemoteEntry => mockRemoteEntry(mockScopeUrl_host(), federationInfo, { host: true, ...o });
