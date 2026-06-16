import type { ModuleDefinition } from '@vehiclelinq/shared';

export const moduleRegistry: ModuleDefinition[] = [
  {
    key: 'core_tracking',
    name: 'Core Tracking',
    description: 'Live kaart, voertuigenlijst en actuele status.',
    category: 'core',
    defaultEnabled: true,
    requiredRoles: ['superadmin', 'company_admin', 'viewer'],
  },
  {
    key: 'history_replay',
    name: 'History Replay',
    description: 'Historische routes en ritten terugkijken.',
    category: 'core',
    defaultEnabled: true,
    requiredRoles: ['superadmin', 'company_admin', 'viewer'],
  },
  {
    key: 'maintenance_placeholder',
    name: 'Maintenance',
    description: 'Voorbereid voor toekomstige onderhoudsmodule.',
    category: 'operations',
    defaultEnabled: false,
    requiredRoles: ['superadmin', 'company_admin'],
  },
  {
    key: 'compliance_placeholder',
    name: 'Compliance',
    description: 'Voorbereid voor toekomstige compliance-module.',
    category: 'compliance',
    defaultEnabled: false,
    requiredRoles: ['superadmin', 'company_admin'],
  },
];
