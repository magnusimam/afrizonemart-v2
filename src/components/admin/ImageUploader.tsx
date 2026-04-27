'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage, UploadApiError, type UploadFolder } from '@/lib/api/uploads';

interface MultiProps {
  multi: true;
  value: string[];
  onChange: (next: string[]) => void;
  folder?: UploadFolder;
  reorder?: boolean;
  emptyHint?: string;
}

interface SingleProps {
  multi?: false;
  value: string;
  onChange: (next: string) => void;
  folder?: UploadFolder;
  emptyHint?: string;
}

type Props = MultiProps | SingleProps;

/**
 * Drag-drop or click-to-pick image uploader. Posts each file to the
 * generic /api/uploads endpoint and stores the returned URL(s) in the
 * caller's state. Same component used for product galleries
 * (multi-image), about-section image (single), category covers, etc.
 */
export function ImageUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const isMulti = props.multi === true;
  const folder: UploadFolder = props.folder ?? 'misc';
  const urls = isMulti ? props.value : props.value ? [props.value] : [];

  const setUrls = (next: string[]) => {
    if (isMulti) (props as MultiProps).onChange(next);
    else (props as SingleProps).onChange(next[0] ?? '');
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploading((n) => n + list.length);

    const results: string[] = [];
    for (const file of list) {
      try {
        const uploaded = await uploadImage(file, folder);
        results.push(uploaded.url);
        if (!isMulti) break; // single mode replaces with first file only
      } catch (e) {
        setError(
          e instanceof UploadApiError || e instanceof Error
            ? e.message
            : 'Upload failed',
        );
      } finally {
        setUploading((n) => n - 1);
      }
    }

    if (results.length > 0) {
      setUrls(isMulti ? [...urls, ...results] : [results[0]]);
    }
  };

  const remove = (idx: number) => setUrls(urls.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...urls];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setUrls(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {urls.length > 0 && (
        <ul
          className={`grid gap-2 ${isMulti ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 max-w-xs'}`}
        >
          {urls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-card border border-border bg-page"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="160px"
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-charcoal/55 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {isMulti && (props as MultiProps).reorder !== false ? (
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move left"
                      className="rounded bg-white/90 p-1 text-charcoal disabled:opacity-30"
                    >
                      <ChevronUp size={12} aria-hidden className="rotate-[-90deg]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === urls.length - 1}
                      aria-label="Move right"
                      className="rounded bg-white/90 p-1 text-charcoal disabled:opacity-30"
                    >
                      <ChevronDown size={12} aria-hidden className="rotate-[-90deg]" />
                    </button>
                  </div>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove image"
                  className="rounded bg-danger p-1 text-white"
                >
                  <Trash2 size={12} aria-hidden />
                </button>
              </div>
              {i === 0 && isMulti && (
                <span className="absolute bottom-1 left-1 rounded-full bg-amber px-1.5 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn text-navy">
                  Primary
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragActive ? 'border-navy bg-navy/5' : 'border-border bg-page'
        }`}
      >
        {uploading > 0 ? (
          <Loader2 size={22} className="animate-spin text-navy" aria-hidden />
        ) : (
          <ImagePlus size={22} className="text-navy" aria-hidden />
        )}
        <p className="font-raleway text-sm font-bold text-navy">
          {uploading > 0
            ? `Uploading ${uploading} file${uploading === 1 ? '' : 's'}…`
            : isMulti
              ? 'Drop images or click to pick'
              : urls.length > 0
                ? 'Drop a new image to replace'
                : 'Drop an image or click to pick'}
        </p>
        <p className="font-sans text-[11px] text-muted">
          {props.emptyHint ?? 'JPEG, PNG, WEBP, AVIF, GIF · max 8MB per file'}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
          className="mt-1 rounded-btn border border-navy bg-white px-4 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMulti ? 'Pick images' : 'Pick image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={isMulti}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
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
