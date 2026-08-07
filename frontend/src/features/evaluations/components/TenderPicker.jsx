import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { listTenders } from '../../tenders/services/tenderApi';

// Reuses Zheng Hong's GET /api/tenders (frontend/src/features/tenders/services/tenderApi.js)
// so staff pick a tender by its reference number and vendor name - the numeric
// tenders.id is only ever used internally, never something a user has to know.
export function TenderPicker({ value, onChange }) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tender-picker', search],
    queryFn: () => listTenders({ vendor_name: search || undefined, limit: 50 }),
  });

  const tenders = data?.data ?? [];

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tender-picker-search">Search vendor</Label>
        <Input
          id="tender-picker-search"
          placeholder="Search by vendor name..."
          className="w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tender-picker-select">Tender</Label>
        <Select
          value={value ? String(value) : undefined}
          onValueChange={(v) => onChange(Number(v))}
        >
          <SelectTrigger id="tender-picker-select" className="w-96">
            <SelectValue placeholder={isLoading ? 'Loading tenders...' : 'Select a tender'} />
          </SelectTrigger>
          <SelectContent>
            {!isLoading && tenders.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No tenders found.</p>
            )}
            {tenders.map((tender) => (
              <SelectItem key={tender.id} value={String(tender.id)}>
                {tender.tender_ref_no} - {tender.vendor_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
