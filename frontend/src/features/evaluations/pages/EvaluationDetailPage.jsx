import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { EvaluationStatusBadge, DecisionBadge } from '../components/StatusBadge';
import { CriterionScoreForm } from '../components/CriterionScoreForm';
import { ApprovalForm } from '../components/ApprovalForm';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { fetchEvaluation, saveDraftScores, submitEvaluation, reprocessEvaluation } from '../services/evaluationApi';
import { fetchApprovals, createApproval } from '../services/approvalApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/routeConfig';

// UC-B5/B6 (weighted PQM breakdown + criterion scoring), UC-B11 (reprocess),
// UC-B9/B10 (approval decision + history) - all against a single evaluation id.
export default function EvaluationDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess } = useActionMessage();

  const [saveError, setSaveError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
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

  const invalidateEvaluation = () => queryClient.invalidateQueries({ queryKey: ['evaluation', id] });

  const saveDraftMutation = useMutation({
    mutationFn: (scores) => saveDraftScores(id, scores),
    onSuccess: () => {
      invalidateEvaluation();
      setSaveError(null);
      showSuccess('Draft scores saved.');
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  });

  const submitMutation = useMutation({
    mutationFn: async (scores) => {
      await saveDraftScores(id, scores);
      return submitEvaluation(id);
    },
    onSuccess: (result) => {
      invalidateEvaluation();
      setSubmitError(null);
      showSuccess(`Submitted - PQM score ${result.pqm_score}.`);
    },
    onError: (err) => {
      if (err?.response?.status === 422) {
        invalidateEvaluation();
        setSubmitError('Every criterion needs a staff score before this evaluation can be submitted.');
        return;
      }
      setSubmitError(getErrorMessage(err));
    },
  });

  const reprocessMutation = useMutation({
    mutationFn: () => reprocessEvaluation(id),
    onSuccess: (evaluation) => {
      setReprocessOpen(false);
      setReprocessError(null);
      showSuccess(`Re-evaluation started as evaluation #${evaluation.id}.`);
      navigate(`/evaluations/${evaluation.id}`);
    },
    onError: (err) => setReprocessError(getErrorMessage(err)),
  });

  const approvalMutation = useMutation({
    mutationFn: (values) => createApproval(id, values),
    onSuccess: () => {
      invalidateEvaluation();
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
  const canScore = role === ROLES.EVALUATOR && evaluation.status === 'processing';
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
          <p className="text-sm text-muted-foreground">
            {evaluation.tender_ref_no ? `${evaluation.tender_ref_no} - ${evaluation.vendor_name}` : `Tender #${evaluation.tender_id}`}
          </p>
        </div>
        <EvaluationStatusBadge status={evaluation.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PQM score breakdown</CardTitle>
          <CardDescription>The weighted total is always calculated by the backend - never submitted directly by the form.</CardDescription>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criterion scores</CardTitle>
          <CardDescription>
            {canScore
              ? 'Enter a score (0-100) and optional remarks for every criterion, then submit to compute the PQM score.'
              : 'Criteria, weights, and scores as recorded on this evaluation attempt - unaffected by any later change to the criteria configuration.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canScore ? (
            <CriterionScoreForm
              criterionScores={evaluation.criterion_scores}
              onSaveDraft={(scores) => saveDraftMutation.mutate(scores)}
              onSubmitFinal={(scores) => submitMutation.mutate(scores)}
              isSavingDraft={saveDraftMutation.isPending}
              isSubmitting={submitMutation.isPending}
              saveError={saveError}
              submitError={submitError}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Staff score</TableHead>
                  <TableHead>Weighted contribution</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluation.criterion_scores.map((c) => (
                  <TableRow key={c.evaluation_criteria_id}>
                    <TableCell>{c.criteria_name}</TableCell>
                    <TableCell className="capitalize">{c.category}</TableCell>
                    <TableCell>{c.weight_percentage}%</TableCell>
                    <TableCell>{c.staff_score ?? '-'}</TableCell>
                    <TableCell>{c.weighted_score ?? '-'}</TableCell>
                    <TableCell className="max-w-sm truncate">{c.remarks ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              Re-evaluate
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

      <AlertDialog open={reprocessOpen} onOpenChange={setReprocessOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-evaluate this tender?</AlertDialogTitle>
            <AlertDialogDescription>
              Starts a brand-new evaluation attempt against the currently active criteria. This rejected record stays
              untouched as historical record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reprocessError && <p className="text-sm text-destructive">{reprocessError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reprocessMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                reprocessMutation.mutate();
              }}
              disabled={reprocessMutation.isPending}
            >
              {reprocessMutation.isPending ? 'Starting...' : 'Re-evaluate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
