# VayuLens Project Write-Up

## Project

**VayuLens** is a neighbourhood-level pollution command system for Indian cities. It combines citizen-uploaded smoke/dust photos, local PM sensor readings, satellite fire/AOD signals, and weather to detect hidden pollution hotspots, forecast 24-hour AQI spikes, and dispatch municipal resources with before/after proof.

## Problem

City-level AQI apps are too coarse. Garbage dump fires, construction dust, smog-trap junctions, and industrial plumes can harm a few streets or one ward while the nearest official AQI station still looks normal.

Municipal teams also lack a reliable way to know:

- which local reports are real
- where the plume will move next
- which asset should be sent
- whether the intervention actually improved air quality

## Solution

VayuLens treats every citizen report, sensor, satellite signal, wind vector, and municipal action as evidence in a shared geospatial graph.

The system moves a hotspot through four states:

```text
Clear -> Watch -> Suspected -> Confirmed -> Mitigated
```

A hotspot is confirmed only when independent evidence agrees. One citizen photo can create a Watch cell, but not a Confirmed hotspot.

## What The Prototype Does

The working demo shows an end-to-end dump-fire incident:

1. A citizen uploads a smoke photo with GPS, timestamp, and Hindi note.
2. The system scores image evidence: smoke probability, haze proxy, EXIF/location consistency.
3. A nearby PMS7003 sensor spikes from 74 to 212 ug/m3 corrected PM2.5.
4. A NASA FIRMS/VIIRS fire prior appears within 900 m.
5. Wind shows the plume moving toward a school exposure zone.
6. The hotspot becomes Confirmed with high confidence.
7. The forecast predicts the next 24-hour AQI peak.
8. The municipal action layer assigns a mist cannon and solid-waste crew.
9. The proof loop records a PM2.5 drop from 212 to 146 ug/m3.

## AI / Technical Execution

### Image Evidence

Citizen photos are treated as both semantic and physical signals:

- smoke/dust classifier
- garbage-fire/construction-dust cause estimate
- visual haze score using contrast and dark-channel-style visibility loss
- EXIF timestamp/GPS consistency
- duplicate/tamper checks through perceptual hash

### Sensor Evidence

Low-cost sensors such as SDS011 or PMS7003 are corrected for humidity, temperature, and local bias.

```text
corrected_pm25 = f(raw_pm25, humidity, temperature, sensor_age, station_bias)
```

The demo simulates the ingestion path but preserves the data contract needed for real devices.

### Satellite Evidence

Satellite data is not treated as street-level truth. It is a prior:

- NASA FIRMS VIIRS/MODIS: active fire and thermal anomaly prior
- Sentinel-5P/TROPOMI: NO2/SO2/CO/aerosol context
- MODIS/MAIAC AOD: regional haze/background aerosol prior

### Fusion

Each source gets confidence and temporal decay.

```text
evidence_weight = source_confidence * exp(-age_hours / tau)
```

The hackathon prototype uses weighted grid scoring and wind-aware plume propagation. A production version can replace this with Gaussian process regression, kriging, or spatiotemporal graph neural networks.

### 24-Hour Forecast

The practical 48-hour model is XGBoost/LightGBM over grid-hour features:

- current PM2.5/PM10
- 1h, 3h, 6h lags
- sensor anomaly z-score
- smoke photo count
- visual haze median
- FIRMS distance/confidence
- AOD/NO2 prior
- wind speed/direction
- humidity, temperature, rainfall
- road density, junction density, dump proximity, industrial proximity

The production model can evolve into a spatiotemporal GNN over grid cells and roads.

## Google Cloud Deployment Path

The static prototype is deployed on GitHub Pages for judge access. The production architecture maps cleanly to Google Cloud:

- **Cloud Run**: Spring Boot civic API and Python ML API
- **Cloud Storage**: citizen photo storage
- **Pub/Sub**: event bus for reports, sensor readings, satellite priors, and dispatch updates
- **Cloud SQL for PostgreSQL + PostGIS**: geospatial incident store
- **BigQuery**: historical AQI, sensor, intervention, and analytics warehouse
- **Vertex AI**: image model and AQI forecasting model endpoint
- **Cloud Scheduler + Cloud Functions**: periodic satellite/weather ingestion
- **Firebase Cloud Messaging**: ward officer and municipal team alerts
- **Looker Studio / ICCC embed**: commissioner and command-centre reporting

## Tools And Data

Prototype:

- HTML, CSS, JavaScript
- GitHub Actions CI/CD
- GitHub Pages

Production-ready data sources:

- CPCB Central Control Room / SAMEER-style AQI context
- OpenAQ
- NASA FIRMS
- Sentinel-5P/TROPOMI
- MODIS/MAIAC AOD
- ERA5 / Open-Meteo / IMD weather
- OpenStreetMap roads, schools, hospitals, land use
- municipal ward, dump-yard, industrial-area data

## Architecture Diagram

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Inclusivity And Accessibility

VayuLens is designed for Indian city conditions:

- cheap Android-first reporting
- compressed photo upload
- offline queue and later sync
- Hindi/regional language labels
- voice note support for low-literacy users
- role-based municipal views
- public map uses coarse geohash instead of exact citizen GPS
- face and license-plate blur before storage

## Impact Potential

The highest-impact users are:

- ward officers
- Smart City ICCC operators
- solid-waste teams
- pollution-control field inspectors
- schools, clinics, RWAs, and vulnerable residents

Measurable outcomes:

- hotspot detection time
- time from first report to dispatch
- exposed population reduced
- PM2.5/PM10 change after intervention
- repeat hotspot frequency
- SLA closure rate

## Why It Is Different

Most teams will submit a pollution heatmap. VayuLens is an accountability system.

It does not stop at "there is smoke here." It answers:

- is the report trustworthy?
- what evidence confirms it?
- where will the plume move?
- which municipal team should act?
- what resource should be sent?
- did the air improve afterward?

## One-Line Pitch

VayuLens turns citizen photos, cheap sensors, satellite fire signals, and weather into an accountable neighbourhood pollution command system that detects hidden hotspots, predicts AQI spikes, dispatches crews, and proves the air improved.
