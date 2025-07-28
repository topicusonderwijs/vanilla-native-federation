import { SharedVersion, Version } from 'lib/1.domain';

/**
 * --------------------------------------
 *  VERSION
 * --------------------------------------
 */
export const MOCK_VERSION_I = (): Version => ({
  version: '1.2.3',
  file: `dep-a.js`,
});

/**
 * --------------------------------------
 *  SHARED_VERSION
 * --------------------------------------
 */
export const MOCK_VERSION_II = (): SharedVersion => ({
  version: '4.5.6',
  file: 'dep-b.js',
  remote: 'team/mfe1',
  requiredVersion: '^4.1.1',
  strictVersion: true,
  host: false,
  cached: true,
  action: 'share',
});

export const MOCK_VERSION_III = (): SharedVersion => ({
  version: '7.8.9',
  file: `dep-c.js`,
  remote: 'team/mfe2',
  requiredVersion: '~7.0.0',
  strictVersion: true,
  host: false,
  cached: false,
  action: 'skip',
});

export const MOCK_VERSION_IV = (): SharedVersion => ({
  version: '2.2.2',
  file: `dep-d.js`,
  remote: 'team/mfe2',
  requiredVersion: '^2.0.0',
  strictVersion: true,
  host: false,
  cached: true,
  action: 'scope',
});

export const MOCK_VERSION_V = (): SharedVersion => ({
  version: '7.8.8',
  file: 'dep-c.js',
  remote: 'host',
  requiredVersion: '~7.0.0',
  strictVersion: true,
  host: true,
  cached: true,
  action: 'share',
});

export const MOCK_VERSION_VI = (): SharedVersion => ({
  version: '3.0.0',
  file: 'dep-d.js',
  remote: 'host',
  requiredVersion: '~3.0.0',
  strictVersion: true,
  host: true,
  cached: true,
  action: 'share',
});
