## Command
speckit.plan

## Feature
Extension Search History

## Active Spec
`specs/017-extension-search-history/spec.md`

## Objective
Plan the Full-time extension Search History feature: persist and display LinkedIn Search run history plus query/keyword aggregates using raw LinkedIn result counts captured before dedupe, while keeping duplicate/rejected/accepted/AI counters separate.

## Current Context
- The feature is extension-only for the `Full-time` lane. Do not change `apps/web` Freelance leads, templates, outreach batches, Email settings, WhatsApp settings, or provider configuration.
- Existing `job_search_runs` already has `search_kind`, `requested_keywords`, `search_query`, `search_sort_order`, `inspected_count`, `accepted_count`, `rejected_count`, `duplicate_count`, AI filter counters, timestamps, status, and diagnostics.
- The extension Search UI already tracks `postsFound` during capture feedback, saves recent keyword badges, supports sort and optional `Past month`, and can link to run/candidates/opportunities diagnostics.
- A 2026-07-13 extension hotfix made AI Field Assistant textareas on Lever/Osmind eligible again by avoiding false sensitive-field matches on `cards[...]`; preserve that behavior while planning Search History.
- Planning must decide the smallest compatible way to persist/expose the raw LinkedIn result count discovered by the extension before dedupe/filtering, without treating missing historical values as zero.

## Requirements To Preserve
1. Add a first-class History tab/view in the Full-time extension popup.
2. Show recent LinkedIn Search runs with query text, keyword tokens, status, run time, raw LinkedIn results, accepted, rejected, duplicate, AI counters, and safe diagnostics.
3. Add aggregates by exact full query and by keyword/token: frequency, total raw results, average raw results, accepted count, duplicate count, latest run.
4. Never compute raw result totals by subtracting duplicates/rejections/skips/AI-filter outcomes.
5. Treat old runs without raw result count as unknown/unavailable, not zero.
6. Preserve owner scoping and existing Full-time Search, Jobs, Gmail, AI Field Assistant, career-page search, and Freelance web behavior.

## Expected Output
Generate `plan.md` plus required design artifacts for `017-extension-search-history`, including data model/contract updates, extension UI contract, tests, migration/backfill strategy, and validation checklist.
