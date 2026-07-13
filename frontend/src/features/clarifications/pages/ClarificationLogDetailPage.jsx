import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ClarificationStatusBadge, LogTypeBadge, ApprovalStatusBadge } from '../components/StatusBadge';
import { EditDraftForm } from '../components/EditDraftForm';
import { SendForm } from '../components/SendForm';
import { RecordResponseForm } from '../components/RecordResponseForm';
import { AttachmentUploadForm } from '../components/AttachmentUploadForm';
import { ResolveForm } from '../components/ResolveForm';
import { JobAdjustmentRequestForm } from '../components/JobAdjustmentRequestForm';
import { ActionMessage } from '../components/ActionMessage';
import { useActionMessage, getErrorMessage } from '../hooks/useActionMessage';
import { MESSAGE_TYPE_LABELS } from '../constants';
import {
  getClarificationLog,
  draftMessage,
  editMessage,
  approveMessage,
  sendClarification,
  recordResponse,
  addAttachment,
  resendClarification,
  escalateClarification,
  resolveClarification,
} from '../services/clarificationApi';
import { createJobAdjustmentRequest } from '../services/jobAdjustmentApi';
import { useAuth } from '@/context';
import { ROLES } from '@/routes/routeConfig';

const ACTION_ROLES = [ROLES.MA_STAFF, ROLES.VENDOR_LIAISON];

// UC-D2-D9: the full clarification log thread and every lifecycle action against
// it - draft, edit, approve, send, record vendor response + attachment, resend/
// escalate, resolve, and (UC-D7) job adjustment requests raised off a response.
export default function ClarificationLogDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, showSuccess } = useActionMessage();

  const [draftError, setDraftError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [approveError, setApproveError] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [resolveError, setResolveError] = useState(null);
  const [jarError, setJarError] = useState(null);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const canAct = ACTION_ROLES.includes(role);
  const canCreateJar = role === ROLES.VENDOR_LIAISON;

  const logQuery = useQuery({
    queryKey: ['clarification-log', id],
    queryFn: () => getClarificationLog(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clarification-log', id] });

  const draftMutation = useMutation({
    mutationFn: () => draftMessage(id),
    onSuccess: () => {
      invalidate();
      setDraftError(null);
      showSuccess('Draft message generated - review it below before approving.');
    },
    onError: (err) => setDraftError(getErrorMessage(err, 'ChatGPT could not generate a draft. You can retry or write the message manually.')),
  });

  const saveMutation = useMutation({
    mutationFn: ({ messageId, payload }) => editMessage(messageId, payload),
    onSuccess: () => {
      invalidate();
      setSaveError(null);
      showSuccess('Draft updated.');
    },
    onError: (err) => setSaveError(getErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: (messageId) => approveMessage(messageId),
    onSuccess: () => {
      invalidate();
      setApproveError(null);
      showSuccess('Draft approved for dispatch.');
    },
    onError: (err) => setApproveError(getErrorMessage(err)),
  });

  const sendMutation = useMutation({
    mutationFn: (dispatchChannel) => sendClarification(id, dispatchChannel),
    onSuccess: () => {
      invalidate();
      setSendError(null);
      showSuccess('Message sent to the vendor.');
    },
    onError: (err) => setSendError(getErrorMessage(err)),
  });

  const responseMutation = useMutation({
    mutationFn: (payload) => recordResponse(id, payload),
    onSuccess: () => {
      invalidate();
      setResponseError(null);
      showSuccess('Vendor response recorded.');
    },
    onError: (err) => setResponseError(getErrorMessage(err)),
  });

  const attachmentMutation = useMutation({
    mutationFn: ({ messageId, file }) => addAttachment(messageId, file),
    onSuccess: () => {
      invalidate();
      showSuccess('Attachment uploaded.');
    },
    onError: (err) => {
      // Surfaced via the page-level banner since there's no dedicated field for it.
      setResponseError(getErrorMessage(err, 'Cloudinary upload failed.'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendClarification(id),
    onSuccess: () => {
      invalidate();
      showSuccess('Reminder sent - the follow-up window has been reset.');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () => escalateClarification(id),
    onSuccess: () => {
      invalidate();
      setEscalateOpen(false);
      showSuccess('Log escalated to MA procurement staff.');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (outcomeNotes) => resolveClarification(id, outcomeNotes),
    onSuccess: () => {
      invalidate();
      setResolveError(null);
      showSuccess('Log resolved and locked.');
    },
    onError: (err) => setResolveError(getErrorMessage(err)),
  });

  const jarMutation = useMutation({
    mutationFn: ({ sourceMessageId, values }) =>
      createJobAdjustmentRequest(id, {
        source_message_id: sourceMessageId,
        description: values.description,
        justification: values.justification,
        is_material: values.is_material,
      }),
    onSuccess: () => {
      invalidate();
      setJarError(null);
      showSuccess('Job adjustment request logged.');
    },
    onError: (err) => setJarError(getErrorMessage(err)),
  });

  if (logQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (logQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {logQuery.error?.response?.status === 404
            ? 'No clarification log found with that id.'
            : getErrorMessage(logQuery.error, 'Failed to load this clarification log.')}
        </p>
        <Button variant="outline" onClick={() => logQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const log = logQuery.data;
  const messages = log.messages ?? [];
  const jobAdjustmentRequests = log.job_adjustment_requests ?? [];
  const latestDraft = [...messages].reverse().find((m) => m.message_type === 'draft');
  const latestVendorResponse = [...messages].reverse().find((m) => m.message_type === 'vendor_response');
  const isOverdue = log.follow_up_due_at && new Date(log.follow_up_due_at) < new Date();

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="self-start" onClick={() => navigate('/clarifications')}>
        <ArrowLeft className="h-4 w-4" />
        Back to clarifications
      </Button>

      <ActionMessage message={message} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clarification log #{log.id}</h1>
          <p className="text-sm text-muted-foreground">Tender #{log.tender_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <LogTypeBadge logType={log.log_type} />
          <ClarificationStatusBadge status={log.status} />
        </div>
      </div>

      {isOverdue && log.status === 'sent' && (
        <Alert className="border-amber-500 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overdue</AlertTitle>
          <AlertDescription>
            No vendor response since {log.follow_up_due_at} - resend a reminder or escalate to MA procurement staff.
          </AlertDescription>
        </Alert>
      )}

      {log.log_type === 'pricing_deviation' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing deviation</CardTitle>
            <CardDescription>Snapshot taken when this log was created - not re-derived from the live tender.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Main offer</p>
              <p className="text-lg font-semibold">{log.main_offer_price_snapshot ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alternative offer</p>
              <p className="text-lg font-semibold">{log.alternative_offer_price_snapshot ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deviation</p>
              <p className="text-lg font-semibold">
                {log.deviation_amount ?? '-'} ({log.deviation_percentage ?? '-'}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Follow-up due</p>
              <p className="text-lg font-semibold">{log.follow_up_due_at ?? '-'}</p>
            </div>
          </CardContent>
          {log.ai_rationale && (
            <>
              <Separator />
              <CardContent className="flex items-start gap-2 pt-6">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{log.ai_rationale}</p>
              </CardContent>
            </>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message thread</CardTitle>
          <CardDescription>Draft, sent, reminder, and vendor response messages - oldest first, append-only.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{MESSAGE_TYPE_LABELS[m.message_type] ?? m.message_type}</Badge>
                    {m.ai_generated && <Badge variant="secondary">AI-generated</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                {m.subject && <p className="text-sm font-medium">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                {m.sent_at && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sent {new Date(m.sent_at).toLocaleString()} via {m.dispatch_channel}
                  </p>
                )}
                {m.approved_at && (
                  <p className="mt-1 text-xs text-muted-foreground">Approved {new Date(m.approved_at).toLocaleString()}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {canAct && log.status === 'flagged' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Draft a clarification message</CardTitle>
            <CardDescription>ChatGPT drafts an official request asking the vendor to confirm or justify the deviation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => { setDraftError(null); draftMutation.mutate(); }} disabled={draftMutation.isPending}>
              {draftMutation.isPending ? 'Generating...' : 'Draft clarification message'}
            </Button>
            {draftError && <p className="mt-2 text-sm text-destructive">{draftError}</p>}
          </CardContent>
        </Card>
      )}

      {canAct && log.status === 'draft_ready' && latestDraft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review & edit draft</CardTitle>
            <CardDescription>Correct tone, figures, or add context before approving it for dispatch.</CardDescription>
          </CardHeader>
          <CardContent>
            <EditDraftForm
              message={latestDraft}
              isSaving={saveMutation.isPending}
              isApproving={approveMutation.isPending}
              saveError={saveError}
              approveError={approveError}
              onSave={(payload) => saveMutation.mutateAsync({ messageId: latestDraft.id, payload })}
              onApprove={() => approveMutation.mutate(latestDraft.id)}
            />
          </CardContent>
        </Card>
      )}

      {canAct && log.status === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send to vendor</CardTitle>
            <CardDescription>Dispatch the approved message to the vendor's registered contact.</CardDescription>
          </CardHeader>
          <CardContent>
            <SendForm
              isSubmitting={sendMutation.isPending}
              submitError={sendError}
              onSubmit={(dispatchChannel) => sendMutation.mutateAsync(dispatchChannel)}
            />
          </CardContent>
        </Card>
      )}

      {canAct && log.status === 'sent' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record vendor response</CardTitle>
              <CardDescription>Log the vendor's reply once they've confirmed, revised, or justified the deviation.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecordResponseForm
                isSubmitting={responseMutation.isPending}
                submitError={responseError}
                onSubmit={(payload) => responseMutation.mutateAsync(payload)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">No response yet?</CardTitle>
              <CardDescription>Resend a reminder, or escalate to MA procurement staff if the deadline is imminent.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
                <RotateCcw className="h-4 w-4" />
                {resendMutation.isPending ? 'Resending...' : 'Resend reminder'}
              </Button>
              <Button variant="destructive" onClick={() => setEscalateOpen(true)}>
                Escalate
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {log.status === 'responded' && latestVendorResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments</CardTitle>
            <CardDescription>Attach supporting documents (e.g. a revised quotation letter) to the vendor's response.</CardDescription>
          </CardHeader>
          <CardContent>
            {canAct && (
              <AttachmentUploadForm
                isUploading={attachmentMutation.isPending}
                onUpload={(file, onDone) =>
                  attachmentMutation.mutate(
                    { messageId: latestVendorResponse.id, file },
                    { onSuccess: () => onDone?.() }
                  )
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {canCreateJar && log.status === 'responded' && latestVendorResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log a job adjustment request</CardTitle>
            <CardDescription>If the vendor's response implies a scope/timeline/terms change, record it here.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobAdjustmentRequestForm
              isSubmitting={jarMutation.isPending}
              submitError={jarError}
              onSubmit={(values) => jarMutation.mutateAsync({ sourceMessageId: latestVendorResponse.id, values })}
            />
          </CardContent>
        </Card>
      )}

      {jobAdjustmentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job adjustment requests</CardTitle>
            <CardDescription>Scope/timeline/terms changes raised off this log's vendor response.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {jobAdjustmentRequests.map((jar) => (
              <div key={jar.id} className="rounded-md border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <ApprovalStatusBadge status={jar.approval_status} />
                  {jar.is_material && <Badge variant="outline">Material</Badge>}
                </div>
                <p className="text-sm">{jar.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{jar.justification}</p>
                {jar.follow_up_clarification_log_id && (
                  <Button
                    variant="link"
                    className="mt-1 h-auto p-0"
                    onClick={() => navigate(`/clarifications/${jar.follow_up_clarification_log_id}`)}
                  >
                    View follow-up notification (log #{jar.follow_up_clarification_log_id})
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Approve/reject material requests and send the follow-up notification from the Job Adjustments page.
            </p>
          </CardContent>
        </Card>
      )}

      {canAct && ['responded', 'escalated'].includes(log.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolve this log</CardTitle>
            <CardDescription>Close it once the vendor response (and any resulting adjustment) has been reviewed.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResolveForm
              isSubmitting={resolveMutation.isPending}
              submitError={resolveError}
              onSubmit={(outcomeNotes) => resolveMutation.mutateAsync(outcomeNotes)}
            />
          </CardContent>
        </Card>
      )}

      {log.status === 'resolved' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution</CardTitle>
            <CardDescription>This log is locked from further edits.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{log.outcome_notes}</p>
            <p className="mt-2 text-xs text-muted-foreground">Resolved {new Date(log.resolved_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escalate this log?</AlertDialogTitle>
            <AlertDialogDescription>
              This notifies MA procurement staff directly - use it when the tender's evaluation deadline is imminent
              and the vendor still hasn't responded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={escalateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => escalateMutation.mutate()} disabled={escalateMutation.isPending}>
              {escalateMutation.isPending ? 'Escalating...' : 'Escalate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
