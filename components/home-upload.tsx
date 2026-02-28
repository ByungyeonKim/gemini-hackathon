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
  const [logs, setLogs] = useState<string[]>([])

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
    setLogs(['[SYSTEM] Initializing uplink...', `[SYSTEM] Target: ${textInput || 'ALL'}`])

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('tag', textInput)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data?.error ?? 'Uplink failed.')
        return
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to initialize stream reader.')

      const decoder = new TextDecoder()
      let partialLine = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = (partialLine + chunk).split('\n')
        partialLine = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith('RESULT: ')) {
            try {
              const resultJson = JSON.parse(line.replace('RESULT: ', ''))
              const { processed_count, frame_urls, dataset_path, dataset_url } = resultJson
              const earnedPoints = processed_count * POINTS_PER_FRAME
              const frames = Array.isArray(frame_urls) ? frame_urls : []

              setUploadResult({
                savedFrames: processed_count,
                earnedPoints,
                frames,
                datasetPath: dataset_path,
                datasetUrl: dataset_url
              })
            } catch (e) {
              console.error('Failed to parse result JSON', e)
            }
          } else {
            setLogs(prev => [...prev, line].slice(-20)) // Keep last 20 logs
          }
        }
      }
      setLogs(prev => [...prev, '[SYSTEM] Capture protocol complete.'])
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Controls & Terminal */}
      <div className="space-y-8 lg:col-span-5">
        <div className="brutalist-card p-6 space-y-6">
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
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="brutalist-button w-full"
            >
              {isUploading ? "PROCESS_INITIATED..." : "EXECUTE_UPLOAD"}
            </button>
          )}
        </div>

        {/* Terminal Console */}
        <div className="brutalist-card bg-black p-4 border-accent/30 min-h-[240px] flex flex-col">
          <div className="flex items-center justify-between border-b border-accent/30 pb-2 mb-4">
            <span className="text-[10px] font-black uppercase text-accent animate-pulse">
              [LIVE_SYSTEM_LOGS]
            </span>
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="flex-1 font-mono text-[10px] space-y-1 overflow-y-auto max-h-[300px] scrollbar-hide">
            {logs.length === 0 ? (
              <p className="opacity-20 italic">// Awaiting initialization...</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className={log.includes('[ERROR]') || log.includes('[FATAL]') ? 'text-red-400' : 'text-green-400 opacity-80'}>
                  {'>'} {log}
                </p>
              ))
            )}
            {isUploading && (
              <p className="text-white animate-pulse">_</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Results & Gallery */}
      <div className="lg:col-span-7">
        {!uploadResult && !error && !isUploading && (
          <div className="flex h-full min-h-[400px] items-center justify-center border-4 border-dashed border-white/10 opacity-20 bg-white/5">
            <div className="text-center">
              <p className="text-4xl">🎬</p>
              <p className="mt-4 text-xs font-black uppercase tracking-widest">Awaiting Data Inflow</p>
            </div>
          </div>
        )}

        {isUploading && !uploadResult && (
          <div className="flex h-full min-h-[400px] items-center justify-center border-4 border-white animate-pulse bg-accent/5">
            <div className="text-center space-y-4">
              <div className="inline-block h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-accent">Analyzing_Data_Packets...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-4 border-red-500 p-8 text-center space-y-4">
            <p className="text-4xl">⚠️</p>
            <h3 className="font-black uppercase text-red-500">Critical_Exploit_Detected</h3>
            <p className="text-xs font-mono opacity-80">{error}</p>
            <button onClick={() => setError(null)} className="brutalist-button py-2 bg-red-500 text-black">RESET_SYSTEM</button>
          </div>
        )}

        {uploadResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="brutalist-card p-8 bg-accent/5 border-accent">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-accent pb-6 mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-50">Operation Summary</p>
                  <p className="text-2xl font-black uppercase">
                    DATA_SAVED: <span className="text-accent">{uploadResult.savedFrames}</span> FRAMES
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase opacity-50">Rewards Issued</p>
                  <p className="text-3xl font-black text-accent-secondary animate-points-count-pop">
                    +{displayPoints} CR
                  </p>
                </div>
              </div>

              {uploadResult.datasetUrl && (
                <div className="bg-white text-black p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:scale-[1.01] transition-transform">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs font-black uppercase tracking-tighter">AI_TRAINING_BUNDLE_GENERIC</p>
                    <p className="text-[10px] font-mono opacity-60 uppercase">Format: YOLOv8 // Ready for optimization</p>
                  </div>
                  <a
                    href={uploadResult.datasetUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brutalist-button bg-black text-white w-full sm:w-auto"
                  >
                    EXTRACT_DATASET.ZIP
                  </a>
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-accent flex items-center gap-2">
                  <span className="h-2 w-2 bg-accent" /> // INSPECTED_DATA_STREAM
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {(uploadResult.frames ?? []).map((src, i) => (
                    <div key={i} className="group relative brutalist-card aspect-video overflow-hidden border-2 hover:border-accent transition-colors">
                      <img
                        src={src}
                        alt={`Frame ${i + 1}`}
                        className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
