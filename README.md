# PlumeGraph

Neighbourhood-level pollution intelligence for Code for Communities, Track 2: CleanAir & Clear Streets.

PlumeGraph combines citizen photo evidence, low-cost PM sensors, satellite fire/AOD priors, weather, and municipal assets into an operational dashboard. The demo shows a hidden dump-fire hotspot moving from Watch to Confirmed, predicts the 24-hour AQI spike, dispatches municipal resources, and records before/after proof that the intervention worked.

## Run Locally

```bash
python3 -m http.server 5174
```

Open:

```text
http://127.0.0.1:5174/
```

## Demo Flow

1. Click `Run dump-fire scenario`.
2. Watch the citizen report, PM sensor spike, FIRMS fire prior, plume, confidence score, and AQI forecast update.
3. Confirm the municipal action recommendation.
4. Click `Record after-reading` to close the accountability loop.

## Files

- `index.html` - app shell
- `styles.css` - responsive operational UI and custom map
- `app.js` - hotspot state machine, forecast chart, dispatch logic
- `PLUMEGRAPH_SOLUTION.md` - full technical and product blueprint
- `PROJECT_WRITEUP.md` / `write-up.html` - submission write-up
- `PITCH_DECK.md` / `pitch-deck.html` - pitch deck
- `ARCHITECTURE.md` - architecture diagram and data contracts
- `.github/workflows/deploy-pages.yml` - GitHub Pages CI/CD

## Deployment

Every push to `main` deploys the static prototype through GitHub Actions to GitHub Pages:

```text
main branch -> GitHub Actions -> upload-pages-artifact -> deploy-pages -> GitHub Pages
```

Live URL:

```text
https://shivam2003-dev.github.io/plumegraph-cleanair-track2/
```

Submission pages:

- Full solution: `solution.html`
- Rendered architecture: `architecture.html`
- Pitch deck: `pitch-deck.html`
- Project write-up: `write-up.html`

## Google Cloud Pilot Path

The prototype is static for hackathon reliability. The city-pilot architecture maps to Google Cloud:

- Cloud Run for Spring Boot civic API and Python ML API
- Pub/Sub for report, sensor, satellite, and dispatch events
- Cloud SQL for PostgreSQL + PostGIS for geospatial state
- Cloud Storage for citizen photos
- Vertex AI for image evidence and AQI forecast models
- BigQuery for intervention analytics and impact reports
- Firebase Cloud Messaging for ward officer alerts

## Hackathon Positioning

This is not just another pollution heatmap. It is an accountable municipal response layer: detect hidden hotspots, predict near-term AQI spikes, dispatch the right resource, and prove the air improved.
