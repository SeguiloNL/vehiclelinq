import type { ChangeEvent } from 'react';
import type { Company } from '@vehiclelinq/shared';

interface CompanySelectorProps {
  companies: Company[];
  value: string | null;
  onChange: (companyId: string) => void;
  disabled?: boolean;
}

export function CompanySelector({
  companies,
  value,
  onChange,
  disabled = false,
}: CompanySelectorProps) {
  return (
    <label className="flex min-w-[220px] items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
      <span className="whitespace-nowrap">Bedrijf</span>
      <select
        value={value ?? ''}
        disabled={disabled || companies.length === 0}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none disabled:text-slate-400"
      >
        {companies.length === 0 ? (
          <option value="">Geen bedrijven</option>
        ) : null}
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </label>
  );
}
