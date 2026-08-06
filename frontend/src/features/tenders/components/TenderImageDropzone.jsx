import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const DEFAULT_ACCEPT_ATTR = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DEFAULT_HELP_TEXT = 'PDF or DOCX - up to 20MB';
const DEFAULT_ERROR_TEXT = 'Only PDF or DOCX files are supported.';
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file, acceptedTypes, acceptAttr, errorText) {
  // Browsers are inconsistent about the MIME type reported for some formats
  // (xlsx/xls in particular), so accept by MIME type OR by the file extensions
  // listed in acceptAttr (e.g. ".pdf,.docx,...") - whichever matches.
  const matchesType = acceptedTypes.some((type) => {
    if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1));
    return file.type === type;
  });
  const allowedExtensions = acceptAttr
    .split(',')
    .filter((entry) => entry.startsWith('.'))
    .map((entry) => entry.slice(1).toLowerCase());
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const matchesExtension = allowedExtensions.includes(fileExtension);
  if (!matchesType && !matchesExtension) {
    return errorText;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large - maximum size is 20MB.';
  }
  return null;
}

function TenderImageDropzone({
  file,
  onFileSelect,
  onRemove,
  disabled,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  acceptAttr = DEFAULT_ACCEPT_ATTR,
  helpText = DEFAULT_HELP_TEXT,
  errorText = DEFAULT_ERROR_TEXT,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const selected = fileList?.[0];
      if (!selected) return;
      const validationError = validateFile(selected, acceptedTypes, acceptAttr, errorText);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelect(selected);
    },
    [onFileSelect, acceptedTypes, acceptAttr, errorText]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove();
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click();
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50'
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <UploadCloud className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          <span className="text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">{helpText}</p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default TenderImageDropzone;
