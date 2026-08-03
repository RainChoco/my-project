import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
import { EvaluationStatusBadge } from '../components/StatusBadge';
import { TenderPicker } from '../components/TenderPicker';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { fetchEvaluationsForTender, createEvaluationFromTender, fetchCompletedEvaluations } from '../services/evaluationApi';
import { getTender } from '../../tenders/services/tenderApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/routeConfig';

// Tender selected -> create evaluation (UC-B4/B11) -> evaluation history for that
// tender -> a comparison table across every completed evaluation.
export default function EvaluationsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { message, showSuccess } = useActionMessage();

  const tenderIdParam = searchParams.get('tenderId') ?? '';
  const parsedTenderId = Number(tenderIdParam);
  const tenderId =
    tenderIdParam && Number.isInteger(parsedTenderId) && parsedTenderId > 0 ? parsedTenderId : null;

  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleTenderChange = (id) => {
    setSearchParams(id ? { tenderId: String(id) } : {});
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

  const completedQuery = useQuery({
    queryKey: ['completed-evaluations'],
    queryFn: () => fetchCompletedEvaluations(),
  });

  const createMutation = useMutation({
    mutationFn: () => createEvaluationFromTender(tenderId),
    onSuccess: (evaluation) => {
      queryClient.invalidateQueries({ queryKey: ['tender-evaluations', tenderId] });
      setConfirmCreateOpen(false);
      setCreateError(null);
      showSuccess(`Evaluation #${evaluation.id} created - enter scores for each criterion.`);
      navigate(`/evaluations/${evaluation.id}`);
    },
    onError: (err) => {
      const body = err?.response?.data;
      if (body?.error === 'tender_ineligible') {
        setCreateError(`This tender is not eligible for evaluation (eligibility_status: ${body.eligibility_status}).`);
        return;
      }
      if (body?.active_weight_total !== undefined) {
        setCreateError(`Active evaluation criteria must total exactly 100% before an evaluation can be created (currently ${body.active_weight_total}%).`);
        return;
      }
      setCreateError(getErrorMessage(err));
    },
  });

  const canCreate = role === ROLES.EVALUATOR;
  const tender = tenderQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Evaluations</h1>
        <p className="text-sm text-muted-foreground">
          Select a tender to create an evaluation or review its previous PQM scoring attempts.
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

      {tenderId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                {tenderQuery.isLoading
                  ? 'Loading tender...'
                  : tender
                    ? `${tender.tender_ref_no} - ${tender.vendor_name}`
                    : `Tender #${tenderId}`}
              </CardTitle>
              <CardDescription>Evaluation attempts, oldest first - a tender can have more than one (UC-B11 re-evaluation).</CardDescription>
            </div>
            {canCreate && (
              <Button
                onClick={() => {
                  setCreateError(null);
                  setConfirmCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create evaluation
              </Button>
            )}
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
            ) : evaluationsQuery.data.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No evaluation attempts yet for this tender.
                {canCreate && ' Select "Create evaluation" to begin scoring this tender.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PQM score</TableHead>
                    <TableHead>Evaluation date</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationsQuery.data.data.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">#{evaluation.id}</TableCell>
                      <TableCell><EvaluationStatusBadge status={evaluation.status} /></TableCell>
                      <TableCell>{evaluation.pqm_score ?? '-'}</TableCell>
                      <TableCell>{evaluation.evaluation_date ?? '-'}</TableCell>
                      <TableCell>{new Date(evaluation.created_at).toLocaleString()}</TableCell>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare completed evaluations</CardTitle>
          <CardDescription>Every evaluation that has been backend-scored at least once, across all tenders.</CardDescription>
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
                <TableRow>
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
                {completedQuery.data.data.map((evaluation) => (
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
              This loads the tender's active evaluation criteria as a fresh scoring form. You'll enter a score for
              each criterion on the next screen.
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
              {createMutation.isPending ? 'Creating...' : 'Create evaluation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
