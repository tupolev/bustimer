# BusTimer 🚌 🚇

[![Build](https://github.com/tupolev/bustimer/actions/workflows/ci.yml/badge.svg)](https://github.com/tupolev/bustimer/actions/workflows/ci.yml)

A lightweight, responsive, installable PWA to monitor the next departures of saved stops and lines.

**Version 0.9.3**

**Automated checks:** [GitHub Actions CI](https://github.com/tupolev/bustimer/actions/workflows/ci.yml) — syntax, unit tests; integration/browser tests on the roadmap. Run locally with `npm run ci` (Node.js 22). Test run is pending validation.

**Project tracking:** [Implementation roadmap and checklist](docs/ROADMAP.md) — priorities, verified vs. unverified status, country expansion, blockers and session handoff instructions. · No build step · No backend · MIT licensed

## Features

- Four tabs: monitored stops, add stop, settings, help/about.
- Add a stop in four steps: city → stop search → available transport mode → currently observed line.
- Arrival countdown, expected time, reported delay, direction and real-time vs scheduled distinction.
- Refreshes departure data every 60 seconds while visible; manual refresh supported.
- English (default), Spanish, German.
- System/light/dark theme.
- Stops and preferences persist in `localStorage`.
- Web app manifest, service worker and SVG icon for PWA installation.
- Static site deployable to GitHub Pages from the root of `main`.

## Data quality and graceful degradation

BusTimer is **schedule-first**, and improves the estimate whenever more reliable information is available. An unavailable realtime feed is not the same as an unavailable transport service.

1. **Realtime prediction**: when the provider supplies a realtime departure or arrival estimate, show the predicted clock time and countdown. If the provider also supplies a planned time, compute or display the reported delay.
2. **Published timetable**: when realtime information is missing, fall back to the provider's planned departure time and label it **Scheduled / Horario / Fahrplan**. Show no invented delay.
3. **No timetable available**: only when neither a current departure nor an applicable published timetable can be obtained, show **Unavailable** or **No upcoming service** as appropriate. Never invent departure times.

Implementation note for v0.1.0: the current transport.rest integration prefers `when` and otherwise uses `plannedWhen` from the same API response. This already provides a basic static-time fallback **if the departures endpoint itself responds**. It does **not** currently include an independent GTFS or static-timetable feed: if the API fails outright, the app cannot yet retrieve timetable data. That independent fallback, including GTFS ZIP ingestion/conversion to static JSON suitable for GitHub Pages, is the next milestone.

Target architecture per city: query realtime where possible → merge with a published schedule (GTFS, GTFS-RT, NeTEx, or provider-specific feeds as available) by stop, line, direction, and service date → return a clearly labeled provenance and timestamp. Static schedules must be refreshed for service/calendar changes; simply caching a single day's predictions is not a timetable.

## Germany-wide MVP (v0.2.0)

The default option is **Deutschland / nationwide**, powered by the [Transitous MOTIS API](https://transitous.org/api/). Search for a stop anywhere in Germany (ideally include town name), choose a currently operating mode and line, then save it. Nationwide records have a dedicated provider identifier and will persist in the browser.

Transitous combines published timetables and realtime updates if supplied by upstream feeds. The UI labels timetable-only departures as Scheduled and realtime as Live. This is still a third-party live service, **not an independently stored offline timetable**. A later milestone will include a static feed fallback independent of API availability.

Existing saved VBB/DB stops remain compatible, and users can still explicitly choose Berlin-Brandenburg VBB, Köln DB, or Düsseldorf DB. The older entries are intentionally *not* migrated to Transitous stop IDs automatically.

The Transitous service is community-hosted and best effort. Usage and attribution: [Transitous API policy](https://transitous.org/api/), [source attribution](https://transitous.org/sources/), [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Keep API calls lightweight; BusTimer refreshes once per minute while visible and deduplicates requests per stop. Do not rely on this API for a commercial or high-volume application without discussing usage with maintainers.

**Verification:** This implementation has not yet been browser-tested against the live production API from GitHub Pages, so geocoder response variations, stop identifiers, CORS and data mappings should be validated on the deployed site.

## Networks and current limitations

| Network | Implementation | Notes |
| --- | --- | --- |
| Germany (nationwide) | [Transitous MOTIS](https://transitous.org/api/) | Default provider, GTFS-based schedules with realtime where supplied. Coverage varies by area. |
| Berlin / Brandenburg | [VBB transport.rest](https://v6.vbb.transport.rest/) | Browser CORS support; realtime when available upstream. |
| Köln | [DB transport.rest](https://v6.db.transport.rest/) | DB-backed source; coverage of KVB local bus/tram stops may be incomplete. |
| Düsseldorf | [DB transport.rest](https://v6.db.transport.rest/) | Initial DB-backed support; Rheinbahn/VRR local bus, tram and U-Bahn coverage may be incomplete. A dedicated VRR data source is planned, subject to browser CORS validation. |
| Málaga | Official EMT Málaga GTFS | Scheduled arrivals by stop/line from published GTFS; no verified realtime ETA yet. Data generated daily with GitHub Actions after first workflow run. |

The dropdown of lines is populated from the *next 90 minutes of departures* at a chosen stop. That means a line not operating in the current window may not be selectable yet. Direction is shown on the monitored card, but direction filtering is not yet implemented. The UI excludes cancelled departure records and matches line + transport mode; the next available service is selected.

If an API is unavailable, the app shows an error instead of simulated predictions. Time fields come from the upstream provider. Delay appears only if provided; **scheduled is not equivalent to realtime**.

Stop search and departure data require internet. App-shell resources may be accessible offline after installation. Browsers may suspend background tabs; this app does not claim background monitoring or push notifications.

## Development

Serve locally over HTTP (not `file://`) for service workers:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000/`. There are no packages to install.

## Roadmap

- Validate and integrate dedicated KVB/VRS local transport coverage.
- Integrate the VRR openservice stop finder and departure monitor for Düsseldorf/Rheinbahn, after checking CORS and provider data formats.
- Investigate EMT Málaga arrival predictions, CORS and licensing; potentially a serverless backend if necessary.
- Allow selection of direction and stops not serving in the next 90 minutes.
- Multiple upcoming departures and service alerts.
- Add robust E2E tests and installability verification.

## Privacy and attribution

Stops and preferences are stored in your browser. This project does not send them to its own server; browser API requests necessarily disclose requested stops to the relevant data provider. The project has no analytics.

Transit predictions are supplied by third-party services and may be unavailable or inaccurate.

© BusTimer contributors. MIT license.

## API use, attribution and security (v0.2.1)

- BusTimer is an open-source, non-commercial application with contact and support at https://github.com/tupolev/bustimer/issues.
- Public data providers: https://transitous.org/api/, https://transitous.org/sources/, https://v6.vbb.transport.rest/, https://v6.db.transport.rest/. Data licenses vary by originating operator. OSM attribution: https://www.openstreetmap.org/copyright.
- Browser requests cannot reliably set a custom User-Agent (a forbidden request header); Transitous accepts browser Referer when website contact details are present. Avoid policies that strip the HTTP Referer from API requests. If the browser suppresses the Referer, the provider may reject or limit requests.
- Refresh only while visible and on the monitored-stops tab. Stop queries share results via short-lived client-side cache for 60 seconds; search queries use 550 ms debounce and 2-minute memoization. These mitigations are per-browser, not a global quota. A production-scale user base should contact upstream maintainers before generating substantial traffic.
- Public JavaScript must never contain private API keys. **No keys or access tokens are currently committed.** Any future credentialed API needs a protected server-side proxy with secret management and rate limits, not GitHub Pages frontend code.
- External API requests reveal the browser's IP and queried stops to providers; stop preferences remain in localStorage in this app.

## Málaga static timetable importer (v0.3.0)

Official source: [EMT Málaga GTFS](https://gtfs.emtmalaga.es/GTFS/google_transit.zip), published by EMT Málaga / Ayuntamiento de Málaga, distributed as open data under **CC BY-SA 4.0**. Preserve this attribution when redistributing timetable data. The importer in `scripts/build_malaga.py` converts the GTFS into `data/malaga/index.json` and per-stop JSON files, including route, trip, service calendar and exceptions. These assets are served directly from GitHub Pages; the user's browser does not download the complete GTFS archive. No API key is required.

**Initial activation required:** open [Actions → Refresh Málaga EMT timetables](https://github.com/tupolev/bustimer/actions/workflows/malaga-gtfs.yml), select **Run workflow**, branch **main**. After the run commits `data/malaga/` and GitHub Pages rebuilds, Málaga stop search and scheduled countdowns can work. The workflow also runs daily at 03:17 UTC. The app reports an error if this dataset has not yet been generated rather than showing fabricated times.

The importer and live browser workflow require validation on the published site. EMT's published bus locations are not stop-level ETA predictions; future real-time functionality depends on finding a legally reusable public stop-arrivals endpoint.

### Spain roadmap

Once Málaga's schedule flow is validated, extend the data-provider abstraction to feeds from the official Spanish National Access Point (NAP), with regional static GTFS, calendars, licensing and available GTFS-RT. Do not commit NAP private access tokens to the public repository.

## Spain-wide beta (v0.4.0)

BusTimer now provides an **España / nationwide (beta)** stop-search option via the existing [Transitous MOTIS API](https://transitous.org/api/). The same stop/line selection, countdown, and live-vs-scheduled display flow applies. Queries include España to narrow geocoding. **This is coverage through currently indexed feeds, not a guarantee of every Spanish operator or of a published static timetable for every stop.** The separately imported official EMT Málaga timetable remains available.

### Toward national static coverage

The official Spanish [National Access Point (NAP)](https://nap.transportes.gob.es/ConjuntoDato/List) catalogs hundreds of GTFS and realtime feeds from Spanish operators. Those feeds must be checked individually for access, calendars, licensing, update mechanisms, and overlap before generating a deduplicated national stop index. A full Spain GTFS ingestion pipeline is **not** part of this beta. Avoid claiming nationwide-complete coverage until that pipeline has been implemented and tested.

This project continues to use no API key and retains the public GitHub Pages architecture.

## Unified Spain selection (v0.4.1)

The Málaga choice was removed from the Add Stop network dropdown. **España** now combines Transitous results with EMT Málaga scheduled-stop results automatically. EMT candidates carry an `emt:` prefix internally and a visible `EMT timetable` label. Selecting one uses the already published GTFS data, not Transitous, and displays scheduled predictions only. Previously saved `city: malaga` items continue to work through their legacy provider, so favorites are preserved. The daily EMT import workflow is retained.

This does not imply full Spanish operator coverage; national GTFS ingestion is still pending. Search results from different providers are not yet deduplicated by geographic coordinates. If a stop appears twice, the EMT-labeled entry explicitly uses the official schedule.

## Automatic data-provider selection (v0.5.0)

Internal adapters for Transitous, EMT Málaga, VBB and DB now select sources without asking users to choose providers. Spain stop search merges matching names within 75 metres when coordinates are available, retaining upstream IDs. New favorites remember all known provider IDs, older favorites remain compatible. Each supported provider is queried independently; a failing source does not suppress successful sources. Departure candidates are deduplicated by line, mode, direction and close planned times, with realtime preferred. Stop matching is heuristic, and direction-specific favorites and complete national GTFS coverage remain future work.

## Country-only network selection (v0.5.1)

The public dropdown now shows only **Deutschland** and **España**. VBB, DB and EMT Málaga are internal provider adapters, not selectable cities. Existing previously saved Berlin/VBB, Köln/DB, Düsseldorf/DB and Málaga/EMT favorites retain their original identifiers and continue using their original provider.

German stop searches combine Transitous national search and the VBB regional API results. Candidates with matching names and geocoordinates within 75 metres can be merged while keeping both providers' actual stop IDs; no foreign IDs are sent to another provider. DB remains available for previously saved favorites; an automatic DB stop-ID mapping for other German regions is not implemented yet. Results may remain duplicated when identifiers or coordinates are insufficient. This is a safe incremental step, not a claim of complete provider arbitration across Germany.

## EU-ready provider discovery (v0.6.0)

One `COUNTRY_CATALOG` routes Germany and Spain through a national Transitous search and country-specific regional adapters. Regional responses are geographically checked and matched by name and coordinates within 75 metres, preserving original source IDs. A failure of one source does not prevent others returning results. Other EU countries are not enabled until their feed coverage, API contract, licensing and browser access are checked; EU National Access Points are catalogs, not one universal live API.

## Country roadmap and activation gate (v0.7.0)

`countries.json` is the machine-readable catalog for the Spain/Germany-first expansion strategy. **Only Germany and Spain are enabled**; the catalog holds neighboring countries (France, Portugal, Netherlands, Belgium, Luxembourg, Austria, Switzerland, Poland, Czechia, Denmark and Andorra) as disabled candidates, and several subsequent European candidates. Each entry stores the country ISO code, audience priority, rollout status, enabled flag, and anticipated regional adapters. The app reads the catalog at startup and shows enabled, validated core countries only; it falls back to its bundled DE/ES configuration when the JSON cannot load. The service worker caches the catalog as part of the app shell.

**Activation checklist:** verify a public and legally reusable timetable feed with dates and exceptions; a working stop search and stop departures endpoint (plus browser CORS); real stop-ID consistency; transport-mode and route mapping; attribution/licensing; sample searches in multiple cities and directions; rate limits; and fallback/error behavior. Then add verified bounds/geo-hint, register the corresponding provider and expand the allow-list, followed by regression testing. Merely flipping `enabled` to true in JSON is deliberately insufficient.

The European Commission's [National Access Points](https://transport.ec.europa.eu/transport-themes/smart-mobility/road/its-directive-and-action-plan/national-access-points_en) are useful discovery catalogs, **not** a unified API granting automatic coverage. Transitous remains best-effort and open-source/non-commercial usage applies: https://transitous.org/api/.

## France and Portugal experimental integration (v0.8.0)

**France 🇫🇷 and Portugal 🇵🇹** are now enabled as **experimental** choices using Transitous stop search and departure lookup, with the same country catalog and core UI as Germany and Spain. No new API keys are needed. The geographical filters include French metropolitan territory and mainland Portugal plus the Azores and Madeira; they are approximate, not precise national boundaries. Country names are appended to stop searches. These countries do **not** yet have independent static GTFS fallback and coverage is not guaranteed.

- France official National Access Point: https://transport.data.gouv.fr/ (GTFS / GTFS-RT and SIRI data sources, with source-specific licenses).
- Portugal National Access Point: https://nap-portugal.imt-ip.pt/nap/multimodalsupply (operator feed discovery, not a uniform arrivals API).
- Transitous usage policy: https://transitous.org/api/ ; attribution: https://transitous.org/sources/ .

Activation does not mean all operators work. In this iteration live web API requests and end-to-end GitHub Pages rendering were not verifiable from the development environment; validate Paris Gare du Nord, Lyon Part-Dieu, Lisboa Oriente and Porto São Bento and mark unsupported networks clearly. The provider catalog distinguishes experimental coverage from the core countries.

## Direction-aware favorites (v0.9.0)

The Add Stop form now requires selecting the direction displayed in the departure feed after choosing a line. Each saved favorite includes its direction, allowing the same route at the same stop to be monitored separately in opposite directions. Existing favorites remain compatible and retain their previous all-directions behavior until recreated. When upstream sources do not supply a direction, an explicit unspecified option is offered; some providers may use slightly different direction labels, so matching follows their displayed text and needs browser validation.

## NRW regional discovery (v0.9.1)

German country search now adds DB-backed stop discovery **only when the user supplies an explicit Köln/Düsseldorf/Bonn/Ruhr-area name**. Matched results are geographically limited to a broad NRW bounding box and retain their DB-specific IDs, never reusing Transitous IDs. This can surface DB-known local stops missing from national Transitous; it does **not** constitute full VRS/VRR coverage. Existing VBB and saved favorites remain supported. Queries without locality hints avoid speculative regional DB calls. Source failures are isolated. Note that DB's unofficial wrapper has rate limits and incomplete local bus/tram coverage.

For full NRW fallback, the official [VRS GTFS static data](https://www.vrs.de/fuer-unternehmen/open-data-service) is a promising next step (DL-DE Zero 2.0; realtime access may require agreement). VRR OpenService needs separate contractual/CORS/schema validation before enabling. Both remain roadmap tasks.

## VRS GTFS import pipeline (staged)

The optional VRS static-data build is in `scripts/build_vrs.py`, using the VRS global-ID GTFS download under Datenlizenz Deutschland Zero 2.0. Run `python3 scripts/build_vrs.py` to generate `data/vrs/index.json` and per-stop JSON files. There is a **manual-only** workflow at [Refresh VRS scheduled timetables](https://github.com/tupolev/bustimer/actions/workflows/vrs-gtfs.yml). It is intentionally **not wired to the app yet**; run and validate the import and repository size before enabling automatic updates. Source: https://www.vrs.de/fuer-unternehmen/open-data-service . Public scheduled data only: realtime VRS access requires a separate agreement.

**VRS feed correction (2026-10-23):** the official VRS site currently links `https://download.vrs.de/gtfs/google_transit_goR.zip`; this supersedes the previously assumed URL. The importer also writes a filename mapping per stop to safely support global stop identifiers. Until the first successful export and integration tests, the app does not advertise VRS departures.

## Optional VRS static adapter (v0.9.2)

The German search now attempts an official VRS static stop index (if it exists under `data/vrs`) alongside Transitous, VBB and NRW-context DB searches. VRS stop IDs are source-namespaced as `vrs:`, and departures use `Europe/Berlin` service dates, calendar exceptions and scheduled-only labels. The index is **not yet generated**; a missing index fails over to the existing providers. Once the manual import succeeds, VRS data becomes available without another application deployment. The first feed must still be checked for GTFS route types, stop naming, service dates, DST behavior and repository size.

**Importer regression fix:** VRS GTFS records are streamed with the ZIP file handle kept open. Synthetic GTFS archive tests now run in the main GitHub Actions CI, independent of network access. The official dataset import still requires a first manual workflow run.

**VRS activation verified:** first official import [completed successfully](https://github.com/tupolev/bustimer/actions/runs/39938475320), publishing **20,494** stop schedule files. Its workflow now refreshes **weekly on Monday at 04:37 UTC** (plus manual dispatch), serialized against overlapping runs. This conservative frequency limits Git repository churn; live UI behavior and long-term storage costs still need checking. Do not interpret VRS static departures as realtime.

## VRS coverage search ranking (v0.9.3)

Verified VRS source index contains **20,494 stops**, service calendars and exceptions. Country search now processes regional results first (VRS, VBB, DB, EMT) and gives prefix matches priority before limiting results to 20, reducing the chance that locally sourced platform stops disappear behind Transitous matches. A VRS provider-ID regression test protects correct namespace handling. A separate lightweight search-index optimization remains planned; VRS raw index is about 5.4 MB, so initial first-load time may vary by connection.
