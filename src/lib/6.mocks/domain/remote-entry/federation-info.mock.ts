import { ExposesInfo, SharedInfo } from 'lib/1.domain/remote-entry/remote-entry.contract';
import {
  mockExposedModuleA,
  mockExposedModuleB,
  mockExposedModuleC,
  mockExposedModuleD,
} from './exposes-info.mock';
import {
  mockSharedInfoA,
  mockSharedInfoB,
  mockSharedInfoC,
  mockSharedInfoD,
} from './shared-info.mock';

/**
 * --------------------------------------
 *  FEDERATION_INFO
 * --------------------------------------
 */
export const mockFederationInfo = (
  name: string,
  o: { exposes: ExposesInfo[]; shared: SharedInfo[] }
) => ({
  name,
  exposes: o.exposes,
  shared: o.shared,
});

export const mockFederationInfo_MFE1 = (
  o: { exposes?: ExposesInfo[]; shared?: SharedInfo[] } = {}
) =>
  mockFederationInfo('team/mfe1', {
    exposes: o.exposes ?? [mockExposedModuleA()],
    shared: o.shared ?? [
      mockSharedInfoA.v2_1_2(),
      mockSharedInfoB.v2_2_2(),
      mockSharedInfoC.v2_2_2(),
      mockSharedInfoD.v2_2_2(),
    ],
  });

export const mockFederationInfo_MFE2 = (
  o: { exposes?: ExposesInfo[]; shared?: SharedInfo[] } = {}
) =>
  mockFederationInfo('team/mfe2', {
    exposes: o.exposes ?? [mockExposedModuleB(), mockExposedModuleC()],
    shared: o.shared ?? [
      mockSharedInfoA.v2_1_2(),
      mockSharedInfoB.v2_1_2(),
      mockSharedInfoC.v2_2_1(),
      mockSharedInfoD.v2_2_2(),
    ],
  });

export const mockFederationInfo_MFE3 = (
  o: { exposes?: ExposesInfo[]; shared?: SharedInfo[] } = {}
) =>
  mockFederationInfo('team/mfe3', {
    exposes: o.exposes ?? [mockExposedModuleD()],
    shared: o.shared ?? [mockSharedInfoA.v2_1_1(), mockSharedInfoB.v2_1_1()],
  });

export const mockFederationInfo_HOST = (
  o: { exposes?: ExposesInfo[]; shared?: SharedInfo[] } = {}
) =>
  mockFederationInfo('team/host', {
    exposes: o.exposes ?? [],
    shared: o.shared ?? [mockSharedInfoA.v2_1_3(), mockSharedInfoD.v2_2_2()],
  });
