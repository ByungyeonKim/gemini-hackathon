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
}

export function HomeUpload() {
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

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error ?? '업로드에 실패했습니다.')
        return
      }

      const { savedFrames, frames } = data as UploadResponse
      const earnedPoints = savedFrames * POINTS_PER_FRAME
      const frameList = Array.isArray(frames) ? frames : []
      setUploadResult({ savedFrames, earnedPoints, frames: frameList })
    } catch {
      setError('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <VideoUploadZone onFileSelect={setSelectedFile} />
      {selectedFile && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="rounded-lg border-2 border-accent bg-accent px-5 py-2.5 font-mono text-sm font-medium text-background shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isUploading ? "... uploading" : "upload"}
            </button>
          </div>
          {uploadResult && (
            <div className="animate-points-card-in min-w-0 flex-1 space-y-4 rounded-xl border border-border bg-surface p-4">
              <p className="font-mono text-sm text-foreground">
                <span className="text-accent">{uploadResult.savedFrames}</span> frames saved ·{' '}
                <span className="animate-points-count-pop inline-block tabular-nums text-accent">
                  +{displayPoints}
                </span>
                {' '}pts
              </p>
              {(uploadResult.frames?.length ?? 0) > 0 && (
                <div>
                  <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-muted">
                    frames
                  </h2>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {(uploadResult.frames ?? []).map((src, i) => (
                      <li key={i} className="overflow-hidden rounded-lg border border-border">
                        <img
                          src={src}
                          alt={`프레임 ${i + 1}`}
                          className="h-auto w-full object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {error && (
            <p className="font-mono text-xs font-medium text-red-400" role="alert">
              error: {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
