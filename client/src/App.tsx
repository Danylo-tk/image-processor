import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type JobStatus = {
  id: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  url?: string
  error?: string
}

const isFinished = (job: JobStatus) => {
  return job.status === 'done' || job.status === 'failed'
}

const API_URL = 'http://localhost:3000'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [job, setJob] = useState<JobStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)
    setJob(null)

    try {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch(`${API_URL}/images`, { method: 'POST', body })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

      setJob(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!job || isFinished(job)) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/images/${job.id}`)
        if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
        setJob(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [job])

  return (
    <main>
      <h1>Image resizer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      {job && (
        <p>
          Job <code>{job.id}</code> is {job.status}
        </p>
      )}
      {job?.status === 'failed' && <p role="alert">{job.error}</p>}
      {job?.url && <img src={`${API_URL}${job.url}`} alt="Resized upload" />}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}

export default App
