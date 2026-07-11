import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge, EligibilityBadge } from '../components/TenderStatusBadges';
import EligibilityChecksTable from '../components/EligibilityChecksTable';
import DocumentsManager from '../components/DocumentsManager';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';
import OverrideCheckDialog from '../components/OverrideCheckDialog';
import {
  getTender,
  listTenderDocuments,
  listEligibilityChecks,
  deleteTender,
  triggerEligibilityCheck,
  overrideEligibilityCheck,
} from '../services/tenderApi';
import { formatCurrency, formatDate } from '../utils/format';
import { LOCKED_FOR_EDIT_STATUSES, LOCKED_FOR_DELETE_STATUSES } from '../constants';

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  );
}

function TenderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);

  const canManage = role === 'ma_staff';
  const canOverride = role === 'ma_staff' || role === 'evaluator';

  const {
    data: tender,
    isLoading: isTenderLoading,
    isError: isTenderError,
    error: tenderError,
  } = useQuery({ queryKey: ['tender', id], queryFn: () => getTender(id) });

  const { data: documents, isLoading: isDocumentsLoading } = useQuery({
    queryKey: ['tender-documents', id],
    queryFn: () => listTenderDocuments(id),
    enabled: Boolean(tender),
  });

  const { data: checks, isLoading: isChecksLoading } = useQuery({
    queryKey: ['eligibility-checks', id],
    queryFn: () => listEligibilityChecks(id),
    enabled: Boolean(tender),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTender(id),
    onSuccess: () => {
      toast({ title: 'Tender deleted', description: `${tender.tender_ref_no} was removed.`, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      navigate('/tenders');
    },
    onError: (err) => {
      toast({
        title: 'Could not delete tender',
        description: err.response?.data?.message ?? 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setConfirmDelete(false);
    },
  });

  const triggerEligibilityMutation = useMutation({
    mutationFn: () => triggerEligibilityCheck(id),
    onSuccess: (result) => {
      toast({
        title: 'Eligibility check complete',
        description: result.ai_eligibility_summary,
        variant: result.eligibility_status === 'eligible' ? 'success' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['tender', id] });
      queryClient.invalidateQueries({ queryKey: ['eligibility-checks', id] });
    },
    onError: (err) => {
      toast({
        title: 'Eligibility check failed',
        description: err.response?.data?.message ?? 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: ({ checkId, ...payload }) => overrideEligibilityCheck(checkId, payload),
    onSuccess: () => {
      toast({ title: 'Eligibility check updated', description: 'Manual override recorded.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['eligibility-checks', id] });
      queryClient.invalidateQueries({ queryKey: ['tender', id] });
      setOverrideTarget(null);
    },
    onError: (err) => {
      toast({
        title: 'Override failed',
        description: err.response?.data?.message ?? 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  if (isTenderLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isTenderError) {
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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/tenders" className="text-sm text-muted-foreground hover:underline">
            &larr; Back to tenders
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{tender.tender_ref_no}</h1>
          <p className="text-sm text-muted-foreground">{tender.vendor_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={tender.status} />
          <EligibilityBadge eligibilityStatus={tender.eligibility_status} />
        </div>
      </div>

      {canManage && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={LOCKED_FOR_EDIT_STATUSES.includes(tender.status)}
            onClick={() => navigate(`/tenders/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled={LOCKED_FOR_DELETE_STATUSES.includes(tender.status)}
            onClick={() => setConfirmDelete(true)}
          >
            Withdraw / Delete
          </Button>
        </div>
      )}

      {tender.ai_eligibility_summary && (
        <Alert>
          <AlertDescription>{tender.ai_eligibility_summary}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Submission Date" value={formatDate(tender.submission_date)} />
          <Field label="Main Offer Price" value={formatCurrency(tender.main_offer_price)} />
          <Field label="Alternative Offer Price" value={formatCurrency(tender.alternative_offer_price)} />
          <Field label="Paid-Up Capital" value={formatCurrency(tender.paid_up_capital)} />
          <Field label="BCA FM01 License No." value={tender.bca_fm01_license_no} />
          <Field label="BCA FM01 Grade" value={tender.bca_fm01_grade} />
          <Field label="Non-Debarment Declared" value={tender.non_debarment_declared ? 'Yes' : 'No'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>All uploaded versions, including superseded ones.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentsManager tenderId={id} documents={documents} isLoading={isDocumentsLoading} canManage={canManage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Eligibility Check Breakdown</CardTitle>
            <CardDescription>Why this tender is {tender.eligibility_status}.</CardDescription>
          </div>
          {canManage && (
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={() => triggerEligibilityMutation.mutate()}
                disabled={triggerEligibilityMutation.isPending || (documents?.length ?? 0) === 0}
              >
                {triggerEligibilityMutation.isPending ? 'Running...' : 'Run Eligibility Check'}
              </Button>
              {documents && documents.length === 0 && (
                <p className="text-xs text-muted-foreground">Upload at least one document first.</p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <EligibilityChecksTable
            checks={checks}
            isLoading={isChecksLoading}
            canOverride={canOverride}
            onOverrideRequest={setOverrideTarget}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        tender={confirmDelete ? tender : null}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />

      <OverrideCheckDialog
        check={overrideTarget}
        isPending={overrideMutation.isPending}
        onCancel={() => setOverrideTarget(null)}
        onSubmit={(payload) => overrideMutation.mutate({ checkId: overrideTarget.id, ...payload })}
      />
    </div>
  );
}

export default TenderDetailPage;
