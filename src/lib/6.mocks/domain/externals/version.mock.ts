import { ScopedVersion, SharedVersion, SharedVersionAction, SharedVersionMeta } from 'lib/1.domain';

export const mockVersionRemote = (
  name: string,
  external: string = 'test-dep',
  options: {
    requiredVersion?: string;
    strictVersion?: boolean;
    cached?: boolean;
    host?: boolean;
    file?: string;
  } = {}
): SharedVersionMeta => ({
  file: options.file ?? `${external}.js`,
  name,
  requiredVersion: options.requiredVersion || '~2.1.0',
  strictVersion: options.strictVersion ?? true,
  cached: options.cached ?? false,
});

type mockSharedVersionOptions = {
  remotes: string[] | Record<string, any>;
  host?: boolean;
  action?: SharedVersionAction;
};

export const mockSharedVersion = (
  tag: string,
  external: string = 'test-dep',
  opt: mockSharedVersionOptions
): SharedVersion => {
  const remoteList = Array.isArray(opt.remotes)
    ? opt.remotes.map(name =>
        mockVersionRemote(name, external, { requiredVersion: `~${tag.substring(0, 3)}.0` })
      )
    : Object.entries(opt.remotes).map(([name, remoteOpt]) =>
        mockVersionRemote(name, external, {
          requiredVersion: `~${tag.substring(0, 3)}.0`,
          ...remoteOpt,
        })
      );

  return {
    tag,
    host:
      remoteList.some(r => r.name.includes('host')) ||
      Object.values(opt.remotes).some((opts: any) => opts?.host) ||
      false,
    action: 'skip',
    ...opt,
    remotes: remoteList,
  };
};

export const mockScopedVersion = (tag: string, external: string = 'test-dep'): ScopedVersion => ({
  tag,
  file: `${external}.js`,
});

export const mockVersion = {
  shared: mockSharedVersion,
  scoped: mockScopedVersion,
};

export const mockVersion_A = {
  v2_1_3: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.1.3', 'dep-a', {
      remotes: opt.remotes ?? ['team/host'],
      host: true,
      ...opt,
    }),
  v2_1_2: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.1.2', 'dep-a', {
      remotes: opt.remotes ?? ['team/mfe1', 'team/mfe2'],
      ...opt,
    }),
  v2_1_1: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.1.1', 'dep-a', { remotes: opt.remotes ?? ['team/mfe3'], ...opt }),
};

export const mockVersion_B = {
  v2_2_2: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.2.2', 'dep-b', { remotes: opt.remotes ?? ['team/mfe1'], ...opt }),
  v2_1_2: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.1.2', 'dep-b', { remotes: opt.remotes ?? ['team/mfe2'], ...opt }),
  v2_1_1: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.1.1', 'dep-b', { remotes: opt.remotes ?? ['team/mfe3'], ...opt }),
};

export const mockVersion_C = {
  v2_2_2: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.2.2', 'dep-c', { remotes: opt.remotes ?? ['team/mfe1'], ...opt }),
  v2_2_1: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.2.1', 'dep-c', { remotes: opt.remotes ?? ['team/mfe2'], ...opt }),
};

export const mockVersion_D = {
  v2_2_2: (opt: Partial<mockSharedVersionOptions> = {}) =>
    mockVersion.shared('2.2.2', 'dep-d', {
      ...opt,
      remotes: opt.remotes ?? ['team/mfe1', 'team/host'],
    }),
};

export const mockVersion_E = {
  v1_2_3: () => mockVersion.scoped('1.2.3', 'dep-e'),
  v1_2_4: () => mockVersion.scoped('1.2.4', 'dep-e'),
};

export const mockVersion_F = {
  v1_2_3: () => mockVersion.scoped('1.2.3', 'dep-f'),
  v1_2_4: () => mockVersion.scoped('1.2.4', 'dep-f'),
};
