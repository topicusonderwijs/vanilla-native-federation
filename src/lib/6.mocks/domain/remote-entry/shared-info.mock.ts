import { SharedInfo } from 'lib/1.domain';

/* --------------------------------------
 *  SHARED INFO
 * --------------------------------------
 */
export const mockSharedInfo = (
  packageName: string,
  options: {
    singleton?: boolean;
    strictVersion?: boolean;
    requiredVersion: string;
    version?: string;
    outFileName?: string;
    shareScope?: string;
    bundle?: string;
  }
): SharedInfo => ({
  outFileName: `${packageName}.js`,
  packageName,
  singleton: options.singleton ?? false,
  strictVersion: options.strictVersion ?? true,
  requiredVersion: options.requiredVersion,
  version: options.version,
  shareScope: options.shareScope,
  bundle: options.bundle,
});

type SharedInfoOptions = {
  singleton?: boolean;
  strictVersion?: boolean;
  requiredVersion?: string;
  outFileName?: string;
  shareScope?: string;
  bundle?: string;
};

export const mockSharedInfoA = {
  v2_1_3: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-a', {
      singleton: true,
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.1.0',
      version: '2.1.3',
    }),
  v2_1_2: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-a', {
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.1.0',
      singleton: true,
      version: '2.1.2',
    }),
  v2_1_1: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-a', {
      singleton: true,
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.1.0',
      version: '2.1.1',
    }),
  v2_2_1: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-a', {
      singleton: true,
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.2.0',
      version: '2.2.2',
    }),
};

export const mockSharedInfoB = {
  v2_2_2: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-b', {
      singleton: true,
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.2.0',
      version: '2.2.2',
    }),
  v2_1_2: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-b', {
      singleton: true,
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.1.0',
      version: '2.1.2',
    }),
  v2_1_1: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-b', {
      singleton: true,
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.1.0',
      version: '2.1.1',
    }),
};

export const mockSharedInfoC = {
  v2_2_2: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-c', {
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.2.0',
      version: '2.2.2',
    }),
  v2_2_1: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-c', {
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.2.0',
      version: '2.2.1',
    }),
};

export const mockSharedInfoD = {
  v2_2_2: (o: SharedInfoOptions = {}) =>
    mockSharedInfo('dep-d', {
      ...o,
      requiredVersion: o.requiredVersion ?? '~2.2.0',
      version: '2.2.2',
    }),
};

export const mockSharedInfoE = {
  v1_2_3: () =>
    mockSharedInfo('dep-e', {
      requiredVersion: '~1.2.0',
      version: '1.2.3',
      singleton: false,
    }),
  v1_2_4: () =>
    mockSharedInfo('dep-e', {
      requiredVersion: '~1.2.0',
      version: '1.2.4',
      singleton: false,
    }),
};

export const mockSharedInfoF = {
  v1_2_3: () =>
    mockSharedInfo('dep-f', {
      requiredVersion: '~1.2.0',
      version: '1.2.3',
      singleton: false,
    }),
  v1_2_4: () =>
    mockSharedInfo('dep-f', {
      requiredVersion: '~1.2.0',
      version: '1.2.4',
      singleton: false,
    }),
};
