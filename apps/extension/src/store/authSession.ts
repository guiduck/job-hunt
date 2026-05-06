import type { CurrentUser } from "../api/types"

const TOKEN_KEY = "auth.accessToken"
const USER_KEY = "auth.currentUser"
const STORAGE_AREA = "local"

export type StoredAuthSession = {
  accessToken: string
  user: CurrentUser
}

function describeToken(token: unknown) {
  if (typeof token !== "string") {
    return { present: false, type: typeof token }
  }
  return {
    present: true,
    length: token.length,
    suffix: token.slice(-6)
  }
}

function describeUser(user: unknown) {
  if (!user || typeof user !== "object") {
    return { present: false, type: typeof user }
  }
  const currentUser = user as Partial<CurrentUser>
  return {
    present: true,
    id: currentUser.id,
    email: currentUser.email
  }
}

function describeSessionValues(values: Record<string, unknown>) {
  return {
    storageArea: STORAGE_AREA,
    token: describeToken(values[TOKEN_KEY]),
    user: describeUser(values[USER_KEY])
  }
}

export async function loadStoredAuthSession(): Promise<StoredAuthSession | null> {
  const values = await chrome.storage.local.get([TOKEN_KEY, USER_KEY])
  console.info("[Opportunity Desk] auth storage load", describeSessionValues(values))
  let accessToken = values[TOKEN_KEY]
  let user = values[USER_KEY]

  if (typeof accessToken !== "string" || !user) {
    const legacyValues = await chrome.storage.session.get([TOKEN_KEY, USER_KEY])
    console.info("[Opportunity Desk] legacy session storage load", {
      storageArea: "session",
      token: describeToken(legacyValues[TOKEN_KEY]),
      user: describeUser(legacyValues[USER_KEY])
    })
    accessToken = legacyValues[TOKEN_KEY]
    user = legacyValues[USER_KEY]

    if (typeof accessToken === "string" && user) {
      await chrome.storage.local.set({ [TOKEN_KEY]: accessToken, [USER_KEY]: user })
      await chrome.storage.session.remove([TOKEN_KEY, USER_KEY])
      console.info("[Opportunity Desk] migrated auth session from session storage to local storage", {
        token: describeToken(accessToken),
        user: describeUser(user)
      })
    }
  }

  if (typeof accessToken !== "string" || !user) {
    console.info("[Opportunity Desk] auth storage load result: no usable session")
    return null
  }
  console.info("[Opportunity Desk] auth storage load result: usable session found", {
    token: describeToken(accessToken),
    user: describeUser(user)
  })
  return { accessToken, user: user as CurrentUser }
}

export async function saveStoredAuthSession(session: StoredAuthSession): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: session.accessToken, [USER_KEY]: session.user })
  await chrome.storage.session.remove([TOKEN_KEY, USER_KEY])
  console.info("[Opportunity Desk] auth storage save", {
    storageArea: STORAGE_AREA,
    token: describeToken(session.accessToken),
    user: describeUser(session.user)
  })
}

export async function clearStoredAuthSession(): Promise<void> {
  await Promise.all([chrome.storage.local.remove([TOKEN_KEY, USER_KEY]), chrome.storage.session.remove([TOKEN_KEY, USER_KEY])])
  console.info("[Opportunity Desk] auth storage clear", { storageAreas: ["local", "session"] })
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!(TOKEN_KEY in changes) && !(USER_KEY in changes)) {
    return
  }

  console.info("[Opportunity Desk] auth storage changed", {
    storageArea: areaName,
    token: TOKEN_KEY in changes ? describeToken(changes[TOKEN_KEY].newValue) : "unchanged",
    user: USER_KEY in changes ? describeUser(changes[USER_KEY].newValue) : "unchanged"
  })
})
