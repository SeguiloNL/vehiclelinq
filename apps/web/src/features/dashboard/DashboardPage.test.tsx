import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

vi.mock('@/hooks/usePlatformContext', () => ({
  usePlatformContext: () => ({
    accessToken: 'token',
    companies: [{ id: 'company-1', name: 'Demo Logistics', slug: 'demo', isActive: true, timezone: 'Europe/Amsterdam' }],
    currentCompanyId: 'company-1',
    setCurrentCompanyId: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/lib/maps/MapPanel', () => ({
  MapPanel: () => <div>Mock Map</div>,
}));

vi.mock('@/lib/api', () => ({
  api: {
    dashboard: vi.fn().mockResolvedValue({
      company: { id: 'company-1', name: 'Demo Logistics', slug: 'demo', isActive: true, timezone: 'Europe/Amsterdam' },
      vehicles: [],
      liveStates: [],
      trackers: [],
      modules: [],
    }),
  },
}));

describe('DashboardPage', () => {
  it('toont de dashboard titel', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Voertuigen en actuele status')).toBeInTheDocument();
  });
});
