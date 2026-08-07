import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select';
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
import { CATEGORY_LABELS } from '../schemas/evaluationCriteriaSchema';
import { generateCoreCriteria } from '../utils/criteriaGenerator';
import { createCriterion, reactivateCriterion } from '../services/evaluationCriteriaApi';
import { getErrorMessage } from '../hooks/useActionMessage';
import { fetchContracts } from '../../contracts/services/contractApi';

const round2 = (n) => Math.round(n * 100) / 100;

const normalize = (name) => name.trim().toLowerCase();

// Compares a freshly-generated criterion against what's already in the table
// so repeated generation never piles up duplicate rows (section 4). An ACTIVE
// match always wins over an inactive one sharing the same normalized name -
// legacy data can have several inactive rows for a name plus one active row,
// and the active row is the one that actually matters for weight/scoring.
function classifyAgainstExisting(row, existingCriteria) {
  const normalized = normalize(row.criteria_name);
  const matches = (existingCriteria ?? []).filter((c) => normalize(c.criteria_name) === normalized);
  const activeMatch = matches.find((c) => c.is_active);
  if (activeMatch) {
    return { ...row, matchStatus: 'exists_active', existingId: activeMatch.id, existingWeight: Number(activeMatch.weight_percentage) };
  }
  const inactiveMatch = matches[0];
  if (inactiveMatch) {
    return { ...row, matchStatus: 'exists_inactive', existingId: inactiveMatch.id, existingWeight: Number(inactiveMatch.weight_percentage) };
  }
  return { ...row, matchStatus: 'new', existingId: null, existingWeight: null };
}

const MATCH_BADGE = {
  new: { label: 'New', className: 'border-green-500 text-green-700 dark:text-green-400' },
  exists_active: { label: 'Already Active', className: 'border-slate-400 text-slate-600 dark:text-slate-400' },
  exists_inactive: { label: 'Existing — Inactive', className: 'border-amber-500 text-amber-700 dark:text-amber-400' },
};

// UC-B1: deterministic (no AI) generation of the 4 core procurement criteria
// (Price Competitiveness, Quality of Work, Resource Availability, Relevant
// Experience) from a free-text job scope - see utils/criteriaGenerator.js.
// Saving reuses the existing evaluation criteria API - new rows are created,
// selected inactive matches are reactivated, and rows already active are left
// untouched, so repeated generation never creates duplicates.
export function CriteriaGeneratorPanel({ existingCriteria, activeWeightTotal, onSaved, onReactivated, showError }) {
  const [jobScope, setJobScope] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [generated, setGenerated] = useState(null); // [{ criteria_name, category, description, weight_percentage, matchStatus, existingId, existingWeight, selectedForReactivation?, savedId?, reactivated? }]
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);

  const contractsQuery = useQuery({
    queryKey: ['contracts-for-criteria-scope'],
    queryFn: fetchContracts,
  });
  const contractsWithScope = (contractsQuery.data ?? []).filter((c) => c.description?.trim());

  const handleSelectContract = (contractId) => {
    setSelectedContractId(contractId);
    const contract = contractsWithScope.find((c) => String(c.id) === contractId);
    if (contract) {
      setJobScope(contract.description);
    }
  };

  const handleGenerate = () => {
    setSaveError(null);
    setHasSaved(false);
    setGenerated(generateCoreCriteria(jobScope).map((row) => classifyAgainstExisting(row, existingCriteria)));
  };

  const updateGeneratedRow = (index, patch) => {
    setGenerated((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  // Only rows that will actually change the active total when Save runs -
  // criteria that are "Already Active" are already counted in
  // activeWeightTotal and must never be added again (section 4).
  const pendingNewRows = generated ? generated.filter((row) => row.matchStatus === 'new' && !row.savedId) : [];
  const pendingReactivateRows = generated
    ? generated.filter((row) => row.matchStatus === 'exists_inactive' && row.selectedForReactivation && !row.reactivated)
    : [];
  const totalPendingActions = pendingNewRows.length + pendingReactivateRows.length;

  const additionalWeight = round2(
    pendingNewRows.reduce((sum, row) => sum + (Number(row.weight_percentage) || 0), 0) +
    pendingReactivateRows.reduce((sum, row) => sum + (Number(row.existingWeight) || 0), 0)
  );
  const projectedActiveTotal = round2((activeWeightTotal ?? 0) + additionalWeight);
  const projectsOver100 = projectedActiveTotal > 100.01;
  const projectsExactly100 = Math.abs(projectedActiveTotal - 100) <= 0.01;

  const toggleReactivationSelection = (index) => {
    updateGeneratedRow(index, { selectedForReactivation: !generated[index].selectedForReactivation });
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    let savedCount = 0;
    try {
      for (let i = 0; i < generated.length; i += 1) {
        const row = generated[i];
        if (row.matchStatus === 'new' && !row.savedId) {
          // eslint-disable-next-line no-await-in-loop
          const created = await createCriterion({
            criteria_name: row.criteria_name,
            category: row.category,
            description: row.description,
            weight_percentage: row.weight_percentage,
          });
          updateGeneratedRow(i, { savedId: created.id });
          savedCount += 1;
        } else if (row.matchStatus === 'exists_inactive' && row.selectedForReactivation && !row.reactivated) {
          // eslint-disable-next-line no-await-in-loop
          await reactivateCriterion(row.existingId);
          updateGeneratedRow(i, { reactivated: true });
          savedCount += 1;
        }
      }
      setConfirmOpen(false);
      setHasSaved(true);
      onSaved?.(savedCount);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to save the generated criteria.');
      setSaveError(message);
      showError?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          Configure Evaluation Criteria
        </CardTitle>
        <CardDescription>
          Describe the job scope once and the four core procurement criteria - Price
          Competitiveness, Quality of Work, Resource Availability, and Relevant
          Experience - are generated with descriptions tailored to that scope.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {contractsWithScope.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract-scope-picker">Auto-fill from an existing contract (optional)</Label>
            <Select value={selectedContractId} onValueChange={handleSelectContract}>
              <SelectTrigger id="contract-scope-picker">
                <SelectValue placeholder="Select a contract with a job description" />
              </SelectTrigger>
              <SelectContent>
                {contractsWithScope.map((contract) => (
                  <SelectItem key={contract.id} value={String(contract.id)}>
                    {contract.name} ({contract.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-scope">Describe the work to be evaluated</Label>
          <Textarea
            id="job-scope"
            rows={4}
            placeholder='"Lift maintenance and emergency repair for HDB residential blocks." or "Preventive maintenance of cable network infrastructure to minimise faulty wiring and service outages."'
            value={jobScope}
            onChange={(e) => setJobScope(e.target.value)}
          />
        </div>

        <div>
          <Button onClick={handleGenerate} disabled={!jobScope.trim()}>
            <Sparkles className="h-4 w-4" />
            Generate Evaluation Criteria
          </Button>
        </div>

        {generated && (
          <div className="flex flex-col gap-4 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">Generated Evaluation Criteria</h3>

            <div className="flex flex-col gap-4">
              {generated.map((row, index) => {
                const badge = MATCH_BADGE[row.matchStatus];
                const isNew = row.matchStatus === 'new';
                const rowLocked = !isNew || Boolean(row.savedId);
                const displayWeight = isNew ? row.weight_percentage : row.existingWeight;

                return (
                  <div key={row.criteria_name} className="flex flex-col gap-2 rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{row.criteria_name}</p>
                        <Badge variant="outline">{CATEGORY_LABELS[row.category] ?? row.category}</Badge>
                        <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                        {row.savedId && <Badge>Saved</Badge>}
                        {row.reactivated && <Badge>Reactivated</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isNew ? (
                          <>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              className="w-24"
                              disabled={Boolean(row.savedId)}
                              value={row.weight_percentage}
                              onChange={(e) => updateGeneratedRow(index, { weight_percentage: e.target.value })}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">{displayWeight}%</span>
                        )}
                        {row.matchStatus === 'exists_inactive' && !row.reactivated && (
                          <Button
                            variant={row.selectedForReactivation ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleReactivationSelection(index)}
                          >
                            {row.selectedForReactivation ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                            {row.selectedForReactivation ? 'Selected for Reactivation' : 'Select for Reactivation'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      rows={2}
                      disabled={rowLocked}
                      value={row.description}
                      onChange={(e) => updateGeneratedRow(index, { description: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Active Weight</span>
                <span className="font-medium">{activeWeightTotal ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">New Criteria Weight</span>
                <span className="font-medium">{additionalWeight}%</span>
              </div>
              <div className="flex items-center justify-between border-t pt-1">
                <span className="text-muted-foreground">Projected Active Weight</span>
                <span className="font-semibold">{projectedActiveTotal}%</span>
              </div>
              {projectsOver100 ? (
                <p className="flex items-start gap-1.5 pt-1 text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Exceeds 100% by {round2(projectedActiveTotal - 100)}% - adjust weights or deselect a
                  reactivation before saving.
                </p>
              ) : projectsExactly100 ? (
                <p className="flex items-center gap-1.5 pt-1 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Ready after save
                </p>
              ) : (
                <p className="pt-1 text-muted-foreground">
                  {round2(100 - projectedActiveTotal)}% short of 100% after saving.
                </p>
              )}
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <div>
              <Button onClick={() => setConfirmOpen(true)} disabled={totalPendingActions === 0 || projectsOver100}>
                {hasSaved && totalPendingActions === 0 ? 'Saved' : 'Save Evaluation Criteria'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !isSaving && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save these evaluation criteria changes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-left">
                <span>
                  This creates {pendingNewRows.length} new active {pendingNewRows.length === 1 ? 'criterion' : 'criteria'}
                  {pendingReactivateRows.length > 0
                    ? ` and reactivates ${pendingReactivateRows.length} existing ${pendingReactivateRows.length === 1 ? 'criterion' : 'criteria'}`
                    : ''}
                  {' '}via the existing evaluation criteria API - criteria that are already active are left untouched.
                </span>
                <span>Projected active weight after saving: {projectedActiveTotal}%.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmSave();
              }}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
