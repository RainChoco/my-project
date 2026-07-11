import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { EvaluationStatusBadge } from '../components/StatusBadge';
import { DocumentIdsDialog } from '../components/DocumentIdsDialog';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { fetchEvaluationsForTender, processTenderForEvaluation } from '../services/evaluationApi';
import { useAuth } from '../../../context';
import { ROLES } from '../../../routes/routeConfig';

// UC-B4/UC-B11 entry point + UC-B3-adjacent evaluation list. There's no tender
// picker UI yet (Zheng Hong's Scope A), so a tender is looked up by id and kept
// in the URL (?tenderId=) so the view is bookmarkable/shareable.
export default function EvaluationsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { message, showSuccess, showError } = useActionMessage();

  const tenderIdParam = searchParams.get('tenderId') ?? '';
  const [tenderIdInput, setTenderIdInput] = useState(tenderIdParam);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processError, setProcessError] = useState(null);

  const tenderId = tenderIdParam ? Number(tenderIdParam) : null;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['tender-evaluations', tenderId],
    queryFn: () => fetchEvaluationsForTender(tenderId),
    enabled: Boolean(tenderId),
  });

  const startEvaluation = useMutation({
    mutationFn: (documentIds) => processTenderForEvaluation(tenderId, documentIds),
    onSuccess: (evaluation) => {
      queryClient.invalidateQueries({ queryKey: ['tender-evaluations', tenderId] });
      setProcessDialogOpen(false);
      setProcessError(null);
      showSuccess(`Evaluation #${evaluation.id} opened - AI extraction is running.`);
      navigate(`/evaluations/${evaluation.id}`);
    },
    onError: (err) => {
      const body = err?.response?.data;
      if (body?.error === 'tender_ineligible') {
        setProcessError(`This tender is not eligible for evaluation (eligibility_status: ${body.eligibility_status}).`);
        return;
      }
      setProcessError(getErrorMessage(err));
    },
  });

  const handleLookup = (e) => {
    e.preventDefault();
    if (!tenderIdInput.trim()) return;
    setSearchParams({ tenderId: tenderIdInput.trim() });
  };

  const canProcess = role === ROLES.EVALUATOR;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Evaluations</h1>
        <p className="text-sm text-muted-foreground">
          Look up a tender to view its evaluation attempts and PQM scoring history.
        </p>
      </div>

      <ActionMessage message={message} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find a tender</CardTitle>
          <CardDescription>Enter a tender id (there's no tender picker yet - Scope A is still in progress).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tenderIdInput" className="text-sm font-medium">Tender ID</label>
              <Input
                id="tenderIdInput"
                type="number"
                min="1"
                className="w-40"
                value={tenderIdInput}
                onChange={(e) => setTenderIdInput(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4" />
              View evaluations
            </Button>
          </form>
        </CardContent>
      </Card>

      {tenderId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Evaluation attempts for tender #{tenderId}</CardTitle>
              <CardDescription>Oldest first - a tender can have more than one attempt (UC-B11 re-evaluation).</CardDescription>
            </div>
            {canProcess && (
              <Button
                onClick={() => {
                  setProcessError(null);
                  setProcessDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Process tender for evaluation
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {error?.response?.status === 404
                    ? 'No tender found with that id.'
                    : getErrorMessage(error, 'Failed to load evaluations.')}
                </p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : data.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No evaluation attempts yet for this tender.
                {canProcess && ' Use "Process tender for evaluation" to start one.'}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((evaluation) => (
                    <TableRow
                      key={evaluation.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                    >
                      <TableCell className="font-medium">#{evaluation.id}</TableCell>
                      <TableCell><EvaluationStatusBadge status={evaluation.status} /></TableCell>
                      <TableCell>{evaluation.pqm_score ?? '-'}</TableCell>
                      <TableCell>{evaluation.evaluation_date ?? '-'}</TableCell>
                      <TableCell>{new Date(evaluation.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {isFetching && !isLoading && <p className="pt-2 text-xs text-muted-foreground">Refreshing...</p>}
          </CardContent>
        </Card>
      )}

      <DocumentIdsDialog
        open={processDialogOpen}
        onOpenChange={setProcessDialogOpen}
        title="Process tender for evaluation"
        description="Opens the Processing Tender Form and kicks off AI extraction of price/quality inputs."
        submitLabel="Start evaluation"
        isSubmitting={startEvaluation.isPending}
        submitError={processError}
        onSubmit={(documentIds) => startEvaluation.mutateAsync(documentIds)}
      />
    </div>
  );
}
