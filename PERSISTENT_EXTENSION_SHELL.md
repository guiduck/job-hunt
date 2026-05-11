# Persistent Extension Shell

## Why This Was Not Built Earlier

The first Opportunity Desk extension focused on the shortest reliable path for the Full-time MVP:

- authenticate the operator
- capture LinkedIn posts using the browser session
- send captured posts to the local API
- review jobs, templates, resumes, Gmail OAuth, and generated emails inside the popup

At that stage, the popup was enough because most workflows happened inside the extension UI itself.
The `Keep open` button was added as a pragmatic workaround for Chrome's native popup behavior: the
popup closes when it loses focus. Opening a separate extension window avoided that limitation without
adding another content-script UI system.

Now the product is moving into external application pages. The operator needs to click inside form
fields, review generated answers, and keep extension controls nearby while the page remains active.
That makes the old popup/window workaround feel clumsy.

## Why The Other Extension Could Stay Open

The reference project at `references/chrome-plugin-v3/chrome-plugin-v3` did not rely only on the
native extension popup. It used a page-injected UI pattern:

- a content script injected an iframe into the active web page
- the iframe loaded extension-owned UI from the extension bundle
- the background script sent messages to open, close, navigate, resize, or minimize that injected UI
- the injected UI lived inside the page tab, so it did not disappear when the native popup lost focus

That is the key difference. A native popup is controlled by Chrome and closes on focus loss. An
injected iframe or shadow-root shell is part of the active tab, controlled by the extension's content
script and background messaging.

## How The New Implementation Should Work

For Opportunity Desk, the new shell now replaces the authenticated `Keep open` flow in the first
implementation slice.

Expected behavior:

1. The operator logs into the extension.
2. On an external application page, the operator can enable the assistant for the base domain, or for
   the exact current page if they want a narrower scope.
3. The extension injects a small, fixed, minimizable shell into the active tab through the Plasmo
   content script.
4. The shell shows field-assistant status and stays available while the native popup is closed.
5. The shell remains available when the operator clicks into the page.
6. Closing or disabling the shell removes the page UI until the operator explicitly reopens it.

The implementation should preserve these boundaries:

- The assistant is disabled by default on external domains and is activated per owner + base domain
  or exact page.
- Unauthenticated users should not get injected controls.
- Sensitive fields must not receive overlays.
- External pages must not receive model credentials, OAuth tokens, client secrets, prompt secrets, or
  full resume file contents. The content script sends sanitized field metadata and receives only the
  generated text selected for review.
- Generated text must be reviewed before insertion.
- The assistant must never submit external forms automatically.

## Why This Should Be More Reliable Than Keep Open

`Keep open` keeps an extension window alive, but the user still has to move between that window and
the page. It is detached from the exact field being filled.

The persistent shell is closer to the user's actual task:

- it lives on the same tab as the application form
- it can anchor field actions to specific inputs/textareas
- it can minimize like a small floating affordance
- it can share state with the content script scanning fields
- it does not depend on Chrome keeping the native popup open

In short: the old workaround kept the extension visible; the new shell makes the extension useful
inside the page where the work happens. The current implementation uses direct content-script DOM UI;
if real sites show CSS/layout conflicts, the next hardening step is moving that shell/menu into a more
isolated iframe or shadow-root.
