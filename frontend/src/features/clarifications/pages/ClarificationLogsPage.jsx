import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ClarificationStatusBadge, LogTypeBadge } from '../components/StatusBadge';
import { ActionMessage } from '../components/ActionMessage';
import { DetectDeviationDialog } from '../components/DetectDeviationDialog';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { listClarificationLogs, detectDeviation } from '../services/clarificationApi';
import { LOG_TYPE_VALUES, LOG_TYPE_LABELS, LOG_STATUS_VALUES, LOG_STATUS_LABELS } from '../constants';
import { useAuth } from '@/context';
import { ROLES } from '@/routes/routeConfig';

const PAGE_LIMIT = 20;
const EMPTY_FILTERS = { tender_id: '', log_type: '', status: '', overdue: false };

// UC-D6: filterable/paginated list of clarification & job-adjustment-notification
// logs across tenders, plus the UC-D1 entry point (ma_staff manually (re-)triggers
// pricing-deviation detection for a tender).
export default function ClarificationLogsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess, showError } = useActionMessage();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [detectOpen, setDetectOpen] = useState(false);
  const [detectError, setDetectError] = useState(null);

  const canDetect = role === ROLES.MA_STAFF;

  const queryParams = {
    page,
    limit: PAGE_LIMIT,
    ...(filters.tender_id && { tender_id: Number(filters.tender_id) }),
    ...(filters.log_type && { log_type: filters.log_type }),
    ...(filters.status && { status: filters.status }),
    ...(filters.overdue && { overdue: 'true' }),
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['clarification-logs', queryParams],
    queryFn: () => listClarificationLogs(queryParams),
    placeholderData: keepPreviousData,
  });

  const detectMutation = useMutation({
    mutationFn: (tenderId) => detectDeviation(tenderId),
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ['clarification-logs'] });
      setDetectOpen(false);
      setDetectError(null);
      showSuccess(
        log.status === 'no_action_required'
          ? `Tender #${log.tender_id}'s deviation is within tolerance - logged for audit, no action needed.`
          : `Tender #${log.tender_id}'s deviation was flagged - opening the clarification log.`
      );
      navigate(`/clarifications/${log.id}`);
    },
    onError: (err) => {
      setDetectError(getErrorMessage(err));
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

  const hasActiveFilters = Boolean(filters.tender_id || filters.log_type || filters.status || filters.overdue);
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clarifications</h1>
          <p className="text-sm text-muted-foreground">
            Pricing deviation clarifications and job adjustment notifications sent to tenderers.
          </p>
        </div>
        {canDetect && (
          <Button
            onClick={() => {
              setDetectError(null);
              setDetectOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Detect deviation
          </Button>
        )}
      </div>

      <ActionMessage message={message} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-tender-id">Tender ID</Label>
              <Input
                id="filter-tender-id"
                type="number"
                min="1"
                className="w-32"
                value={filters.tender_id}
                onChange={(e) => handleFilterChange('tender_id', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-log-type">Log type</Label>
              <Select value={filters.log_type} onValueChange={(v) => handleFilterChange('log_type', v)}>
                <SelectTrigger id="filter-log-type" className="w-56">
                  <SelectValue placeholder="All log types" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_TYPE_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LOG_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger id="filter-status" className="w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LOG_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label htmlFor="filter-overdue" className="flex h-9 items-center gap-2 text-sm">
              <input
                id="filter-overdue"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={filters.overdue}
                onChange={(e) => handleFilterChange('overdue', e.target.checked)}
              />
              Overdue only (UC-D8)
            </label>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logs</CardTitle>
          <CardDescription>{pagination?.total ?? 0} log(s) on record</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{getErrorMessage(error, 'Failed to load clarification logs.')}</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No logs match the current filter.
              {hasActiveFilters && ' Adjust or clear the filters above to see more.'}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deviation</TableHead>
                    <TableHead>Follow-up due</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer" onClick={() => navigate(`/clarifications/${log.id}`)}>
                      <TableCell className="font-medium">#{log.id}</TableCell>
                      <TableCell>{log.tender_ref_no ?? `#${log.tender_id}`}</TableCell>
                      <TableCell>{log.vendor_name ?? '-'}</TableCell>
                      <TableCell><LogTypeBadge logType={log.log_type} /></TableCell>
                      <TableCell><ClarificationStatusBadge status={log.status} /></TableCell>
                      <TableCell>{log.deviation_percentage != null ? `${log.deviation_percentage}%` : '-'}</TableCell>
                      <TableCell>{log.follow_up_due_at ?? '-'}</TableCell>
                      <TableCell>{new Date(log.updated_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {totalPages} - {pagination.total} log(s)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
          {isFetching && !isLoading && <p className="pt-2 text-xs text-muted-foreground">Refreshing...</p>}
        </CardContent>
      </Card>

      <DetectDeviationDialog
        open={detectOpen}
        onOpenChange={setDetectOpen}
        isSubmitting={detectMutation.isPending}
        submitError={detectError}
        onSubmit={(tenderId) => detectMutation.mutateAsync(tenderId)}
      />
    </div>
  );
}
