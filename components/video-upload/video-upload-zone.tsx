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
        className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center border-4 border-dashed transition-all duration-200 ${isDragging
            ? "border-accent bg-accent/20 scale-[1.02]"
            : "border-white bg-surface hover:border-accent-secondary"
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
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center border-4 border-accent bg-black text-5xl">
              [REC]
            </div>
            <div className="space-y-2">
              <p className="max-w-full truncate font-black uppercase text-foreground">
                IDENTIFIED: {selectedFile.name}
              </p>
              <p className="font-mono text-sm tabular-nums text-accent">
                SIZE: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="brutalist-button py-2 bg-white text-black text-xs"
            >
              // RESET_IDENTIFICATION
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center border-4 border-white bg-black text-6xl">
              {isDragging ? ">>" : "++"}
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-black uppercase tracking-tighter">
                {isDragging ? "DROP_FOR_ANALYSIS" : "INITIALIZE_UPLOAD"}
              </p>
              <p className="text-xs font-bold text-accent">
                MP4_WEBM_MOV_AVI // MAX_{MAX_SIZE_MB}MB
              </p>
            </div>
          </div>
        )}
      </label>
      {error && (
        <div className="bg-red-500 p-4 font-black uppercase text-black">
          CRITICAL_DRAG_ERROR: {error}
        </div>
      )}
    </div>
  );
}
