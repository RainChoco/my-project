import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TenderImageDropzone from '../components/TenderImageDropzone';

// Placeholder destination for the "Existing / Past Record (OCR Upload)" entry option
// on TenderFormPage's mode-selection screen. No reference lookup or OCR extraction
// exists in the backend yet, so the inputs below are intentionally non-functional -
// this just reserves the route/UI shape until that work is scoped.
function TenderRecordLookupPage() {
  const navigate = useNavigate();
  const [refNo, setRefNo] = useState('');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <CardTitle>Existing / Past Record Lookup (OCR Upload)</CardTitle>
          </div>
          <CardDescription>
            Look up a past tender by reference number, or upload an existing document package for OCR extraction.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <Alert>
            <AlertDescription>
              Coming soon - reference lookup and OCR extraction aren&apos;t wired up yet. Use &quot;New Tender
              Submission&quot; for manual entry in the meantime.
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
            <Label>Upload Document / PDF Package</Label>
            <TenderImageDropzone file={null} onFileSelect={() => {}} onRemove={() => {}} disabled />
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
