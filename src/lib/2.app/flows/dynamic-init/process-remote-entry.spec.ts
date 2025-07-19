import { ForProcessingRemoteEntry } from 'lib/2.app/driver-ports/dynamic-init/for-processing-remote-entry';
import type { SharedInfoActions } from 'lib/1.domain';

import { LoggingConfig } from '../init';
import { createProcessRemoteEntry } from './process-remote-entry';

describe('processRemoteEntry', () => {
  let processRemoteEntry: ForProcessingRemoteEntry;
  let mockConfig: LoggingConfig;

  beforeEach(() => {
    mockConfig = {
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        level: 'debug',
      },
    } as LoggingConfig;

    processRemoteEntry = createProcessRemoteEntry(mockConfig);
  });

  it('should process remote entry correctly with only scoped dependencies', async () => {
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: false,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const result = await processRemoteEntry({ entry: remoteEntry, actions: {} });
    expect(result).toEqual(remoteEntry);
  });

  it('should process remote entry correctly with globally shared dependency', async () => {
    const remoteEntry = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const actions: SharedInfoActions = {
      'dep-a': { action: 'share' },
    };
    const result = await processRemoteEntry({ entry: remoteEntry, actions });
    expect(result).toEqual(remoteEntry);
  });

  it('should process remote entry correctly with scoped shared dependency', async () => {
    const remoteEntryIn = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const remoteEntryOut = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: false,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actions: SharedInfoActions = {
      'dep-a': { action: 'scope' },
    };

    const actual = await processRemoteEntry({ entry: remoteEntryIn, actions });

    expect(actual).toEqual(remoteEntryOut);
  });

  it('should process remote entry correctly with skipped shared dependency', async () => {
    const remoteEntryIn = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const remoteEntryOut = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [],
    };

    const actions: SharedInfoActions = {
      'dep-a': { action: 'skip' },
    };

    const actual = await processRemoteEntry({ entry: remoteEntryIn, actions });

    expect(actual).toEqual(remoteEntryOut);
  });

  it('should process remote entry correctly with overridden shared dependency', async () => {
    const remoteEntryIn = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const remoteEntryOut = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: false,
          scopeOverride: 'http://my.service/mfe2/',
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };

    const actions: SharedInfoActions = {
      'dep-a': { action: 'scope', override: 'http://my.service/mfe2/' },
    };

    const actual = await processRemoteEntry({ entry: remoteEntryIn, actions });

    expect(actual).toEqual(remoteEntryOut);
  });

  it('should skip and warn if the action is not found', async () => {
    const remoteEntryIn = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [
        {
          version: '1.2.3',
          requiredVersion: '~1.2.1',
          strictVersion: false,
          singleton: true,
          packageName: 'dep-a',
          outFileName: 'dep-a.js',
        },
      ],
    };
    const remoteEntryOut = {
      name: 'team/mfe1',
      url: 'http://my.service/mfe1/remoteEntry.json',
      exposes: [{ key: './wc-comp-a', outFileName: 'component-a.js' }],
      shared: [],
    };

    const actions: SharedInfoActions = {};

    const actual = await processRemoteEntry({ entry: remoteEntryIn, actions });

    expect(mockConfig.log.warn).toHaveBeenCalledWith(
      `[dynamic][team/mfe1] No action found for shared external 'dep-a'.`
    );
    expect(actual).toEqual(remoteEntryOut);
  });
});
