import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

function ChecklistRow({ passed, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
      )}
      <span className={passed ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

// Select Tender -> check whether an evaluation can be created -> Create Evaluation
// -> load configured evaluation criteria -> begin scoring. Reuses the existing
// POST /tenders/:tenderId/evaluations create-evaluation flow (createMutation in
// EvaluationsPage.jsx) - this component only computes readiness and previews
// the currently active criteria, it never calls the API itself.
export function EvaluationReadinessPanel({
  tender,
  criteria,
  activeWeightTotal,
  latestAttempt,
  canCreate,
  isCreating,
  onCreateClick,
  onContinueClick,
}) {
  const tenderSelected = Boolean(tender);
  const contractLinked = Boolean(tender?.contract);
  const activeCriteria = criteria.filter((c) => c.is_active);
  const hasActiveCriteria = activeCriteria.length > 0;
  const weightIsExact = Math.abs((activeWeightTotal ?? 0) - 100) <= 0.01;
  const inProgress = latestAttempt?.status === 'processing';
  const noEvaluationInProgress = !inProgress;
  const hasAnyEvaluation = Boolean(latestAttempt);
  const isSubmitted = hasAnyEvaluation && !inProgress;

  const allReady = tenderSelected && contractLinked && hasActiveCriteria && weightIsExact && noEvaluationInProgress;

  const reasons = [];
  if (!tenderSelected) reasons.push('Select a tender before creating an evaluation.');
  if (tenderSelected && !contractLinked) reasons.push('This tender is not linked to a contract.');
  if (!hasActiveCriteria) {
    reasons.push('No active evaluation criteria have been configured.');
  } else if (!weightIsExact) {
    reasons.push('Evaluation criteria are not ready. Active weights must total exactly 100%.');
  }
  if (!canCreate) reasons.push('Only evaluators can create an evaluation.');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evaluation workflow</CardTitle>
        <CardDescription>
          {inProgress
            ? 'An evaluation is in progress for this tender - continue scoring it below.'
            : isSubmitted
              ? "This tender's evaluation has already been submitted - view it below."
              : 'Check readiness, review the criteria that will be used, then create the evaluation.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {inProgress ? (
          <div className="flex flex-col gap-3">
            <ChecklistRow passed={false} label="An evaluation is already in progress for this tender." />
            <Button onClick={onContinueClick}>Continue Evaluation</Button>
          </div>
        ) : isSubmitted ? (
          <div className="flex flex-col gap-3">
            <ChecklistRow passed label="This evaluation has already been submitted for manager approval." />
            <Button onClick={onContinueClick}>View Evaluation</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <ChecklistRow passed={tenderSelected} label="Tender selected" />
              <ChecklistRow passed={contractLinked} label="Tender is linked to a contract" />
              <ChecklistRow passed={hasActiveCriteria} label="Active evaluation criteria exist" />
              <ChecklistRow passed={weightIsExact} label="Active criteria weights total exactly 100%" />
              <ChecklistRow passed={noEvaluationInProgress} label="No evaluation is currently in progress for this tender" />

              <div className="mt-1 flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Evaluation Readiness</span>
                <Badge
                  variant="outline"
                  className={allReady ? 'border-green-500 text-green-700 dark:text-green-400' : 'border-red-500 text-red-700 dark:text-red-400'}
                >
                  {allReady ? 'READY TO EVALUATE' : 'NOT READY'}
                </Badge>
              </div>
            </div>

            {hasActiveCriteria && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Criteria Used for This Evaluation</p>
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  {activeCriteria.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <span className="font-medium">{c.criteria_name}</span>
                        {c.description && (
                          <p className="text-xs text-muted-foreground">
                            {c.description.length > 100 ? `${c.description.slice(0, 100)}...` : c.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">{c.weight_percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={onCreateClick} disabled={!allReady || !canCreate || isCreating}>
                {isCreating ? 'Creating...' : 'Create Evaluation'}
              </Button>
              {(!allReady || !canCreate) && reasons.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {reasons.map((reason) => (
                    <p key={reason} className="text-xs text-destructive">{reason}</p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
