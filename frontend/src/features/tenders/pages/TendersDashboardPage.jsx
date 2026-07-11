import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context';
import { useToast } from '@/hooks/use-toast';
import TenderFilters, { EMPTY_FILTERS } from '../components/TenderFilters';
import TenderTable from '../components/TenderTable';
import TenderPagination from '../components/TenderPagination';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';
import { listTenders, deleteTender } from '../services/tenderApi';

const PAGE_LIMIT = 20;

function TendersDashboardPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManage = role === 'ma_staff';

  const queryParams = {
    page,
    limit: PAGE_LIMIT,
    ...(filters.status && { status: filters.status }),
    ...(filters.eligibility_status && { eligibility_status: filters.eligibility_status }),
    ...(filters.vendor_name && { vendor_name: filters.vendor_name }),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tenders', queryParams],
    queryFn: () => listTenders(queryParams),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTender(id),
    onSuccess: () => {
      toast({
        title: 'Tender deleted',
        description: `${deleteTarget?.tender_ref_no} was removed.`,
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({
        title: 'Could not delete tender',
        description: err.response?.data?.message ?? 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setDeleteTarget(null);
    },
  });

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tender Management</h1>
          <p className="text-sm text-muted-foreground">Intake, review, and track vendor tender submissions.</p>
        </div>
        {canManage && <Button onClick={() => navigate('/tenders/new')}>New Tender Submission</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <TenderFilters filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>{data?.pagination?.total ?? 0} tender(s) on record</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isError && (
            <Alert variant="destructive">
              <AlertDescription>{error.response?.data?.message ?? 'Failed to load tenders.'}</AlertDescription>
            </Alert>
          )}
          <TenderTable
            tenders={data?.data ?? []}
            isLoading={isLoading}
            canManage={canManage}
            onDeleteRequest={setDeleteTarget}
          />
          <TenderPagination pagination={data?.pagination} onPageChange={setPage} />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        tender={deleteTarget}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default TendersDashboardPage;
