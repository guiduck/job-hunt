import { useState } from "react"
import type { FormEvent } from "react"

import { usePopupStore } from "../../store/popupStore"

type Mode = "login" | "register" | "reset-request" | "reset-confirm"

export function AuthView() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [resetToken, setResetToken] = useState("")
  const loading = usePopupStore((state) => state.loading)
  const login = usePopupStore((state) => state.login)
  const register = usePopupStore((state) => state.register)
  const requestPasswordReset = usePopupStore((state) => state.requestPasswordReset)
  const confirmPasswordReset = usePopupStore((state) => state.confirmPasswordReset)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    console.info("[Opportunity Desk] auth form submitted", { mode, email })
    if (mode === "login") {
      await login(email, password)
    } else if (mode === "register") {
      await register(email, password, displayName)
    } else if (mode === "reset-request") {
      await requestPasswordReset(email)
    } else {
      await confirmPasswordReset(resetToken, password)
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-hero">
        <span className="auth-badge">Opportunity Desk</span>
        <h2>{mode === "register" ? "Create your workspace" : "Welcome back"}</h2>
        <p>Keep LinkedIn jobs, templates, resumes, and Gmail sending scoped to your account.</p>
      </div>
      <form className="form-stack" onSubmit={(event) => void submit(event)}>
        {mode !== "reset-confirm" ? (
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
        ) : null}
        {mode === "register" ? (
          <label className="field">
            <span>Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>
        ) : null}
        {mode !== "reset-request" ? (
          <label className="field">
            <span>{mode === "reset-confirm" ? "New password" : "Password"}</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
        ) : null}
        {mode === "reset-confirm" ? (
          <label className="field">
            <span>Reset token</span>
            <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required />
          </label>
        ) : null}
        <button className="primary-button" disabled={loading} type="submit">
          {mode === "login" ? "Log in" : "Continue"}
        </button>
      </form>
      <p className="message">
        Google connection is configured after login in Settings. Google sign-in will need a dedicated auth flow before it can replace email login.
      </p>
      <div className="button-row">
        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")} type="button">
          {mode === "login" ? "Create account" : "Use existing account"}
        </button>
        <button className="link-button" onClick={() => setMode("reset-request")} type="button">
          Request reset
        </button>
        <button className="link-button" onClick={() => setMode("reset-confirm")} type="button">
          Confirm reset
        </button>
      </div>
    </section>
  )
}
