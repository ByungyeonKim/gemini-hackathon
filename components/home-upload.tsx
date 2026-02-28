'use client'

import { useEffect, useState } from 'react'
import { VideoUploadZone } from '@/components/video-upload'
import { POINTS_PER_FRAME } from '@/lib/reward'
import type { UploadResponse } from '@/types/upload'

const COUNT_UP_DURATION_MS = 600

interface UploadResult {
  savedFrames: number
  earnedPoints: number
  frames: string[]
  datasetPath?: string
  datasetUrl?: string
}

export function HomeUpload() {
  const [textInput, setTextInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [displayPoints, setDisplayPoints] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uploadResult) {
      setDisplayPoints(0)
      return
    }
    const target = uploadResult.earnedPoints
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / COUNT_UP_DURATION_MS, 1)
      const eased = 1 - (1 - progress) ** 2
      setDisplayPoints(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [uploadResult])

  async function handleUpload() {
    if (!selectedFile) return
    setIsUploading(true)
    setUploadResult(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('tag', textInput)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error ?? 'Upload failed.')
        return
      }

      const { savedFrames, frames, datasetPath, datasetUrl } = data as UploadResponse
      const earnedPoints = savedFrames * POINTS_PER_FRAME
      const frameList = Array.isArray(frames) ? frames : []
      setUploadResult({ savedFrames, earnedPoints, frames: frameList, datasetPath, datasetUrl })
    } catch {
      setError('An error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-12">
      <div className="space-y-4">
        <label htmlFor="home-text-input" className="text-sm font-black uppercase tracking-widest text-accent">
          // TAG_OBJECT_IDENTIFIER
        </label>
        <input
          id="home-text-input"
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="ENTER_OBJECT_TYPE..."
          className="brutalist-input w-full"
        />
      </div>
      <VideoUploadZone onFileSelect={setSelectedFile} />
      {selectedFile && (
        <div className="flex flex-col gap-8">
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="brutalist-button w-full sm:w-auto"
            >
              {isUploading ? "PROCESS_INITIATED..." : "EXECUTE_UPLOAD"}
            </button>
          </div>
          {uploadResult && (
            <div className="brutalist-card space-y-6 p-8">
              <div className="flex flex-wrap items-center gap-4 border-b-2 border-dashed border-accent pb-4">
                <span className="text-2xl" aria-hidden>[!]</span>
                <p className="text-lg font-black uppercase">
                  DATA_SAVED: <span className="text-accent">{uploadResult.savedFrames}</span> FRAMES //
                  CREDITS: <span className="animate-points-count-pop ml-1 text-accent-secondary">
                    +{displayPoints}
                  </span>
                </p>
              </div>
              {uploadResult.datasetPath && (
                <div className="bg-accent/10 border-2 border-accent p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase text-accent">
                        // AI_TRAINING_DATASET_READY
                      </p>
                      <p className="font-mono text-[10px] opacity-70">
                        ID: {uploadResult.datasetPath}
                      </p>
                    </div>
                    {uploadResult.datasetUrl && (
                      <a
                        href={uploadResult.datasetUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="brutalist-button bg-accent text-black text-xs py-2 px-4 whitespace-nowrap"
                      >
                        DOWNLOAD_DATASET.ZIP
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] leading-tight opacity-50 border-t border-accent/30 pt-4">
                    THIS ARCHIVE CONTAINS YOLO-FORMAT IMAGES, LABELS, AND DATA.YAML FOR IMMEDIATE MODEL TRAINING.
                    UPLOAD TO YOUR TRAINING ENVIRONMENT TO INITIALIZE WEIGHT OPTIMIZATION.
                  </p>
                </div>
              )}
              {(uploadResult.frames?.length ?? 0) > 0 && (
                <div>
                  <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-accent">
                    // INSPECTED_DATA_STREAM
                  </h2>
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {(uploadResult.frames ?? []).map((src, i) => (
                      <li key={i} className="brutalist-card aspect-video overflow-hidden border-2">
                        <img
                          src={src}
                          alt={`Frame ${i + 1}`}
                          className="h-full w-full object-cover grayscale transition-all hover:grayscale-0"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="bg-red-500 p-4 font-black uppercase text-black">
              ERROR_DETECTED: {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
