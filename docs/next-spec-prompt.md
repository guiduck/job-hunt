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
