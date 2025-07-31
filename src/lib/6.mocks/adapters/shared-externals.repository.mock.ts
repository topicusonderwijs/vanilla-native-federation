import { GLOBAL_SCOPE } from 'lib/1.domain';
import { ForSharedExternalsStorage } from 'lib/2.app/driving-ports/for-shared-externals-storage.port';

export const mockSharedExternalsRepository = (): jest.Mocked<ForSharedExternalsStorage> => ({
  addOrUpdate: jest.fn(),
  getAll: jest.fn(),
  commit: jest.fn(),
  removeFromAllScopes: jest.fn(),
  scopeType: jest.fn(),
  getScopes: jest.fn((o = { includeGlobal: true }) => (o.includeGlobal ? [GLOBAL_SCOPE] : [])),
  tryGet: jest.fn(),
});
