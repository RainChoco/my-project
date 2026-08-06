import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileEdit, ScanSearch, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '../components/NativeSelect';
import TenderImageDropzone from '../components/TenderImageDropzone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createTenderSchema, editTenderSchema } from '../schemas';
import { BCA_GRADES, BIZSAFE_LEVELS, LOCKED_FOR_EDIT_STATUSES, STATUS_LABELS, ELIGIBILITY_STATUS_LABELS } from '../constants';
import { createTender, updateTender, getTender, uploadTenderImage, listTenders } from '../services/tenderApi';
import { computeNextTenderRefNo } from '../utils/tenderRefNo';
import { fetchContracts } from '@/features/contracts/services/contractApi';
import { TENDER_SUBMISSION_BLOCKED_STATUSES } from '@/features/contracts/constants';

const CREATE_DEFAULTS = {
  contractId: '',
  tender_ref_no: '',
  vendor_name: '',
  submission_date: '',
  main_offer_price: '',
  alternative_offer_price: '',
  status: 'submitted',
  eligibility_status: 'eligible',
  // -- Additional Vendor & Compliance Information (optional) --
  vendor_uen: '',
  contact_person_name: '',
  contact_person_email: '',
  proposed_completion_months: '',
  tender_validity_days: 90,
  bizsafe_level: 'None',
  conflict_of_interest_declared: false,
};

// Manual-entry subset of the full status/eligibility_status enums - the rest
// (approved/rejected/withdrawn, rejected) are only reached via the evaluation
// and eligibility-check workflow, not picked when first logging a tender.
const CREATE_STATUS_OPTIONS = ['draft', 'submitted', 'under_evaluation'];
const CREATE_ELIGIBILITY_OPTIONS = ['eligible', 'flagged', 'pending'];

const EDIT_DEFAULTS = {
  ...CREATE_DEFAULTS,
  paid_up_capital: '',
  bca_fm01_license_no: '',
  bca_fm01_grade: '',
  non_debarment_declared: false,
};

function FieldError({ formik, name }) {
  if (!formik.touched[name] || !formik.errors[name]) return null;
  return <p className="text-xs text-destructive">{formik.errors[name]}</p>;
}

function Required() {
  return <span className="text-destructive"> *</span>;
}

// Initial step shown at /tenders/new before the manual-entry form - lets the user
// pick between filling the form in themselves or (eventually) an OCR-based upload.
function EntryModeSelection({ onSelectManual, onSelectLookup }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>New Tender Submission</CardTitle>
          <CardDescription>Choose how you&apos;d like to log this tender.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSelectManual}
            className="flex flex-col items-start gap-2 rounded-xl border border-border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileEdit className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">New Tender Submission</span>
            <span className="text-sm text-muted-foreground">
              Manual entry - fill in Contract Opportunity, vendor, price, and dates yourself.
            </span>
          </button>

          <button
            type="button"
            onClick={onSelectLookup}
            className="flex flex-col items-start gap-2 rounded-xl border border-border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ScanSearch className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">Existing / Past Record</span>
            <span className="text-sm text-muted-foreground">
              OCR upload - look up by reference number or upload an existing document package.
            </span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// Info panel shown when a contract is selected
function ContractInfoPanel({ contract }) {
  if (!contract) return null;
  const closingDate = contract.closingDate ? new Date(contract.closingDate) : null;
  const isPastDeadline = closingDate && closingDate < new Date();
  const isBlocked = TENDER_SUBMISSION_BLOCKED_STATUSES.includes(contract.status);

  return (
    <div style={{
      border: isBlocked ? '1px solid #ef4444' : isPastDeadline ? '1px solid #f59e0b' : '1px solid #3b82f6',
      borderRadius: '10px',
      padding: '1rem',
      background: isBlocked ? '#fef2f2' : isPastDeadline ? '#fffbeb' : '#eff6ff',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f' }}>{contract.name}</div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#374151' }}>
        <span><strong>ID:</strong> {contract.id}</span>
        <span><strong>Category:</strong> {contract.category}</span>
        <span><strong>Status:</strong> {contract.status}</span>
        <span><strong>Closing:</strong> {closingDate ? closingDate.toLocaleDateString() : '—'}</span>
      </div>
      {isBlocked && (
        <p style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
          ⚠ This contract is {contract.status}. Tender submission is not allowed.
        </p>
      )}
      {!isBlocked && isPastDeadline && (
        <p style={{ color: '#b45309', fontSize: '0.82rem', fontWeight: 600 }}>
          ⚠ The closing date has passed. Contact a procurement officer before submitting.
        </p>
      )}
    </div>
  );
}

function TenderFormPage({ mode }) {
  const isEditMode = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [serverError, setServerError] = useState(null);
  const [tenderImageFile, setTenderImageFile] = useState(null);
  // null = show the entry-mode selection screen (create mode only); edit mode skips it.
  const [entryMode, setEntryMode] = useState(isEditMode ? 'manual' : null);

  const {
    data: tender,
    isLoading: isTenderLoading,
    isError: isTenderError,
    error: tenderError,
  } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => getTender(id),
    enabled: isEditMode,
  });

  // Load contracts for the selector (create mode only)
  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    enabled: !isEditMode,
  });

  // Fetch existing tenders once (create mode only) purely to compute the next
  // auto-generated tender_ref_no below - not rendered anywhere itself.
  const { data: existingTendersData } = useQuery({
    queryKey: ['tenders-for-ref-no'],
    queryFn: () => listTenders({ limit: 100 }),
    enabled: !isEditMode,
  });
  const autoTenderRefNo = useMemo(
    () => computeNextTenderRefNo(existingTendersData?.data ?? []),
    [existingTendersData]
  );

  // Pre-fill contractId when arriving from ContractDetailPage's "New Tender" button
  // (navigate('/tenders/new', { state: { contractId } })), and/or other fields when
  // arriving from TenderRecordLookupPage's "Apply to New Tender Form" button
  // (navigate('/tenders/new', { state: { contractId, prefill: { vendor_name, ... } } })).
  const prefilledContractId = location.state?.contractId ?? '';
  const prefill = location.state?.prefill ?? {};
  const todayStr = new Date().toISOString().slice(0, 10);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return { ...CREATE_DEFAULTS, contractId: prefilledContractId, submission_date: todayStr, ...prefill };
    }
    if (!tender) return EDIT_DEFAULTS;
    return {
      contractId: tender.contractId ?? '',
      tender_ref_no: tender.tender_ref_no ?? '',
      vendor_name: tender.vendor_name ?? '',
      submission_date: tender.submission_date ?? '',
      main_offer_price: tender.main_offer_price ?? '',
      alternative_offer_price: tender.alternative_offer_price ?? '',
      paid_up_capital: tender.paid_up_capital ?? '',
      bca_fm01_license_no: tender.bca_fm01_license_no ?? '',
      bca_fm01_grade: tender.bca_fm01_grade ?? '',
      non_debarment_declared: tender.non_debarment_declared ?? false,
    };
  }, [isEditMode, tender, prefilledContractId, todayStr, location.state]);

  const schema = isEditMode ? editTenderSchema : createTenderSchema;
  const isLocked = isEditMode && tender && LOCKED_FOR_EDIT_STATUSES.includes(tender.status);

  const createMutation = useMutation({ mutationFn: createTender });
  const updateMutation = useMutation({ mutationFn: (payload) => updateTender(id, payload) });
  const uploadImageMutation = useMutation({
    mutationFn: ({ tenderId, file }) => uploadTenderImage(tenderId, file),
  });
  const isSubmittingMutation =
    createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, { setFieldError }) => {
      setServerError(null);
      const payload = schema.cast(values, { stripUnknown: true });

      try {
        let tenderId = id;
        if (isEditMode) {
          const updated = await updateMutation.mutateAsync(payload);
          queryClient.invalidateQueries({ queryKey: ['tenders'] });
          queryClient.invalidateQueries({ queryKey: ['tender', id] });
          toast({ title: 'Tender updated', description: `${updated.tender_ref_no} was saved.`, variant: 'success' });
        } else {
          const created = await createMutation.mutateAsync(payload);
          tenderId = created.id;
          queryClient.invalidateQueries({ queryKey: ['tenders'] });
          queryClient.invalidateQueries({ queryKey: ['contract-tenders', payload.contractId] });
          toast({ title: 'Tender created', description: `${created.tender_ref_no} was logged as a draft.`, variant: 'success' });
        }

        if (tenderImageFile) {
          try {
            await uploadImageMutation.mutateAsync({ tenderId, file: tenderImageFile });
            queryClient.invalidateQueries({ queryKey: ['tender', String(tenderId)] });
          } catch (uploadError) {
            const uploadMessage = uploadError.response?.data?.message ?? 'Image upload failed.';
            toast({
              title: 'Tender saved, but image upload failed',
              description: uploadMessage,
              variant: 'destructive',
            });
          }
        }

        navigate(`/tenders/${tenderId}`);
      } catch (error) {
        const message = error.response?.data?.message ?? 'Something went wrong. Please try again.';
        if (error.response?.status === 409 && !isEditMode) {
          setFieldError('tender_ref_no', message);
        }
        setServerError(message);
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
      }
    },
  });

  // Auto-fill tender_ref_no once the next-number lookup resolves. Done via a targeted
  // setFieldValue (not folded into initialValues above) so it can't clobber whatever
  // else the user has already typed if this resolves after they've started the form -
  // enableReinitialize would otherwise reset the whole form back to initialValues.
  // Gated on existingTendersData itself (not just autoTenderRefNo) - before that query
  // resolves, computeNextTenderRefNo([]) already returns a truthy "TC-<year>-001"
  // fallback, which would otherwise get locked in permanently by the
  // !formik.values.tender_ref_no guard below and never update once the real data
  // (and real next sequence number) arrives.
  useEffect(() => {
    if (!isEditMode && existingTendersData && !formik.values.tender_ref_no) {
      formik.setFieldValue('tender_ref_no', autoTenderRefNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTenderRefNo, existingTendersData, isEditMode]);

  // Derive the selected contract object for the info panel
  const selectedContract = !isEditMode
    ? contracts.find((c) => c.id === formik.values.contractId) ?? null
    : tender?.contract ?? null;

  const isContractBlocked = selectedContract && TENDER_SUBMISSION_BLOCKED_STATUSES.includes(selectedContract.status);

  if (!isEditMode && entryMode === null) {
    return (
      <EntryModeSelection
        onSelectManual={() => setEntryMode('manual')}
        onSelectLookup={() => navigate('/tenders/lookup')}
      />
    );
  }

  if (isEditMode && isTenderLoading) {
    return (
      <Card>
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

  if (isEditMode && isTenderError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {tenderError.response?.status === 404
            ? 'Tender not found.'
            : (tenderError.response?.data?.message ?? 'Failed to load tender.')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Card>
        <form onSubmit={formik.handleSubmit} noValidate>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Tender Submission' : 'New Tender Submission'}</CardTitle>
            <CardDescription>
              {isEditMode
                ? 'Correct declared details before evaluation begins.'
                : 'Log a vendor tender package into the system. A Contract Opportunity is required.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tender Document Package (optional)</Label>
              <TenderImageDropzone
                file={tenderImageFile}
                onFileSelect={setTenderImageFile}
                onRemove={() => setTenderImageFile(null)}
                disabled={isLocked || isSubmittingMutation}
              />
            </div>

            {isLocked && (
              <Alert variant="destructive">
                <AlertDescription>
                  This tender's status is &apos;{STATUS_LABELS[tender.status]}&apos; - edits are locked past
                  submission. Raise a clarification instead.
                </AlertDescription>
              </Alert>
            )}
            {serverError && !isLocked && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <fieldset disabled={isLocked} className="flex flex-col gap-4">
              {/* ── Contract Selector (create mode) ───────────────────────── */}
              {!isEditMode && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contractId">Contract Opportunity<Required /></Label>
                  {isContractsLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <NativeSelect
                      id="contractId"
                      name="contractId"
                      value={formik.values.contractId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">— Select a Contract Opportunity —</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.name} [{c.status}]
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                  {formik.touched.contractId && formik.errors.contractId && (
                    <p className="text-xs text-destructive">{formik.errors.contractId}</p>
                  )}
                  {selectedContract && <ContractInfoPanel contract={selectedContract} />}
                </div>
              )}

              {/* ── Edit mode: show linked contract (read-only) ─────────── */}
              {isEditMode && tender?.contract && (
                <div className="flex flex-col gap-1.5">
                  <Label>Linked Contract Opportunity</Label>
                  <ContractInfoPanel contract={tender.contract} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tender_ref_no">Tender Reference No.<Required /></Label>
                  <Input
                    id="tender_ref_no"
                    name="tender_ref_no"
                    placeholder="TC-2026-007"
                    value={formik.values.tender_ref_no}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {!isEditMode && (
                    <p className="text-xs text-muted-foreground">Auto-generated - edit if you need a different reference.</p>
                  )}
                  <FieldError formik={formik} name="tender_ref_no" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendor_name">Vendor Name<Required /></Label>
                  <Input
                    id="vendor_name"
                    name="vendor_name"
                    value={formik.values.vendor_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldError formik={formik} name="vendor_name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="submission_date">Submission Date<Required /></Label>
                  <Input
                    id="submission_date"
                    name="submission_date"
                    type="date"
                    value={formik.values.submission_date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldError formik={formik} name="submission_date" />
                </div>
                <div />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="main_offer_price">Main Offer Price (SGD)<Required /></Label>
                  <Input
                    id="main_offer_price"
                    name="main_offer_price"
                    type="number"
                    step="0.01"
                    value={formik.values.main_offer_price}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldError formik={formik} name="main_offer_price" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="alternative_offer_price">Alternative Offer Price (SGD)</Label>
                  <Input
                    id="alternative_offer_price"
                    name="alternative_offer_price"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formik.values.alternative_offer_price}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldError formik={formik} name="alternative_offer_price" />
                </div>
              </div>

              {/* ── Submission Status / Initial Eligibility (create mode) ─────── */}
              {!isEditMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="status">Submission Status</Label>
                    <NativeSelect
                      id="status"
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      {CREATE_STATUS_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {STATUS_LABELS[value]}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldError formik={formik} name="status" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="eligibility_status">Initial Eligibility Status</Label>
                    <NativeSelect
                      id="eligibility_status"
                      name="eligibility_status"
                      value={formik.values.eligibility_status}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      {CREATE_ELIGIBILITY_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {ELIGIBILITY_STATUS_LABELS[value]}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldError formik={formik} name="eligibility_status" />
                  </div>
                </div>
              )}

              {/* ── Additional Vendor & Compliance Information (create mode) ──── */}
              {!isEditMode && (
                <details className="group rounded-lg border border-border">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold select-none">
                    Additional Vendor & Compliance Information (Optional)
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vendor Verification</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="vendor_uen">Vendor UEN</Label>
                          <Input
                            id="vendor_uen"
                            name="vendor_uen"
                            placeholder="201234567A"
                            value={formik.values.vendor_uen}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          <FieldError formik={formik} name="vendor_uen" />
                        </div>
                        <div />
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="contact_person_name">Contact Person Name</Label>
                          <Input
                            id="contact_person_name"
                            name="contact_person_name"
                            value={formik.values.contact_person_name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          <FieldError formik={formik} name="contact_person_name" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="contact_person_email">Contact Person Email</Label>
                          <Input
                            id="contact_person_email"
                            name="contact_person_email"
                            type="email"
                            value={formik.values.contact_person_email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          <FieldError formik={formik} name="contact_person_email" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commercial Terms</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="proposed_completion_months">Proposed Completion Period (Months)</Label>
                          <Input
                            id="proposed_completion_months"
                            name="proposed_completion_months"
                            type="number"
                            step="1"
                            value={formik.values.proposed_completion_months}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          <FieldError formik={formik} name="proposed_completion_months" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="tender_validity_days">Tender Validity Period (Days)</Label>
                          <Input
                            id="tender_validity_days"
                            name="tender_validity_days"
                            type="number"
                            step="1"
                            value={formik.values.tender_validity_days}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          <FieldError formik={formik} name="tender_validity_days" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compliance &amp; Accreditations</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4 items-start">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="bizsafe_level">bizSAFE Level</Label>
                          <NativeSelect
                            id="bizsafe_level"
                            name="bizsafe_level"
                            value={formik.values.bizsafe_level}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          >
                            {BIZSAFE_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </NativeSelect>
                          <FieldError formik={formik} name="bizsafe_level" />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            id="conflict_of_interest_declared"
                            name="conflict_of_interest_declared"
                            type="checkbox"
                            className="h-4 w-4 rounded border-input"
                            checked={formik.values.conflict_of_interest_declared}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                          <Label htmlFor="conflict_of_interest_declared">Conflict of Interest Declaration</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {isEditMode && (
                <>
                  <div className="mt-2 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold">Eligibility Inputs</h3>
                    <p className="text-xs text-muted-foreground">
                      Normally extracted by AI on submission (UC-A6); correct here if needed.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="paid_up_capital">Paid-Up Capital (SGD)</Label>
                      <Input
                        id="paid_up_capital"
                        name="paid_up_capital"
                        type="number"
                        step="0.01"
                        value={formik.values.paid_up_capital}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <FieldError formik={formik} name="paid_up_capital" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="bca_fm01_license_no">BCA FM01 License No.</Label>
                      <Input
                        id="bca_fm01_license_no"
                        name="bca_fm01_license_no"
                        value={formik.values.bca_fm01_license_no}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <FieldError formik={formik} name="bca_fm01_license_no" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-start">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="bca_fm01_grade">BCA FM01 Grade</Label>
                      <NativeSelect
                        id="bca_fm01_grade"
                        name="bca_fm01_grade"
                        value={formik.values.bca_fm01_grade}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <option value="">Unknown / not extracted</option>
                        {BCA_GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </NativeSelect>
                      <FieldError formik={formik} name="bca_fm01_grade" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id="non_debarment_declared"
                        name="non_debarment_declared"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={formik.values.non_debarment_declared}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <Label htmlFor="non_debarment_declared">Non-debarment declared</Label>
                    </div>
                  </div>
                </>
              )}
            </fieldset>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-2">
            <div>
              {!isEditMode && (
                <Button type="button" variant="ghost" onClick={() => setEntryMode(null)}>
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  formik.isSubmitting ||
                  isSubmittingMutation ||
                  isLocked ||
                  (!isEditMode && !formik.values.contractId) ||
                  isContractBlocked
                }
              >
                {formik.isSubmitting || isSubmittingMutation ? 'Saving...' : 'Save Tender'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TenderFormPage;
