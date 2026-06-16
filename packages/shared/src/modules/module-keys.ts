export const MODULE_KEYS = [
  'core_tracking',
  'history_replay',
  'maintenance_placeholder',
  'compliance_placeholder',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
