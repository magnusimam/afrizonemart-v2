'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { uploadDocument, UploadApiError, type UploadedAsset } from '@/lib/api/uploads';

interface Props {
  /// Current file URL, or empty string if none uploaded yet.
  value: string;
  onChange: (next: string, meta?: { fileSizeBytes: number }) => void;
  emptyHint?: string;
}

/**
 * PDF sibling of `ImageUploader` — single-file, no preview thumbnail
 * (just a filename chip), posts to `/api/uploads/document`. Used by
 * the Civic Library admin form and intern submission form.
 */
export function FileUploader({ value, onChange, emptyHint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [lastAsset, setLastAsset] = useState<UploadedAsset | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadDocument(file);
      setLastAsset(uploaded);
      onChange(uploaded.url, { fileSizeBytes: uploaded.size });
    } catch (e) {
      setError(e instanceof UploadApiError || e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    setLastAsset(null);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-page px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={18} className="shrink-0 text-navy" aria-hidden />
            <span className="truncate font-sans text-sm text-charcoal">
              {lastAsset?.originalName ?? value.split('/').pop()}
            </span>
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove file"
            className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragActive ? 'border-navy bg-navy/5' : 'border-border bg-page'
        }`}
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-navy" aria-hidden />
        ) : (
          <UploadCloud size={22} className="text-navy" aria-hidden />
        )}
        <p className="font-raleway text-sm font-bold text-navy">
          {uploading ? 'Uploading…' : value ? 'Drop a new PDF to replace' : 'Drop a PDF or click to pick'}
        </p>
        <p className="font-sans text-[11px] text-muted">{emptyHint ?? 'PDF only · max 50MB'}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-1 rounded-btn border border-navy bg-white px-4 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pick PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {error && (
        <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
