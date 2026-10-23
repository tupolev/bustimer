# European neighboring-country data sources

Reviewed: 2026-10-23. Germany and Spain remain primary markets; France and Portugal experimental via Transitous. The following countries are **candidates only** and intentionally disabled in `countries.json`.

| Candidate | Source | Schedule format | License / access | Engineering path |
| --- | --- | --- | --- | --- |
| 🇱🇺 Luxembourg — first | [Administration des transports publics, official GTFS](https://data.public.lu/en/datasets/horaires-et-arrets-des-transport-publics-gtfs/) | GTFS ZIP, ~16 MB, weekly updates | CC BY 4.0; attribution required | Adapt VRS split GTFS importer for Europe/Luxembourg; discover latest resource through portal API rather than hardcoding dated ZIP |
| 🇧🇪 Belgium — next | [Belgian Mobility Open Data](https://data.belgianmobility.io/en/data.html), [API documentation](https://data.belgianmobility.io/en/knowledge-base.html) | Four operators' GTFS static (De Lijn, STIB-MIVB, LETEC, NMBS-SNCB); some GTFS-RT | Free public datasets; verify individual feed license, terms and auth before ingestion | Build multi-operator normalized import; handle source IDs and cross-operator duplicates |
| 🇳🇱 Netherlands — next | [NDOV Open Data](https://data.ndovloket.nl/), [openOV national GTFS](https://gtfs.ovapi.nl/nl/gtfs-nl.zip) | GTFS, GTFS-RT and raw NeTEx/BISON | NDOV states CC0 for open data; inspect feed-specific conditions | National GTFS ZIP roughly 200–250 MB, unpacked substantially larger: process in CI/Actions, never download directly into browser |

## Acceptance criteria before enabling a country

- [ ] Download current official data without private API credentials, or document an authorized arrangement.
- [ ] Independently verify dataset license/attribution and rate limits.
- [ ] Normalize stop IDs, transportation product types, trips and directions; keep operator-provided identity.
- [ ] Generate size-bounded stop-search and service-calendar assets (never a giant all-in-one browser download).
- [ ] Check service-date exceptions, >24-hour trips, timezone and DST, including train/bus/tram.
- [ ] Test several recognizable stops across different cities against official published schedules.
- [ ] Verify browser CORS, search/save/refresh flow and clean handling when data are unavailable.
- [ ] Enable in `countries.json` only after integration succeeds and status accurately reflects scope.

## Proposed build sequence

1. **Luxembourg:** generalize the working VRS GTFS conversion to an operator-independent importer, with CC BY 4.0 source metadata, then validate Luxembourg City and regional stops.
2. **Belgium:** start with STIB-MIVB and NMBS-SNCB official static data; add De Lijn and LETEC iteratively. Investigate live data separately.
3. **Netherlands:** stream-import openOV GTFS/NDOV data with bounded memory and sharded output; handle national size early.

No country gains verified public support simply because it appears in this source matrix. Transitous remains an optional data provider, not proof of a country's national coverage.

## Luxembourg staging progress (2026-10-23)

The importer discovers the most recent GTFS ZIP via the public [data.public.lu dataset](https://data.public.lu/en/datasets/horaires-et-arrets-des-transport-publics-gtfs/) API. It generates \`search.json\`, \`services.json\` and per-stop JSON with CC BY 4.0 attribution. A manual-only validation workflow checks integrity and uploads index artifacts. Luxembourg is **not enabled** in the PWA until live dataset validation and browser integration are complete.
