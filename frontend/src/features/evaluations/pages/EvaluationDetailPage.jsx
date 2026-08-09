import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
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
import { EvaluationStatusBadge } from '../components/StatusBadge';
import { CriterionScoreForm } from '../components/CriterionScoreForm';
import { CriterionScoresTable } from '../components/CriterionScoresTable';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { fetchEvaluation, saveDraftScores, submitEvaluation, reprocessEvaluation } from '../services/evaluationApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/roles';

// UC-B5/B6 (weighted PQM breakdown + criterion scoring), UC-B11 (reprocess) -
// the approval decision itself (UC-B9/B10) lives on its own page, ApprovalHistoryPage.jsx.
export default function EvaluationDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess } = useActionMessage();

  const [saveError, setSaveError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [reprocessOpen, setReprocessOpen] = useState(false);
  const [reprocessError, setReprocessError] = useState(null);

  const evaluationQuery = useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => fetchEvaluation(id),
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
        const missing = err.response.data?.missing_criteria ?? [];
        const names = missing.map((m) => m.criteria_name).join(', ');
        setSubmitError(
          names
            ? `Still need a score for: ${names}.`
            : 'Every criterion needs a staff score before this evaluation can be submitted.'
        );
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
  // ma_staff shares the score/submit workflow with evaluator (see
  // EvaluationsPage.jsx's canCreate); re-evaluation (UC-B11) stays
  // evaluator-only, matching the backend's unchanged /reprocess route.
  const canScore = [ROLES.EVALUATOR, ROLES.MA_STAFF].includes(role) && evaluation.status === 'processing';
  const canReprocess = role === ROLES.EVALUATOR && evaluation.status === 'rejected';

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
            <CriterionScoresTable criterionScores={evaluation.criterion_scores} />
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
          <CardTitle className="text-base">Approval</CardTitle>
          <CardDescription>
            Criteria scores, a board paper summary, the decision history, and (for management) the decision form all
            live on the dedicated Approval page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate(`/evaluations/${id}/approval`)}>
            <ShieldCheck className="h-4 w-4" />
            Open approval page
          </Button>
        </CardContent>
      </Card>

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
