import { Button } from '@/components/ui/button';

function TenderPagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page, limit, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} - {total} tender{total === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default TenderPagination;
