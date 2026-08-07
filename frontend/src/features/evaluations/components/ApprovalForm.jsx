import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
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
import { cn } from '../../../lib';

const CONFIRM_COPY = {
  approved: {
    title: 'Approve this evaluation?',
    description: "This will record the manager's approval decision for this tender evaluation.",
    confirmLabel: 'Approve Evaluation',
  },
  rejected: {
    title: 'Reject this evaluation?',
    description: "This will record the manager's rejection decision. The reason will be kept in the decision history.",
    confirmLabel: 'Reject Evaluation',
  },
};

// UC-B9: management's go/no-go decision on a fully-scored evaluation. The
// backend still accepts a third 'revision_requested' decision (see
// approvalService.js) but this decision form only exposes approve/reject.
export function ApprovalForm({ onSubmit, isSubmitting, submitError }) {
  const [remarks, setRemarks] = useState('');
  const [rejectError, setRejectError] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null); // 'approved' | 'rejected' | null

  const handleRejectClick = () => {
    if (!remarks.trim()) {
      setRejectError('Please provide a reason for rejecting this evaluation.');
      return;
    }
    setRejectError(null);
    setPendingDecision('rejected');
  };

  const handleApproveClick = () => {
    setRejectError(null);
    setPendingDecision('approved');
  };

  const handleConfirm = async () => {
    try {
      await onSubmit({ decision: pendingDecision, remarks: remarks.trim() || undefined });
      setRemarks('');
    } finally {
      // Close the dialog whether the call succeeded or failed - previously
      // a failed submission (e.g. a permissions error) left the dialog stuck
      // open with the error message hidden behind it, making it look like
      // the button silently did nothing.
      setPendingDecision(null);
    }
  };

  const copy = pendingDecision ? CONFIRM_COPY[pendingDecision] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manager-remarks">Manager Remarks</Label>
        <Textarea
          id="manager-remarks"
          rows={3}
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            if (rejectError) setRejectError(null);
          }}
          placeholder="Add remarks for this decision (required when rejecting)"
        />
        {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={isSubmitting}
          onClick={handleApproveClick}
        >
          Approve Evaluation
        </Button>
        <Button variant="destructive" disabled={isSubmitting} onClick={handleRejectClick}>
          Reject Evaluation
        </Button>
      </div>

      <AlertDialog open={Boolean(pendingDecision)} onOpenChange={(open) => !isSubmitting && !open && setPendingDecision(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                buttonVariants({ variant: pendingDecision === 'rejected' ? 'destructive' : 'default' }),
                pendingDecision === 'approved' && 'bg-green-600 hover:bg-green-700'
              )}
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
