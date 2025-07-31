import { SharedVersion, ScopedVersion } from 'lib/1.domain';

/**
 * --------------------------------------
 *  VERSION
 * --------------------------------------
 */
export const MOCK_VERSION_I = (): ScopedVersion => ({
  tag: '1.2.3',
  file: `dep-a.js`,
});

/**
 * --------------------------------------
 *  SHARED_VERSION
 * --------------------------------------
 */
export const MOCK_VERSION_II = (): SharedVersion => ({
  tag: '4.5.6',
  remotes: [
    {
      file: 'dep-b.js',
      name: 'team/mfe1',
      requiredVersion: '^4.1.1',
      strictVersion: true,
      cached: true,
    },
  ],

  host: false,

  action: 'share',
});

export const MOCK_VERSION_III = (): SharedVersion => ({
  tag: '7.8.9',
  remotes: [
    {
      file: `dep-c.js`,
      name: 'team/mfe2',
      requiredVersion: '~7.0.0',
      strictVersion: true,
      cached: false,
    },
  ],
  host: false,
  action: 'skip',
});

export const MOCK_VERSION_IV = (): SharedVersion => ({
  tag: '2.2.2',
  remotes: [
    {
      file: `dep-d.js`,
      name: 'team/mfe2',
      requiredVersion: '^2.0.0',
      strictVersion: true,
      cached: true,
    },
  ],
  host: false,
  action: 'scope',
});

export const MOCK_VERSION_V = (): SharedVersion => ({
  tag: '7.8.8',
  remotes: [
    {
      file: 'dep-c.js',
      name: 'host',
      requiredVersion: '~7.0.0',
      strictVersion: true,
      cached: true,
    },
  ],

  host: true,
  action: 'share',
});

export const MOCK_VERSION_VI = (): SharedVersion => ({
  tag: '3.0.0',
  remotes: [
    {
      file: 'dep-d.js',
      name: 'host',
      requiredVersion: '~3.0.0',
      strictVersion: true,
      cached: true,
    },
  ],
  host: true,

  action: 'share',
});

export const MOCK_VERSION_VII = (): SharedVersion => ({
  tag: '2.9.0',
  remotes: [
    {
      file: 'dep-d.js',
      name: 'team/mfe1',
      requiredVersion: '~2.9.0',
      strictVersion: true,
      cached: false,
    },
  ],
  host: false,
  action: 'skip',
});
