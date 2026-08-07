import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
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
import { TenderPicker } from '../components/TenderPicker';
import { TenderSummaryCard } from '../components/TenderSummaryCard';
import { EvaluationReadinessPanel } from '../components/EvaluationReadinessPanel';
import { EvaluationWorkspacePanel } from '../components/EvaluationWorkspacePanel';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import {
  fetchEvaluationsForTender,
  createEvaluationFromTender,
  fetchCompletedEvaluations,
  fetchEvaluation,
  saveDraftScores,
  submitEvaluation,
} from '../services/evaluationApi';
import { fetchCriteria } from '../services/evaluationCriteriaApi';
import { getTender } from '../../tenders/services/tenderApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/routeConfig';

// Tender selected -> Tender Summary -> Create/Continue Evaluation -> embedded
// scoring workspace (progress tracker + criteria + live score summary) ->
// previous evaluations for that tender -> a comparison table across every
// completed evaluation, tender-agnostic. This page is the main tender
// evaluation workspace (UC-B4/B5/B6/B11); the dedicated /evaluations/:id route
// still exists for direct links (e.g. from Pending Approvals) and read-only
// historical viewing.
export default function EvaluationsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { message, showSuccess } = useActionMessage();
  const workspaceRef = useRef(null);

  const tenderIdParam = searchParams.get('tenderId') ?? '';
  const parsedTenderId = Number(tenderIdParam);
  const tenderId =
    tenderIdParam && Number.isInteger(parsedTenderId) && parsedTenderId > 0 ? parsedTenderId : null;

  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [completedSort, setCompletedSort] = useState('newest');

  const handleTenderChange = (id) => {
    setSearchParams(id ? { tenderId: String(id) } : {});
    setWorkspaceVisible(false);
  };

  const scrollToWorkspace = () => {
    setWorkspaceVisible(true);
    requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const tenderQuery = useQuery({
    queryKey: ['tender', tenderId],
    queryFn: () => getTender(tenderId),
    enabled: Boolean(tenderId),
  });

  const evaluationsQuery = useQuery({
    queryKey: ['tender-evaluations', tenderId],
    queryFn: () => fetchEvaluationsForTender(tenderId),
    enabled: Boolean(tenderId),
  });

  const attempts = evaluationsQuery.data?.data ?? [];
  const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  const activeEvaluationId = latestAttempt?.id ?? null;

  const activeEvaluationQuery = useQuery({
    queryKey: ['evaluation', activeEvaluationId],
    queryFn: () => fetchEvaluation(activeEvaluationId),
    enabled: Boolean(activeEvaluationId),
  });

  // N+1, but a tender rarely has more than a handful of evaluation attempts -
  // the list endpoint doesn't return evaluated_by, so each row's detail is
  // fetched to show it in the Previous Evaluations table.
  const attemptDetailsQuery = useQuery({
    queryKey: ['tender-evaluations-detail', tenderId, attempts.map((a) => a.id).join(',')],
    queryFn: () => Promise.all(attempts.map((a) => fetchEvaluation(a.id))),
    enabled: attempts.length > 0,
  });

  const criteriaQuery = useQuery({
    queryKey: ['evaluation-criteria'],
    queryFn: () => fetchCriteria(),
  });
  const criteriaDescriptions = Object.fromEntries(
    (criteriaQuery.data?.data ?? []).map((c) => [c.id, c.description])
  );

  const completedQuery = useQuery({
    queryKey: ['completed-evaluations'],
    queryFn: () => fetchCompletedEvaluations(),
  });

  const invalidateAttempts = () => {
    queryClient.invalidateQueries({ queryKey: ['tender-evaluations', tenderId] });
    queryClient.invalidateQueries({ queryKey: ['completed-evaluations'] });
  };

  const createMutation = useMutation({
    mutationFn: () => createEvaluationFromTender(tenderId),
    onSuccess: (evaluation) => {
      invalidateAttempts();
      setConfirmCreateOpen(false);
      setCreateError(null);
      showSuccess('Evaluation created successfully.');
      scrollToWorkspace();
    },
    onError: (err) => {
      const body = err?.response?.data;
      if (body?.error === 'tender_ineligible') {
        setCreateError(`This tender is not eligible for evaluation (eligibility_status: ${body.eligibility_status}).`);
        return;
      }
      if (body?.error === 'evaluation_in_progress') {
        setCreateError('An evaluation is already in progress for this tender.');
        return;
      }
      if (body?.active_weight_total !== undefined) {
        setCreateError(`Active evaluation criteria must total exactly 100% before an evaluation can be created (currently ${body.active_weight_total}%).`);
        return;
      }
      setCreateError(getErrorMessage(err));
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (scores) => saveDraftScores(activeEvaluationId, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', activeEvaluationId] });
      setSaveError(null);
      showSuccess('Draft scores saved.');
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  });

  const submitMutation = useMutation({
    mutationFn: async (scores) => {
      await saveDraftScores(activeEvaluationId, scores);
      return submitEvaluation(activeEvaluationId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation', activeEvaluationId] });
      invalidateAttempts();
      setSubmitError(null);
      showSuccess('Evaluation submitted successfully. Awaiting manager approval.');
    },
    onError: (err) => {
      if (err?.response?.status === 422) {
        queryClient.invalidateQueries({ queryKey: ['evaluation', activeEvaluationId] });
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

  const duplicateMutation = useMutation({
    mutationFn: async (sourceId) => {
      const [sourceDetail, created] = await Promise.all([
        fetchEvaluation(sourceId),
        createEvaluationFromTender(tenderId),
      ]);
      const freshDetail = await fetchEvaluation(created.id);
      const sourceByCriteriaId = new Map(sourceDetail.criterion_scores.map((c) => [c.evaluation_criteria_id, c]));
      const carryOverScores = freshDetail.criterion_scores
        .map((row) => {
          const source = sourceByCriteriaId.get(row.evaluation_criteria_id);
          if (!source || source.staff_score === null || source.staff_score === undefined) return null;
          return {
            evaluation_criteria_id: row.evaluation_criteria_id,
            staff_score: source.staff_score,
            remarks: source.remarks,
          };
        })
        .filter(Boolean);
      if (carryOverScores.length > 0) {
        await saveDraftScores(created.id, carryOverScores);
      }
      return created;
    },
    onSuccess: (created) => {
      invalidateAttempts();
      setDuplicateTarget(null);
      setDuplicateError(null);
      showSuccess(`Evaluation #${created.id} created from a duplicate - review the carried-over scores before submitting.`);
      scrollToWorkspace();
    },
    onError: (err) => setDuplicateError(getErrorMessage(err)),
  });

  // ma_staff performs the full create/score/submit workflow alongside
  // evaluator in this project - management stays read-only here and only
  // acts via the separate manager-approval flow.
  const canCreate = [ROLES.EVALUATOR, ROLES.MA_STAFF].includes(role);
  const tender = tenderQuery.data;
  const hasAnyEvaluation = attempts.length > 0;
  const activeEvaluation = activeEvaluationQuery.data;
  const canScoreActive = canCreate && activeEvaluation?.status === 'processing';

  const enrichedAttempts = attempts.map((attempt, i) => ({
    ...attempt,
    evaluated_by: attemptDetailsQuery.data?.[i]?.evaluated_by,
  }));

  const sortedCompleted = [...(completedQuery.data?.data ?? [])].sort((a, b) => {
    switch (completedSort) {
      case 'highest_pqm':
        return (b.pqm_score ?? -Infinity) - (a.pqm_score ?? -Infinity);
      case 'oldest':
        return new Date(a.evaluation_date ?? 0) - new Date(b.evaluation_date ?? 0);
      case 'vendor':
        return (a.vendor_name ?? '').localeCompare(b.vendor_name ?? '');
      case 'newest':
      default:
        return new Date(b.evaluation_date ?? 0) - new Date(a.evaluation_date ?? 0);
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Evaluations</h1>
        <p className="text-sm text-muted-foreground">
          Select a tender to create and score its evaluation, or review its previous PQM scoring attempts.
        </p>
      </div>

      <ActionMessage message={message} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select tender</CardTitle>
          <CardDescription>Choose a tender by vendor name - no need to know its internal id.</CardDescription>
        </CardHeader>
        <CardContent>
          <TenderPicker value={tenderId} onChange={handleTenderChange} />
        </CardContent>
      </Card>

      {tenderId && tenderQuery.isLoading && (
        <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
      )}

      {tenderId && tender && (
        <TenderSummaryCard
          tender={tender}
          latestStatus={latestAttempt?.status ?? null}
          assignedEvaluatorId={activeEvaluation?.evaluated_by}
        />
      )}

      {tenderId && tender && (
        <EvaluationReadinessPanel
          tender={tender}
          criteria={criteriaQuery.data?.data ?? []}
          activeWeightTotal={criteriaQuery.data?.active_weight_total ?? 0}
          latestAttempt={latestAttempt}
          canCreate={canCreate}
          isCreating={createMutation.isPending}
          onCreateClick={() => {
            setCreateError(null);
            setConfirmCreateOpen(true);
          }}
          onContinueClick={scrollToWorkspace}
        />
      )}

      {tenderId && workspaceVisible && activeEvaluationId && (
        <div ref={workspaceRef}>
          {activeEvaluationQuery.isLoading ? (
            <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          ) : activeEvaluationQuery.isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {getErrorMessage(activeEvaluationQuery.error, 'Failed to load this evaluation.')}
                </p>
                <Button variant="outline" onClick={() => activeEvaluationQuery.refetch()}>Retry</Button>
              </CardContent>
            </Card>
          ) : (
            <EvaluationWorkspacePanel
              tender={tender}
              evaluation={activeEvaluation}
              criteriaDescriptions={criteriaDescriptions}
              canScore={canScoreActive}
              onSaveDraft={(scores) => saveDraftMutation.mutate(scores)}
              onSubmitFinal={(scores) => submitMutation.mutate(scores)}
              isSavingDraft={saveDraftMutation.isPending}
              isSubmitting={submitMutation.isPending}
              saveError={saveError}
              submitError={submitError}
            />
          )}
        </div>
      )}

      {tenderId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous evaluations</CardTitle>
            <CardDescription>Every evaluation attempt for this tender, oldest first - a tender can have more than one (UC-B11 re-evaluation).</CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationsQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : evaluationsQuery.isError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {getErrorMessage(evaluationsQuery.error, 'Failed to load evaluations.')}
                </p>
                <Button variant="outline" onClick={() => evaluationsQuery.refetch()}>Retry</Button>
              </div>
            ) : attempts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No evaluation attempts yet for this tender.
                {canCreate && ' Select "Create Evaluation" above to begin scoring this tender.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluation ID</TableHead>
                    <TableHead>Evaluator</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>PQM Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedAttempts.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">#{evaluation.id}</TableCell>
                      <TableCell>{evaluation.evaluated_by ? `Evaluator #${evaluation.evaluated_by}` : '-'}</TableCell>
                      <TableCell>{evaluation.evaluation_date ?? '-'}</TableCell>
                      <TableCell>{evaluation.pqm_score ?? '-'}</TableCell>
                      <TableCell><EvaluationStatusBadge status={evaluation.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/evaluations/${evaluation.id}`)}>
                            View
                          </Button>
                          {canCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDuplicateError(null);
                                setDuplicateTarget(evaluation);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Duplicate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Compare completed evaluations</CardTitle>
            <CardDescription>Every evaluation that has been backend-scored at least once, across all tenders.</CardDescription>
          </div>
          {!completedQuery.isLoading && !completedQuery.isError && completedQuery.data.data.length > 0 && (
            <Select value={completedSort} onValueChange={setCompletedSort}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="highest_pqm">Highest PQM</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent>
          {completedQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : completedQuery.isError ? (
            <p className="text-sm text-muted-foreground">{getErrorMessage(completedQuery.error, 'Failed to load completed evaluations.')}</p>
          ) : completedQuery.data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No completed evaluations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Tender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price score</TableHead>
                  <TableHead>Quality score</TableHead>
                  <TableHead>PQM score</TableHead>
                  <TableHead>Evaluation date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCompleted.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.tender_ref_no} - {evaluation.vendor_name}</TableCell>
                    <TableCell><EvaluationStatusBadge status={evaluation.status} /></TableCell>
                    <TableCell>{evaluation.price_score ?? '-'}</TableCell>
                    <TableCell>{evaluation.quality_score ?? '-'}</TableCell>
                    <TableCell className="font-semibold">{evaluation.pqm_score ?? '-'}</TableCell>
                    <TableCell>{evaluation.evaluation_date ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/evaluations/${evaluation.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmCreateOpen} onOpenChange={setConfirmCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Create an evaluation for {tender ? `${tender.tender_ref_no} - ${tender.vendor_name}` : `tender #${tenderId}`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This snapshots the currently active evaluation criteria into a new evaluation. The Tender Evaluation
              section below will open automatically so you can enter a score for each criterion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Evaluation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(duplicateTarget)} onOpenChange={(open) => !open && setDuplicateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate evaluation #{duplicateTarget?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Creates a new evaluation attempt against the currently active criteria, pre-filled with #{duplicateTarget?.id}'s
              scores and remarks as a starting point wherever the criterion still matches. Nothing about the original
              evaluation is changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {duplicateError && <p className="text-sm text-destructive">{duplicateError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={duplicateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                duplicateMutation.mutate(duplicateTarget.id);
              }}
              disabled={duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
