import { createHostConfig } from './host.config';

describe('host.config', () => {
  it('should set hostRemoteEntry to false by default', () => {
    const config = createHostConfig({});
    expect(config.hostRemoteEntry).toBe(false);
  });

  it('should set hostRemoteEntry to a string URL', () => {
    const config = createHostConfig({ hostRemoteEntry: 'http://localhost:3000/remoteEntry.json' });
    expect(config.hostRemoteEntry).toEqual({
      name: '__NF-HOST__',
      url: 'http://localhost:3000/remoteEntry.json',
    });
  });

  it('should set hostRemoteEntry to an object with name and url', () => {
    const config = createHostConfig({
      hostRemoteEntry: { url: 'http://localhost:3000/remoteEntry.json' },
    });
    expect(config.hostRemoteEntry).toEqual({
      name: '__NF-HOST__',
      url: 'http://localhost:3000/remoteEntry.json',
    });
  });

  it('should set hostRemoteEntry to an object with name and url', () => {
    const config = createHostConfig({
      hostRemoteEntry: { url: 'http://localhost:3000/remoteEntry.json', name: 'my-custom-host' },
    });
    expect(config.hostRemoteEntry).toEqual({
      name: 'my-custom-host',
      url: 'http://localhost:3000/remoteEntry.json',
    });
  });

  it('should add a cachetag to the remoteEntry', () => {
    const config = createHostConfig({
      hostRemoteEntry: {
        url: 'http://localhost:3000/remoteEntry.json',
        name: 'my-custom-host',
        cacheTag: '123abc',
      },
    });
    expect(config.hostRemoteEntry).toEqual({
      name: 'my-custom-host',
      url: 'http://localhost:3000/remoteEntry.json',
      cacheTag: '123abc',
    });
  });
});
