import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// UC-D5: attach a supporting document (e.g. a revised quotation letter) to the
// logged vendor_response message. Cloudinary upload can be slow, so the file
// input is disabled (not just the button) while a request is in flight to
// avoid a duplicate/overlapping upload.
export function AttachmentUploadForm({ onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onUpload(file, () => {
      setFile(null);
      setInputKey((key) => key + 1); // remount to clear the native file input
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="response-attachment">Attach supporting document</Label>
        <Input
          key={inputKey}
          id="response-attachment"
          type="file"
          className="w-64"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          disabled={isUploading}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" variant="outline" disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  );
}
