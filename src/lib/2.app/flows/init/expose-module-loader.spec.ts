import { ForExposingModuleLoader } from '../../driver-ports/init/for-exposing-module-loader.port';
import { DrivingContract } from '../../driving-ports/driving.contract';
import { createExposeModuleLoader } from './expose-module-loader';
import { LoggingConfig } from '../../config/log.contract';
import { Optional } from 'lib/utils/optional';
import { NFError } from 'lib/native-federation.error';
import { mockAdapters } from 'lib/6.mocks/adapters.mock';
import { mockConfig } from 'lib/6.mocks/config.mock';

describe('createExposeModuleLoader', () => {
  let exposeModuleLoader: ForExposingModuleLoader;
  let adapters: Pick<DrivingContract, 'remoteInfoRepo' | 'browser'>;
  let config: LoggingConfig;

  beforeEach(() => {
    config = mockConfig();
    adapters = mockAdapters();

    exposeModuleLoader = createExposeModuleLoader(config, adapters);
  });

  it('should load a remote module if in storage', async () => {
    adapters.remoteInfoRepo.contains = jest.fn(() => true);
    adapters.remoteInfoRepo.tryGetModule = jest.fn(
      (): Optional<string> => Optional.of('http://my.service/mfe1/component-a.js')
    );

    const loadRemoteModule = await exposeModuleLoader();

    await loadRemoteModule('team/mfe1', './component-a');

    expect(adapters.browser.importModule).toHaveBeenCalledWith(
      'http://my.service/mfe1/component-a.js'
    );
  });

  it('should throw an error if remote-info is not in storage', async () => {
    adapters.remoteInfoRepo.contains = jest.fn(() => false);

    const loadRemoteModule = await exposeModuleLoader();

    await expect(loadRemoteModule('team/mfe1', './comp-a')).rejects.toEqual(
      new NFError('Failed to load module team/mfe1/./comp-a')
    );

    expect(config.log.error).toHaveBeenCalledWith(6, 'Failed to load module team/mfe1/./comp-a: ', {
      error: new NFError("Remote 'team/mfe1' is not initialized."),
    });
  });

  it('should throw an error if remote-info doesnt contain the module', async () => {
    adapters.remoteInfoRepo.contains = jest.fn(() => true);
    adapters.remoteInfoRepo.tryGetModule = jest.fn((): Optional<string> => Optional.empty());

    const loadRemoteModule = await exposeModuleLoader();

    await expect(loadRemoteModule('team/mfe1', './comp-a')).rejects.toEqual(
      new NFError('Failed to load module team/mfe1/./comp-a')
    );

    expect(config.log.error).toHaveBeenCalledWith(6, 'Failed to load module team/mfe1/./comp-a: ', {
      error: new NFError("Exposed module './comp-a' from remote 'team/mfe1' not found in storage."),
    });
  });
});
