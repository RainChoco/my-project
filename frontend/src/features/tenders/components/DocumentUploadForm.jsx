import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FILE_TYPE_VALUES, FILE_TYPE_LABELS } from '../constants';

function DocumentUploadForm({ onUpload, isPending }) {
  const [fileType, setFileType] = useState('main_offer');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onUpload(file, fileType);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-md border border-dashed border-border p-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="upload-file-type">Document type</Label>
        <Select
          id="upload-file-type"
          className="w-44"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
        >
          {FILE_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>
              {FILE_TYPE_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="upload-file">File</Label>
        <Input
          id="upload-file"
          type="file"
          className="w-64"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" disabled={!file || isPending}>
        {isPending ? 'Uploading...' : 'Upload Document'}
      </Button>
    </form>
  );
}

export default DocumentUploadForm;
