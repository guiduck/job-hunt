import { type FormEvent, useEffect, useState } from "react"

import { createEmailTemplate, previewEmailTemplate, updateEmailTemplate } from "../../api/client"
import type { RenderedPreview, TemplateKind } from "../../api/types"
import { usePopupStore } from "../../store/popupStore"
import { TemplatePreviewPanel } from "./TemplatePreviewPanel"

export function TemplatesView() {
  const emailTemplates = usePopupStore((state) => state.emailTemplates)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const [name, setName] = useState("")
  const [templateKind, setTemplateKind] = useState<TemplateKind>("job_application")
  const [subjectTemplate, setSubjectTemplate] = useState("Application for {{job_title}} at {{company_name}}")
  const [bodyTemplate, setBodyTemplate] = useState("Hi {{author_name}},\n\nI found {{source_url}} and wanted to reach out.")
  const [preview, setPreview] = useState<RenderedPreview | null>(null)

  useEffect(() => {
    void refreshEmailSetup()
  }, [refreshEmailSetup])

  async function submitTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const template = await createEmailTemplate({
      mode: "full_time",
      template_kind: templateKind,
      name,
      subject_template: subjectTemplate,
      body_template: bodyTemplate,
      is_active: true
    })
    setName("")
    setPreview(
      await previewEmailTemplate(template.id, {
        sample_values: {
          company_name: "Example Co",
          job_title: "Senior TypeScript Developer",
          source_url: "https://www.linkedin.com/jobs/example",
          operator_name: "Guilherme"
        }
      })
    )
    await refreshEmailSetup()
  }

  return (
    <section className="panel">
      <h2>Full-time templates</h2>
      <p className="muted">Manage job application and follow-up email templates.</p>
      <form className="template-form" onSubmit={submitTemplate}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" required />
        <select value={templateKind} onChange={(event) => setTemplateKind(event.target.value as TemplateKind)}>
          <option value="job_application">Job application</option>
          <option value="job_follow_up">Job follow-up</option>
        </select>
        <input
          value={subjectTemplate}
          onChange={(event) => setSubjectTemplate(event.target.value)}
          placeholder="Subject template"
          required
        />
        <textarea value={bodyTemplate} onChange={(event) => setBodyTemplate(event.target.value)} required rows={5} />
        <button type="submit">Create template</button>
      </form>
      {emailTemplates.length === 0 ? (
        <p className="message">No templates yet.</p>
      ) : (
        <ul className="stack-list">
          {emailTemplates.map((template) => (
            <li className="stack-card" key={template.id}>
              <strong>{template.name}</strong>
              <span>{template.template_kind}</span>
              <button
                type="button"
                onClick={async () =>
                  setPreview(
                    await previewEmailTemplate(template.id, {
                      sample_values: {
                        company_name: "Example Co",
                        job_title: "Senior TypeScript Developer",
                        source_url: "https://www.linkedin.com/jobs/example"
                      }
                    })
                  )
                }
              >
                Preview
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateEmailTemplate(template.id, { is_active: !template.is_active })
                  await refreshEmailSetup()
                }}
              >
                {template.is_active ? "Deactivate" : "Activate"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <TemplatePreviewPanel preview={preview} />
    </section>
  )
}
