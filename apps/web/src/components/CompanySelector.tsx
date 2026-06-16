import type { ChangeEvent } from 'react';
import type { Company } from '@vehiclelinq/shared';

interface CompanySelectorProps {
  companies: Company[];
  value: string | null;
  onChange: (companyId: string) => void;
}

export function CompanySelector({ companies, value, onChange }: CompanySelectorProps) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300">
      <span>Bedrijf</span>
      <select
        value={value ?? ''}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className="flex-1 bg-transparent text-white outline-none"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id} className="bg-slate-950">
            {company.name}
          </option>
        ))}
      </select>
    </label>
  );
}
