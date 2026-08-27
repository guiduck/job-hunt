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
Manual diagnostics on 2026-07-27 and 2026-08-14 showed `BUTTON.jobs-apply-button[data-live-test-job-apply-button]` has no `href`, and duplicating `/jobs/search/` in a disposable tab can recreate only another LinkedIn search tab instead of clicking the active CTA. Do not keep guessing selectors. Specify a safe resolver that clicks only the verified apply CTA in the current LinkedIn Jobs tab, observes the opened non-LinkedIn tab, captures the stabilized external URL, closes only that auxiliary external tab, and returns diagnostics to the main run. Keep this scoped to `apps/extension`; no `apps/web`/Freelance changes.

## LinkedIn Jobs Current Tab Resolver Validation
The extension resolves hrefless LinkedIn Jobs apply CTAs by clicking the verified CTA in the current LinkedIn Jobs tab and observing the opened non-LinkedIn auxiliary tab. Next spec should be created only after manual smoke validates: external ATS URL captured, external auxiliary tab closed, no duplicate `/jobs/search/` tab opened, no automatic `Continuar` click on share-profile modal, and diagnostics distinguish `resolved_tab`, `timeout`, `script_no_result`, `click_failed`, and `share_profile_blocked`.

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

## LinkedIn Jobs Detail Pane Selection Note
Recent extension hotfix: when validating that a LinkedIn Jobs result card selected the right job, do not match job titles against document.body; the left results list contains the same titles. Wait for the real detail pane text or matching job id before inspecting apply CTAs.

## LinkedIn Jobs Internal Href Resolver Note
Recent extension hotfix: visible external Candidatar-se CTAs may carry an internal LinkedIn /jobs/view/...alternateChannel=search href. Treat those like hrefless CTAs: click the verified CTA in the current LinkedIn Jobs tab, observe the opened non-LinkedIn ATS tab, then source-match the stabilized external URL. Do not classify a job as Easy Apply from arbitrary detail text; require an Easy Apply/Candidatura Simplificada control label.

## LinkedIn Jobs Apply CTA Ranking Debug Note
Recent extension hotfix: the source matcher is substring-based (`canonicalUrl.includes(signal)`), but the content script can fail before matching if it chooses the wrong `Candidatar-se` element. Preserve the ranked CTA selection and debug logs: `selected LinkedIn apply CTA candidate`, `LinkedIn apply resolver result`, and `LinkedIn external source match` with `matchedSignals`. InHire URLs such as `premiersoft.inhire.app` / `brq.inhire.app` and Greenhouse URLs containing `greenhouse` must match selected source strings by includes. No migration is needed for this area.

Recent extension hotfix: curated ATS sources are now InHire, Ashby, Lever, Greenhouse, Gupy, SmartRecruiters, Trampos, and Catho; Teamtailor was removed. Preserve substring matching by selected source aliases instead of exact host matching. No migration is needed for this area.


## LinkedIn Jobs URL-Only Source Debug Note
Recent extension diagnostic: for LinkedIn Jobs external apply capture, the only source-match decision should be whether the resolved external tab URL contains any alias for the selected ATS sources. Future specs should preserve URL-only diagnostics (`canonicalApplyUrl`, `searchableUrl`, `selectedSourceKeys`, `checkedSources`, `matchedSignals`, `accepted`, `reason`) and avoid noisy page-link/resource snapshots unless explicitly requested. No migration is needed for this area.

## LinkedIn Jobs Observed External URL Fallback Note
Recent extension hotfix: if the apply resolver observes any external tab URL during the click window, that URL must be treated as the resolved apply URL even if the script click result is empty or the stabilized resolver later returns null. Future specs must prevent false `missing_external_apply` when `observedApplyTabs` already contains `isExternal: true`. No migration is needed for this area.

## LinkedIn Jobs Pagination Advance Guard Note
Recent extension hotfix: do not trust the local page counter alone. After clicking LinkedIn Jobs pagination, verify real advancement by comparing the URL `start` offset and visible job keys before/after the click. If neither changes, end with `pagination_stalled` and keep the `LinkedIn Jobs pagination advance result` log for manual debugging. No migration is needed for this area.

## LinkedIn Jobs Strict Pagination Note
A captura da extensao deve contar pagina de LinkedIn Jobs apenas quando o parametro start da URL avanca. Nao tratar isible_jobs_changed como pagina nova, pois a lista virtualizada muda os cards durante scroll. Se nao houver novo start, registrar pagination_stalled e manter logs de previousStart/currentStart. Sem migration.

## LinkedIn Jobs Long Run Timeout Note
Recent extension hotfix: the background timeout for LinkedIn Jobs external capture now scales with `maxPages` (`8min/page`, minimum 15min and capped at 3h). Future specs should prefer incremental persistence for accepted candidates so a late timeout/context invalidation cannot discard already accepted jobs. No migration is needed for this area.

## Next Spec Candidate - LinkedIn Jobs Assisted Search Reliability

Use Spec Kit for the extension only. Do not change the freelance web app. Validate assisted LinkedIn Jobs search and direct LinkedIn Jobs search as two entry routes into the same capture pipeline. Add regression coverage or documented diagnostics for Chrome message channel closure during LinkedIn route changes, accepted external URL persistence, and pagination completion across high page counts.


## LinkedIn Jobs Assisted Entry URL Note
Recent extension hotfix: assisted LinkedIn Jobs search must open https://www.linkedin.com/jobs/ first, then click the visible Exibir todas/Show all entry. Do not start assisted mode at /jobs/search-results/, and do not treat /jobs/search-results/ as successful unless real job cards/results are rendered. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Opening Wait Note
Recent extension hotfix: tab loading waits must not block forever on LinkedIn Jobs SPA navigation. Preserve the current-tab status check plus bounded timeout before content-script capture, and surface operator-visible failure if the tab cannot be contacted. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Tab Creation Note
Recent extension hotfix: LinkedIn Jobs tab creation should use the callback-based helper with a bounded timeout, then emit opening progress with sourceTabId immediately after Chrome returns the tab. Future changes should keep a visible operator failure when Chrome cannot create the tab. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Popup Command Timeout Note
Recent extension hotfix: the popup must send START_LINKEDIN_JOBS_EXTERNAL_CAPTURE with a callback-based chrome.runtime.sendMessage wrapper and bounded timeout. Preserve an operator-visible failure before tab creation when the background/service worker does not respond. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Open Tab Before Run Note
Recent extension hotfix: open the LinkedIn Jobs tab before creating the API run, then send an initial popup ack with tabId and continue capture through progress events. Future changes must not let API run creation block tab opening. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Content Script Reinject Note
Recent extension hotfix: when CAPTURE_LINKEDIN_JOBS_EXTERNAL fails with a missing receiving end, the background should discover the LinkedIn Jobs content script from chrome.runtime.getManifest(), inject it with chrome.scripting.executeScript, and retry before failing the run. Preserve this for LinkedIn SPA/HMR resilience. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Assisted Show All Click Note
Recent extension hotfix: assisted search should click Exibir todas/Show all using the closest actionable target ([href], utton, or [role=button]) with pointer/mouse events, retry up to 3 attempts, and fall back to an available jobs search href. Preserve logs for attempt, target, and href. Keep this scoped to apps/extension; no apps/web/Freelance changes.


## LinkedIn Jobs Search Results Surface Note
Recent extension hotfix: treat both /jobs/search/ and /jobs/search-results/ as valid LinkedIn Jobs search surfaces. Job card selection should prefer a single stable /jobs/view anchor per card instead of trying multiple parent targets, because LinkedIn virtualized lists can alternate selection between neighboring cards. Keep this scoped to apps/extension; no apps/web/Freelance changes.



## LinkedIn Jobs Result List Scroll Boundary Note
Recent extension hotfix: LinkedIn Jobs capture must never use `window.scrollBy()` as a fallback for result pagination. Scroll only the left results-list container or a scrollable ancestor of job cards; if it cannot advance or reaches the end, attempt real pagination. Preserve the 25-new-jobs-per-page cap so LinkedIn's virtualized list does not behave like an infinite first page.


## LinkedIn Jobs Apply CTA Activation Note
Recent extension hotfix: keep the current-tab resolver for hrefless or internal LinkedIn apply CTAs, but activate the selected CTA with focus plus pointer/mouse events before the fallback `.click()`. Future work should expose resolver failure reasons directly in the popup without risking TSX encoding changes.


## LinkedIn Jobs Resolver Debug Bridge Note
Recent extension hotfix: keep LinkedIn Jobs resolver debugging visible in the service worker console via `LINKEDIN_JOBS_DEBUG`. Future fixes should use these events before changing navigation/click behavior again.


## LinkedIn Jobs Detail Selection Normalization Note
Recent extension hotfix: LinkedIn card titles may include duplicated text and badges such as `(Vaga verificada)`. Normalize titles before matching the detail pane, and use the service-worker debug events `job_detail_selection_attempt/matched/failed` before changing CTA resolver behavior.

## LinkedIn Jobs Full Flow Debug Note
Recent extension instrumentation emits service-worker debug events for every transition from result card click to external apply URL resolution. Future fixes should first inspect whether the failure is `job_detail_selection_failed`, `no_apply_cta_candidate`, or `apply_resolver_url_result` with no external URL. Do not change source matching until the logs show a resolved external URL that is being rejected.

## LinkedIn Jobs Direct Href Source Decision Note
Recent logs can show `selected_apply_cta_candidate` followed by `apply_href_direct_external_candidate` and no `request_apply_resolution`. That means the CTA had a decodable LinkedIn safety/redir href and the extension extracted the ATS URL without opening a tab. If the candidate is still not saved, inspect `external_source_url_decision`: the remaining issue is selected-source matching, not CTA clicking.

## LinkedIn Jobs Hrefless Button Current Tab Resolver Note
Recent extension hotfix: when LinkedIn renders `Candidatar-se` as `BUTTON.jobs-apply-button[data-live-test-job-apply-button]` with `href=null`, resolve it by clicking the verified CTA in the current LinkedIn Jobs tab in the page `MAIN world`, waiting for the full tab-observation window, capturing the first non-LinkedIn URL, and closing only the opened external auxiliary tab. Preserve `apply_resolution_strategy=current_tab_button_click` and `script_no_result` diagnostics for cases where the injected click is aborted or returns no structured result. This supersedes the discarded duplicate `/jobs/search/` disposable-tab attempt for hrefless buttons. Keep this scoped to `apps/extension`; no `apps/web`/Freelance changes.

## LinkedIn Jobs Injected CTA Click Diagnostic Note

2026-08-14: the hrefless `Candidatar-se` button resolver was narrowed to a background injection issue, not a CTA selector issue. Logs showed `selected_apply_cta_candidate`, `apply_resolution_strategy=current_tab_button_click`, and `apply resolver request`, followed by `scriptReturnedNoResult=true` and `observedApplyTabs=[]`. The injected function was referencing the background helper `waitInPage`, which is not available after `chrome.scripting.executeScript({ func })` serializes the function into the LinkedIn page. The resolver now uses an injected-page-local delay helper and returns structured diagnostics (`phase`, selected element, dispatch results, tab snapshots) instead of failing as `null`.

## LinkedIn Jobs Duplicate External Tab Fix Note

2026-08-14: after the hrefless apply button resolver started executing correctly, logs showed one resolver window observing two external candidate tabs (`candidateExternalTabIds: Array(2)`) for the same `Candidatar-se` CTA. The injected script was still dispatching a synthetic `MouseEvent("click")` and then calling `element.click()`, which could activate LinkedIn's apply handler twice. The resolver now dispatches only pointer/mouse hover/down/up events and uses a single final `element.click()` activation. Cleanup also closes every observed external candidate tab, not only the last `openedTabId`.

## Freelance WhatsApp Template Follow-up Candidate

Recent implementation: apps/web can send first-contact WhatsApp outreach through a Twilio approved content template when `TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID` is configured. Future Spec Kit work should focus on delivery-status callbacks, operator-visible template/readiness diagnostics, and switching from template first contact to freeform AI follow-up after the lead replies. Preserve the existing checkbox bulk outreach flow and do not remove the deterministic `primeiro_contato_site_v1` variable mapping.

## Freelance WhatsApp English Template Note

Recent web implementation: first-contact WhatsApp now supports one Twilio Content SID per language. Keep `TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID` for Portuguese and use `TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN` for the English template. Future specs should preserve `twilioWhatsAppTemplate.templateLanguage`, the same 9-variable mapping across PT/EN templates, and the existing checkbox bulk outreach approval flow.

## Freelance WhatsApp Inbox Follow-up Candidate

Recent web implementation: apps/web has a Twilio WhatsApp inbox MVP backed by `WhatsAppConversation` and `WhatsAppMessage`, inbound webhook `POST /api/twilio/whatsapp/webhook`, and page `/inbox`. Future specs should harden delivery status callbacks, media/attachments, read/assignment states, multi-user routing beyond `DEFAULT_FREELANCE_USER_ID`, and optional WebSocket/Redis live updates. Preserve the existing Twilio template first-contact flow and use freeform replies only after the lead has responded/opened the WhatsApp customer-care window.


## Freelance WhatsApp Delivery Status And Retry Candidate

Specify the next Freelance WhatsApp hardening slice: receive Twilio delivery status callbacks, persist queued/sent/delivered/failed transitions, surface the Twilio error code and safe diagnostic in the review modal and inbox, and define an explicit operator-confirmed retry path for previously contacted test leads. Preserve the exact PT/EN ContentSid mapping, the 9 validated ContentVariables, automatic lead-language selection, eligibility skipping, and the checkbox-to-floating-action-to-review-modal workflow.


## Next Candidate: Immutable Web Images And Zero-Downtime Deployment

Specify a production deployment flow that builds immutable web images, runs database bootstrap as a one-off task, performs health checks before traffic switches, and avoids stale Next.js Server Action requests during releases.


## Next Candidate: Twilio Sender Preflight

Specify a safe Twilio sender preflight that checks the configured Account SID against the Senders API, verifies that `TWILIO_WHATSAPP_FROM` is present and ONLINE, caches only non-secret status metadata, and surfaces actionable configuration diagnostics before an operator approves delivery.

## Freelance WhatsApp Inbox Reconciliation Note

Preserve immediate inbox persistence for every Twilio-accepted bulk WhatsApp message, signed inbound
and delivery-status webhooks, monotonic status transitions, and the idempotent historical backfill.
A future inbox spec may add media, assignment, and search while preserving the current
Redis/WebSocket invalidation path and 30-second polling fallback.

## Freelance WhatsApp Realtime And Unread Note

The inbox now uses Redis pub/sub and a dedicated WebSocket service for immediate invalidation, with
PostgreSQL as the source of truth and a 30-second polling fallback. Preserve Twilio signature
validation against the exact public webhook URL behind Caddy. Unread badges represent inbound
messages not yet opened; opening the conversation clears them. Future work may add media,
assignment, search, and mobile push, but must not reinterpret unread as unanswered.

## Brazilian WhatsApp Phone Integrity Note

Preserve shared E.164 normalization for Brazilian legacy mobile numbers at lead ingestion, review,
inbox matching, and final provider submission. Never rewrite `TWILIO_WHATSAPP_FROM`; it must remain
the exact sender registered by Twilio. Historical delivery records must not be silently rewritten.

## WhatsApp Timeline Language Note

Twilio first-contact variable 7 contains the full estimated timeline. Preserve deterministic
localization so numeric day values use `dias` in `pt-BR` and `days` in English, regardless of the
language in which the shared seller setting was originally stored.

## Database Phone Constraint Note

Preserve PostgreSQL E.164 constraints and the stricter Brazilian fixed/mobile shape. New country
support should add explicit country-aware normalization without weakening Brazilian validation.
Duplicate outreach protection must compare the actual recipient so corrected contacts can be retried
without enabling repeated sends to the same address.


## WhatsApp Contacted-State Invariant

Preserve the distinction between preparation and actual provider acceptance: generated, edited,
queued, interrupted, and failed items must not be presented as already contacted. Only a persisted
sent event for the same normalized recipient may block another first-contact attempt. Any future
retry/override UI must remain explicit and auditable, and must not weaken this default protection.


## Global WhatsApp Retest Maintenance

Preserve the preview-first global reset command for exceptional test resets. Production-facing retry
features should prefer per-lead operator overrides with an audit marker instead of deleting sent
events globally. Inbox conversations and provider logs must remain immutable during dedupe resets.
