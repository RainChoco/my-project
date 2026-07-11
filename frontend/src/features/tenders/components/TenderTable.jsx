import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, EligibilityBadge } from './TenderStatusBadges';
import { formatCurrency, formatDate } from '../utils/format';
import { LOCKED_FOR_EDIT_STATUSES, LOCKED_FOR_DELETE_STATUSES } from '../constants';

function TenderTable({ tenders, isLoading, canManage, onDeleteRequest }) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ref No.</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Main Offer Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Eligibility</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
              {Array.from({ length: 7 }).map((__, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {!isLoading && tenders.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              No tenders match the current filters.
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          tenders.map((tender) => (
            <TableRow key={tender.id} className="cursor-pointer" onClick={() => navigate(`/tenders/${tender.id}`)}>
              <TableCell className="font-medium">{tender.tender_ref_no}</TableCell>
              <TableCell>{tender.vendor_name}</TableCell>
              <TableCell>{formatDate(tender.submission_date)}</TableCell>
              <TableCell>{formatCurrency(tender.main_offer_price)}</TableCell>
              <TableCell>
                <StatusBadge status={tender.status} />
              </TableCell>
              <TableCell>
                <EligibilityBadge eligibilityStatus={tender.eligibility_status} />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/tenders/${tender.id}`)}>
                    View
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={LOCKED_FOR_EDIT_STATUSES.includes(tender.status)}
                        onClick={() => navigate(`/tenders/${tender.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={LOCKED_FOR_DELETE_STATUSES.includes(tender.status)}
                        onClick={() => onDeleteRequest(tender)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

export default TenderTable;
