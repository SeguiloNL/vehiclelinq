import type { PlatformRole } from '../auth/roles';
import type { ModuleKey } from './module-keys';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  category: 'core' | 'operations' | 'compliance';
  defaultEnabled: boolean;
  requiredRoles: PlatformRole[];
  dependencies?: ModuleKey[];
}
