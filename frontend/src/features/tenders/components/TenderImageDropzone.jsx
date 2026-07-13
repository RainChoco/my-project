import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mirrors backend/src/controllers/tenderController.js#uploadTenderImage (image/* only)
// and backend/src/middlewares/upload.js's 20MB multer limit.
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only PDF, PNG, JPEG, or WEBP files are supported.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large - maximum size is 20MB.';
  }
  return null;
}

function TenderImageDropzone({ file, onFileSelect, onRemove, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFiles = useCallback(
    (fileList) => {
      const selected = fileList?.[0];
      if (!selected) return;
      const validationError = validateFile(selected);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelect(selected);
    },
    [onFileSelect]
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
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
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
        <p className="text-xs text-muted-foreground">PDF, PNG, JPEG, or WEBP - up to 20MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
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
