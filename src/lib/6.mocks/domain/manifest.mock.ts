import { Manifest } from 'lib/1.domain';
import {
  MOCK_REMOTE_ENTRY_SCOPE_I_URL,
  MOCK_REMOTE_ENTRY_SCOPE_II_URL,
} from './remote-entry/remote-entry.mock';

export const MOCK_MANIFEST = (): Manifest => ({
  'team/mfe1': `${MOCK_REMOTE_ENTRY_SCOPE_I_URL()}remoteEntry.json`,
  'team/mfe2': `${MOCK_REMOTE_ENTRY_SCOPE_II_URL()}remoteEntry.json`,
});
