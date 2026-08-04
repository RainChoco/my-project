import { useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NativeSelect } from '../components/NativeSelect';
import { useToast } from '@/hooks/use-toast';
import { eligibilityConfigSchema } from '../schemas';
import {
  BCA_GRADES,
  BIZSAFE_LEVELS,
  BIZSAFE_LEVEL_TO_NUMBER,
  NUMBER_TO_BIZSAFE_LEVEL,
  STANDARD_BCA_GRADE_LIMITS,
  STANDARD_MIN_PAID_UP_CAPITAL,
  STANDARD_MIN_BIZSAFE_LEVEL,
} from '../constants';
import {
  listBcaGradeLimits,
  updateBcaGradeLimit,
  listEligibilityThresholds,
  updateEligibilityThreshold,
} from '../services/tenderApi';

// UC-A9/UC-A10 (routeConfig.jsx) - admin-only settings view for the reference data that
// backs automated eligibility screening: BCA grade -> max tendering limit, minimum
// paid-up capital, and minimum bizSAFE level. RoleRoute already restricts this route to
// ma_staff; this page assumes it's only ever reached by that role.

const MIN_PAID_UP_CAPITAL_KEY = 'min_paid_up_capital';
const MIN_BIZSAFE_LEVEL_KEY = 'min_bizsafe_level';

// Illustrative only - BCA grade limits apply system-wide across every workhead a vendor
// holds (CW01 General Building, ME05 Electrical, ...); the backend doesn't model a
// per-workhead limit, only per-grade (see backend/src/models/bcaGradeLimit.js and the
// eligibility check in tenderController.js, which matches solely on tender.bca_fm01_grade).
const EXAMPLE_WORKHEADS = 'CW01 - General Building, CW02 - Civil Engineering, ME05 - Electrical, and other BCA workheads';

function buildValuesFromServer(gradeLimits, thresholds) {
  const bcaLimits = {};
  const bcaUnlimited = {};
  BCA_GRADES.forEach((grade) => {
    const row = gradeLimits.find((limit) => limit.grade === grade);
    const value = row ? row.max_tender_value : STANDARD_BCA_GRADE_LIMITS[grade];
    const isUnlimited = value === null || value === undefined;
    bcaUnlimited[grade] = isUnlimited;
    bcaLimits[grade] = isUnlimited ? '' : String(value);
  });

  const paidUpCapital = thresholds.find((t) => t.criterion_key === MIN_PAID_UP_CAPITAL_KEY);
  const bizsafeLevel = thresholds.find((t) => t.criterion_key === MIN_BIZSAFE_LEVEL_KEY);

  return {
    bcaLimits,
    bcaUnlimited,
    minPaidUpCapital: paidUpCapital ? String(paidUpCapital.threshold_value) : String(STANDARD_MIN_PAID_UP_CAPITAL),
    minBizsafeLevel: bizsafeLevel
      ? (NUMBER_TO_BIZSAFE_LEVEL[Number(bizsafeLevel.threshold_value)] ?? STANDARD_MIN_BIZSAFE_LEVEL)
      : STANDARD_MIN_BIZSAFE_LEVEL,
  };
}

const STANDARD_VALUES = buildValuesFromServer([], []);

function EligibilityConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);

  const {
    data: gradeLimits,
    isLoading: isGradeLimitsLoading,
    isError: isGradeLimitsError,
  } = useQuery({ queryKey: ['config', 'bca-grade-limits'], queryFn: listBcaGradeLimits });

  const {
    data: thresholds,
    isLoading: isThresholdsLoading,
    isError: isThresholdsError,
  } = useQuery({ queryKey: ['config', 'eligibility-thresholds'], queryFn: listEligibilityThresholds });

  const isLoading = isGradeLimitsLoading || isThresholdsLoading;
  const isError = isGradeLimitsError || isThresholdsError;

  const initialValues = useMemo(
    () => (gradeLimits && thresholds ? buildValuesFromServer(gradeLimits, thresholds) : STANDARD_VALUES),
    [gradeLimits, thresholds]
  );

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const current = buildValuesFromServer(gradeLimits ?? [], thresholds ?? []);

      const gradeUpdates = BCA_GRADES.filter((grade) => {
        const wasUnlimited = current.bcaUnlimited[grade];
        const isUnlimited = values.bcaUnlimited[grade];
        if (isUnlimited !== wasUnlimited) return true;
        return !isUnlimited && values.bcaLimits[grade] !== current.bcaLimits[grade];
      }).map((grade) =>
        updateBcaGradeLimit(grade, {
          max_tender_value: values.bcaUnlimited[grade] ? null : Number(values.bcaLimits[grade]),
          effective_from: todayStr,
        })
      );

      const thresholdUpdates = [];
      if (values.minPaidUpCapital !== current.minPaidUpCapital) {
        thresholdUpdates.push(
          updateEligibilityThreshold(MIN_PAID_UP_CAPITAL_KEY, { threshold_value: Number(values.minPaidUpCapital) })
        );
      }
      if (values.minBizsafeLevel !== current.minBizsafeLevel) {
        thresholdUpdates.push(
          updateEligibilityThreshold(MIN_BIZSAFE_LEVEL_KEY, {
            threshold_value: BIZSAFE_LEVEL_TO_NUMBER[values.minBizsafeLevel],
          })
        );
      }

      await Promise.all([...gradeUpdates, ...thresholdUpdates]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast({ title: 'Rules saved', description: 'Eligibility configuration was updated.', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.message ?? 'Failed to save eligibility rules. Please try again.';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    },
  });

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: eligibilityConfigSchema,
    // Cross-field "required unless Unlimited" check - see schemas.js for why this isn't
    // expressed in the Yup schema itself. Formik merges this with validationSchema's errors.
    validate: (values) => {
      const bcaLimitsErrors = {};
      BCA_GRADES.forEach((grade) => {
        if (!values.bcaUnlimited[grade] && !values.bcaLimits[grade]) {
          bcaLimitsErrors[grade] = 'Required, or mark Unlimited';
        }
      });
      return Object.keys(bcaLimitsErrors).length > 0 ? { bcaLimits: bcaLimitsErrors } : {};
    },
    onSubmit: (values) => saveMutation.mutateAsync(values),
  });

  const handleConfirmReset = () => {
    formik.setValues(STANDARD_VALUES);
    setResetDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load eligibility configuration. Please refresh and try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Eligibility Configuration</h1>
        <p className="text-sm text-muted-foreground">
          BCA grade limits and minimum compliance thresholds used during automated eligibility screening (UC-A9/UC-A10).
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>BCA Grade Thresholds</CardTitle>
            <CardDescription>
              Maximum tendering limit per BCA financial grade (FM01). Applies system-wide across {EXAMPLE_WORKHEADS} -
              the limit isn&apos;t configured per workhead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Financial Grade</TableHead>
                  <TableHead>Maximum Tendering Limit (SGD)</TableHead>
                  <TableHead>Unlimited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BCA_GRADES.map((grade) => (
                  <TableRow key={grade}>
                    <TableCell className="font-medium">{grade}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 1500000"
                        className="max-w-[220px]"
                        name={`bcaLimits.${grade}`}
                        value={formik.values.bcaLimits[grade]}
                        disabled={formik.values.bcaUnlimited[grade]}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.bcaLimits?.[grade] && formik.errors.bcaLimits?.[grade] && (
                        <p className="text-xs text-destructive">{formik.errors.bcaLimits[grade]}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input"
                          name={`bcaUnlimited.${grade}`}
                          checked={formik.values.bcaUnlimited[grade]}
                          onChange={formik.handleChange}
                        />
                        No limit
                      </label>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minimum Compliance Requirements</CardTitle>
            <CardDescription>Baseline checks applied to every tender during eligibility screening.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minBizsafeLevel">Minimum bizSAFE Level</Label>
              <NativeSelect
                id="minBizsafeLevel"
                name="minBizsafeLevel"
                value={formik.values.minBizsafeLevel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {BIZSAFE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </NativeSelect>
              {formik.touched.minBizsafeLevel && formik.errors.minBizsafeLevel && (
                <p className="text-xs text-destructive">{formik.errors.minBizsafeLevel}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minPaidUpCapital">Minimum Paid-Up Capital (SGD)</Label>
              <Input
                id="minPaidUpCapital"
                name="minPaidUpCapital"
                type="number"
                step="0.01"
                min="0"
                value={formik.values.minPaidUpCapital}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.minPaidUpCapital && formik.errors.minPaidUpCapital && (
                <p className="text-xs text-destructive">{formik.errors.minPaidUpCapital}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setResetDialogOpen(true)}
            disabled={saveMutation.isPending}
          >
            Reset to Standard Rules
          </Button>
          <Button type="submit" variant="destructive" disabled={formik.isSubmitting || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Rules'}
          </Button>
        </div>
      </form>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to standard rules?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores the BCA grade limits and compliance thresholds shown below to their standard defaults.
              Nothing is saved until you click &quot;Save Rules&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EligibilityConfigPage;
