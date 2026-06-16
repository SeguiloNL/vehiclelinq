import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSessionStore } from '@/store/session';

export function usePlatformContext() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const companies = useSessionStore((state) => state.companies);
  const setCompanies = useSessionStore((state) => state.setCompanies);
  const currentCompanyId = useSessionStore((state) => state.currentCompanyId);
  const setCurrentCompanyId = useSessionStore((state) => state.setCurrentCompanyId);
  const [loading, setLoading] = useState(companies.length === 0);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    api
      .companies(accessToken)
      .then((nextCompanies) => {
        setCompanies(nextCompanies);
        if (!currentCompanyId && nextCompanies[0]) {
          setCurrentCompanyId(nextCompanies[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [accessToken, currentCompanyId, setCompanies, setCurrentCompanyId]);

  return {
    accessToken,
    companies,
    currentCompanyId,
    setCurrentCompanyId,
    loading,
  };
}
