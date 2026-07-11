import { Input } from '@/components/ui/input';
import { NativeSelect } from './NativeSelect';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { STATUS_VALUES, ELIGIBILITY_STATUS_VALUES, STATUS_LABELS, ELIGIBILITY_STATUS_LABELS } from '../constants';

const EMPTY_FILTERS = { status: '', eligibility_status: '', vendor_name: '' };

function TenderFilters({ filters, onChange, onReset }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-vendor">Vendor name</Label>
        <Input
          id="filter-vendor"
          placeholder="Search vendor..."
          className="w-56"
          value={filters.vendor_name}
          onChange={(e) => onChange('vendor_name', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-status">Status</Label>
        <NativeSelect
          id="filter-status"
          className="w-44"
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-eligibility">Eligibility</Label>
        <NativeSelect
          id="filter-eligibility"
          className="w-44"
          value={filters.eligibility_status}
          onChange={(e) => onChange('eligibility_status', e.target.value)}
        >
          <option value="">All eligibility</option>
          {ELIGIBILITY_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {ELIGIBILITY_STATUS_LABELS[status]}
            </option>
          ))}
        </NativeSelect>
      </div>
      {(filters.status || filters.eligibility_status || filters.vendor_name) && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

export { EMPTY_FILTERS };
export default TenderFilters;
