import type { CurrentUser } from "../api/types"

const TOKEN_KEY = "auth.accessToken"
const USER_KEY = "auth.currentUser"

export type StoredAuthSession = {
  accessToken: string
  user: CurrentUser
}

export async function loadStoredAuthSession(): Promise<StoredAuthSession | null> {
  const values = await chrome.storage.session.get([TOKEN_KEY, USER_KEY])
  const accessToken = values[TOKEN_KEY]
  const user = values[USER_KEY]
  if (typeof accessToken !== "string" || !user) {
    return null
  }
  return { accessToken, user: user as CurrentUser }
}

export async function saveStoredAuthSession(session: StoredAuthSession): Promise<void> {
  await chrome.storage.session.set({ [TOKEN_KEY]: session.accessToken, [USER_KEY]: session.user })
}

export async function clearStoredAuthSession(): Promise<void> {
  await chrome.storage.session.remove([TOKEN_KEY, USER_KEY])
}
