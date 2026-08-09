import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanSearch, FileSpreadsheet, FileImage, FileText, FileType2,
  Trash2, Sparkles, ChevronDown, CheckCircle2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ELIGIBILITY_STATUS_LABELS, ELIGIBILITY_BADGE_VARIANTS } from '../constants';
import { formatCurrency, formatDate } from '../utils/format';
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

const SAMPLE_FORMAT_CHIPS = [
  { icon: FileSpreadsheet, label: 'Past Pricing Spreadsheets (.xlsx)' },
  { icon: FileImage, label: 'Vendor Proposal Scans (.png, .jpg)' },
  { icon: FileText, label: 'Formal Tender Contracts (.pdf, .docx)' },
];

// No OCR/AI extraction service is wired up in the backend yet - this is a fixed,
// simulated result standing in for that pipeline so the staging → review preview
// flow can be demoed end to end. "Use Extracted Data" hands these values to the
// New Tender Submission form as a prefill (see TenderFormPage's `prefill` handling)
// rather than writing them to the tenders table directly - the user still has to
// review/edit and explicitly save from there, so nothing simulated reaches the
// database unreviewed. Swap SIMULATED_EXTRACTED_FIELDS for a real extraction
// endpoint's response once one exists; the handoff below doesn't need to change.
const SIMULATED_EXTRACTED_FIELDS = {
  vendor_name: 'Cana Construction Pte Ltd',
  main_offer_price: 1250000,
  eligibility_status: 'eligible',
  contractId: 'CTR-PRPGTC-RR-22-001',
  submission_date: '2026-07-10',
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeMeta(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['xlsx', 'xls'].includes(ext)) {
    return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excel Spreadsheet' };
  }
  if (ext === 'pdf') {
    return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF Document' };
  }
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return { icon: FileImage, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Scanned Image' };
  }
  if (ext === 'docx') {
    return { icon: FileType2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Word Document' };
  }
  return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Document' };
}

// The upload dropzone is fully interactive - selecting a file stages it locally, and
// "Extract Data" simulates OCR/AI extraction (see SIMULATED_EXTRACTED_FIELDS) until a
// real extraction service is wired up.
function TenderRecordLookupPage() {
  const navigate = useNavigate();
  const [stagedFile, setStagedFile] = useState(null);
  // 'idle' -> 'extracting' -> 'extracted', reset whenever the staged file changes.
  const [extractionStatus, setExtractionStatus] = useState('idle');
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const extractTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(extractTimeoutRef.current), []);

  const handleFileSelect = (file) => {
    setStagedFile(file);
    setExtractionStatus('idle');
  };

  const handleRemoveFile = () => {
    clearTimeout(extractTimeoutRef.current);
    setStagedFile(null);
    setExtractionStatus('idle');
  };

  const handleExtract = () => {
    setExtractionStatus('extracting');
    setIsPreviewOpen(true);
    extractTimeoutRef.current = setTimeout(() => setExtractionStatus('extracted'), 900);
  };

  const handleUseExtractedData = () => {
    navigate('/tenders/new', {
      state: {
        contractId: SIMULATED_EXTRACTED_FIELDS.contractId,
        prefill: {
          vendor_name: SIMULATED_EXTRACTED_FIELDS.vendor_name,
          main_offer_price: SIMULATED_EXTRACTED_FIELDS.main_offer_price,
          eligibility_status: SIMULATED_EXTRACTED_FIELDS.eligibility_status,
          submission_date: SIMULATED_EXTRACTED_FIELDS.submission_date,
        },
      },
    });
  };

  const typeMeta = stagedFile ? getFileTypeMeta(stagedFile) : null;
  const TypeIcon = typeMeta?.icon;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-primary" />
            <CardTitle>Past Document AI / OCR Extraction</CardTitle>
          </div>
          <CardDescription>
            Upload a past tender package, scanned document, or spreadsheet. AI will scan and extract the historical
            tender details to auto-fill a new submission.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* ── Upload + Staging ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <Label>Upload Document / Spreadsheet / Scan</Label>
            <TenderImageDropzone
              file={null}
              onFileSelect={handleFileSelect}
              onRemove={() => {}}
              acceptedTypes={OCR_ACCEPTED_TYPES}
              acceptAttr={OCR_ACCEPT_ATTR}
              helpText={OCR_HELP_TEXT}
              errorText={OCR_ERROR_TEXT}
            />

            {stagedFile && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', typeMeta.bg)}>
                    <TypeIcon className={cn('h-6 w-6', typeMeta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{stagedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(stagedFile.size)} &middot; {typeMeta.label}
                    </p>
                  </div>
                  {extractionStatus === 'extracted' ? (
                    <Badge variant="success" className="shrink-0 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Extracted
                    </Badge>
                  ) : extractionStatus === 'extracting' ? (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Extracting...
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="shrink-0">Staged for Extraction</Badge>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveFile}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#E31E24] text-white hover:bg-[#c01a1f]"
                    onClick={handleExtract}
                    disabled={extractionStatus !== 'idle'}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {extractionStatus === 'idle' && 'Extract Data'}
                    {extractionStatus === 'extracting' && 'Extracting...'}
                    {extractionStatus === 'extracted' && 'Extracted'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Extracted Data Preview ───────────────────────────────────── */}
          {extractionStatus !== 'idle' && (
            <div className="flex flex-col gap-3 border-t pt-5">
              <button
                type="button"
                onClick={() => setIsPreviewOpen((prev) => !prev)}
                className="flex items-center justify-between text-left"
              >
                <span className="text-sm font-semibold text-foreground">Extracted Tender Data Preview</span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isPreviewOpen && 'rotate-180')} />
              </button>

              {isPreviewOpen && (
                extractionStatus === 'extracting' ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Running OCR / AI extraction on {stagedFile?.name}...
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Simulated preview - no extraction service is connected yet. Values below are illustrative.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground">Vendor Name</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                          {SIMULATED_EXTRACTED_FIELDS.vendor_name}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground">Main Offer Price (SGD)</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                          {formatCurrency(SIMULATED_EXTRACTED_FIELDS.main_offer_price)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground">Eligibility Status</div>
                        <Badge
                          variant={ELIGIBILITY_BADGE_VARIANTS[SIMULATED_EXTRACTED_FIELDS.eligibility_status]}
                          className="mt-1"
                        >
                          {ELIGIBILITY_STATUS_LABELS[SIMULATED_EXTRACTED_FIELDS.eligibility_status]}
                        </Badge>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground">Contract Opportunity</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-foreground">
                          {SIMULATED_EXTRACTED_FIELDS.contractId}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-xs font-medium text-muted-foreground">Submission Date</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                          {formatDate(SIMULATED_EXTRACTED_FIELDS.submission_date)}
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* ── Supported Formats & Examples ─────────────────────────────── */}
          <div className="flex flex-col gap-2.5 border-t pt-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Supported Formats &amp; Examples
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {SAMPLE_FORMAT_CHIPS.map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                  >
                    <ChipIcon className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    {chip.label}
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => navigate('/tenders/new')}>
            Back
          </Button>
          <Button
            type="button"
            className="bg-[#E31E24] text-white hover:bg-[#c01a1f]"
            disabled={extractionStatus !== 'extracted'}
            title={
              extractionStatus !== 'extracted'
                ? 'Extract data from an uploaded document first.'
                : 'Opens New Tender Submission with these values pre-filled for your review.'
            }
            onClick={handleUseExtractedData}
          >
            Use Extracted Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default TenderRecordLookupPage;
