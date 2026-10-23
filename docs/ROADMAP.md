# BusTimer — Implementation roadmap

Last reviewed: 2026-10-23 · Current application version: **0.12.0** (tests rollout)  
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

## Belgium experimental launch — 2026-10-23 (v0.12.0)

- [x] Published and validated SNCB-NMBS (2,213 GTFS stops), [run 39951852629](https://github.com/tupolev/bustimer/actions/runs/39951852629).
- [x] Published and validated STIB-MIVB (2,415), [run 39952200679](https://github.com/tupolev/bustimer/actions/runs/39952200679).
- [x] Published and validated LETEC (30,908), [run 39952313433](https://github.com/tupolev/bustimer/actions/runs/39952313433).
- [x] Published and validated De Lijn (25,468), [run 39952320177](https://github.com/tupolev/bustimer/actions/runs/39952320177).
- [x] Verified Belgian GeoNames town index (2,257 entries), including multilingual aliases, [refresh run 39953151061](https://github.com/tupolev/bustimer/actions/runs/39953151061).
- [x] Enable country as experimental with all four published scheduled providers, per-operator namespaced IDs, country-scoped city+stop searches and localized country label. No unsupported realtime claim.
- [x] Confirm JavaScript and four real compiled dataset CI passed ([run 39952812129](https://github.com/tupolev/bustimer/actions/runs/39952812129)) and GitHub Pages deployed ([run 39952811855](https://github.com/tupolev/bustimer/actions/runs/39952811855)).
- [ ] Manually exercise browser flows for Bruxelles/Brussel → Gare Centrale, Gent → tram/bus, and Liège → TEC; live/browser smoke tests not supplied by current CI.
- [ ] Expand realtime providers as authentication and licensing permit; never label static times live.

## Belgian interchange search refinement (2026-10-23)

- [x] Keep two platforms from the same operator as distinct selectable stops even when their names and coordinates nearly match; only merge across providers.
- [x] Prioritize prefix matching, then geographic proximity to the selected city so the limited result list favors local stops.
- [x] Add regression fixture for same-operator STIB Gare Centrale platforms.
- [ ] Confirm language and platform selection in live browser for Brussels Central, Gent and Liège.


## Belgian interchange regression and documentation alignment (2026-10-23)

- [x] Add mocked Belgian interchange regression fixtures: STIB platforms with separate IDs remain separate; a co-located SNCB/TEC stop can merge with one platform without erasing the other; distant same-name stops remain distinct. See `tests/core.test.mjs`, commit `fe6bf010`.
- [x] Align README's headline version and description of country-first city search, direction-aware saved lines and available test coverage; synchronize `package.json` to v0.12.0.
- [ ] Confirm GitHub Actions CI is green after these changes. Source updates alone do not count as test execution.
- [ ] Run real browser smoke checks for Brussels Central, Gent and Liège, including all language modes, route/direction selection, saved favorite refresh and actual static schedule dates. This environment's GitHub repository connector does not provide a browser session; no browser test is claimed.


## Belgian mocked-provider fallback regression (2026-10-23)

- [x] Add integration fixtures proving that Belgian rail scheduled departures remain available when STIB fails; assert no invented realtime/delay, and ensure TEC and De Lijn IDs remain source-specific during a total outage (`tests/providers.integration.test.mjs`, commit `0b2339b0`).
- [x] Inspect older Belgian CI run [39952812129](https://github.com/tupolev/bustimer/actions/runs/39952812129): its checks job completed successfully (JavaScript and Python checks).
- [ ] Verify CI for latest commits. The linked GitHub action for retrieving runs by commit filters to PR-triggered executions and returns no runs for the push on `main`; previous success must not be attributed to new commits.
- [ ] Interactive GitHub Pages smoke tests for Brussels, Gent, Liège and stored favorites remain outstanding.


## Belgian city-scoped search regression (2026-10-23)

- [x] Add `tests/belgium-search.test.mjs` exercising real `searchCountryStops` and `joinProviderStops` implementation using four mocked regional indexes. Covers co-located STIB platforms and rail/TEC references, selected-city proximity exclusion and literal stop names (commits `675297a6`, `8796c39e`).
- [ ] Verify the new Node tests pass in Actions. This repository connector cannot enumerate the latest main-branch push workflow; avoid marking CI green without a specific run.
- [ ] Extend the automated harness to a browser end-to-end flow (town select, stop, mode, line, direction, favorite save/reload); no real-browser verification claimed yet.


## Belgian favorites workflow test harness (2026-10-23)

- [x] Add `tests/favorites-flow.test.mjs`, a Node-only DOM-control harness that executes the application's real transport, line, direction and save handlers with a mocked Belgian interchange. Tests direction-specific saved favorites, duplicate prevention, retained operator references and round-trip serialized localStorage data (commit `8df4077c`).
- [ ] Confirm this test passes in GitHub Actions. It is a mocked handler integration test, **not** a browser E2E: no assertions cover town autocomplete, click-based stop selection, full page reload or live GTFS/network requests.
- [ ] Follow up with Playwright browser E2E in CI once a browser test runner is available; include Belgium, Germany and Spain and preserve existing favorites.

## CI fix: favorites harness constructor (2026-10-23)

- [x] Correct the test-only `Option` mock in `tests/favorites-flow.test.mjs`: production code invokes `new Option(...)`, but the test declared an arrow function, which is not constructible. Changed to a regular constructor (commit `2250c5f2`). No production UI code changed.
- [ ] Verify this correction in the next GitHub Actions run; the supplied failure log showed 46 tests, 42 passes and 4 failures, of which two were explicitly the `Option is not a constructor` failures. Investigate the other two failures from the complete CI log before claiming green.


## CI regression: async search extraction (2026-10-23)

- [x] Repair `tests/belgium-search.test.mjs` function extraction to include the `async` modifier in `async function searchCountryStops(...)` (commit `deda8dd3`). The previous string slice began at `function` and produced invalid JavaScript containing `await` outside an async function.
- [ ] Obtain a successful CI run after both test-harness corrections (`Option` constructor and async extraction). Previous log showed 42/46 passing, with two specifically attributable to Option; do not claim the other two are proven fixed without the complete error output.


## Connector-sourced isolated JavaScript validation (2026-10-23)

- [x] Reproduce application handlers directly from the current GitHub `index.html` using an isolated JavaScript runtime without cloning. Verify mocked transport → line → direction → saved favorite serialization and separate direction/duplicate handling. The missing test harness `iconFor` and `productLabels` were fixed in `tests/favorites-flow.test.mjs` (commit `f8103f82`).
- [x] Reproduce Belgian stop discovery directly from current application source: two same-operator STIB platforms remain distinct, and one may merge with colocated SNCB and TEC references. Fix a dangling `async` left by the fixture extraction boundary in `tests/belgium-search.test.mjs` (commit `1e7084b9`).
- [ ] Execute complete Node.js/Python CI against latest commit and capture an actual successful GitHub Actions run. The isolated JavaScript checks validate functional paths but are not equivalent to `npm run ci` or a browser E2E test.

## Belgian search negative-case hardening (2026-10-23)

- [x] Strengthened `tests/belgium-search.test.mjs` to require actual matching Brussels stops before asserting on their names (avoids vacuously passing an empty result), and added a Gent-selected-city negative scenario to reject Brussels-only interchange matches (commit `0c09ee10`).
- [ ] Confirm updated Node suite in GitHub Actions and publish CI run reference; tests have not been certified by a new successful push run in this session.
- [ ] Continue with real-browser E2E of country → town → stop → line → direction → save and reload, plus VRS and EMT regression paths.


## Chromium browser E2E rollout (2026-10-23)

- [x] Add Playwright `e2e/belgium.spec.mjs` to drive the actual page through Belgium country → Brussels town autocomplete → Gare Centrale stop → tram line → direction → favorite persistence → page reload. Browser network fixtures serve deterministic country/town/GTFS files; external API availability does not determine this test's result.
- [x] Add `playwright.config.mjs` running a local Python static server and Chromium with service workers blocked for deterministic tests.
- [x] Add separate `browser` CI job installing Playwright Chromium, running `npm run test:e2e` and uploading traces on failure. Existing JS/Python `checks` job remains intact.
- [ ] Verify a complete successful `browser` job in GitHub Actions. The new test has been committed but no successful Playwright run has yet been observed. Inspect traces and fix fixture or production issues as evidence demands.
- [ ] Expand tests to other Belgian operators and German/Spanish regression cases, plus real Pages smoke tests (mocked sources do not prove current real GTFS correctness).


## Browser locale persistence regression (2026-10-23)

- [x] Extend the Belgian Playwright smoke flow to switch to Spanish, verify the original literal stop/direction labels are preserved, and confirm the locale and favorite persist after a second reload (`e2e/belgium.spec.mjs`, commit `108cb6c5`).
- [ ] Browser CI result still requires an observed run: the available GitHub connector returns PR-only commit workflow runs and the container cannot resolve github.com. Do not claim a successful browser run until jobs/logs are retrieved.


## CI cadence adjustment (2026-10-23)

- [x] Keep the quick JavaScript/Node and Python fixture checks on push and pull request in `.github/workflows/ci.yml`.
- [x] Move Chromium Playwright E2E to its own **manual-only** `.github/workflows/browser-e2e.yml` (`workflow_dispatch`), retaining failure traces. Browser tests no longer run for each commit.
- [ ] Run Browser E2E manually after substantial UX/provider changes or before an important release. Verify it passes before marking P0-02 complete.


## P0-06 — Stale departure safety fix (2026-10-23)

- [x] On complete provider failure during a monitored-stop refresh, discard the old departure object and present the existing error state rather than continuing to display the previously cached clock time/countdown as if current (`index.html`, commit `0ac4ea1e`).
- [x] Add dependency-free Node fixture tests for failure and successful empty timetable refresh (`tests/stale-departures.test.mjs`, commit `9f9348d7`). These run in the existing fast CI job, not Playwright.
- [ ] Confirm the new tests pass in CI; test offline browser behavior and partial provider outages before marking P0-06 wholly complete.


## Sequential milestones 1–4 toward Netherlands (2026-10-23)

User-approved order: (1) reliability, (2) six-country validation, (3) GTFS optimization/freshness, (4) Netherlands launch. Do not skip acceptance gates or represent staging as live coverage.

- **M1 / v0.12.1 — partially implemented, NOT complete.** JavaScript/Python fast checks remain automatic; browser E2E is manual-only. Stale departures clear on provider failure. Latest full CI success and remaining offline/realtime behavior still require evidence.
- **M2 / v0.13.0 — NOT complete.** Belgium provider/search/favorites fixtures exist, but real-browser and operator stop timetable validation remain open. Germany/Spain/Luxembourg/France/Portugal production smoke tests also outstanding.
- **M3 / v0.14.0 — NOT complete.** Existing VRS search/services split published; broader shard optimization, publisher storage costs, retention and freshness indicators remain to be validated. Netherlands stream processing stages by stop and uses disk-backed SQLite, rather than loading national stop_times in application memory.
- **M4 / v0.15.0 — candidate staging, NOT launched.** Added NL to offline GeoNames town generation and internal ISO/bounds/town configuration but left `countries.json` disabled. Verified national download listing at https://gtfs.ovapi.nl/nl/gtfs-nl.zip (large ~237 MB compressed as of Oct 2026). `scripts/inspect_netherlands.py` checks archive counts, service calendars and bounds; `scripts/build_netherlands.py` streams stop_times via SQLite and produces per-stop scheduled JSON and search/services indexes; `tests/test_netherlands_import.py` adds a synthetic >24-hour/calendars fixture. Manual `netherlands-gtfs.yml` downloads, validates, compiles and uploads report/index artifacts only. **No Netherlands dataset has been confirmed built, uploaded as production data, or integrated into the public stop/departure adapters.**
- **NL launch gates:** obtain successful importer CI + workflow execution; assess national output size, build time and feed license; publish safe shards and country towns; add correct path/timezone/provider in app; test Amsterdam, Rotterdam, Utrecht and Den Haag with schedules, cancellations/errors, favorites, multiple modes and DST; only then enable in country catalog.

### Operational caution

The first national compiler is an initial staging implementation, not a performance-verified solution at national scale. It must be profiled on actual data and revised if SQLite lookup throughput, storage size, repository growth, calendar exceptions or asset request payloads do not meet the quality bar. The browser workflow remains manual to avoid slowing every push.


## Netherlands real-feed validation initiated (2026-10-23)

- [x] Fix an important national-scale performance issue in `scripts/build_netherlands.py`: index the SQLite timetable by stop before exporting per-stop shards. Without this, each stop would scan the entire departures table (commit `817ccaa2`).
- [x] Configure `.github/workflows/netherlands-gtfs.yml` for a **one-time automatic run on workflow-file changes**, as well as manual dispatch. On successful complete feed compilation, publish a small audit report at `docs/validation/netherlands-latest.json` with GitHub Actions run ID and counts, while keeping raw timetable data staged and Netherlands disabled (commit `4adc52f9`).
- [ ] Check actual resulting run/job outcome and report. No successful feed-run evidence is available yet; do not assert the national import has passed.
- [ ] If compilation succeeds, inspect index size, export footprint, feed-specific conditions and service semantics, then design a storage strategy that avoids committing unbounded stop files to `main`.
- [ ] M1/M2/M3 acceptance gates and the real browser/operator tests still apply before Netherlands can be enabled.

## Netherlands national feed — validation evidence (2026-10-23)

- [x] Official national GTFS inspection and SQLite compilation completed successfully in GitHub Actions [run 39966942756](https://github.com/tupolev/bustimer/actions/runs/39966942756), job `inspect`, conclusion `success`.
- [x] Machine-readable evidence committed at `docs/validation/netherlands-latest.json`: 71,886 candidate stops within NL bounds, 53,493 scheduled stop shards, 3,473 exception-service keys and 1,306,120,103 uncompressed GTFS bytes. 61,768 future calendar-date rows were reported; no regular `calendar.txt` service was found.
- [ ] Size production assets and select a bounded publishing/hosting approach for >53k stop shards, rather than committing blindly to `main`.
- [ ] Validate future departures, service exceptions and timezone on representative Amsterdam/Rotterdam/Utrecht/Den Haag stops before release; offline city search also requires a published NL town index.
- [ ] Implement and verify Netherlands browser search/departure adapters and only then enable the country in `countries.json`.


## Netherlands app integration behind launch gate (2026-10-23)

- [x] Integrate a disabled `nl` static GTFS provider into the existing country search/favorites/departures architecture, with source-ID normalization and calendar-date aware scheduled times. `countries.json` remains `enabled:false`; this code is not a public Netherlands launch.
- [x] Add fast Node regression guards in `tests/netherlands-adapter.test.mjs` for IDs, schedule service-date logic, and disabled country status. Production inline JavaScript parsed successfully in isolated JavaScript validation.
- [x] Expand the Netherlands validation workflow with a JSON-file-count/byte-size footprint report committed only after successful inspection and compilation. Do **not** commit >53k schedule files to `main` without choosing the hosting/deployment approach.
- [ ] Confirm footprint report from latest run; ensure `data/towns/nl.json` is actually published by the GeoNames workflow.
- [ ] Publish staged per-stop shards in supported static hosting, verify timetable queries across Amsterdam/Rotterdam/Utrecht/Den Haag, correct service semantics, and run the manual Playwright smoke test.
- [ ] Verify external feed license and operational storage budget; enable `netherlands` only when assets are deployed and smoke tests pass.

## Netherlands API-first rollout (2026-10-23)

Architecture changed on user request: do not mirror ~53,493 stop timetables for the Netherlands. BusTimer queries the existing HTTPS Transitous geocode and stop-times endpoints on demand and keeps only a small GeoNames town index. The national GTFS importer/inspector remains an optional offline audit tool; `netherlands-gtfs.yml` is manual only. The previous staged shard infrastructure is **not required** to serve Dutch riders.

- [x] Remove Dutch static search/services/stops fetch logic and `nl` provider mapping; use Transitous IDs verbatim, preserving saved stops.
- [x] Confirm `data/towns/nl.json` is published, wire the country into selection/search, and mark the country `experimental` / `enabled:true` in `countries.json`.
- [x] Add fast Node API-first regression checks; inspect Transitous documented API usage/attribution and known Netherlands stop-times examples. Keep visible attribution and ensure browser usage remains lightweight.
- [ ] Verify Netherlands full browser workflow and CORS with live requests for Amsterdam, Rotterdam, Utrecht and Den Haag, including saved stops and source coverage. Do not claim exhaustive operator coverage or realtime.
- [ ] Check that automated `checks` passes for the latest commit, then run manual Chromium release smoke when convenient.
- [ ] Evaluate requests per minute and caching; if the API cannot support expected deployment usage, seek permission or use a narrowly scoped provider fallback rather than introducing national bulk downloads.

**Status:** NL exposed as experimental API-first support, not a verified national realtime guarantee. Existing M1–M3 backlog remains tracked separately.

## Netherlands API-first release gate after live validation (2026-10-23)

- [x] README and translated About credits explicitly thank Transitous and its volunteers, MOTIS, open-feed publishers, and OpenStreetMap; include attribution/licensing links.
- [x] Added a lightweight real-network geocode/CORS smoke for Amsterdam, Rotterdam, Utrecht, Den Haag, with machine-readable evidence at `docs/validation/netherlands-api-latest.json` (run `39969565345`).
- [!] The run returned HTTP 403 from Transitous in all four cities. This may be specific to GitHub Actions request origin/headers. Do not infer browser-wide denial, and do not claim functioning Dutch stops or arrivals.
- [x] Revert `countries.json` to `enabled:false` / `candidate` until browser-based live requests succeed; retain the API-first implementation and fast test guards.
- [x] Add a separate manual-only Netherlands Playwright end-to-end fixture with mock Transitous data and a local, test-only enabled country catalog; no browser job is added to per-commit CI.
- [ ] Diagnose 403 on normal browser origin and establish Transitous permission/Referer compliance. Real multi-city live stop search, stop-times, CORS and provider IDs still require evidence.
- [ ] Verify CI fast suite and manually run Chromium suite successfully; do not bump/release a stable version until green tests and live upstream access are confirmed.


## Netherlands Transitous 403 resolved (2026-10-23)

- [x] Identified API identification requirement from Transitous usage policy: server clients must send an identifiable User-Agent including application/version/contact; browser clients use Referer. Initial GitHub Actions probe spoofed Origin/Referer and received 403 in four cities.
- [x] Corrected network probe User-Agent and reran Actions [39970122882](https://github.com/tupolev/bustimer/actions/runs/39970122882). Live geocoding **passed** for Amsterdam, Rotterdam, Utrecht and Den Haag, with Access-Control-Allow-Origin: *. Evidence: `docs/validation/netherlands-api-latest.json`.
- [ ] Validate actual stop-times responses and that the geocoder's top results can identify correct Dutch provider IDs; some search candidates are international source IDs.
- [ ] Browser CORS and end-to-end favorites remain unverified. Netherlands is still gated until live departure queries and browser smoke succeed.


## Netherlands live departure smoke (2026-10-23)

- [x] Expand `scripts/smoke_netherlands_api.py` beyond geocoding: request real `/api/v6/stoptimes` for up to four stop candidates per representative city, prefer `nl-` provider IDs, record available line identifiers and CORS response headers. The workflow remains lightweight and does not run Chromium per commit (commit `14533427`).
- [ ] Check `docs/validation/netherlands-api-latest.json` from the **new** workflow run; prior successful run `39970122882` tested geocoding only and does not prove departure coverage.
- [ ] Confirm browser smoke and favorites; avoid enabling Netherlands until the live departure evidence supports usability.


## Netherlands API live departures verified (2026-10-23)

- [x] GitHub Actions [run 39970478094](https://github.com/tupolev/bustimer/actions/runs/39970478094) passed with real Transitous `/api/v1/geocode` and `/api/v6/stoptimes` calls across Amsterdam, Rotterdam, Utrecht and Den Haag. All 16 queried local `nl-OpenOV` stop candidates returned departures; observed line strings included 18/51/54, D/44/38, 2/8/27/73 and Sprinter/Intercity respectively. All 16 stop-times responses reported CORS `*`.
- [ ] Verify an actual browser flow from the deployed PWA; the CI probe is a server request with User-Agent, not browser-origin proof. Check the requested central stops and sorting explicitly: geocode results may include nearby but nonmatching stops.
- [ ] Run manual Playwright flow and assess the result before exposing Netherlands. The country catalog remains gated.
