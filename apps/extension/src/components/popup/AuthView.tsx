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
    <section className="card">
      <h2 className="card-title">{mode === "register" ? "Create account" : "Log in"}</h2>
      <p className="empty-state">Sign in to keep Full-time data, resumes, Gmail, and templates scoped to your account.</p>
      <form className="form-stack" onSubmit={(event) => void submit(event)}>
        {mode !== "reset-confirm" ? (
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
        ) : null}
        {mode === "register" ? (
          <label>
            Display name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </label>
        ) : null}
        {mode !== "reset-request" ? (
          <label>
            {mode === "reset-confirm" ? "New password" : "Password"}
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
        ) : null}
        {mode === "reset-confirm" ? (
          <label>
            Reset token
            <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} required />
          </label>
        ) : null}
        <button className="primary-button" disabled={loading} type="submit">
          Continue
        </button>
      </form>
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
