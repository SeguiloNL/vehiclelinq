import { create } from 'zustand';
import type { AuthResponse, Company } from '@vehiclelinq/shared';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  currentCompanyId: string | null;
  user: AuthResponse['user'] | null;
  companies: Company[];
  setSession: (session: AuthResponse) => void;
  setCompanies: (companies: Company[]) => void;
  setCurrentCompanyId: (companyId: string) => void;
  clear: () => void;
}

const initialToken = localStorage.getItem('vehiclelinq.accessToken');
const initialRefreshToken = localStorage.getItem('vehiclelinq.refreshToken');
const initialCompanyId = localStorage.getItem('vehiclelinq.companyId');
const initialUser = localStorage.getItem('vehiclelinq.user');

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: initialToken,
  refreshToken: initialRefreshToken,
  currentCompanyId: initialCompanyId,
  user: initialUser ? JSON.parse(initialUser) : null,
  companies: [],
  setSession: (session) =>
    set(() => {
      localStorage.setItem('vehiclelinq.accessToken', session.accessToken);
      localStorage.setItem('vehiclelinq.refreshToken', session.refreshToken);
      localStorage.setItem('vehiclelinq.user', JSON.stringify(session.user));
      if (session.user.companyId) {
        localStorage.setItem('vehiclelinq.companyId', session.user.companyId);
      }

      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        currentCompanyId: session.user.companyId,
      };
    }),
  setCompanies: (companies) =>
    set((state) => ({
      companies,
      currentCompanyId:
        state.currentCompanyId ?? companies[0]?.id ?? state.user?.companyId ?? null,
    })),
  setCurrentCompanyId: (companyId) =>
    set(() => {
      localStorage.setItem('vehiclelinq.companyId', companyId);
      return { currentCompanyId: companyId };
    }),
  clear: () =>
    set(() => {
      localStorage.removeItem('vehiclelinq.accessToken');
      localStorage.removeItem('vehiclelinq.refreshToken');
      localStorage.removeItem('vehiclelinq.companyId');
      localStorage.removeItem('vehiclelinq.user');

      return {
        accessToken: null,
        refreshToken: null,
        currentCompanyId: null,
        user: null,
        companies: [],
      };
    }),
}));
