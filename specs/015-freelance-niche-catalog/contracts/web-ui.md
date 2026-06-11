# Web UI Contract: Freelance Niche Catalog Governance

## Placement

The catalog governance UI belongs inside the `Freelance` web app, preferably under `Settings` as `Nichos`/`Niches` or an equivalent internal admin entry point. It must not become a public landing page or a mixed Full-time/Freelance screen.

## Catalog Audit View

Must show:

- total approved entries
- total enabled entries
- baseline count expected from the approved reference seed
- missing baseline entries
- extra approved entries
- duplicate slug/alias conflicts
- conversion-hint mismatches
- encoding/source-name issues
- entries missing source evidence
- candidate counts by status

Each finding row must show:

- severity
- finding type
- current catalog value
- expected/reference value
- source path or note
- recommended operator action

Required actions:

- open/edit affected niche
- open candidate when finding is candidate-related
- mark mismatch as documented override when allowed
- distinguish niche catalog candidates from real scraped business leads/opportunities

Forbidden:

- CSV export/import
- automatic bulk approval without review
- Full-time/job/resume/candidature labels
- creating real leads or outreach targets from screenshot/reference candidates

## Approved Niche Management

The operator can:

- add a niche
- edit display name
- edit market applicability
- edit conversion hint and source
- edit aliases/default query terms
- edit source path/note
- enable or disable
- change sort order
- merge into another niche when duplicate

The form must:

- show normalized slug preview
- warn on duplicate slug/alias
- require source evidence
- explain that conversion hints are estimates
- explain that old campaigns keep snapshots

## Candidate Review

This section is for niche catalog candidates only. Real business leads/opportunities must come from scraper/API/provider flows and are reviewed in the lead/prospecting areas, not in this catalog list.

Candidate list must show:

- proposed normalized name
- market applicability
- proposed conversion hint
- source path/excerpt
- suggested matching approved niche when detected
- status and decision reason

Actions:

- approve into catalog
- reject with reason
- defer with reason
- mark already covered by an existing niche
- preserve operator-provided niches such as `Igrejas` when they have source evidence, even if absent from screenshots

Approving must:

- require source evidence
- pass duplicate slug/alias validation
- create an enabled or disabled approved niche depending on operator choice
- not create any business lead, opportunity, email, WhatsApp action, or outreach target

## Campaign Creation Interaction

Campaign creation must:

- list only enabled approved catalog entries
- show readable display names, not mojibake raw names
- show conversion hints as estimates
- use query terms/aliases only for discovery behavior, not as extra visible duplicate options

Old campaign cards/detail pages must:

- continue displaying `nicheNameSnapshot` and `conversionHintSnapshot`
- remain readable if the catalog item is later disabled, renamed, or merged
