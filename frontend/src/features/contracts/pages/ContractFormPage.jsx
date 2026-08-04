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

const CATEGORY_OPTIONS = ['Cleaning', 'Maintenance', 'Landscaping', 'Lift Maintenance', 'Pest Control'];
const STATUS_OPTIONS = ['Draft', 'Open', 'Evaluating', 'Awarded'];

function Required() {
  return <span className="text-destructive"> *</span>;
}

function FieldErrorText({ children }) {
  if (!children) return null;
  return <p className="text-xs text-destructive">{children}</p>;
}

function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Cleaning',
    description: '',
    budgetLimit: '',
    openingDate: '',
    closingDate: '',
    status: 'Draft',
    securityDepositAmount: '',
    bankGuaranteeTerms: '',
    publicLiabilityInsuranceMin: '',
    publicLiabilityInsuranceMax: '',
    monthlyManagementFeeRate: '',
    contractStartDate: '',
    contractEndDate: '',
    optionToExtend: false,
    defectsLiabilityPeriodMonths: '',
    terminationNoticePeriodDays: '',
  });
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
        category: contract.category,
        description: contract.description || '',
        budgetLimit: contract.budgetLimit,
        openingDate: contract.openingDate.split('T')[0],
        closingDate: contract.closingDate.split('T')[0],
        status: contract.status,
        securityDepositAmount: contract.securityDepositAmount ?? '',
        bankGuaranteeTerms: contract.bankGuaranteeTerms || '',
        publicLiabilityInsuranceMin: contract.publicLiabilityInsuranceMin ?? '',
        publicLiabilityInsuranceMax: contract.publicLiabilityInsuranceMax ?? '',
        monthlyManagementFeeRate: contract.monthlyManagementFeeRate ?? '',
        contractStartDate: contract.contractStartDate ? contract.contractStartDate.split('T')[0] : '',
        contractEndDate: contract.contractEndDate ? contract.contractEndDate.split('T')[0] : '',
        optionToExtend: contract.optionToExtend ?? false,
        defectsLiabilityPeriodMonths: contract.defectsLiabilityPeriodMonths ?? '',
        terminationNoticePeriodDays: contract.terminationNoticePeriodDays ?? '',
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
    if (!formData.name.trim()) newErrors.name = 'Contract name is required.';
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
      formData.publicLiabilityInsuranceMin &&
      formData.publicLiabilityInsuranceMax &&
      parseFloat(formData.publicLiabilityInsuranceMin) > parseFloat(formData.publicLiabilityInsuranceMax)
    ) {
      newErrors.publicLiabilityInsurance = 'Minimum insurance coverage must not exceed the maximum.';
    }
    if (
      formData.contractStartDate &&
      formData.contractEndDate &&
      new Date(formData.contractStartDate) >= new Date(formData.contractEndDate)
    ) {
      newErrors.contractPeriod = 'Contract end date must be after the contract start date.';
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
      <Card className="mx-auto max-w-2xl">
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
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Button type="button" variant="ghost" className="self-start" onClick={() => navigate('/contracts')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contracts
      </Button>

      <Card>
        <form noValidate onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Contract' : 'Create New Contract Opportunity'}</CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update the details of this contract opportunity.'
                : 'Set up a new Town Council contract opportunity for tender submissions.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {errors.form && (
              <Alert variant="destructive">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">
                  Contract Name<Required />
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Zone A Cleaning Services 2026"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                <FieldErrorText>{errors.name}</FieldErrorText>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">
                  Category<Required />
                </Label>
                <NativeSelect id="category" value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Routine cleaning services for residential blocks in Zone A..."
                className="min-h-24"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="budgetLimit">
                  Budget Limit (SGD)<Required />
                </Label>
                <Input
                  id="budgetLimit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.budgetLimit}
                  onChange={(e) => handleChange('budgetLimit', e.target.value)}
                />
                <FieldErrorText>{errors.budgetLimit}</FieldErrorText>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="openingDate">
                  Opening Date<Required />
                </Label>
                <Input
                  id="openingDate"
                  type="date"
                  value={formData.openingDate}
                  onChange={(e) => handleChange('openingDate', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="closingDate">
                  Closing Date<Required />
                </Label>
                <Input
                  id="closingDate"
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => handleChange('closingDate', e.target.value)}
                />
              </div>
            </div>
            <FieldErrorText>{errors.dates}</FieldErrorText>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">
                Status<Required />
              </Label>
              <NativeSelect
                id="status"
                className="w-full sm:w-1/3"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={!isEditing}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
              {!isEditing && <p className="text-xs text-muted-foreground">New contracts start as Drafts.</p>}
            </div>

            <div className="mt-2 border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground">Contract Terms & Legal Framework</h3>
              <p className="mb-4 text-xs text-muted-foreground">Financial and compliance terms extracted from the tender documents (optional).</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="securityDepositAmount">Security Deposit Amount (SGD)</Label>
                  <Input
                    id="securityDepositAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.securityDepositAmount}
                    onChange={(e) => handleChange('securityDepositAmount', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bankGuaranteeTerms">Bank Guarantee Terms</Label>
                  <Input
                    id="bankGuaranteeTerms"
                    placeholder="e.g. 5% of contract sum, valid till end of DLP"
                    value={formData.bankGuaranteeTerms}
                    onChange={(e) => handleChange('bankGuaranteeTerms', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="publicLiabilityInsuranceMin">Public Liability Insurance - Min (SGD)</Label>
                  <Input
                    id="publicLiabilityInsuranceMin"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000000"
                    value={formData.publicLiabilityInsuranceMin}
                    onChange={(e) => handleChange('publicLiabilityInsuranceMin', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="publicLiabilityInsuranceMax">Public Liability Insurance - Max (SGD)</Label>
                  <Input
                    id="publicLiabilityInsuranceMax"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2000000"
                    value={formData.publicLiabilityInsuranceMax}
                    onChange={(e) => handleChange('publicLiabilityInsuranceMax', e.target.value)}
                  />
                </div>
              </div>
              <FieldErrorText>{errors.publicLiabilityInsurance}</FieldErrorText>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="monthlyManagementFeeRate">Monthly Management Fee / EDU Rate (SGD)</Label>
                  <Input
                    id="monthlyManagementFeeRate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monthlyManagementFeeRate}
                    onChange={(e) => handleChange('monthlyManagementFeeRate', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="defectsLiabilityPeriodMonths">Defects Liability / Warranty Period (months)</Label>
                  <Input
                    id="defectsLiabilityPeriodMonths"
                    type="number"
                    step="1"
                    placeholder="e.g. 12"
                    value={formData.defectsLiabilityPeriodMonths}
                    onChange={(e) => handleChange('defectsLiabilityPeriodMonths', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="terminationNoticePeriodDays">Termination Notice Period (days)</Label>
                  <Input
                    id="terminationNoticePeriodDays"
                    type="number"
                    step="1"
                    placeholder="e.g. 14"
                    value={formData.terminationNoticePeriodDays}
                    onChange={(e) => handleChange('terminationNoticePeriodDays', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contractStartDate">Contract Start Date</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) => handleChange('contractStartDate', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contractEndDate">Contract End Date</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={formData.contractEndDate}
                    onChange={(e) => handleChange('contractEndDate', e.target.value)}
                  />
                </div>
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
              </div>
              <FieldErrorText>{errors.contractPeriod}</FieldErrorText>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/contracts')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Contract'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ContractFormPage;
