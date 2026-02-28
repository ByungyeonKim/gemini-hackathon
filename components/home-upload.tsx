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
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:opacity-60"
            >
              {isUploading ? "업로드 중… 🚀" : "업로드하기"}
            </button>
          </div>
          {uploadResult && (
            <div className="animate-points-card-in min-w-0 flex-1 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg" aria-hidden>🎉</span>
                <p className="text-sm font-medium text-foreground">
                  <span className="text-accent font-semibold">{uploadResult.savedFrames}</span>개 프레임 저장 ·
                  <span className="animate-points-count-pop ml-1 inline-block tabular-nums font-bold text-accent">
                    +{displayPoints}
                  </span>
                  포인트 적립!
                </p>
              </div>
              {(uploadResult.frames?.length ?? 0) > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">
                    저장된 프레임
                  </h2>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {(uploadResult.frames ?? []).map((src, i) => (
                      <li key={i} className="overflow-hidden rounded-xl border border-border shadow-sm">
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
            <p className="text-sm font-medium text-red-500" role="alert">
              ⚠️ {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
