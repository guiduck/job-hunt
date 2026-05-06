import { type FormEvent, useEffect, useState } from "react"

import { createEmailTemplate, previewEmailTemplate, updateEmailTemplate } from "../../api/client"
import type { RenderedPreview, TemplateKind } from "../../api/types"
import { usePopupStore } from "../../store/popupStore"
import { TemplatePreviewPanel } from "./TemplatePreviewPanel"

export function TemplatesView() {
  const emailTemplates = usePopupStore((state) => state.emailTemplates)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [templateKind, setTemplateKind] = useState<TemplateKind>("job_application")
  const [subjectTemplate, setSubjectTemplate] = useState("Application for {{job_title}} at {{company_name}}")
  const [bodyTemplate, setBodyTemplate] = useState("Hi {{author_name}},\n\nI found {{source_url}} and wanted to reach out.")
  const [preview, setPreview] = useState<RenderedPreview | null>(null)
  const isEditing = Boolean(editingTemplateId)

  useEffect(() => {
    void refreshEmailSetup()
  }, [refreshEmailSetup])

  async function submitTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const template = editingTemplateId
      ? await updateEmailTemplate(editingTemplateId, {
          name,
          subject_template: subjectTemplate,
          body_template: bodyTemplate
        })
      : await createEmailTemplate({
          mode: "full_time",
          template_kind: templateKind,
          name,
          subject_template: subjectTemplate,
          body_template: bodyTemplate,
          is_active: true
        })

    resetForm()
    setPreview(await renderPreview(template.id))
    await refreshEmailSetup()
  }

  function editTemplate(template: (typeof emailTemplates)[number]) {
    setEditingTemplateId(template.id)
    setName(template.name)
    setTemplateKind(template.template_kind)
    setSubjectTemplate(template.subject_template)
    setBodyTemplate(template.body_template)
    setPreview(null)
  }

  function resetForm() {
    setEditingTemplateId(null)
    setName("")
    setTemplateKind("job_application")
    setSubjectTemplate("Application for {{job_title}} at {{company_name}}")
    setBodyTemplate("Hi {{author_name}},\n\nI found {{source_url}} and wanted to reach out.")
  }

  function renderPreview(templateId: string) {
    return previewEmailTemplate(templateId, {
      sample_values: {
        company_name: "Example Co",
        job_title: "Senior TypeScript Developer",
        source_url: "https://www.linkedin.com/feed/update/example",
        operator_name: "Guilherme"
      }
    })
  }

  return (
    <section className="panel">
      <h2>Full-time templates</h2>
      <p className="muted">Manage job application and follow-up email templates.</p>
      <form className="template-form" onSubmit={submitTemplate}>
        {isEditing ? <p className="message message--warn">Editing template. Save or cancel before creating another one.</p> : null}
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" required />
        <select
          disabled={isEditing}
          title={isEditing ? "Template type cannot be changed after creation." : undefined}
          value={templateKind}
          onChange={(event) => setTemplateKind(event.target.value as TemplateKind)}>
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
        <div className="button-row">
          <button type="submit">{isEditing ? "Save template" : "Create template"}</button>
          {isEditing ? (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
      {emailTemplates.length === 0 ? (
        <p className="message">No templates yet.</p>
      ) : (
        <ul className="stack-list">
          {emailTemplates.map((template) => (
            <li className="stack-card" key={template.id}>
              <div className="template-summary">
                <strong>{template.name}</strong>
                <span>{template.template_kind}</span>
              </div>
              <div className="template-actions">
                <button type="button" onClick={() => editTemplate(template)}>
                  Edit
                </button>
                <button type="button" onClick={async () => setPreview(await renderPreview(template.id))}>
                  Preview
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateEmailTemplate(template.id, { is_active: !template.is_active })
                    await refreshEmailSetup()
                  }}>
                  {template.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <TemplatePreviewPanel preview={preview} />
    </section>
  )
}
