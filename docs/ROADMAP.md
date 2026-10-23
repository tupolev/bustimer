# BusTimer — Implementation roadmap

Last reviewed: 2026-10-23 · Current application version: **0.9.1** (tests rollout)  
[Live app](https://tupolev.github.io/bustimer/) · [Repository](https://github.com/tupolev/bustimer)

> **Working agreement:** update this checklist in the **same commit or PR** as the implementation whenever possible. Mark a task complete only after its acceptance criteria have been met. Code committed ≠ feature verified in production.

## Status legend

- [x] Implemented and evidenced in repository (not necessarily browser-tested)
- [ ] Not yet complete; the note identifies whether it is implemented but **unverified**, partially implemented, or not started
- **Blocked:** dependency or upstream issue; record next action and do not invent a successful test

## P0 — Reliability and validation (do before expanding further)

- [ ] **P0-01 — Automated JavaScript checks.** **Implemented, CI verification pending:** `scripts/check-js.mjs` checks inline JavaScript, service worker and enabled-country JSON. `.github/workflows/ci.yml` runs on pushes and PRs. **Done when:** a GitHub Actions run succeeds and a deliberately malformed test fixture is rejected.
- [ ] **P0-01b — Unit-test battery in CI.** **Initial 7 cases implemented, CI verification pending:** `tests/core.test.mjs` uses Node's built-in test runner; covers provider mapping, provider IDs, realtime deduplication, stop merging, geographic filtering and malformed JS detection. **Done when:** the GitHub Actions run passes and additional fixtures cover service calendars, midnight/DST, cancelled departures and stale data.
- [ ] **P0-01c — Integration tests in CI.** **Initial mocked provider integration scenarios implemented, CI result pending:** `tests/providers.integration.test.mjs` verifies EMT fallback when Transitous fails, realtime priority, total outage and isolation of VBB/DB legacy IDs. Still needed: localStorage migration, full add/save/refresh UI workflow and a successful GitHub Actions run. **Done when:** all integration fixtures pass in CI and an E2E flow is verified.
- [ ] **P0-01d — CI quality gate for pull requests.** **Workflow implemented, verification pending:** require `checks` in branch protection after a successful CI run; preserve a way to roll back a broken release.
- [ ] **P0-02 — Browser smoke tests on GitHub Pages.** Test each tab, language, theme, favorite save/remove, PWA update, offline shell and restored localStorage. **Done when:** reproducible Playwright or equivalent tests run in CI and are documented.
- [ ] **P0-03 — Validate Transitous API integration.** Confirm request paths, schemas, CORS, stop search, timetable, delay, cancellation and error behavior. **Done when:** fixtures and at least one tested stop per enabled country pass.
- [ ] **P0-04 — Fix provider identity and stop matching.** Avoid incorrect merging of different platforms or stop IDs; preserve source-specific IDs and coordinates. **Done when:** tests cover nearby distinct platforms, aliases and duplicates.
- [x] **P0-05 — Direction-aware monitored lines (implementation).** New favorites store the selected destination/direction and filter departures accordingly; opposite directions can be saved separately. Legacy favorites without a direction continue to display both until re-added. Browser verification remains under P0-02.
- [ ] **P0-06 — Robust error / offline / stale-data states.** Never represent stale data as live. **Done when:** offline, API failure and expired schedule scenarios are explicitly labeled and tested.
- [ ] **P0-07 — Check GitHub Pages deployment.** Validate generated URLs, service-worker update cycle, cache migration and required data files on a published build. **Done when:** live pages and a fresh private browser session pass.

## P1 — Complete the core markets (Germany & Spain)

- [x] **P1-01 — PWA baseline.** Static site, responsive tabs, ES/EN/DE, light/dark/system and local persistence implemented.
- [x] **P1-02 — Country-level selector.** User chooses Germany or Spain, not city-specific backends; France and Portugal later added experimentally.
- [x] **P1-03 — Provider adapters.** Internal Transitous, VBB, DB and EMT adapters with basic retry-by-alternative behavior and source attribution.
- [x] **P1-04 — Málaga GTFS importer.** Official EMT feed is converted to per-stop JSON; scheduled GitHub Actions updater and initial generated files exist.
- [ ] **P1-05 — Málaga GTFS end-to-end verification.** Test calendars, exceptions, >24h trips, midnight and DST (Europe/Madrid), and stop+line predictions on Pages. Import implemented, testing outstanding.
- [ ] **P1-06 — Spanish national GTFS ingestion.** Catalogue official NAP/operator feeds; validate licenses, ingest stable GTFS, generate usable country-specific stop index and service calendars. Not started.
- [ ] **P1-07 — German nationwide static timetable fallback.** Verify national GTFS/DELFI access and create a manageable cache/source independent of live APIs. Not started.
- [ ] **P1-08 — Germany regional coverage beyond VBB.** Integrate and validate VRS/KVB, VRR/Rheinbahn, plus other regional feeds where legally/technically possible. **Partial progress (v0.9.1):** DB-backed stop search is now available for explicit NRW-location queries; `scripts/build_vrs.py` and manual `vrs-gtfs.yml` workflow prepare official scheduled GTFS conversion, but no verified VRS export or app integration yet. Not full VRS/VRR support. Investigate VRS's daily open GTFS and VRR licensing/CORS before a dedicated rollout.
- [ ] **P1-09 — Realtime quality tiers.** Prefer confirmed realtime updates over static schedules; show provenance, last update, delay and missing-delay distinction accurately. Basic implementation exists; cross-provider merging and source quality still unverified.
- [ ] **P1-10 — Dataset freshness and attribution checks.** Date stamps, data expiry, source licenses and copyright in Help for all enabled feeds. Some attribution exists; comprehensive verification pending.

## P2 — First neighboring countries

- [x] **P2-01 — External country catalog.** `countries.json` holds enabled core markets and gated candidates; app reads it with fallback.
- [x] **P2-02 — France and Portugal experimental selection.** Country search/departure provider wired to Transitous; no confirmed nationwide completeness.
- [ ] **P2-03 — France production verification.** Test Paris/Lyon plus regional bus/tram and obtain official GTFS/GTFS-RT fallback where permitted. Implementation experimental, browser verification pending.
- [ ] **P2-04 — Portugal production verification.** Test Lisboa/Porto plus local services and official GTFS fallback. Implementation experimental, browser verification pending.
- [ ] **P2-05 — Next German neighbors.** Assess Netherlands, Belgium, Luxembourg, Austria, Switzerland, Poland, Czechia, Denmark; enable **one at a time** only with working journeys and attribution.
- [ ] **P2-06 — Spain neighbors.** Assess Andorra separately and improve cross-border links with Portugal/France.
- [ ] **P2-07 — More EU/European countries.** Expand to Italy, Nordic countries and others after core quality thresholds, respecting non-EU jurisdictions separately.

## P3 — Architecture, sustainability and UX

- [ ] **P3-01 — Split monolithic `index.html`.** Move country config, providers, normalizers, UI and translations into testable modules without requiring a heavy build.
- [ ] **P3-02 — Provider health, circuit breakers and quotas.** Avoid unnecessary requests; isolate failing services, honor rate limits and retry-after semantics.
- [ ] **P3-03 — Stable favorites and schema migrations.** Versioned localStorage format with backward-compatible provider ID mappings.
- [ ] **P3-04 — Installation and offline fallback.** Add correct install icons and meaningful preloaded timetable caching with expiry controls.
- [ ] **P3-05 — Privacy, security and legal review.** Confirm API ToS, transit data licenses, attribution, contact and GDPR-relevant disclosures. Never commit private API credentials; use server-side proxy only if required.
- [ ] **P3-06 — Accessibility and usability audit.** Keyboard operation, screen-reader labels, loading feedback, color contrast and responsive testing.
- [ ] **P3-07 — CI release gates.** Tests, staging preview, version bump, changelog and documented rollback.
- [ ] **P3-08 — Contributor docs.** Explain adding a country/feed, testing fixtures, data refreshes and how to report a broken operator.

## Known constraints and blockers

| Item | Constraint | Next action |
| --- | --- | --- |
| National coverage | Transitous does not guarantee that every operator is included | Test real stops and add licensed local/static fallback |
| France / Portugal | Code enabled experimentally, not end-to-end browser validated | Run country smoke tests and record fixtures |
| Málaga real-time | Official stop-level ETA endpoint not yet confirmed for reuse | Research legally reusable endpoint; retain schedule-only label |
| Legacy favorites | VBB/DB/EMT local IDs are not Transitous IDs | Maintain provider-aware records; test old entries |
| GitHub Pages | Static hosting cannot protect API secrets or process huge GTFS archives at request time | Preprocess in Actions; add secure proxy only if essential |
| Credits / context | Development may span multiple ChatGPT sessions | Start every session by reading this roadmap and current source; update status with evidence |

## Session handoff procedure

1. Open **`docs/ROADMAP.md`**, then read the current README, `countries.json`, provider code and recent relevant commits.
2. Select the **highest-priority unchecked task** that is realistically actionable; do not claim completion based solely on code upload.
3. Implement and run available checks. Note if API/live-browser tests are unavailable.
4. Update that task with evidence (tests, files, workflow links, commit hash if known) and mark `[x]` only if acceptance criteria are met.
5. Commit documentation together with code, update any relevant README/changelog, and explain remaining blockers.

## Implementation history (high level)

| Version | Milestone |
| --- | --- |
| 0.1.x | Baseline PWA and VBB/DB integrations |
| 0.2.x | Nationwide Germany via Transitous; schedule-first philosophy |
| 0.3.x | Málaga EMT official static GTFS pipeline |
| 0.4.x | Spain national Transitous beta; EMT hidden behind country selection |
| 0.5.x | Multi-provider adapters, source-specific IDs and deduplication |
| 0.6.x | Shared country/regional discovery |
| 0.7.x | Independent country catalog and expansion gate |
| 0.8.0 | Experimental France and Portugal selection |

**Scope rule:** Focus development and reliability investment on **Germany and Spain** first, then their neighbors, then the rest of Europe.

## CI setup and first-run verification

Workflow: [Tests and JavaScript checks](https://github.com/tupolev/bustimer/actions/workflows/ci.yml). Commands: `npm run check`, `npm test`, `npm run ci`. The suite uses Node.js 22 and no third-party test dependencies. GitHub Actions should trigger on every push to `main` and each pull request. **As of this checklist update, the workflow was committed but a successful run has not been independently confirmed**; inspect the Actions page, fix any failures, and only then mark P0-01 and the initial tests complete.

## VRS static GTFS import — staged rollout (2026-10-23)

- [x] Add `scripts/build_vrs.py` to download official global-ID VRS GTFS, compile service calendars and stop-centric schedules, protect against empty datasets, and stage output atomically into `data/vrs/`.
- [x] Add `.github/workflows/vrs-gtfs.yml` **manual workflow** for first verification. Daily scheduling is intentionally disabled until tested and repository size reviewed.
- [ ] Execute workflow, confirm the VRS download works and generated index/calendar/date exceptions, IDs, license, file counts and total repository size are correct. **Not yet executed.**
- [ ] Wire `vrs` into Germany stop discovery and departure adapter with Europe/Berlin timezone handling; don't label static times realtime.
- [ ] Verify stop matching, midnight/DST and VRS direction labels with sample Bonn/Köln stops, and regression-test old favorites.
- [ ] Only after successful tests, enable a conservative scheduled refresh and record source freshness in UI.
