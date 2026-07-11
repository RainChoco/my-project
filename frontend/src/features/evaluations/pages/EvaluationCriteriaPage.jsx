import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
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
import { CriteriaFormDialog } from '../components/CriteriaFormDialog';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import {
  fetchCriteria,
  createCriterion,
  updateCriterion,
  deactivateCriterion,
} from '../services/evaluationCriteriaApi';

const QUERY_KEY = ['evaluation-criteria'];

// UC-B1/B2/B3: define, edit/deactivate, and view weighted scoring criteria.
// ma_staff only (enforced both by routeConfig's RoleRoute and, ultimately, the
// backend - this page just doesn't render the write actions for other roles,
// but a direct API call would still be rejected server-side).
export default function EvaluationCriteriaPage() {
  const queryClient = useQueryClient();
  const { message, showSuccess, showError } = useActionMessage();

  const [dialogState, setDialogState] = useState(null); // { mode: 'create' | 'edit', criterion? }
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchCriteria(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: createCriterion,
    onSuccess: (criterion) => {
      invalidate();
      setDialogState(null);
      setSubmitError(null);
      showSuccess(`"${criterion.criteria_name}" was added.`);
    },
    onError: (err) => {
      const body = err?.response?.data;
      const extra = body?.current_active_total !== undefined
        ? ` Current active total: ${body.current_active_total}%.`
        : '';
      setSubmitError(getErrorMessage(err) + extra);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCriterion(id, payload),
    onSuccess: () => {
      invalidate();
      setDialogState(null);
      setSubmitError(null);
      showSuccess('Criterion updated.');
    },
    onError: (err) => setSubmitError(getErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateCriterion,
    onSuccess: () => {
      invalidate();
      setDeactivateTarget(null);
      showSuccess('Criterion deactivated.');
    },
    onError: (err) => {
      setDeactivateTarget(null);
      showError(getErrorMessage(err));
    },
  });

  const handleSubmit = async (values) => {
    setSubmitError(null);
    if (dialogState.mode === 'create') {
      await createMutation.mutateAsync(values);
    } else {
      await updateMutation.mutateAsync({ id: dialogState.criterion.id, payload: values });
    }
  };

  const isSubmittingForm = createMutation.isPending || updateMutation.isPending;
  const activeTotal = data?.active_weight_total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evaluation Criteria</h1>
          <p className="text-sm text-muted-foreground">
            Weighted price/quality criteria used to compute the PQM score.
          </p>
        </div>
        <Button
          onClick={() => {
            setSubmitError(null);
            setDialogState({ mode: 'create' });
          }}
        >
          <Plus className="h-4 w-4" />
          Add criterion
        </Button>
      </div>

      <ActionMessage message={message} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Active weight total</CardTitle>
            <CardDescription>Must reach exactly 100% before evaluations can be scored.</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={activeTotal === 100 ? 'border-green-500 text-green-700 dark:text-green-400' : 'border-amber-500 text-amber-700 dark:text-amber-400'}
          >
            {isLoading ? '...' : `${activeTotal}%`}
          </Badge>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{getErrorMessage(error, 'Failed to load evaluation criteria.')}</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No criteria configured yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell className="font-medium">{criterion.criteria_name}</TableCell>
                    <TableCell className="capitalize">{criterion.category}</TableCell>
                    <TableCell>{criterion.weight_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={criterion.is_active ? 'default' : 'secondary'}>
                        {criterion.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSubmitError(null);
                          setDialogState({ mode: 'edit', criterion });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!criterion.is_active}
                        onClick={() => setDeactivateTarget(criterion)}
                      >
                        Deactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dialogState && (
        <CriteriaFormDialog
          open={Boolean(dialogState)}
          onOpenChange={(open) => !open && setDialogState(null)}
          mode={dialogState.mode}
          criterion={dialogState.criterion}
          onSubmit={handleSubmit}
          isSubmitting={isSubmittingForm}
          submitError={submitError}
        />
      )}

      <AlertDialog open={Boolean(deactivateTarget)} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate "{deactivateTarget?.criteria_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a soft delete - the row stays so past evaluations keep their original weighting, but it stops
              counting toward the active 100% total for new evaluations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deactivateMutation.mutate(deactivateTarget.id);
              }}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
