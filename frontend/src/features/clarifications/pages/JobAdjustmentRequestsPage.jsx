import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ApprovalStatusBadge } from '../components/StatusBadge';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import {
  listJobAdjustmentRequests,
  updateJobAdjustmentRequest,
  createFollowUpNotification,
} from '../services/jobAdjustmentApi';
import { listTenders } from '@/features/tenders/services/tenderApi';
import { APPROVAL_STATUS_VALUES, APPROVAL_STATUS_LABELS } from '../constants';
import { useAuth } from '@/context';
import { ROLES } from '@/routes/routeConfig';

const EMPTY_FILTERS = { tender_id: '', approval_status: '', is_material: false };
// Radix's Select can't use an empty string as an item value, so "All Tenders"
// uses this sentinel and gets translated back to '' (no filter) in the handler.
const ALL_TENDERS_VALUE = 'all';

// UC-D7: job adjustment requests raised off a vendor response, viewable/filterable
// across tenders. ma_staff approves/rejects material requests here; vendor_liaison
// sends the follow-up notification once a request is approved.
export default function JobAdjustmentRequestsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess, showError } = useActionMessage();

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const canReview = role === ROLES.MA_STAFF;
  const canNotify = role === ROLES.VENDOR_LIAISON;

  const queryParams = {
    ...(filters.tender_id && { tender_id: Number(filters.tender_id) }),
    ...(filters.approval_status && { approval_status: filters.approval_status }),
    ...(filters.is_material && { is_material: 'true' }),
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['job-adjustment-requests', queryParams],
    queryFn: () => listJobAdjustmentRequests(queryParams),
    placeholderData: keepPreviousData,
  });

  // Populates the Tender filter dropdown. Shares the ['tenders'] cache key
  // prefix with the rest of the app so creating/editing a tender elsewhere
  // keeps this list fresh too.
  const { data: tendersData, isLoading: isTendersLoading } = useQuery({
    queryKey: ['tenders', { limit: 100 }],
    queryFn: () => listTenders({ limit: 100 }),
  });
  const tenderOptions = tendersData?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['job-adjustment-requests'] });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approvalStatus }) => updateJobAdjustmentRequest(id, approvalStatus),
    onSuccess: (_result, { approvalStatus }) => {
      invalidate();
      showSuccess(approvalStatus === 'approved' ? 'Request approved.' : 'Request rejected.');
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const notifyMutation = useMutation({
    mutationFn: (id) => createFollowUpNotification(id),
    onSuccess: (log) => {
      invalidate();
      showSuccess('Follow-up notification created - opening it to draft and send.');
      navigate(`/clarifications/${log.id}`);
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleResetFilters = () => setFilters(EMPTY_FILTERS);
  const hasActiveFilters = Boolean(filters.tender_id || filters.approval_status || filters.is_material);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Job Adjustment Requests</h1>
        <p className="text-sm text-muted-foreground">
          Scope/timeline/terms changes raised off vendor clarification responses.
        </p>
      </div>

      <ActionMessage message={message} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jar-filter-tender">Tender</Label>
              <Select
                value={filters.tender_id || ALL_TENDERS_VALUE}
                onValueChange={(v) => handleFilterChange('tender_id', v === ALL_TENDERS_VALUE ? '' : v)}
                disabled={isTendersLoading}
              >
                <SelectTrigger id="jar-filter-tender" className="w-56">
                  <SelectValue placeholder={isTendersLoading ? 'Loading tenders...' : 'All Tenders'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TENDERS_VALUE}>All Tenders</SelectItem>
                  {tenderOptions.map((tender) => (
                    <SelectItem key={tender.id} value={String(tender.id)}>
                      {tender.tender_ref_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jar-filter-status">Approval status</Label>
              <Select value={filters.approval_status} onValueChange={(v) => handleFilterChange('approval_status', v)}>
                <SelectTrigger id="jar-filter-status" className="w-56">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {APPROVAL_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label htmlFor="jar-filter-material" className="flex h-9 items-center gap-2 text-sm">
              <input
                id="jar-filter-material"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={filters.is_material}
                onChange={(e) => handleFilterChange('is_material', e.target.checked)}
              />
              Material only
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
          <CardTitle className="text-base">Requests</CardTitle>
          <CardDescription>{data?.data?.length ?? 0} request(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{getErrorMessage(error, 'Failed to load job adjustment requests.')}</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No job adjustment requests match the current filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((jar) => (
                  <TableRow key={jar.id}>
                    <TableCell>
                      <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/clarifications/${jar.clarification_log_id}`)}>
                        #{jar.tender_id}
                      </Button>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{jar.description}</TableCell>
                    <TableCell>{jar.is_material ? 'Yes' : 'No'}</TableCell>
                    <TableCell><ApprovalStatusBadge status={jar.approval_status} /></TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {canReview && jar.approval_status === 'pending_approval' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({ id: jar.id, approvalStatus: 'approved' })}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({ id: jar.id, approvalStatus: 'rejected' })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {canNotify && jar.approval_status === 'approved' && !jar.follow_up_clarification_log_id && (
                        <Button
                          size="sm"
                          disabled={notifyMutation.isPending}
                          onClick={() => notifyMutation.mutate(jar.id)}
                        >
                          {notifyMutation.isPending ? 'Creating...' : 'Send follow-up notification'}
                        </Button>
                      )}
                      {jar.follow_up_clarification_log_id && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate(`/clarifications/${jar.follow_up_clarification_log_id}`)}
                        >
                          View notification
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {isFetching && !isLoading && <p className="pt-2 text-xs text-muted-foreground">Refreshing...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
