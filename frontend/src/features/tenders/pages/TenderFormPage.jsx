import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { BCA_GRADES, LOCKED_FOR_EDIT_STATUSES, STATUS_LABELS } from '../constants';
import { createTender, updateTender, getTender, uploadTenderImage } from '../services/tenderApi';

const CREATE_DEFAULTS = {
  tender_ref_no: '',
  vendor_name: '',
  submission_date: '',
  main_offer_price: '',
  alternative_offer_price: '',
};

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

function TenderFormPage({ mode }) {
  const isEditMode = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [serverError, setServerError] = useState(null);
  const [tenderImageFile, setTenderImageFile] = useState(null);

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

  const initialValues = useMemo(() => {
    if (!isEditMode) return CREATE_DEFAULTS;
    if (!tender) return EDIT_DEFAULTS;
    return {
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
  }, [isEditMode, tender]);

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
                : 'Log a vendor tender package into the system.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tender Document / Image (optional)</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tender_ref_no">Tender Reference No.</Label>
                  <Input
                    id="tender_ref_no"
                    name="tender_ref_no"
                    placeholder="TC-2026-007"
                    value={formik.values.tender_ref_no}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <FieldError formik={formik} name="tender_ref_no" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vendor_name">Vendor Name</Label>
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
                  <Label htmlFor="submission_date">Submission Date</Label>
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
                  <Label htmlFor="main_offer_price">Main Offer Price (SGD)</Label>
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

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting || isSubmittingMutation || isLocked}>
              {formik.isSubmitting || isSubmittingMutation ? 'Saving...' : 'Save Tender'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default TenderFormPage;
