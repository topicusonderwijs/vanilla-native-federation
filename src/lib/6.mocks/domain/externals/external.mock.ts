import { ScopedExternal, SharedExternal, SharedVersion } from 'lib/1.domain';
import {
  mockVersion_A,
  mockVersion_B,
  mockVersion_C,
  mockVersion_D,
  mockVersion_E,
  mockVersion_F,
} from './version.mock';

export const mockExternal = {
  shared: (versions: SharedVersion[], opt: { dirty?: boolean } = {}): SharedExternal => ({
    dirty: opt.dirty ?? false,
    versions,
  }),
  scoped: (versions: ScopedExternal): ScopedExternal => ({ ...versions }),
  globalScope: (externals: Record<string, SharedExternal>) => ({
    __GLOBAL__: externals,
  }),

  customScope: (scopeName: string, externals: Record<string, SharedExternal>) => ({
    [scopeName]: externals,
  }),
};

export const mockExternal_A = (opt: { dirty?: boolean } = {}): SharedExternal =>
  mockExternal.shared(
    Object.values(mockVersion_A).map(v => v()),
    opt
  );

export const mockExternal_B = (opt: { dirty?: boolean } = {}): SharedExternal =>
  mockExternal.shared(
    Object.values(mockVersion_B).map(v => v()),
    opt
  );

export const mockExternal_C = (opt: { dirty?: boolean } = {}): SharedExternal =>
  mockExternal.shared(
    Object.values(mockVersion_C).map(v => v()),
    opt
  );

export const mockExternal_D = (opt: { dirty?: boolean } = {}): SharedExternal =>
  mockExternal.shared(
    Object.values(mockVersion_D).map(v => v()),
    opt
  );

export const mockScopedExternals = (): ScopedExternal => ({
  'dep-e': mockVersion_E.v1_2_3(),
  'dep-f': mockVersion_F.v1_2_4(),
});
