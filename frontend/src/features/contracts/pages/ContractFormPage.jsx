import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchContractById, createContract, updateContract } from '../services/contractApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { NativeSelect } from '@/features/tenders/components/NativeSelect';
import {
  CATEGORY_VALUES,
  STATUS_VALUES,
  BIZSAFE_LEVELS,
  EXTENSION_TERMS_OPTIONS,
  DEFAULT_GOVERNING_LAW_FRAMEWORK,
} from '../constants';

const EMPTY_FORM = {
  // -- Card 1: Basic Information & Estate Scope --
  name: '',
  contractRefNo: '',
  townCouncilName: '',
  category: CATEGORY_VALUES[0],
  estateZoneScope: '',
  description: '',
  budgetLimit: '',
  openingDate: '',
  closingDate: '',
  status: 'Draft',
  // -- Card 2: Duration, Extensions & DLP --
  contractStartDate: '',
  contractEndDate: '',
  contractDurationMonths: '',
  defectsLiabilityPeriodMonths: '',
  optionToExtend: false,
  extensionTerms: 'None',
  terminationNoticePeriodDays: '',
  // -- Card 3: Commercial & Payment Terms --
  awardedContractSum: '',
  monthlyManagementFeeRate: '',
  paymentMilestones: '',
  liquidatedDamagesRate: '',
  // -- Card 4: Insurance, Security Deposit & Legal Framework --
  wicaInsuranceCap: '',
  publicLiabilityInsuranceMin: '',
  publicLiabilityInsuranceMax: '',
  minBizsafeLevel: 'None',
  performanceGuaranteePercent: '',
  securityDepositAmount: '',
  bankGuaranteeTerms: '',
  governingLawFramework: DEFAULT_GOVERNING_LAW_FRAMEWORK,
};

function Required() {
  return <span className="text-destructive"> *</span>;
}

function FieldErrorText({ children }) {
  if (!children) return null;
  return <p className="text-xs text-destructive">{children}</p>;
}

function Field({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <Required />}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldErrorText>{error}</FieldErrorText>
    </div>
  );
}

function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id),
    enabled: isEditing,
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name,
        contractRefNo: contract.contractRefNo ?? '',
        townCouncilName: contract.townCouncilName ?? '',
        category: contract.category,
        estateZoneScope: contract.estateZoneScope ?? '',
        description: contract.description || '',
        budgetLimit: contract.budgetLimit,
        openingDate: contract.openingDate.split('T')[0],
        closingDate: contract.closingDate.split('T')[0],
        status: contract.status,
        contractStartDate: contract.contractStartDate ? contract.contractStartDate.split('T')[0] : '',
        contractEndDate: contract.contractEndDate ? contract.contractEndDate.split('T')[0] : '',
        contractDurationMonths: contract.contractDurationMonths ?? '',
        defectsLiabilityPeriodMonths: contract.defectsLiabilityPeriodMonths ?? '',
        optionToExtend: contract.optionToExtend ?? false,
        extensionTerms: contract.extensionTerms || 'None',
        terminationNoticePeriodDays: contract.terminationNoticePeriodDays ?? '',
        awardedContractSum: contract.awardedContractSum ?? '',
        monthlyManagementFeeRate: contract.monthlyManagementFeeRate ?? '',
        paymentMilestones: contract.paymentMilestones || '',
        liquidatedDamagesRate: contract.liquidatedDamagesRate ?? '',
        wicaInsuranceCap: contract.wicaInsuranceCap ?? '',
        publicLiabilityInsuranceMin: contract.publicLiabilityInsuranceMin ?? '',
        publicLiabilityInsuranceMax: contract.publicLiabilityInsuranceMax ?? '',
        minBizsafeLevel: contract.minBizsafeLevel || 'None',
        performanceGuaranteePercent: contract.performanceGuaranteePercent ?? '',
        securityDepositAmount: contract.securityDepositAmount ?? '',
        bankGuaranteeTerms: contract.bankGuaranteeTerms || '',
        governingLawFramework: contract.governingLawFramework || DEFAULT_GOVERNING_LAW_FRAMEWORK,
      });
    }
  }, [contract]);

  const saveMutation = useMutation({
    mutationFn: (data) => (isEditing ? updateContract(id, data) : createContract(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: isEditing ? 'Contract updated' : 'Contract created',
        description: `${formData.name} was saved.`,
        variant: 'success',
      });
      navigate('/contracts');
    },
    onError: (err) => {
      const message = err.response?.data?.message ?? 'An error occurred while saving. Please try again.';
      setErrors((prev) => ({ ...prev, form: message }));
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    },
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Contract title is required.';
    if (!formData.budgetLimit || parseFloat(formData.budgetLimit) <= 0) {
      newErrors.budgetLimit = 'Budget Limit must be greater than SGD 0 (e.g. 500.00).';
    }
    if (formData.openingDate && formData.closingDate) {
      if (new Date(formData.openingDate) > new Date(formData.closingDate)) {
        newErrors.dates = 'Closing date must be after opening date.';
      }
    } else {
      newErrors.dates = 'Both opening and closing dates are required.';
    }
    if (
      formData.contractStartDate &&
      formData.contractEndDate &&
      new Date(formData.contractStartDate) >= new Date(formData.contractEndDate)
    ) {
      newErrors.contractPeriod = 'Contract end date must be after the contract start date.';
    }
    if (
      formData.publicLiabilityInsuranceMin &&
      formData.publicLiabilityInsuranceMax &&
      parseFloat(formData.publicLiabilityInsuranceMin) > parseFloat(formData.publicLiabilityInsuranceMax)
    ) {
      newErrors.publicLiabilityInsurance = 'Minimum insurance coverage must not exceed the maximum.';
    }
    if (
      formData.performanceGuaranteePercent !== '' &&
      (parseFloat(formData.performanceGuaranteePercent) < 0 || parseFloat(formData.performanceGuaranteePercent) > 100)
    ) {
      newErrors.performanceGuaranteePercent = 'Enter a percentage between 0 and 100.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) saveMutation.mutate(formData);
  };

  if (isEditing && isLoading) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Button type="button" variant="ghost" className="self-start" onClick={() => navigate('/contracts')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts
      </Button>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errors.form && (
          <Alert variant="destructive">
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}

        {/* ── Card 1: Basic Information & Estate Scope ─────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information & Estate Scope</CardTitle>
            <CardDescription>
              {isEditing ? 'Update the details of this contract opportunity.' : 'Set up a new Town Council contract opportunity for tender submissions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract Title" htmlFor="name" required error={errors.name}>
                <Input
                  id="name"
                  placeholder="e.g. Zone A Cleaning Services 2026"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </Field>
              <Field label="Contract Reference No." htmlFor="contractRefNo" hint="e.g. PRPGTC/RR/22/001">
                <Input
                  id="contractRefNo"
                  placeholder="e.g. PRPGTC/RR/22/001"
                  value={formData.contractRefNo}
                  onChange={(e) => handleChange('contractRefNo', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Town Council Name" htmlFor="townCouncilName">
                <Input
                  id="townCouncilName"
                  placeholder="e.g. Pasir Ris-Punggol Town Council"
                  value={formData.townCouncilName}
                  onChange={(e) => handleChange('townCouncilName', e.target.value)}
                />
              </Field>
              <Field label="Service Type" htmlFor="category" required>
                <NativeSelect id="category" value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                  {CATEGORY_VALUES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <Field label="Estate / Zone Scope" htmlFor="estateZoneScope" hint="e.g. Division A/B, HDB Blocks 101-156">
              <Textarea
                id="estateZoneScope"
                placeholder="e.g. Division A/B, HDB Blocks 101-156, Pasir Ris Street 11-13"
                className="min-h-16"
                value={formData.estateZoneScope}
                onChange={(e) => handleChange('estateZoneScope', e.target.value)}
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                placeholder="Routine cleaning services for residential blocks in Zone A..."
                className="min-h-24"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Budget Limit (SGD)" htmlFor="budgetLimit" required error={errors.budgetLimit}>
                <Input
                  id="budgetLimit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.budgetLimit}
                  onChange={(e) => handleChange('budgetLimit', e.target.value)}
                />
              </Field>
              <Field label="Opening Date" htmlFor="openingDate" required>
                <Input
                  id="openingDate"
                  type="date"
                  value={formData.openingDate}
                  onChange={(e) => handleChange('openingDate', e.target.value)}
                />
              </Field>
              <Field label="Closing Date" htmlFor="closingDate" required>
                <Input
                  id="closingDate"
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => handleChange('closingDate', e.target.value)}
                />
              </Field>
            </div>
            <FieldErrorText>{errors.dates}</FieldErrorText>

            <Field label="Status" htmlFor="status" required>
              <NativeSelect
                id="status"
                className="w-full sm:w-1/3"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={!isEditing}
              >
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
              {!isEditing && <p className="text-xs text-muted-foreground">New contracts start as Drafts.</p>}
            </Field>
          </CardContent>
        </Card>

        {/* ── Card 2: Duration, Extensions & DLP ────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Duration, Extensions & DLP</CardTitle>
            <CardDescription>Contract period, defects liability, extension options, and termination notice.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Contract Start Date" htmlFor="contractStartDate">
                <Input
                  id="contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => handleChange('contractStartDate', e.target.value)}
                />
              </Field>
              <Field label="Contract End Date" htmlFor="contractEndDate" error={errors.contractPeriod}>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => handleChange('contractEndDate', e.target.value)}
                />
              </Field>
              <Field label="Duration (Months)" htmlFor="contractDurationMonths" hint="e.g. 36">
                <Input
                  id="contractDurationMonths"
                  type="number"
                  step="1"
                  placeholder="e.g. 36"
                  value={formData.contractDurationMonths}
                  onChange={(e) => handleChange('contractDurationMonths', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Defects Liability Period (Months)"
                htmlFor="defectsLiabilityPeriodMonths"
                hint="e.g. 12 or 24 months"
              >
                <Input
                  id="defectsLiabilityPeriodMonths"
                  type="number"
                  step="1"
                  placeholder="e.g. 12"
                  value={formData.defectsLiabilityPeriodMonths}
                  onChange={(e) => handleChange('defectsLiabilityPeriodMonths', e.target.value)}
                />
              </Field>
              <Field label="Termination Notice Period (Days)" htmlFor="terminationNoticePeriodDays">
                <Input
                  id="terminationNoticePeriodDays"
                  type="number"
                  step="1"
                  placeholder="e.g. 14"
                  value={formData.terminationNoticePeriodDays}
                  onChange={(e) => handleChange('terminationNoticePeriodDays', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="optionToExtend"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={formData.optionToExtend}
                  onChange={(e) => handleChange('optionToExtend', e.target.checked)}
                />
                <Label htmlFor="optionToExtend" className="cursor-pointer">
                  Option to extend
                </Label>
              </div>
              <Field label="Extension Terms" htmlFor="extensionTerms" hint="e.g. +1 or +2 Years">
                <NativeSelect
                  id="extensionTerms"
                  value={formData.extensionTerms}
                  disabled={!formData.optionToExtend}
                  onChange={(e) => handleChange('extensionTerms', e.target.value)}
                >
                  {EXTENSION_TERMS_OPTIONS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Commercial & Payment Terms ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Commercial & Payment Terms</CardTitle>
            <CardDescription>Awarded sum, service fee, payment milestones, and liquidated damages.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Awarded Contract Sum (SGD)" htmlFor="awardedContractSum" hint="Final awarded amount, once evaluated">
                <Input
                  id="awardedContractSum"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.awardedContractSum}
                  onChange={(e) => handleChange('awardedContractSum', e.target.value)}
                />
              </Field>
              <Field label="Monthly Service Fee Rate (SGD)" htmlFor="monthlyManagementFeeRate">
                <Input
                  id="monthlyManagementFeeRate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthlyManagementFeeRate}
                  onChange={(e) => handleChange('monthlyManagementFeeRate', e.target.value)}
                />
              </Field>
            </div>

            <Field
              label="Payment Milestones"
              htmlFor="paymentMilestones"
              hint="e.g. 20% mobilization, 60% progressive, 20% on completion"
            >
              <Textarea
                id="paymentMilestones"
                placeholder="e.g. 20% on mobilization, 60% progressively upon completion, 20% on final handover."
                className="min-h-20"
                value={formData.paymentMilestones}
                onChange={(e) => handleChange('paymentMilestones', e.target.value)}
              />
            </Field>

            <Field
              label="Liquidated Damages (LD) Rate (SGD / day)"
              htmlFor="liquidatedDamagesRate"
              hint="e.g. 100.00 for delayed works"
            >
              <Input
                id="liquidatedDamagesRate"
                type="number"
                step="0.01"
                placeholder="e.g. 100.00"
                className="max-w-xs"
                value={formData.liquidatedDamagesRate}
                onChange={(e) => handleChange('liquidatedDamagesRate', e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        {/* ── Card 4: Insurance, Security Deposit & Legal Framework ──────── */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance, Security Deposit & Legal Framework</CardTitle>
            <CardDescription>Compliance limits, performance guarantee, and the governing legal framework.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="WICA Insurance Cap (SGD)" htmlFor="wicaInsuranceCap" hint="Work Injury Compensation Act coverage cap">
                <Input
                  id="wicaInsuranceCap"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500000"
                  value={formData.wicaInsuranceCap}
                  onChange={(e) => handleChange('wicaInsuranceCap', e.target.value)}
                />
              </Field>
              <Field label="Minimum bizSAFE Level Requirement" htmlFor="minBizsafeLevel">
                <NativeSelect
                  id="minBizsafeLevel"
                  value={formData.minBizsafeLevel}
                  onChange={(e) => handleChange('minBizsafeLevel', e.target.value)}
                >
                  {BIZSAFE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Public Liability Insurance - Min (SGD)" htmlFor="publicLiabilityInsuranceMin">
                <Input
                  id="publicLiabilityInsuranceMin"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1000000"
                  value={formData.publicLiabilityInsuranceMin}
                  onChange={(e) => handleChange('publicLiabilityInsuranceMin', e.target.value)}
                />
              </Field>
              <Field label="Public Liability Insurance - Max (SGD)" htmlFor="publicLiabilityInsuranceMax">
                <Input
                  id="publicLiabilityInsuranceMax"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2000000"
                  value={formData.publicLiabilityInsuranceMax}
                  onChange={(e) => handleChange('publicLiabilityInsuranceMax', e.target.value)}
                />
              </Field>
            </div>
            <FieldErrorText>{errors.publicLiabilityInsurance}</FieldErrorText>

            <div className="border-t pt-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Performance Guarantee / Security Deposit
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Performance Guarantee (%)"
                  htmlFor="performanceGuaranteePercent"
                  hint="e.g. 5% of contract sum"
                  error={errors.performanceGuaranteePercent}
                >
                  <Input
                    id="performanceGuaranteePercent"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5"
                    value={formData.performanceGuaranteePercent}
                    onChange={(e) => handleChange('performanceGuaranteePercent', e.target.value)}
                  />
                </Field>
                <Field label="Security Deposit Amount (SGD)" htmlFor="securityDepositAmount">
                  <Input
                    id="securityDepositAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.securityDepositAmount}
                    onChange={(e) => handleChange('securityDepositAmount', e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                <Label htmlFor="bankGuaranteeTerms">Bank Guarantee Terms</Label>
                <Input
                  id="bankGuaranteeTerms"
                  placeholder="e.g. 5% of contract sum, valid till end of DLP"
                  value={formData.bankGuaranteeTerms}
                  onChange={(e) => handleChange('bankGuaranteeTerms', e.target.value)}
                />
              </div>
            </div>

            <Field
              label="Governing Law Framework"
              htmlFor="governingLawFramework"
              hint="e.g. Singapore Town Councils Act & PSSCOC"
            >
              <Textarea
                id="governingLawFramework"
                className="min-h-16"
                value={formData.governingLawFramework}
                onChange={(e) => handleChange('governingLawFramework', e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardFooter className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/contracts')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Contract'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default ContractFormPage;
