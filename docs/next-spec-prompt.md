## Command
speckit.specify

## Candidate Feature
Full-time LinkedIn Jobs External Search Manual Validation Follow-up

## Context
Spec 018 has its automated implementation complete. The next product/spec decision should be based on manual LinkedIn smoke results: direct Jobs URL behavior without geoId, whether geoId is needed, whether fallback click-path is required, whether assisted entry is reliable, and whether diagnostics/counters match real mixed cards.

## Prompt
Create the next spec only after manual smoke observations are recorded. If LinkedIn Jobs external search works reliably, specify polishing/history drilldown for external runs. If direct URL or DOM inspection is fragile, specify hardening for LinkedIn Jobs navigation selectors, fallback click-path, and operator recovery controls. Keep `apps/web`/Freelance out of scope.

## Freelance WhatsApp Plain Text Note
Recent web hotfix: generated `Freelance` commercial messages for WhatsApp must be plain chat text. Preserve the rule that WhatsApp output should not use Markdown links, should not ask the lead to contact via WhatsApp because the thread is already WhatsApp, and should ask them to reply here.

## Freelance Twilio Delivery Status Note
Recent web hotfix: Twilio WhatsApp HTTP success means provider acceptance, not guaranteed delivery. Preserve `providerStatus` visibility and avoid UI copy that implies final WhatsApp delivery unless Twilio status callback/logs confirm delivered.

## LinkedIn Jobs CTA Redirect Resolution Note
Recent extension hotfix: visible `Candidatar-se` CTAs can expose internal `linkedin.com/jobs/view/...` hrefs before resolving to the external ATS. Future spec work should preserve the controlled background resolution flow: click the apply CTA in `_blank`, observe the opened tab until the URL leaves LinkedIn, close the auxiliary tab, then source-match/dedupe the resolved external URL. Keep this scoped to the Full-time extension; do not involve `apps/web`/Freelance.

## LinkedIn Jobs Button CTA Note
Recent extension hotfix: LinkedIn can render `Candidatar-se` as `BUTTON.jobs-apply-button` with `href=null`. Future LinkedIn Jobs specs must treat button/role-button apply CTAs as first-class, not only `a[href]`, and preserve resolver logs (`LinkedIn apply resolver clicking CTA`, `opened external tab`, `result`) for manual debugging.

## LinkedIn Jobs Share Profile Modal Note
Recent extension hotfix: `Candidatar-se` can open LinkedIn's share-profile confirmation modal before the external ATS URL. Future LinkedIn Jobs specs must preserve the resolver step that clicks `Continuar`/`Continue`, captures the non-LinkedIn tab URL, and closes the modal on timeout.

## LinkedIn Jobs Share Profile Modal Correction
Correction: do not click `Continuar`/`Continue` in LinkedIn's share-profile modal. Treat it as an unexpected blocker, close it, and use resolver logs (`tag`, `className`, `label`, `outerHTML`) to refine CTA targeting. Future specs must avoid automatic profile sharing.

## LinkedIn Jobs Hrefless CTA Diagnostic Note
Recent extension hotfix: do not click `BUTTON.jobs-apply-button` with `href=null`. Diagnose these buttons by inspecting attributes, dataset, surrounding form/dialog data, scripts, and network behavior without triggering profile-sharing side effects.

## LinkedIn Jobs Passive Hrefless CTA Diagnostics
Recent extension diagnostic: hrefless `Candidatar-se` buttons log `currentJobId`, CTA dataset/html, parent chain, recent `/voyager/` resources, and JSON signals. Use those logs to design the next deterministic resolver without clicking profile-share flows.

## LinkedIn Jobs Hrefless CTA Resolver Follow-up
Manual diagnostics on 2026-07-27 showed `BUTTON.jobs-apply-button[data-live-test-job-apply-button]` has no `href`, and passive `/voyager/` resources are too noisy or scoped to unrelated job IDs. Do not keep guessing selectors. Specify a safe resolver that duplicates the current job/search URL into a disposable tab, clicks only the verified apply CTA there, captures the first non-LinkedIn URL if one appears, closes any LinkedIn share-profile modal/tab without clicking `Continuar`, and returns diagnostics to the main run. Keep this scoped to `apps/extension`; no `apps/web`/Freelance changes.

## LinkedIn Jobs Disposable Resolver Validation
The extension now resolves hrefless LinkedIn Jobs apply CTAs through a disposable background tab. Next spec should be created only after manual smoke validates: external ATS URL captured, disposable tab closed, no main-tab feed redirect, no automatic `Continuar` click on share-profile modal, and diagnostics distinguish `resolved_tab`, `timeout`, `click_failed`, and `share_profile_blocked`.

## Freelance Outreach Retry Note
Recent hotfix: duplicate first-contact checks should use the latest outreach event. `failed_send` must allow a retry, while pending/sent events still block duplicates. Preserve this behavior in future Twilio delivery-status and outreach-history specs.

## LinkedIn Jobs Current Tab Hrefless Resolver Note
Recent extension hotfix: disposable tabs do not always reproduce the active LinkedIn Jobs SPA state for `BUTTON.jobs-apply-button` without `href`. For hrefless CTAs, the resolver now clicks the verified CTA in the current LinkedIn Jobs tab, watches for the opened non-LinkedIn ATS tab, closes that auxiliary tab, and rejects LinkedIn Jobs/search URLs as unresolved. Future specs should add operator-visible diagnostics for this path and confirm it does not navigate the main search tab.

## LinkedIn Jobs Hrefless Resolver Loop Guard Note
Recent extension hotfix: hrefless `Candidatar-se` resolution is memoized per job/page/label so polling cannot click/open the same ATS URL repeatedly. Future specs should preserve one-click-per-job behavior and expose retry only as an explicit operator action.

## LinkedIn Jobs External URL Stabilization Note
Recent extension hotfix: after a non-LinkedIn apply tab appears, wait briefly and read the latest tab URL before closing it, because ATS links may pass through shorteners or tracking redirects. Preserve this stabilization delay in future resolver work.

## LinkedIn Jobs External Tab And Source Alias Note
Recent extension hotfix: ATS tabs opened from LinkedIn apply clicks may not expose `openerTabId`, so resolver code should track new external tabs in the same window during the resolution window. Source matching must preserve aliases such as `job-boards.greenhouse.io` for Greenhouse and company subdomains under `inhire.app`.

## LinkedIn Jobs Source Substring Match Note
Recent extension hotfix: source matching for LinkedIn Jobs external ATS URLs should remain substring-based against selected source signals, not strict host equality. A URL should match when it contains the selected source key, configured domain, or known alias; inactive or unselected sources must still be ignored.
