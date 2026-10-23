# BusTimer — Implementation roadmap

Last reviewed: 2026-10-23 · Current application version: **0.11.1** (tests rollout)  
[Live app](https://tupolev.github.io/bustimer/) · [Repository](https://github.com/tupolev/bustimer)

> **Working agreement:** update this checklist in the **same commit or PR** as the implementation whenever possible. Mark a task complete only after its acceptance criteria have been met. Code committed ≠ feature verified in production.

## Status legend

- [x] Implemented and evidenced in repository (not necessarily browser-tested)
- [ ] Not yet complete; the note identifies whether it is implemented but **unverified**, partially implemented, or not started
- **Blocked:** dependency or upstream issue; record next action and do not invent a successful test

## P0 — Reliability and validation (do before expanding further)

- [ ] **P0-01 — Automated JavaScript checks.** **Implemented; GitHub Actions success confirmed (2026-10-23):** `scripts/check-js.mjs` checks inline JavaScript, service worker and enabled-country JSON. `.github/workflows/ci.yml` runs on pushes and PRs. **Done when:** a GitHub Actions run succeeds and a deliberately malformed test fixture is rejected.
- [ ] **P0-01b — Unit-test battery in CI.** **Initial 7 cases implemented; workflow success confirmed:** `tests/core.test.mjs` uses Node's built-in test runner; covers provider mapping, provider IDs, realtime deduplication, stop merging, geographic filtering and malformed JS detection. **Done when:** the GitHub Actions run passes and additional fixtures cover service calendars, midnight/DST, cancelled departures and stale data.
- [ ] **P0-01c — Integration tests in CI.** **Initial mocked provider integration scenarios implemented; GitHub Actions success confirmed:** `tests/providers.integration.test.mjs` verifies EMT fallback when Transitous fails, realtime priority, total outage and isolation of VBB/DB legacy IDs. Still needed: localStorage migration, full add/save/refresh UI workflow and a successful GitHub Actions run. **Done when:** all integration fixtures pass in CI and an E2E flow is verified.
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
- [ ] Execute workflow, confirm the corrected official VRS download works and generated index/calendar/date exceptions, IDs, license, file counts and total repository size are correct. **Not yet executed.**
- [x] Wire optional `vrs` into German stop discovery and a schedule-only departure adapter using Europe/Berlin time, reading `data/vrs` if present. Import has not run; catch and isolate missing-dataset errors.
- [ ] Verify stop matching, midnight/DST and VRS direction labels with sample Bonn/Köln stops, and regression-test old favorites.
- [ ] Only after successful tests, enable a conservative scheduled refresh and record source freshness in UI.

- [x] Correct VRS GTFS download URL to the **current official link** (`google_transit_goR.zip`), store explicit `file` mapping for non-filesystem-safe stop IDs and detect filename collisions; this importer change is not yet validated against a complete live feed.

## Importer validation progress (2026-10-23)

- [x] Fix VRS CSV reader: the prior parser returned a lazy reader after its ZIP member had closed, preventing real imports. Now rows stream while their source is open.
- [x] Add offline synthetic GTFS importer tests in `tests/test_vrs_import.py`, including 101 stops with source IDs requiring filename mapping, GTFS departure times after 24:00, exceptions, and broken archive detection.
- [x] Include Python importer tests in standard `ci.yml` using Python 3.12 and `unittest`.
- [ ] Confirm updated CI run with Python tests succeeds. The earlier successful v0.9.2 JavaScript suite does not cover this new importer test.
- [ ] Run `vrs-gtfs.yml` manually through GitHub Actions UI and validate the real official feed before automating updates. This connector can view Actions runs/logs but cannot dispatch a new workflow directly.

## First official VRS import attempt — 2026-10-23

- [x] Official VRS download and GTFS compilation succeeded in [run 39937922369](https://github.com/tupolev/bustimer/actions/runs/39937922369); generated index validation also passed.
- [x] Diagnose failed publishing: `git push` rejected because `main` advanced after checkout, not because of GTFS data. Workflow now quietly commits and rebases/retries up to five times without force-push.
- [x] Manual VRS import succeeded in [run 39938475320](https://github.com/tupolev/bustimer/actions/runs/39938475320): **20,494** stop JSON files compiled, index validated, commit and push completed.
- [ ] Optimize large VRS dataset storage and deployment. Initial import generated **20,494** stop files; verify GitHub Pages performance, repository growth and scheduling cost. Consider sharding/compression or publishing release artifacts before increasing refresh frequency.

## VRS periodic refresh (2026-10-23)

- [x] Official GTFS first import and GitHub publication verified (run 39938475320, 20,494 stops).
- [x] Set a conservative **weekly Monday 04:37 UTC** VRS refresh via GitHub Actions (manual dispatch remains available); add concurrency serialization and a basic upper-bound guard on stop count. Source freshness remains to be tested on the published app.
- [ ] Verify the first scheduled run, app stop search for Bonn/Köln and departure dates/directions. Increase to daily only after dataset storage/deployment is optimized.

## VRS live data inspection (2026-10-23)

- [x] Verified published VRS index via GitHub REST: **20,494 stops**, **4,507** service calendars, **4,345** exception sets; sample stops include Bonn Hbf and Köln Neumarkt/Heumarkt. Verified a Bonn Hbf stop timetable contains planned departures and trip headsigns.
- [x] Adjusted German country stop discovery to prioritize regional provider results before national Transitous results, and rank stops whose names start with the query. Prevents official VRS matches being excluded by the first-20 limit.
- [x] Added VRS namespace regression test for original IDs and cross-provider references.
- [ ] Verify the public browser experience, GTFS clock conversion around DST and real-world departures. Dataset presence alone does not verify display correctness.
- [ ] Optimize search payload: the combined `data/vrs/index.json` is approximately **5.4 MB** of JSON; split search-only stop list from calendar data, ideally shard or compress before increasing update cadence.

## VRS split data and European expansion (v0.9.4)

- [x] Split VRS GTFS into `search.json` (stops) and `services.json` (calendars and exceptions); retain per-stop files. App downloads calendars only when requesting departures.
- [x] Keep compatibility fallback to old `index.json` until next successful import; import replaces directory and removes obsolete index.
- [x] Update Python importer test and GTFS workflow validation to require split files.
- [x] VRS split publication verified: [run 39942424131](https://github.com/tupolev/bustimer/actions/runs/39942424131) succeeded; `search.json` has 20,494 stops (2,604,805 bytes), `services.json` has 4,507 calendars and 4,345 exception sets (2,770,503 bytes), and old `index.json` returns 404. Browser stop search and departures in Bonn/Köln still require hands-on validation.
- [x] Add Node timezone tests for winter/summer, spring DST gap, autumn repeated hour and >24h service times. The conversion omits nonexistent spring local times and chooses the first occurrence for ambiguous autumn times; operator semantics still require real-world inspection.
- [ ] Assess Netherlands (NDOV), Belgium (STIB/De Lijn/TEC/SNCB), Luxembourg (Mobiliteit), Austria (VAO), Switzerland (opentransportdata), Poland, Czechia, Denmark. Validate licenses and browser access before enabling, while prioritizing Germany and Spain.

### Follow-up: rollout verification

- [x] GitHub Actions passed with `tests/vrs-time.test.mjs`: [CI run 39939584167](https://github.com/tupolev/bustimer/actions/runs/39939584167).
- [x] Published `search.json` and `services.json` to `main` through GitHub Actions. **Pending:** verify actual GitHub Pages network load and representative Bonn/Köln departures.
- [ ] Inspect provider coverage, license and browser CORS before enabling Netherlands, Belgium, Luxembourg, Austria, Switzerland, Czechia, Denmark and Poland.

## Verified VRS split rollout — 2026-10-23

- [x] Successful VRS [workflow #39942424131](https://github.com/tupolev/bustimer/actions/runs/39942424131), with split dataset committed.
- [x] Verified published GitHub repository files: `search.json` = 2,604,805 bytes / 20,494 stops; `services.json` = 2,770,503 bytes / 4,507 calendars and 4,345 exception sets; obsolete `index.json` removed.
- [x] JavaScript/Python test CI successful, [run #39939584167](https://github.com/tupolev/bustimer/actions/runs/39939584167).
- [ ] Validate representative VRS departures and browser behavior on the live Pages site; optimize search beyond 2.6 MB, potentially via shard indexes.

## Neighboring countries: researched candidate sources (2026-10-23)

- [x] Document source evaluation in [docs/EU-SOURCES.md](EU-SOURCES.md) for Luxembourg's CC BY 4.0 national GTFS, Belgium's four-operator GTFS catalog, and Netherlands' open NDOV/openOV GTFS/GTFS-RT.
- [x] Add candidate source URLs and suggested geographic bounds to `countries.json` without exposing unverified countries in the UI.
- [x] Extend CI country metadata validation: unique IDs, mandatory source metadata, and reject `enabled:true` when `status:"candidate"`.
- [x] Implement Luxembourg staging importer using official data.public.lu dataset API, shared VRS split GTFS builder, CC BY 4.0 attribution and geographic bounds. Actual-feed validation and country activation remain pending.
- [ ] Independently validate representative Luxembourg stops and timetables, then consider experimental activation.
- [ ] Continue with Belgian operator-by-operator ingestion; design bounded, sharded data processing before loading the larger Dutch national GTFS.

## Luxembourg importer (2026-10-23)

- [x] Generalized VRS split GTFS builder with configurable national bounds, timezone, attribution and minimum stop count.
- [x] Added Luxembourg latest-feed discovery through official data.public.lu API and source host allowlist, plus offline catalog-selection tests.
- [x] Added manual-only \`luxembourg-gtfs.yml\` workflow; validates stop files and calendar data; publishes only validation index artifacts, without automatically committing thousands of files.
- [x] Luxembourg validation workflow [run 39944904441](https://github.com/tupolev/bustimer/actions/runs/39944904441) succeeded: **2,767 stops**, **217 service calendars**, synthetic importer tests, complete stop-file integrity validation and validation artifact upload.
- [ ] Integrate Luxembourg stop search and departure adapter, validate actual timetables and licenses, then enable the country.

## Luxembourg first live feed validation — 2026-10-23

- [x] Successful [run 39944904441](https://github.com/tupolev/bustimer/actions/runs/39944904441): 2,767 Luxembourg stops, 217 calendars, valid stop JSON, staged artifacts available.
- [ ] Publish Luxembourg split GTFS output into `data/luxembourg` with safe rebase/retry and bounded refresh cadence.
- [ ] Implement and test country search, saved favorites, Europe/Luxembourg service-date conversion, product mapping and scheduled-only provenance. Then enable Luxembourg experimentally, not before.

## Luxembourg app adapter and staged publication (v0.9.5)

- [x] Implement optional Luxembourg static stop discovery, departures, service calendar, and source-namespaced IDs (`lux:`). Not enabled in country selector until published source and browser checks.
- [x] Fix VRS absent-time guard for DST gap; retain schedule-only provenance for both feeds.
- [ ] Publish Luxembourg GTFS and verify index/stop URLs under GitHub Pages; then enable only after test fixtures and browser smoke validation.

## Luxembourg experimental launch (2026-10-23)

- [x] Successful official publication [run 39945847058](https://github.com/tupolev/bustimer/actions/runs/39945847058). Verified `data/luxembourg/search.json` with **2,767** stops (295,489 bytes), `services.json` with **217** calendars and **202** exception sets (38,906 bytes), and Hamilius stop file with 5,108 scheduled service records.
- [x] Enable Luxembourg in country catalog as **experimental**; extend hard-coded catalog allowlist; fix provider namespace stripping in merged stop references so Luxembourg/VRS IDs route correctly.
- [ ] Browser smoke test GitHub Pages and several saved departures in Luxembourg City; verify search, refresh, DST, direction filtering, and operator GTFS semantics. Experimental does not imply field-validation complete.
- [x] Schedule conservative weekly Luxembourg refresh every Tuesday at 05:43 UTC (manual dispatch retained), serialize overlapping runs, add stop-count/source/attribution validation; trigger automatically on workflow-file updates. First scheduled execution and live browser smoke test remain pending.

## Luxembourg self-running workflow (2026-10-23)

- [x] Add GitHub Actions weekly Tuesday 05:43 UTC schedule, workflow-file push trigger and concurrency guard to official Luxembourg GTFS publisher. This avoids needing a manual Run workflow for ordinary refreshes and workflow updates.
- [x] Validate source HTTPS, CC BY 4.0 attribution and bounded stop count before publishing.
- [ ] Confirm first workflow-file push-triggered automatic publication and ongoing weekly execution. Check Pages deployment and browser stops independently.

## City-first stop discovery (v0.9.7)

- [x] Add mandatory city/town text input between country and stop search (EN/ES/DE translations).
- [x] Disable stop search until city is supplied; reset dependent choices on city changes, preserving saved favorites unchanged.
- [x] Qualify Transitous stop queries with city and country; locally narrow regional results by town names where present.
- [ ] Improve city UX with geocoded city suggestion/selection and radius-based filtering of regional stops, especially stations not named after their municipality.
- [ ] Browser smoke-test city-to-stop flows in Germany, Spain and Luxembourg.

## City suggestion bugfix (v0.9.8)

- [x] Replace free-text city entry with debounced Photon/OSM city autocomplete, filtered by selected country's coordinates. Users choose a city suggestion to enable stop search.
- [x] Clear stale suggestions on country or city changes, avoid delayed responses overwriting newer results; support Enter and Escape.
- [x] Filter national stop results by a selected city's 20 km radius or matching city name, and regional results by city name/proximity.
- [ ] Test in a real browser for Bonn, Köln, Málaga and Luxembourg; Photon public demo has rate limits and no uptime guarantee, so plan an owned/alternative city catalog for high-scale usage.

## Photon HTTP 400 fix (v0.9.9)

- [x] Remove direct `lang=prefs.language` parameter from public Photon calls (UI language may not be supported on that instance), retain translated interface.
- [x] Add ISO country code and country bounding box to geocoding request, reducing irrelevant results.
- [ ] Browser-verify real autocomplete behavior in ES/DE UI and Bonn/Málaga searches; consider a fallback city search source if the Photon demo is unavailable.

## Literal vs localized names (v0.10.0)

- [x] User-language country names via browser Intl.DisplayNames (DE/ES/EN); country selector rerenders on language changes, retains original catalog values as fallback.
- [x] Preserve stop, city, region, route, direction and transport labels literally as delivered by their sources. Unknown transport categories display their literal codes rather than a forced English “Other”.
- [x] Translate UI labels and selector prompts in ES/EN/DE; correct country/city/stop/transport/line/direction step numbering.
- [x] Add automated translation policy regression tests.
- [ ] Verify literal naming for any new providers before enabling and browser-smoke-test language switches.

## Locale switch and city selection regression (v0.10.1)

- [x] Changing the interface language no longer unlocks stop searches unless the user has selected a valid city suggestion; preserves language rules and avoids unscoped queries.
- [x] Regression check added to literal-label tests.
- [ ] Follow up with real-browser integration checks for all three UI languages and saved stops.

## Country → city → stop → line → direction regression suite (2026-10-23)

- [x] Added fixture-based tests for country-bounded city autocomplete, literal city/region labels, deduplicated suggestions and filtering out station POIs.
- [x] Added tests for line-specific direction choices preserving original destination strings.
- [x] Added checks that EN/ES/DE dictionaries expose all key six-step form labels and errors.
- [ ] Validate new tests in GitHub CI and follow with an actual browser interaction test (the new fixture tests are not a browser smoke test).
- [ ] Begin Belgian operator feed integration after browser coverage and the Photon city suggestion issue are stable.

## Photon resilience (v0.10.2)

- [x] Use standard Photon `q`, `limit`, `countrycode`, `bbox` parameters and country-bounded results; retry a documented minimal query only when the demo rejects optional parameters with HTTP 400.
- [x] Prefer Photon `osm_value` to classify actual city/town/village entities, ignoring unrelated POIs; slow typeahead request cadence to 850 ms to reduce stress on public demo.
- [x] Extend regression tests for optional-parameter fallback and region filtering.
- [ ] Browser-network smoke test and consider a backed service or static city catalog if demo API is rate-limited/unavailable.

## Offline-first towns — v0.11.0

- [x] Built automatic weekly GeoNames cities500 importer (`scripts/build_towns.py`), with Sunday 03:23 UTC refresh and push-triggered first generation.
- [x] Verified published JSON indexes for Germany (11,927), Spain (7,425), France (15,364), Portugal (1,079), Luxembourg (235); source CC BY 4.0.
- [x] Town autocomplete loads same-origin per-country JSON, performs accented case-folding and prefix/population ranking locally; Photon is optional only when dataset is inaccessible.
- [x] Added regression tests for offline-first behavior and no cross-country leakage; existing favorites remain untouched.
- [ ] Browser smoke test actual GitHub Pages deployment and refine incomplete rural localities (cities500 excludes some settlements under 500 residents).

## Luxembourg stop search correction (v0.11.1)

- [x] Return an empty stop result set as a normal 'no matches' UI state, not a misleading connection error.
- [x] Keep all matching Luxembourg and VRS local stop candidates until the selected city filter is applied, then cap to 20.
- [x] Normalize lux:/vrs:/emt: references when combining regional and Transitous results.
- [ ] Verify actual browser search for Luxembourg → Luxembourg → Hamilius / Gare and other towns; inspect app network behavior if an HTTP error persists.

## Belgium candidate groundwork (2026-10-23)

- [x] Extend offline GeoNames city generation to Belgium (BE) without prematurely enabling Belgian departures.
- [x] Record official Belgian multi-operator GTFS sources and gated API authorization concerns in `docs/EU-SOURCES.md`.
- [ ] Confirm generated Belgian dataset publication and CI before relying on it in app.
- [ ] Verify feed download authorization/license and build a bounded Belgian schedule adapter. Belgium remains a disabled candidate.
