# PlumeGraph Build Phases

## Current Status

PlumeGraph has cleared the initial selection round. The next goal is to turn the selected prototype into a credible end-to-end civic product demo that judges can inspect page by page.

Important security note: no private API key is committed to this repo or exposed in GitHub Pages. AI calls must go through a backend proxy or local environment variable.

## Phase 1: Complete Multi-Page Civic Product Surface

Status: completed in the static prototype

Goal: make the prototype feel like a real municipal system, not a single demo page.

Deliverables:

- `index.html`: live command dashboard
- `report.html`: citizen / field-inspector report intake
- `evidence.html`: evidence graph and trust scoring
- `forecast.html`: 24-hour AQI forecast lab
- `dispatch.html`: municipal resource routing and proof loop
- `solution.html`: full selected-project story
- `architecture.html`: rendered system architecture
- `pitch-deck.html`: browser pitch deck
- `write-up.html`: browser project write-up

Acceptance tests:

- Every public page returns HTTP 200 locally and on GitHub Pages.
- Dashboard scenario reaches Confirmed hotspot.
- Navigation never points judges to raw Markdown as the primary experience.
- Mobile layout remains usable.
- Google Maps support exists through runtime session key input; no browser key is committed.

## Phase 2: AI-Ready Evidence, Forecasting, Dispatch, And Proof

Status: completed in the static prototype

Goal: make AI visible in the workflow while keeping secrets safe.

AI features:

- citizen photo evidence interpretation
- smoke/dust/cause explanation
- trust score and fake-report risk
- hotspot confirmation reasoning
- 24-hour spike explanation
- municipal action recommendation
- WhatsApp/SMS alert draft
- field crew checklist
- post-intervention proof summary

Implementation rule:

- GitHub Pages uses deterministic local AI simulation for reliable judging.
- Real model calls use an environment variable or proxy only:

```text
PLUMEGRAPH_AI_PROXY_URL=https://your-secure-backend.example.com/ai
OPENROUTER_API_KEY=stored_on_backend_only
```

Never place a private token in:

- browser JavaScript
- committed `.env`
- GitHub Pages files
- screenshots
- README examples

Acceptance tests:

- core hotspot confidence is deterministic and tested
- fake reports cannot create Confirmed state alone
- dispatch optimizer assigns the best eligible asset
- proof loop shows measurable before/after impact
- AI fallback produces incident summaries without network access

Implemented pages:

- `evidence.html`: trust and corroboration logic
- `forecast.html`: forecast cases and spike windows
- `dispatch.html`: asset selection and proof timeline
- `ai-copilot.html`: municipal brief, citizen alert, field checklist

## Phase 3: Backend Pilot

Status: planned

Goal: move from static demo to a deployable city pilot.

Recommended stack:

- Spring Boot civic workflow API on Cloud Run
- Python FastAPI ML service on Cloud Run
- Pub/Sub for report/sensor/satellite events
- Cloud SQL PostgreSQL + PostGIS
- Cloud Storage for report media
- Vertex AI or OpenRouter-compatible model through backend proxy
- BigQuery for impact analytics
- Firebase Cloud Messaging for mobile alerts

## Phase 4: Field Pilot

Status: planned

Goal: one ward pilot with real municipal workflow.

Pilot assets:

- 20 PM sensors across schools, clinics, junctions, and dump edges
- 1 sanitation fleet route
- 1 water-mist cannon or tanker team
- ward officer dashboard access
- RWA/school reporting drive
- weekly impact report

Pilot metrics:

- first-report to confirmation time
- first-report to dispatch time
- PM2.5/PM10 reduction after action
- repeated hotspot reduction
- exposed population protected
- SLA closure rate
