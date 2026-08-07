import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ListChecks, Loader2, Percent, Plus, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '../../../components/ui/button';
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
import { CriteriaGeneratorPanel } from '../components/CriteriaGeneratorPanel';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import {
  fetchCriteria,
  createCriterion,
  updateCriterion,
  deactivateCriterion,
  reactivateCriterion,
  deleteCriterionPermanently,
  previewDuplicateCleanup,
  runDuplicateCleanup,
} from '../services/evaluationCriteriaApi';
import { CATEGORY_LABELS } from '../schemas/evaluationCriteriaSchema';
import { cn } from '../../../lib';

const QUERY_KEY = ['evaluation-criteria'];

// Guidance only - quick-add prefills the Add Criterion form so the user still
// reviews and confirms before anything is created (never inserted automatically).
const DEFAULT_CRITERIA_SUGGESTIONS = [
  {
    criteria_name: 'Quality of Work',
    category: 'quality',
    description: 'Checks proposed work quality, methodology and expected standards.',
  },
  {
    criteria_name: 'Price Competitiveness',
    category: 'price',
    description: 'Checks whether the submitted price is reasonable and competitive.',
  },
  {
    criteria_name: 'Relevant Experience',
    category: 'experience',
    description: 'Checks whether the vendor has completed similar projects.',
  },
  {
    criteria_name: 'Company Capability / Job Compatibility',
    category: 'capability',
    description: 'Checks whether the company has the manpower, certifications, resources and technical ability required for this contract.',
  },
];

const CATEGORY_BADGE_STYLES = {
  price: 'border-emerald-500 text-emerald-700 dark:text-emerald-400',
  quality: 'border-blue-500 text-blue-700 dark:text-blue-400',
  experience: 'border-purple-500 text-purple-700 dark:text-purple-400',
  capability: 'border-indigo-500 text-indigo-700 dark:text-indigo-400',
  compliance: 'border-amber-500 text-amber-700 dark:text-amber-400',
  other: 'border-slate-400 text-slate-600 dark:text-slate-400',
};

function CategoryBadge({ category }) {
  return (
    <Badge variant="outline" className={cn(CATEGORY_BADGE_STYLES[category])}>
      {CATEGORY_LABELS[category] ?? category}
    </Badge>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, className }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted', className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// UC-B1/B2/B3: define, edit/deactivate, and view weighted scoring criteria.
// ma_staff only (enforced both by routeConfig's RoleRoute and, ultimately, the
// backend - this page just doesn't render the write actions for other roles,
// but a direct API call would still be rejected server-side).
export default function EvaluationCriteriaPage() {
  const queryClient = useQueryClient();
  const { message, showSuccess, showError } = useActionMessage();

  const [dialogState, setDialogState] = useState(null); // { mode: 'create' | 'edit', criterion?, prefill? }
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState(null); // { payload, existing }
  const [submitError, setSubmitError] = useState(null);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

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
    onError: (err, payload) => {
      const body = err?.response?.data;
      if (body?.error === 'duplicate_criterion_name') {
        setDialogState(null);
        setSubmitError(null);
        setDuplicatePrompt({ payload, existing: body.existing_criterion });
        return;
      }
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

  const reactivateMutation = useMutation({
    mutationFn: reactivateCriterion,
    onSuccess: () => {
      invalidate();
      setDuplicatePrompt(null);
      showSuccess('Criterion reactivated.');
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCriterionPermanently,
    onSuccess: (result) => {
      invalidate();
      setDeleteTarget(null);
      setDeleteError(null);
      showSuccess(`"${result.criteria_name}" was permanently deleted.`);
    },
    onError: (err) => {
      const body = err?.response?.data;
      if (body?.error === 'criterion_in_use') {
        setDeleteError(getErrorMessage(err));
        return;
      }
      setDeleteTarget(null);
      showError(getErrorMessage(err));
    },
  });

  const cleanupPreviewQuery = useQuery({
    queryKey: ['evaluation-criteria-duplicates-preview'],
    queryFn: previewDuplicateCleanup,
    enabled: cleanupDialogOpen,
  });

  const cleanupMutation = useMutation({
    mutationFn: runDuplicateCleanup,
    onSuccess: (result) => {
      invalidate();
      setCleanupDialogOpen(false);
      showSuccess(
        result.deleted.length === 0
          ? 'No unused duplicates to remove.'
          : `Removed ${result.deleted.length} unused duplicate ${result.deleted.length === 1 ? 'criterion' : 'criteria'}.`
      );
    },
    onError: (err) => showError(getErrorMessage(err)),
  });

  const handleSubmit = async (values) => {
    setSubmitError(null);
    if (dialogState.mode === 'create') {
      await createMutation.mutateAsync(values);
    } else {
      await updateMutation.mutateAsync({ id: dialogState.criterion.id, payload: values });
    }
  };

  const openCreateDialog = (prefill) => {
    setSubmitError(null);
    setDialogState({ mode: 'create', prefill });
  };

  const isSubmittingForm = createMutation.isPending || updateMutation.isPending;

  const criteria = data?.data ?? [];
  const activeCriteria = criteria.filter((c) => c.is_active);
  const activeTotal = data?.active_weight_total ?? 0;

  const readiness = activeTotal === 100 ? 'ready' : activeTotal < 100 ? 'below' : 'above';
  const READINESS_META = {
    ready: {
      label: 'Ready for Evaluation',
      icon: CheckCircle2,
      className: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
    },
    below: {
      label: 'Not Ready',
      icon: AlertTriangle,
      className: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
    },
    above: {
      label: 'Not Ready',
      icon: AlertTriangle,
      className: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    },
  }[readiness];

  const existingNames = new Set(criteria.map((c) => c.criteria_name.trim().toLowerCase()));
  const suggestions = DEFAULT_CRITERIA_SUGGESTIONS.filter(
    (s) => !existingNames.has(s.criteria_name.trim().toLowerCase())
  );
  const showSuggestions = !isLoading && !isError && activeCriteria.length === 0 && suggestions.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evaluation Criteria</h1>
          <p className="text-sm text-muted-foreground">
            Configure the weighted criteria evaluators will use to assess whether a
            vendor is suitable for the job - price, quality, experience, capability,
            and any other custom criteria your team needs.
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="h-4 w-4" />
          Add criterion
        </Button>
      </div>

      <ActionMessage message={message} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={ListChecks}
          label="Total Criteria"
          value={isLoading ? '-' : criteria.length}
          className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Active Criteria"
          value={isLoading ? '-' : activeCriteria.length}
          className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
        />
        <SummaryCard
          icon={Percent}
          label="Active Weight Total"
          value={isLoading ? '-' : `${activeTotal}%`}
          className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
        <SummaryCard
          icon={READINESS_META.icon}
          label="Evaluation Readiness"
          value={isLoading ? '-' : READINESS_META.label}
          hint={!isLoading ? 'Active weights must total exactly 100%' : undefined}
          className={READINESS_META.className}
        />
      </div>

      <CriteriaGeneratorPanel
        existingCriteria={criteria}
        activeWeightTotal={activeTotal}
        showError={showError}
        onSaved={(savedCount) => {
          invalidate();
          showSuccess(`${savedCount} evaluation ${savedCount === 1 ? 'criterion' : 'criteria'} saved.`);
        }}
      />

      {showSuggestions && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Common Evaluation Templates
            </CardTitle>
            <CardDescription>
              No active criteria yet. These are common tender evaluation areas - use them as a
              starting point or add your own. Nothing is created until you review and save.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((s) => (
              <div key={s.criteria_name} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{s.criteria_name}</p>
                  <CategoryBadge category={s.category} />
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
                <Button variant="outline" size="sm" className="w-fit" onClick={() => openCreateDialog(s)}>
                  <Plus className="h-3.5 w-3.5" />
                  Use this
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Criteria</CardTitle>
            <CardDescription>
              The exact criteria, weights, and descriptions staff will use when scoring
              tender submissions. Deactivating a criterion is a soft delete - past
              evaluations keep their original weighting.
            </CardDescription>
          </div>
          {criteria.some((c) => c.is_duplicate_name) && (
            <Button variant="outline" size="sm" onClick={() => setCleanupDialogOpen(true)}>
              Clean Up Duplicates
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
          ) : criteria.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-medium">No evaluation criteria have been configured yet.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Add criteria such as Quality, Price, Experience and Company Capability.
                Active weights must total exactly 100% before evaluations can be created.
              </p>
              <Button onClick={() => openCreateDialog()}>
                <Plus className="h-4 w-4" />
                Add criterion
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        {criterion.criteria_name}
                        {criterion.is_duplicate_name && (
                          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                            Duplicate
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><CategoryBadge category={criterion.category} /></TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {criterion.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{criterion.weight_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={criterion.is_active ? 'default' : 'secondary'}>
                        {criterion.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
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
                        {criterion.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeactivateTarget(criterion)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reactivateMutation.isPending}
                            onClick={() => reactivateMutation.mutate(criterion.id)}
                          >
                            Reactivate
                          </Button>
                        )}
                        {criterion.is_used ? (
                          <span title="This criterion has been used in an evaluation and cannot be permanently deleted. Deactivate it instead.">
                            <Button variant="outline" size="sm" disabled>
                              Delete
                            </Button>
                          </span>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(criterion);
                            }}
                          >
                            Delete
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

      {dialogState && (
        <CriteriaFormDialog
          open={Boolean(dialogState)}
          onOpenChange={(open) => !open && setDialogState(null)}
          mode={dialogState.mode}
          criterion={dialogState.criterion}
          prefill={dialogState.prefill}
          activeWeightTotal={activeTotal}
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

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete criterion?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete '{deleteTarget?.criteria_name}'? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Criterion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(duplicatePrompt)} onOpenChange={(open) => !open && setDuplicatePrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criterion already exists</AlertDialogTitle>
            <AlertDialogDescription>
              A criterion named '{duplicatePrompt?.existing.criteria_name}' already exists
              {duplicatePrompt?.existing.is_active ? '.' : ' but is currently inactive.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel
              onClick={() => {
                const payload = duplicatePrompt?.payload;
                setDuplicatePrompt(null);
                if (payload) {
                  setSubmitError(null);
                  setDialogState({ mode: 'create', prefill: payload });
                }
              }}
            >
              Cancel
            </AlertDialogCancel>
            <div className="flex gap-2">
              {duplicatePrompt && !duplicatePrompt.existing.is_active && (
                <Button
                  variant="outline"
                  disabled={reactivateMutation.isPending}
                  onClick={() => reactivateMutation.mutate(duplicatePrompt.existing.id)}
                >
                  {reactivateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reactivate Existing Criterion
                </Button>
              )}
              <AlertDialogAction onClick={() => setDuplicatePrompt(null)}>
                Use Existing Criterion
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cleanupDialogOpen} onOpenChange={(open) => !cleanupMutation.isPending && setCleanupDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clean up duplicate criteria?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 text-left">
                <span>
                  For each name shared by more than one record, the active record (or the
                  newest inactive one if none is active) is kept. Only unused duplicates are
                  removed - anything referenced by a past evaluation is preserved for audit
                  history, and nothing is ever reactivated automatically.
                </span>
                {cleanupPreviewQuery.isLoading ? (
                  <span className="text-muted-foreground">Checking for duplicates...</span>
                ) : cleanupPreviewQuery.isError ? (
                  <span className="text-destructive">{getErrorMessage(cleanupPreviewQuery.error, 'Failed to load the cleanup preview.')}</span>
                ) : cleanupPreviewQuery.data?.groups.length === 0 ? (
                  <span className="text-muted-foreground">No duplicate groups found.</span>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cleanupPreviewQuery.data?.groups.map((group) => (
                      <div key={group.normalized_name} className="rounded-md border p-2 text-sm">
                        <p className="font-medium">{group.keep.criteria_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Keeping #{group.keep.id} ({group.keep.is_active ? 'active' : 'inactive'})
                          {group.reactivate_candidate_id ? ' - reusable if reactivated later' : ''}
                        </p>
                        {group.delete.length > 0 && (
                          <p className="text-xs text-destructive">
                            Will delete: {group.delete.map((d) => `#${d.id}`).join(', ')}
                          </p>
                        )}
                        {group.preserved.length > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Preserved (used in a past evaluation): {group.preserved.map((p) => `#${p.id}`).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleanupMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={(e) => {
                e.preventDefault();
                cleanupMutation.mutate();
              }}
              disabled={
                cleanupMutation.isPending ||
                cleanupPreviewQuery.isLoading ||
                !cleanupPreviewQuery.data?.groups.some((g) => g.delete.length > 0)
              }
            >
              {cleanupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Unused Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
