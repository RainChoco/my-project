import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TenderImageDropzone from '../components/TenderImageDropzone';

// Past tender records may show up as a spreadsheet export, a scanned image, or the
// original PDF/Word package - so this lookup accepts a broader format set than the
// New Tender Submission upload, which only takes a fresh PDF/DOCX package.
const OCR_ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/*',
];
const OCR_ACCEPT_ATTR =
  '.xlsx,.xls,.png,.jpg,.jpeg,.webp,.pdf,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,image/*';
const OCR_HELP_TEXT = 'Excel, PDF, Word, or Scanned Image (PNG, JPG) - up to 20MB';
const OCR_ERROR_TEXT = 'Only Excel, PDF, Word, or image (PNG/JPG/WEBP) files are supported.';

// Reference lookup by tender number isn't wired up in the backend yet, so that
// field stays disabled. The upload dropzone below is otherwise fully interactive -
// selecting a file just stages it locally until OCR/AI extraction is wired up.
function TenderRecordLookupPage() {
  const navigate = useNavigate();
  const [refNo, setRefNo] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <CardTitle>Existing / Past Record Lookup (OCR Upload)</CardTitle>
          </div>
          <CardDescription>
            Upload an existing tender package, scanned document, or spreadsheet for OCR / AI data extraction.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <Alert>
            <AlertDescription>
              Uploaded files below are staged for OCR / AI data extraction to help pre-fill this tender&apos;s
              details. Reference number lookup isn&apos;t wired up yet - use &quot;New Tender Submission&quot; for
              manual entry in the meantime.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lookup-ref-no">Tender Reference Number</Label>
            <div className="flex gap-2">
              <Input
                id="lookup-ref-no"
                placeholder="TC-2026-007"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                disabled
              />
              <Button type="button" variant="outline" disabled>
                Look Up
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Upload Document / Spreadsheet / Scan</Label>
            <TenderImageDropzone
              file={uploadedFile}
              onFileSelect={setUploadedFile}
              onRemove={() => setUploadedFile(null)}
              acceptedTypes={OCR_ACCEPTED_TYPES}
              acceptAttr={OCR_ACCEPT_ATTR}
              helpText={OCR_HELP_TEXT}
              errorText={OCR_ERROR_TEXT}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => navigate('/tenders/new')}>
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default TenderRecordLookupPage;
