import { Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchContractById, fetchContractTenders } from '../services/contractApi';
import {
  ArrowLeft, Building2, Calendar, DollarSign, Tag, FileText,
  AlertTriangle, Eye, ClipboardCheck, Users, Clock, TrendingUp,
  ShieldCheck, Landmark, Wrench, BellRing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── Status helpers ───────────────────────────────────────────────────────────
const CONTRACT_STATUS_BADGE_VARIANTS = {
  Draft: 'secondary',
  Open: 'success',
  Closed: 'destructive',
  Archived: 'outline',
  Cancelled: 'warning',
};
function ContractStatusBadge({ status }) {
  return <Badge variant={CONTRACT_STATUS_BADGE_VARIANTS[status] ?? 'secondary'}>{status}</Badge>;
}

const RISK_BADGE_VARIANTS = { low: 'success', medium: 'warning', high: 'destructive' };
const RISK_ICONS = { low: '🟢', medium: '🟠', high: '🔴' };
function RiskBadge({ risk }) {
  if (!risk) return <span className="text-sm text-muted-foreground">Pending</span>;
  const key = risk.toLowerCase();
  return (
    <Badge variant={RISK_BADGE_VARIANTS[key] ?? 'warning'}>
      {RISK_ICONS[key] ?? ''} {risk}
    </Badge>
  );
}

// ── KPI Summary Card ─────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, iconColor, iconBg, label, value, sub, subColor }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="text-xl font-bold leading-tight text-foreground">{value}</div>
          {sub && <div className={cn('mt-0.5 text-xs font-medium', subColor ?? 'text-muted-foreground')}>{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, colorClass = 'bg-primary', label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value} / {max} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Tender Workflow Steps ─────────────────────────────────────────────────────
const WORKFLOW_STEPS = ['draft', 'submitted', 'under_evaluation', 'approved'];
const STEP_LABELS = { draft: 'Draft', submitted: 'Submitted', under_evaluation: 'Evaluating', approved: 'Ranked' };

function TenderWorkflow({ status }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(status ?? 'draft');
  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <Fragment key={step}>
            <div
              className={cn(
                'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold',
                isCurrent ? 'bg-primary text-primary-foreground' : isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
              )}
            >
              {isDone ? '✓ ' : ''}
              {STEP_LABELS[step]}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && <div className="text-xs text-muted-foreground">→</div>}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contract, isLoading: contractLoading, isError: contractError } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: tenders = [], isLoading: tendersLoading } = useQuery({
    queryKey: ['contractTenders', id],
    queryFn: () => fetchContractTenders(id),
    enabled: !!id,
  });

  if (contractLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  if (contractError || !contract) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-lg font-semibold text-destructive">Contract not found</p>
        <Button variant="ghost" onClick={() => navigate('/contracts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts
        </Button>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const closingDate = contract.closingDate ? new Date(contract.closingDate) : null;
  const openingDate = contract.openingDate ? new Date(contract.openingDate) : null;
  const isPastDeadline = closingDate && closingDate < new Date();
  const daysLeft = closingDate ? Math.ceil((closingDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const evaluatedCount = tenders.filter(
    (t) => t.evaluations && t.evaluations.length > 0 && t.evaluations[0].pqm_score != null
  ).length;

  const formatMoney = (value) => (value != null && value !== '' ? `$${parseFloat(value).toLocaleString()}` : null);
  const insuranceRange = (() => {
    const min = formatMoney(contract.publicLiabilityInsuranceMin);
    const max = formatMoney(contract.publicLiabilityInsuranceMax);
    if (min && max) return min === max ? min : `${min} - ${max}`;
    return min || max;
  })();
  const contractStartDate = contract.contractStartDate ? new Date(contract.contractStartDate) : null;
  const contractEndDate = contract.contractEndDate ? new Date(contract.contractEndDate) : null;
  const contractPeriod =
    contractStartDate && contractEndDate
      ? `${contractStartDate.toLocaleDateString()} - ${contractEndDate.toLocaleDateString()}`
      : contractStartDate?.toLocaleDateString() || contractEndDate?.toLocaleDateString();

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 h-auto px-0 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => navigate('/contracts')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Contracts
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{contract.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">{contract.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            <Button onClick={() => navigate(`/contracts/${id}/edit`)}>Edit Contract</Button>
          </div>
        </div>
      </div>

      {/* ── Alert Banner ───────────────────────────────────────────────── */}
      {isPastDeadline && contract.status !== 'Archived' && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="font-medium text-amber-900 dark:text-amber-200">
            This contract&apos;s closing date has passed ({closingDate.toLocaleDateString()}). Consider updating its status.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Closing Soon notification ────────────────────────────────── */}
      {!isPastDeadline && daysLeft !== null && daysLeft <= 7 && (
        <Alert className="border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="font-medium text-orange-900 dark:text-orange-200">
            ⚠ Contract closes in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
            {tenders.filter((t) => !t.evaluations?.length).length > 0 &&
              ` ${tenders.filter((t) => !t.evaluations?.length).length} supplier(s) still pending evaluation.`}
          </AlertDescription>
        </Alert>
      )}

      {/* ── KPI Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          label="Budget Limit"
          value={contract.budgetLimit ? `$${parseFloat(contract.budgetLimit).toLocaleString()}` : '—'}
          sub={contract.category}
        />
        <SummaryCard
          icon={Calendar}
          iconColor={isPastDeadline ? 'text-destructive' : daysLeft !== null && daysLeft <= 7 ? 'text-orange-600' : 'text-primary'}
          iconBg={isPastDeadline ? 'bg-destructive/10' : daysLeft !== null && daysLeft <= 7 ? 'bg-orange-100' : 'bg-primary/10'}
          label="Closing Date"
          value={closingDate ? closingDate.toLocaleDateString() : '—'}
          sub={isPastDeadline ? 'Deadline passed' : daysLeft !== null ? `${daysLeft} days remaining` : ''}
          subColor={isPastDeadline ? 'text-destructive' : daysLeft !== null && daysLeft <= 7 ? 'text-orange-600' : 'text-primary'}
        />
        <SummaryCard
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-100"
          label="Suppliers"
          value={tendersLoading ? '…' : tenders.length}
          sub={tenders.length === 1 ? '1 submission received' : `${tenders.length} submissions received`}
        />
        <SummaryCard
          icon={ClipboardCheck}
          iconColor={evaluatedCount === tenders.length && tenders.length > 0 ? 'text-emerald-600' : 'text-amber-600'}
          iconBg={evaluatedCount === tenders.length && tenders.length > 0 ? 'bg-emerald-100' : 'bg-amber-100'}
          label="Evaluated"
          value={tendersLoading ? '…' : `${evaluatedCount} / ${tenders.length}`}
          sub={evaluatedCount === tenders.length && tenders.length > 0 ? 'All evaluated' : 'Pending evaluations'}
          subColor={evaluatedCount === tenders.length && tenders.length > 0 ? 'text-emerald-600' : 'text-amber-600'}
        />
      </div>

      {/* ── Contract Details + Progress ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {contract.description && <CardDescription className="leading-relaxed">{contract.description}</CardDescription>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: Tag, label: 'Category', value: contract.category },
                { icon: DollarSign, label: 'Budget Limit', value: contract.budgetLimit ? `$${parseFloat(contract.budgetLimit).toLocaleString()}` : '—' },
                { icon: Calendar, label: 'Opening Date', value: openingDate?.toLocaleDateString() },
                { icon: Calendar, label: 'Closing Date', value: closingDate?.toLocaleDateString() },
                { icon: Building2, label: 'Status', value: contract.status },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">{label}</div>
                    <div className="text-sm font-semibold text-foreground">{value ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procurement Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ProgressBar label="Supplier Submissions" value={tenders.length} max={Math.max(tenders.length, 1)} colorClass="bg-primary" />
            <ProgressBar
              label="Evaluations Completed"
              value={evaluatedCount}
              max={Math.max(tenders.length, 1)}
              colorClass={evaluatedCount === tenders.length && tenders.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'}
            />

            <div className="border-t pt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Award Status</div>
              <div className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', evaluatedCount > 0 ? 'bg-emerald-500' : 'bg-amber-500')} />
                <span className="text-sm font-semibold text-foreground">
                  {evaluatedCount > 0 ? 'Ready for Review' : 'Pending Evaluations'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              onClick={() => navigate('/dashboard')}
            >
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> View on Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Contract Terms & Legal Framework ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contract Terms & Legal Framework</CardTitle>
          <CardDescription>Financial and compliance terms extracted from the tender documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Landmark,
                label: 'Security Deposit / Bank Guarantee',
                value: formatMoney(contract.securityDepositAmount),
                sub: contract.bankGuaranteeTerms,
              },
              {
                icon: ShieldCheck,
                label: 'Public Liability Insurance Coverage',
                value: insuranceRange,
              },
              {
                icon: DollarSign,
                label: 'Monthly Management Fee Rate / EDU Rate',
                value: contract.monthlyManagementFeeRate != null ? `${formatMoney(contract.monthlyManagementFeeRate)} / month` : null,
              },
              {
                icon: Calendar,
                label: 'Contract Period',
                value: contractPeriod,
                sub: contract.optionToExtend ? 'Option to extend' : null,
              },
              {
                icon: Wrench,
                label: 'Defects Liability / Warranty Period',
                value: contract.defectsLiabilityPeriodMonths != null ? `${contract.defectsLiabilityPeriodMonths} month(s)` : null,
              },
              {
                icon: BellRing,
                label: 'Termination Notice Period',
                value: contract.terminationNoticePeriodDays != null ? `${contract.terminationNoticePeriodDays} day(s)` : null,
              },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{label}</div>
                  <div className="text-sm font-semibold text-foreground">{value ?? '—'}</div>
                  {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Submitted Tenders ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Submitted Tenders</CardTitle>
            <CardDescription>{tenders.length} tender(s) linked to this contract</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate('/tenders/new', { state: { contractId: contract.id } })}>
            <FileText className="mr-1.5 h-3.5 w-3.5" /> New Tender
          </Button>
        </CardHeader>
        <CardContent>
          {tendersLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : tenders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground">No tenders submitted yet</p>
                <p className="text-sm text-muted-foreground">Be the first to submit a tender for this contract.</p>
              </div>
              <Button onClick={() => navigate('/tenders/new', { state: { contractId: contract.id } })}>Submit First Tender</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No.</TableHead>
                  <TableHead>Supplier / Vendor</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>PQM Score</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenders.map((t) => {
                  const latestEval = t.evaluations?.[0];
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-medium text-foreground">{t.tender_ref_no}</TableCell>
                      <TableCell className="font-medium">{t.vendor_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.submission_date ? new Date(t.submission_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <TenderWorkflow status={t.status} />
                      </TableCell>
                      <TableCell>
                        {latestEval?.pqm_score != null ? (
                          <Badge variant={latestEval.pqm_score >= 80 ? 'default' : 'warning'}>{latestEval.pqm_score.toFixed(1)}</Badge>
                        ) : (
                          <span className="text-sm italic text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={latestEval?.risk_level} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/tenders/${t.id}`)}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/evaluations?tenderId=${t.id}`)}>
                            <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Evaluate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
