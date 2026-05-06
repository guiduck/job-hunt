# Implementation Plan: LinkedIn AI Filters

**Branch**: `008-linkedin-ai-filters` | **Date**: 2026-05-05 | **Spec**: `specs/008-linkedin-ai-filters/spec.md`
**Input**: Feature specification from `specs/008-linkedin-ai-filters/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Continuity Context

**Roadmap Phase**: Fase 3.5. Filtros inteligentes pos-captura  
**Action Plan Step**: 4. Revisao operacional / 6. Tracking e feedback loop de emprego  
**Related Handoff**: `docs/handoff.md`  
**Latest Working Prompt**: `/speckit-plan` for `specs/008-linkedin-ai-filters/spec.md` after clarification that AI filters are disabled by default, low confidence below 0.70 falls back, and fallback uses existing deterministic/local rules.

> Before closing this plan, update `docs/handoff.md` with current status, next recommended step,
> and the latest working prompt.

## Summary

Refactor the current Plasmo `Full-time` Search flow so LinkedIn search uses only text query plus recent/relevant sort order, then move remote-only, onsite/hybrid/presential exclusion, accepted/excluded regions, and excluded keywords into an optional post-capture AI filter step. The extension will send the broad captured posts plus opt-in filter settings to the API as additive run payload fields. The worker will evaluate accepted-looking candidates after parsing/normalization and before opportunity creation, recording pass/reject/fallback/failed/skipped decisions, confidence, reason, and normalized signals on candidates and run counters. Missing AI configuration, invalid AI output, provider failures, and confidence below 0.70 fall back to existing deterministic/local rules so capture remains usable and existing runs continue to render.

## Technical Context

**Language/Version**: Python 3.11+ for API/worker; TypeScript 6.x and React 19 in the Plasmo extension  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic Settings, psycopg, pytest, httpx; Plasmo, React, Zustand; existing optional OpenAI-style analyzer configuration via backend/worker env vars  
**Storage**: PostgreSQL via existing local Docker Compose; additive migration over `job_search_runs` and `job_search_candidates`, with no destructive changes to opportunities  
**Testing**: pytest for API contract/integration and worker unit/integration tests; extension `npm run typecheck`; focused manual LinkedIn capture smoke test  
**Target Platform**: Local Windows development with bash-compatible commands, Docker Compose for API/worker/PostgreSQL, Chrome/Plasmo extension pointed at `PLASMO_PUBLIC_API_BASE_URL`; later Render API/worker/Postgres remains compatible  
**Project Type**: Full-stack local operator workflow: FastAPI service, separate worker process, PostgreSQL persistence, Plasmo Chrome extension UI  
**Performance Goals**: Search UI remains responsive while editing filters; run creation returns after enqueueing/capturing and never waits for AI; worker filter evaluation handles at least 50 captured posts per run; run/candidate diagnostics load in under 1 second for local datasets  
**Constraints**: AI filters disabled by default; AI secrets never reach the extension; LinkedIn search URL uses only text query and sort order; long-running filtering stays outside HTTP request handling; AI output must be structured and validated; confidence below 0.70 falls back; schema/API changes are additive; `Full-time` and `Freelance` remain separated  
**Scale/Scope**: Single-user local-first extension flow with owner-scoped API data, tens to hundreds of captured posts across local runs, one worker process polling pending runs, no web app, no Google Maps freelance bot, no auto-apply or email-send behavior change

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual Opportunity Search**: PASS. The feature targets `opportunity_type=job` / `Full-time` Search only and does not change `Freelance` contracts or UI.
- **II. Specialized, Evidence-Backed Discovery**: PASS. LinkedIn capture stays broad and evidence-backed, with `source_query`, `source_url`, captured text, provider state, and filter decisions preserved for diagnostics.
- **III. Structured Opportunity Records**: PASS. The plan adds structured filter settings, decisions, confidence, reasons, signals, and counters rather than storing opaque AI text only.
- **IV. Human-Reviewed Multi-Channel Outreach**: PASS. Filtering affects whether a candidate becomes a reviewable opportunity; it does not send email, apply to jobs, or bypass human review before outreach.
- **V. Compatible Architecture and Operator Workflow**: PASS. The extension remains the local operator UI, API records commands/query results, and worker performs post-capture filtering outside HTTP request handlers.
- **Additional Constraints**: PASS. FastAPI/PostgreSQL/Docker Compose/Render direction remains intact, AI secrets stay backend/worker-only, and public/user-provided captured data remains the analysis source.
- **Development Workflow**: PASS. This plan creates research, data model, OpenAPI contract, quickstart, updates active agent context, and updates `docs/handoff.md`.

## Project Structure

### Documentation (this feature)

```text
specs/008-linkedin-ai-filters/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
  api/
    alembic/versions/
    app/
      api/routes/
        job_search_runs.py
        opportunities.py
      core/config.py
      models/
        job_search_run.py
        opportunity.py
      schemas/
        job_search_run.py
        opportunity.py
      services/
        job_search_run_service.py
        opportunity_service.py
    tests/
      contract/
      integration/
      unit/
  worker/
    app/
      core/config.py
      jobs/linkedin_job_search.py
      services/
        job_ai_filter.py
        job_candidate_normalizer.py
        job_review_analyzer.py
        linkedin_candidate_parser.py
    tests/
      integration/
      unit/
  extension/
    background.ts
    contents/linkedin-search.ts
    src/
      api/
      capture/
      components/popup/
      store/
      styles/
docs/
docker-compose.yml
```

**Structure Decision**: Extend the current `apps/api`, `apps/worker`, and `apps/extension` architecture. API code owns additive run/candidate payloads, schemas, owner-scoped query contracts, and persistence. Worker code owns post-capture AI filter evaluation, deterministic fallback, run counters, and opportunity creation gates. Extension code owns the Search UI split, broad LinkedIn URL building, capture payload shape, and diagnostics display. No new web app, queue service, shared package, or external service boundary is introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.

## Change Impact Review

**Change Type**: Additive schema, API contract, worker processing, and extension UI refactor  
**Primary Surface**: Search popup inputs, LinkedIn capture payload, job-search run/candidate contracts, worker candidate acceptance pipeline, database migrations  
**Compatibility Risk**: Medium. Search UI behavior changes visibly and candidate acceptance gains a new optional gate, but fallback and optional fields preserve existing flows.

**Potentially Affected Areas**:

- API models/schemas/routes/services, Alembic migrations, owner-scoped contract tests
- Worker run loop, candidate parser/normalizer handoff, optional AI analyzer config, fallback and counter aggregation
- Extension Search UI, capture URL builder, content capture payloads, API types/client, popup store, diagnostics rendering
- Docs, `.env.example`, quickstart, focused API/worker/extension validation

**Failure Modes**:

- The extension may still apply old local remote/region/keyword filters before capture, hiding useful posts.
- AI secrets or provider config could accidentally be exposed to extension types or responses.
- Low-confidence or invalid AI output could reject candidates instead of falling back.
- Rejected candidates could lose evidence, making false positives/negatives impossible to debug.
- Existing runs without filter fields could fail serialization or UI rendering.
- Duplicate candidates could be counted as AI-rejected, confusing run diagnostics.
- Owner scoping regressions could expose another user's run/candidate diagnostics.

**Recommended Safeguards**:

- Use additive nullable/defaulted fields and preserve old response fields.
- Keep AI filters disabled by default and never include AI secrets in extension payloads or responses.
- Apply AI filtering only after capture and parsing/normalization, before opportunity creation for non-duplicate accepted-looking candidates.
- Treat confidence below 0.70, missing config, invalid JSON, rate limit, and unavailable provider as fallback to deterministic/local rules.
- Store raw evidence and filter decision metadata for all inspected candidates, including rejected candidates.
- Add contract/integration tests for old runs, ownership, pass/reject/fallback/failed/skipped counters, and extension type coverage.

## Phase 0 Research

See `specs/008-linkedin-ai-filters/research.md`.

Key decisions:

- Keep LinkedIn search URL construction limited to query text and sort order; all remote/region/exclusion logic becomes optional post-capture filtering.
- Store AI filter settings and outcomes on runs/candidates through additive fields, not by overloading existing review `analysis_status`.
- Introduce `ai_filter_status` separately from existing review analysis status so search filtering and review scoring remain distinguishable.
- Run AI filtering inside the worker after parsing/normalization and before opportunity creation for non-duplicate accepted-looking candidates.
- Fall back to deterministic/local rules for missing config, invalid output, provider issues, and confidence below 0.70.

## Phase 1 Design

See:

- `specs/008-linkedin-ai-filters/data-model.md`
- `specs/008-linkedin-ai-filters/contracts/openapi.yaml`
- `specs/008-linkedin-ai-filters/quickstart.md`

## Post-Design Constitution Check

- **Dual Opportunity Search**: PASS. Data model and contracts keep this scoped to `job` search while preserving future `Freelance` compatibility.
- **Evidence-Backed Discovery**: PASS. Captured evidence, source URL/query, and AI filter reasons/signals are retained on rejected and accepted candidates.
- **Structured Records**: PASS. Filter settings, statuses, confidence, reason, counters, and signals are structured fields with additive migrations.
- **Human-Reviewed Outreach**: PASS. Filtering only controls opportunity acceptance; outreach remains reviewed, approved, and evented through existing flows.
- **Compatible Architecture**: PASS. Worker owns long-running filtering, API owns owner-scoped persistence/contracts, and extension owns operator UI.
- **Additional Constraints**: PASS. AI secrets stay backend/worker-only, PostgreSQL remains the source of truth, and no scraping bypass behavior is introduced.
- **Development Workflow**: PASS. Plan artifacts, active agent context, and handoff are updated for the new feature.
