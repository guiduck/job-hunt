import { type FormEvent, useState } from "react"

import { usePopupStore } from "../../store/popupStore"

export function ResumeSettingsPanel() {
  const uploadResumePdf = usePopupStore((state) => state.uploadResumePdf)
  const [displayName, setDisplayName] = useState("")
  const [file, setFile] = useState<File | null>(null)

  async function submitResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    await uploadResumePdf(file, displayName || file.name)
    setDisplayName("")
    setFile(null)
  }

  return (
    <form className="template-form" onSubmit={submitResume}>
      <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Resume label" required />
      <input
        accept="application/pdf,.pdf"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        required
        type="file"
      />
      <button disabled={!file} type="submit">
        Upload PDF resume
      </button>
    </form>
  )
}
