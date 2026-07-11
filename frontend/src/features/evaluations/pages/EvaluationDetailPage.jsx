import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Separator } from '../../../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { EvaluationStatusBadge, DecisionBadge } from '../components/StatusBadge';
import { ConfirmInputsForm } from '../components/ConfirmInputsForm';
import { ApprovalForm } from '../components/ApprovalForm';
import { DocumentIdsDialog } from '../components/DocumentIdsDialog';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { fetchEvaluation, confirmEvaluationInputs, reprocessEvaluation } from '../services/evaluationApi';
import { fetchApprovals, createApproval } from '../services/approvalApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/routeConfig';

// UC-B5/B6 (PQM breakdown + confirm inputs), UC-B11 (reprocess), UC-B9/B10
// (approval decision + history) - all against a single evaluation id.
export default function EvaluationDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess } = useActionMessage();

  const [confirmError, setConfirmError] = useState(null);
  const [approvalError, setApprovalError] = useState(null);
  const [reprocessOpen, setReprocessOpen] = useState(false);
  const [reprocessError, setReprocessError] = useState(null);

  const evaluationQuery = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => fetchEvaluation(id),
  });

  const approvalsQuery = useQuery({
    queryKey: ['evaluation-approvals', id],
    queryFn: () => fetchApprovals(id),
  });

  const confirmMutation = useMutation({
    mutationFn: (payload) => confirmEvaluationInputs(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      setConfirmError(null);
      showSuccess(result.status === 'scored' ? 'Inputs confirmed - PQM score computed.' : 'Inputs saved.');
    },
    onError: (err) => {
      if (err?.response?.status === 422) {
        // Backend already persisted the 'incomplete' status + missing_fields;
        // refetch so the page reflects it instead of just showing a toast.
        queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
        setConfirmError('Some required inputs are still missing - see the warning above.');
        return;
      }
      setConfirmError(getErrorMessage(err));
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: (documentIds) => reprocessEvaluation(id, documentIds),
    onSuccess: (evaluation) => {
      setReprocessOpen(false);
      setReprocessError(null);
      showSuccess(`Re-processing started as evaluation #${evaluation.id}.`);
      navigate(`/evaluations/${evaluation.id}`);
    },
    onError: (err) => setReprocessError(getErrorMessage(err)),
  });

  const approvalMutation = useMutation({
    mutationFn: (values) => createApproval(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-approvals', id] });
      setApprovalError(null);
      showSuccess('Decision logged.');
    },
    onError: (err) => setApprovalError(getErrorMessage(err)),
  });

  if (evaluationQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (evaluationQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {evaluationQuery.error?.response?.status === 404
            ? 'No evaluation found with that id.'
            : getErrorMessage(evaluationQuery.error, 'Failed to load this evaluation.')}
        </p>
        <Button variant="outline" onClick={() => evaluationQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const evaluation = evaluationQuery.data;
  const canConfirmInputs = role === ROLES.EVALUATOR && ['processing', 'incomplete'].includes(evaluation.status);
  const canReprocess = role === ROLES.EVALUATOR && evaluation.status === 'rejected';
  const canDecide = role === ROLES.MANAGEMENT && evaluation.status === 'scored';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <ActionMessage message={message} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evaluation #{evaluation.id}</h1>
          <p className="text-sm text-muted-foreground">Tender #{evaluation.tender_id}</p>
        </div>
        <EvaluationStatusBadge status={evaluation.status} />
      </div>

      {evaluation.status === 'incomplete' && evaluation.missing_fields?.length > 0 && (
        <Alert className="border-amber-500 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing required inputs</AlertTitle>
          <AlertDescription>
            The active evaluation criteria need: {evaluation.missing_fields.join(', ')}. Supply them below to compute
            the PQM score.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PQM score breakdown</CardTitle>
          <CardDescription>Computed deterministically by the backend - never accepted directly from a form.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Price score</p>
            <p className="text-lg font-semibold">{evaluation.price_score ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quality score</p>
            <p className="text-lg font-semibold">{evaluation.quality_score ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">PQM score</p>
            <p className="text-lg font-semibold">{evaluation.pqm_score ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Evaluation date</p>
            <p className="text-lg font-semibold">{evaluation.evaluation_date ?? '-'}</p>
          </div>
        </CardContent>
        {evaluation.criteria_used?.length > 0 && (
          <>
            <Separator />
            <CardContent className="pt-6">
              <p className="mb-2 text-sm font-medium">Active criteria used</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluation.criteria_used.map((c) => (
                    <TableRow key={c.criteria_name}>
                      <TableCell>{c.criteria_name}</TableCell>
                      <TableCell className="capitalize">{c.category}</TableCell>
                      <TableCell>{c.weight_percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </>
        )}
      </Card>

      {canConfirmInputs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm extracted inputs</CardTitle>
            <CardDescription>Review/correct the AI-extracted inputs, then confirm to compute the PQM score.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmInputsForm
              initialInputs={evaluation.ai_extracted_inputs}
              onSubmit={(payload) => confirmMutation.mutateAsync(payload)}
              isSubmitting={confirmMutation.isPending}
              submitError={confirmError}
            />
          </CardContent>
        </Card>
      )}

      {canReprocess && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Re-evaluate this tender</CardTitle>
            <CardDescription>
              Creates a brand-new evaluation attempt for the same tender - this rejected record stays untouched (UC-B11).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setReprocessError(null);
                setReprocessOpen(true);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Re-process evaluation
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval decision history</CardTitle>
          <CardDescription>Append-only audit trail - a new evaluation attempt starts its own fresh history.</CardDescription>
        </CardHeader>
        <CardContent>
          {approvalsQuery.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : approvalsQuery.isError ? (
            <p className="text-sm text-muted-foreground">{getErrorMessage(approvalsQuery.error, 'Failed to load approval history.')}</p>
          ) : approvalsQuery.data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Awaiting approval.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decision</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Decided at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalsQuery.data.data.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell><DecisionBadge decision={approval.decision} /></TableCell>
                    <TableCell className="max-w-sm truncate">{approval.remarks ?? '-'}</TableCell>
                    <TableCell>{new Date(approval.decided_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canDecide && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log a decision</CardTitle>
            <CardDescription>Approve, reject, or request revision. Remarks are required unless approving.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalForm
              onSubmit={(values) => approvalMutation.mutateAsync(values)}
              isSubmitting={approvalMutation.isPending}
              submitError={approvalError}
            />
          </CardContent>
        </Card>
      )}

      <DocumentIdsDialog
        open={reprocessOpen}
        onOpenChange={setReprocessOpen}
        title="Re-process evaluation"
        description="Starts a new evaluation attempt for the same tender, using any updated documents."
        submitLabel="Start re-processing"
        isSubmitting={reprocessMutation.isPending}
        submitError={reprocessError}
        onSubmit={(documentIds) => reprocessMutation.mutateAsync(documentIds)}
      />
    </div>
  );
}
