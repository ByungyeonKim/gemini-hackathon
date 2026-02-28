"use client";

import { useCallback, useState } from "react";

const ACCEPT_VIDEO = "video/mp4,video/webm,video/quicktime,video/x-msvideo";
const MAX_SIZE_MB = 500;

interface VideoUploadZoneProps {
  onFileSelect?: (file: File | null) => void;
}

export function VideoUploadZone({ onFileSelect }: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!validTypes.includes(file.type)) {
      return "Only MP4, WebM, MOV, AVI formats are supported.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size must be ${MAX_SIZE_MB}MB or less.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null);
      setSelectedFile(file);
      onFileSelect?.(file);
      if (file) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          setSelectedFile(null);
          onFileSelect?.(null);
        }
      }
    },
    [onFileSelect, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    handleFile(null);
  }, [handleFile]);

  return (
    <div className="w-full space-y-4">
      <label
        className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border bg-surface hover:border-accent/40 hover:bg-surface-hover/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={ACCEPT_VIDEO}
          onChange={handleChange}
          className="sr-only"
          aria-label="Select video file"
        />
        {selectedFile && !error ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-4xl">
              🎬
            </div>
            <p className="max-w-full truncate px-2 text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-sm tabular-nums text-muted">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-border/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/20 hover:text-accent"
            >
              Choose again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="animate-float flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 text-5xl">
              {isDragging ? "👋" : "📤"}
            </div>
            <p className="text-base font-medium text-foreground">
              {isDragging ? "Drop here!" : "Drag and drop video"}
            </p>
            <p className="text-sm text-muted">
              or click to select · MP4, WebM, MOV, AVI (max {MAX_SIZE_MB}MB)
            </p>
          </div>
        )}
      </label>
      {error && (
        <p className="text-sm font-medium text-red-500" role="alert">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
