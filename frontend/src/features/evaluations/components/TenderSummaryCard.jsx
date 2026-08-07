import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { EvaluationStatusBadge } from './StatusBadge';

function SummaryField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

// Read-only snapshot of the tender + its contract, shown once a tender is picked
// on the Evaluations page - before/while/after an evaluation exists for it.
export function TenderSummaryCard({ tender, latestStatus, assignedEvaluatorId }) {
  const contract = tender.contract;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tender summary</CardTitle>
        <CardDescription>Key details for this tender, before evaluation scoring begins.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryField label="Tender Reference Number">{tender.tender_ref_no}</SummaryField>
        <SummaryField label="Vendor Name">{tender.vendor_name}</SummaryField>
        <SummaryField label="Contract Name">{contract?.name ?? '-'}</SummaryField>
        <SummaryField label="Contract Category">{contract?.category ?? '-'}</SummaryField>
        <SummaryField label="Estimated Contract Value">
          {contract?.budgetLimit != null ? `$${Number(contract.budgetLimit).toLocaleString()}` : '-'}
        </SummaryField>
        <SummaryField label="Submission Date">
          {tender.submission_date ? new Date(tender.submission_date).toLocaleDateString() : '-'}
        </SummaryField>
        <SummaryField label="Current Evaluation Status">
          {latestStatus ? <EvaluationStatusBadge status={latestStatus} /> : <Badge variant="secondary">Not started</Badge>}
        </SummaryField>
        <SummaryField label="Assigned Evaluator">
          {assignedEvaluatorId ? `Evaluator #${assignedEvaluatorId}` : 'Not yet assigned'}
        </SummaryField>
      </CardContent>
    </Card>
  );
}
