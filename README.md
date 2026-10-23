# BusTimer 🚌 🚇

A lightweight, responsive, installable PWA to monitor the next departures of saved stops and lines.

**Version 0.1.0** · No build step · No backend · MIT licensed

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

## Networks and current limitations

| Network | Implementation | Notes |
| --- | --- | --- |
| Berlin / Brandenburg | [VBB transport.rest](https://v6.vbb.transport.rest/) | Browser CORS support; realtime when available upstream. |
| Köln | [DB transport.rest](https://v6.db.transport.rest/) | DB-backed source; coverage of KVB local bus/tram stops may be incomplete. |
| Düsseldorf | [DB transport.rest](https://v6.db.transport.rest/) | Initial DB-backed support; Rheinbahn/VRR local bus, tram and U-Bahn coverage may be incomplete. A dedicated VRR data source is planned, subject to browser CORS validation. |
| Málaga | Planned | EMT Málaga publishes open datasets, but these do not themselves constitute a verified stop-level arrival-prediction API accessible from a static web page. Disabled until a suitable source is tested. |

The dropdown of lines is populated from the *next 90 minutes of departures* at a chosen stop. That means a line not operating in the current window may not be selectable yet. Direction is shown on the monitored card, but direction filtering is not yet implemented. The UI excludes cancelled departure records and matches line + transport mode; the next available service is selected.

If an API is unavailable, the app shows an error instead of simulated predictions. Time fields come from the upstream provider. Delay appears only if provided; **scheduled is not equivalent to realtime**.

Stop search and departure data require internet. App-shell resources may be accessible offline after installation. Browsers may suspend background tabs; this app does not claim background monitoring or push notifications.

## GitHub Pages deployment

1. Open [Repository → Settings → Pages](https://github.com/tupolev/bustimer/settings/pages).
2. In **Build and deployment**, select **Deploy from a branch**.
3. Set branch **main**, folder **/(root)**, then **Save**.
4. Your expected URL is **https://tupolev.github.io/bustimer/**.

Assets use relative paths, so GitHub Pages project-path hosting works. HTTPS enables service-worker registration and installation. Some browsers may have specific requirements for PWA icons/install prompts.

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
