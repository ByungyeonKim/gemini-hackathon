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
      return "MP4, WebM, MOV, AVI 형식만 업로드할 수 있습니다.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`;
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
        className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-accent bg-accent/5 shadow-glow"
            : "border-border bg-surface hover:border-accent/50"
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
          aria-label="동영상 파일 선택"
        />
        {selectedFile && !error ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 font-mono text-lg text-accent">
              [vid]
            </div>
            <p className="font-mono text-sm text-foreground break-all">
              {selectedFile.name}
            </p>
            <p className="font-mono text-xs tabular-nums text-muted">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded border border-border bg-surface-hover px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-foreground"
            >
              rm file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 font-mono text-2xl text-accent">
              {isDragging ? "[drop]" : "[+]"}
            </div>
            <p className="font-mono text-sm text-foreground">
              {isDragging ? "drop here" : "drag & drop or click"}
            </p>
            <p className="font-mono text-xs text-muted">
              MP4 · WebM · MOV · AVI · max {MAX_SIZE_MB}MB
            </p>
          </div>
        )}
      </label>
      {error && (
        <p className="font-mono text-xs font-medium text-red-400" role="alert">
          error: {error}
        </p>
      )}
    </div>
  );
}
