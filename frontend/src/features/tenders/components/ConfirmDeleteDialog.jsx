import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function ConfirmDeleteDialog({ tender, isPending, onConfirm, onCancel }) {
  return (
    <Dialog open={Boolean(tender)} onOpenChange={(open) => !open && onCancel()}>
      {tender && (
        <DialogContent onClose={onCancel}>
          <DialogHeader>
            <DialogTitle>Withdraw / delete tender</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{tender.tender_ref_no}</strong> ({tender.vendor_name}) along with
              its documents and eligibility checks. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete tender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default ConfirmDeleteDialog;
