import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Gauge, Search, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/skeleton';
import { getErrorMessage } from '../hooks/useActionMessage';
import { fetchCompletedEvaluations, fetchEvaluation } from '../services/evaluationApi';
import { fetchApprovals } from '../services/approvalApi';
import { getTender } from '../../tenders/services/tenderApi';
import { cn } from '../../../lib';

function isToday(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// Reuses the existing GET /evaluations (scored/approved/rejected) and per-evaluation
// detail/approvals endpoints - there is no dedicated "pending approvals" backend
// endpoint, so this assembles the view client-side rather than adding one.
async function fetchPendingApprovalsData() {
  const { data: evaluations } = await fetchCompletedEvaluations();

  const pendingSummaries = evaluations.filter((e) => e.status === 'scored');
  const decidedSummaries = evaluations.filter((e) => e.status === 'approved' || e.status === 'rejected');

  const pqmValues = evaluations
    .map((e) => e.pqm_score)
    .filter((value) => value !== null && value !== undefined)
    .map(Number);
  const averagePqm = pqmValues.length
    ? pqmValues.reduce((sum, value) => sum + value, 0) / pqmValues.length
    : null;

  const [pendingRows, decidedToday] = await Promise.all([
    Promise.all(
      pendingSummaries.map(async (summary) => {
        const [detail, tender] = await Promise.all([
          fetchEvaluation(summary.id),
          getTender(summary.tender_id),
        ]);
        return {
          ...summary,
          evaluated_by: detail.evaluated_by,
          contract_name: tender?.contract?.name ?? null,
        };
      })
    ),
    Promise.all(
      decidedSummaries.map(async (summary) => {
        const { data: approvals } = await fetchApprovals(summary.id);
        const latest = approvals.reduce(
          (latestSoFar, approval) =>
            !latestSoFar || new Date(approval.decided_at) > new Date(latestSoFar.decided_at)
              ? approval
              : latestSoFar,
          null
        );
        return { status: summary.status, decided_at: latest?.decided_at ?? null };
      })
    ),
  ]);

  pendingRows.sort((a, b) => new Date(b.evaluation_date ?? 0) - new Date(a.evaluation_date ?? 0));

  return {
    pendingRows,
    summary: {
      pendingCount: pendingRows.length,
      approvedToday: decidedToday.filter((d) => d.status === 'approved' && isToday(d.decided_at)).length,
      rejectedToday: decidedToday.filter((d) => d.status === 'rejected' && isToday(d.decided_at)).length,
      averagePqm,
    },
  };
}

function PendingApprovalBadge() {
  return (
    <Badge
      variant="outline"
      className="border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-950/40 dark:text-orange-400"
    >
      Pending Approval
    </Badge>
  );
}

function SummaryCard({ icon: Icon, label, value, className }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted', className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Manager-facing list of evaluations awaiting an approve/reject decision (status:
// 'scored'). The decision itself still happens on the existing per-evaluation
// approval screen (UC-B9/B10) - this page only surfaces the queue and links there.
export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: fetchPendingApprovalsData,
  });

  const rows = query.data?.pendingRows ?? [];
  const summary = query.data?.summary;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.tender_ref_no, row.vendor_name, row.contract_name]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pending Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Evaluations awaiting a manager's approve or reject decision.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={ClipboardList}
          label="Pending Approvals"
          value={query.isLoading ? '-' : summary.pendingCount}
          className="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Approved Today"
          value={query.isLoading ? '-' : summary.approvedToday}
          className="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />
        <SummaryCard
          icon={XCircle}
          label="Rejected Today"
          value={query.isLoading ? '-' : summary.rejectedToday}
          className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        />
        <SummaryCard
          icon={Gauge}
          label="Average PQM Score"
          value={query.isLoading ? '-' : summary.averagePqm != null ? summary.averagePqm.toFixed(1) : '-'}
          className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Awaiting approval</CardTitle>
            <CardDescription>Newest submitted evaluations first.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tender reference, vendor, or contract"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : query.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {getErrorMessage(query.error, 'Failed to load pending approvals.')}
              </p>
              <Button variant="outline" onClick={() => query.refetch()}>Retry</Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              There are currently no evaluations awaiting manager approval.
            </p>
          ) : filteredRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No pending approvals match your search.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender Reference</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Evaluator</TableHead>
                  <TableHead>Final PQM</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.tender_ref_no ?? `#${row.tender_id}`}</TableCell>
                    <TableCell>{row.vendor_name ?? '-'}</TableCell>
                    <TableCell>{row.contract_name ?? '-'}</TableCell>
                    <TableCell>{row.evaluated_by ? `Evaluator #${row.evaluated_by}` : '-'}</TableCell>
                    <TableCell className="font-semibold">{row.pqm_score ?? '-'}</TableCell>
                    <TableCell>{row.evaluation_date ? new Date(row.evaluation_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><PendingApprovalBadge /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => navigate(`/evaluations/${row.id}/approval`)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
