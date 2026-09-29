import { useState } from 'react'
import type { FormEvent } from 'react'

type UploadResult = { id: string; status: string }

const API_URL = 'http://localhost:3000'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch(`${API_URL}/images`, { method: 'POST', body })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

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
      {result && (
        <p>
          Job <code>{result.id}</code> is {result.status}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}

export default App
