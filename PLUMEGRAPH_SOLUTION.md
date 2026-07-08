# VayuLens: CleanAir & Clear Streets Hackathon Solution

## 1. Generic Solutions To Design Against

These are the five obvious ideas many teams will submit:

1. Citizen reporting app + CNN smoke classifier + pollution heatmap.
2. IoT PM2.5 sensors on a city map with red/yellow/green AQI markers.
3. Satellite fire/AOD layer overlaid with CPCB/OpenAQ station data.
4. AQI forecasting dashboard using historical AQI + weather in an LSTM.
5. Municipal alert app that sends SMS/WhatsApp when AQI crosses a threshold.

VayuLens is intentionally different on at least three axes:

- From map to action: it recommends which municipal asset should go where, tracks SLA, and proves whether the intervention worked.
- From reports to evidence graph: every hotspot requires cross-source corroboration from image physics, sensor anomaly, satellite/fire prior, wind direction, and reporter trust.
- From static heatmap to plume intelligence: it models pollution as moving plumes over roads, street canyons, dump yards, industrial edges, and downwind exposure zones.

## 2. Three Novel Concepts

### Concept A: VayuLens

VayuLens is a graph-based municipal command layer where every road segment, junction, dump site, industrial pocket, ward, and 100 m grid cell becomes a node. Citizen photos, low-cost sensors, satellite fire/AOD/NO2, weather, and municipal assets update node risk in near real time.

Unfair advantage: citizen photos become soft particulate sensors. Instead of only classifying smoke, the system estimates visual haze using dark-channel prior, sky brightness, contrast loss, EXIF timestamp/location, and comparison against expected clear-sky visibility.

Why it wins: it combines geospatial ML, civic workflow, explainability, and proof of action.

### Concept B: WasteRoute Sentinel

Low-cost PMS7003/SDS011 sensors and Android phones are mounted on garbage trucks, buses, street-sweeping vehicles, and water tankers. These vehicles already travel near dumps, transfer stations, industrial roads, markets, and bus depots.

Unfair advantage: garbage trucks visit exactly the locations where dump fires and waste burning occur. Other teams will place fixed sensors and miss these daily municipal transects.

### Concept C: Complaint-to-Cause Attribution Engine

Fuse Swachhata-style complaints, citizen photos, NASA FIRMS fire detections, wind back-trajectories, industrial/land-use maps, and sensor anomalies to infer likely cause: dump fire, construction dust, traffic choke, industrial plume, or biomass burning.

Unfair advantage: sanitation complaints are an early-warning signal. A garbage pile complaint today can become a smoke hotspot tomorrow.

## 3. Chosen Concept: VayuLens

One-line idea: a neighbourhood pollution evidence graph that detects hidden hotspots, predicts 24-hour AQI spikes, dispatches municipal resources, and proves whether the intervention worked.

## 4. Data Fusion Architecture

Use a 100 m to 250 m grid over the city, plus a road/ward graph.

Each grid cell stores:

```text
cell_id
lat/lon polygon
ward_id
road_type
nearby_dump_score
industrial_score
traffic_junction_score
building_density / street-canyon score
latest_pm25
latest_pm10
visual_haze_score
fire_prior
satellite_aod_prior
no2_prior
wind_u, wind_v
rainfall
temperature
humidity
trust_weighted_reports
hotspot_probability
forecast_aqi_24h
```

### Citizen Photos

Inputs:

- image
- GPS
- timestamp
- optional voice/text note in Hindi or regional language

ML outputs:

- smoke probability
- dust probability
- garbage-fire probability
- construction-dust probability
- visual haze index
- tamper/geolocation confidence

Image checks:

- EXIF GPS/time consistency
- perceptual hash duplicate detection
- camera timestamp drift
- smoke/dust classifier confidence
- face/license-plate blur for privacy

Visual PM proxy:

- segment sky or bright far-field areas
- estimate haze using dark-channel prior and contrast loss
- compare against expected clear-sky visibility or nearby reference photos
- generate a soft PM signal, not a regulatory reading

### Low-Cost Sensors

Supported examples:

- SDS011
- PMS7003
- Plantower PM sensors

Readings:

- PM2.5
- PM10
- temperature
- humidity
- battery
- device health

Calibration:

```text
corrected_pm25 = f(raw_pm25, humidity, temperature, sensor_age, nearest_station_bias)
```

For a hackathon, use a linear correction or random forest. In production, calibrate against CPCB-grade reference stations and detect drift over time.

### Satellite Data

Satellite data should be used as a prior, not as street-level truth.

- Sentinel-5P/TROPOMI: daily NO2, SO2, CO, aerosol/cloud products. Useful for regional pollution context and industrial plume priors.
- NASA FIRMS VIIRS/MODIS: near-real-time active fire and thermal anomaly priors.
- MODIS/MAIAC AOD: aerosol background and regional haze prior.
- Sentinel Hub / Copernicus / Earth Engine: imagery/statistics access for bounding boxes.

### Public Ground Data

- CPCB Central Control Room for real-time and historical AQI repository.
- OpenAQ API for hackathon-friendly JSON air-quality measurements.
- SAFAR where available for city-level context.

### Weather Data

- IMD APIs when available.
- Open-Meteo / ERA5 fallback.

Features:

- wind speed
- wind direction
- humidity
- rainfall
- temperature
- pressure
- boundary-layer proxy if available

### Fusion Method

For 48 hours, avoid overbuilding a deep fusion model. Use transparent weighted fusion that can later evolve into Gaussian process regression or kriging.

```text
1. Spatial snap:
   citizen report -> nearest grid cell + road node
   sensor -> nearest grid cell
   satellite pixel -> intersecting grid cells
   weather -> all cells or interpolated grid

2. Temporal decay:
   evidence_weight = source_confidence * exp(-age_hours / tau)

   photo smoke tau: 4h
   sensor PM tau: 1h
   FIRMS fire tau: 12h
   Sentinel-5P tau: 24h
   MODIS AOD tau: 24h

3. Weighted interpolation:
   predicted_pm25(cell) =
      weighted nearby sensor PM
      + station background AQI
      + visual haze contribution
      + fire prior
      + satellite AOD/NO2 prior
      + wind-transported upstream risk

4. Confidence:
   confidence(cell) =
      1 - product(1 - confidence_from_each_independent_source)
```

Hackathon implementation:

- inverse-distance weighting
- confidence weights
- temporal decay
- wind-downstream plume bias

Hotspot score:

```text
hotspot_score =
  0.30 * sensor_anomaly_z
+ 0.20 * visual_smoke_haze_score
+ 0.15 * citizen_trust_score
+ 0.15 * wind_upstream_source_score
+ 0.10 * FIRMS_fire_prior
+ 0.05 * satellite_aod_no2_prior
+ 0.05 * vulnerable_population_score
```

## 5. Hidden Hotspot Detection

A hotspot is not confirmed by one viral photo.

State machine:

```text
WATCH:
  one report, weak sensor anomaly, or satellite prior

SUSPECTED:
  two independent citizen reports
  OR one trusted report + sensor anomaly
  OR FIRMS fire nearby + visual smoke report

CONFIRMED:
  at least two independent source families agree:
    photo evidence
    corrected sensor anomaly
    satellite/fire prior
    wind-consistent downstream AQI increase
    repeated reports from trusted users
```

Trust scoring:

- starts neutral
- increases when reports match later sensor/satellite/municipal confirmation
- decreases for duplicate, old, or geospatially inconsistent images
- never lets a single report create a confirmed hotspot

Corroboration examples:

- photo says smoke and wind carries plume to a sensor spike 30 minutes later
- report near a known dump/industrial cluster gets a higher prior
- report far from plausible source needs stronger evidence

Alert card:

```text
Evidence Confidence: 87%
Cause: likely garbage dump fire
Affected radius: 650 m downwind
Population exposed: 8,400
Recommended action: water-mist cannon + solid-waste crew
```

## 6. 24-Hour AQI Spike Prediction

Scientifically strongest long-term model:

- spatiotemporal graph neural network
- graph nodes: road segments, grid cells, sensors, CPCB stations
- edges: distance, wind direction, road connectivity, land-use similarity

Honest 48-hour model:

- LightGBM or XGBoost over grid-time features
- graph-smoothed predictions across downwind cells

Why:

- robust with sparse data
- fast to train
- explainable for judges
- feasible in 48 hours

Features:

```text
current_pm25 / pm10 estimate
1h, 3h, 6h lagged PM
sensor anomaly z-score
photo smoke count last 3h
visual haze median last 3h
FIRMS fire distance and confidence
AOD / NO2 prior
wind speed, wind direction
upwind hotspot score
humidity
temperature
rainfall
hour of day
day of week
road density
junction density
industrial proximity
dump-site proximity
construction-zone proximity
population/vulnerability score
```

Targets:

```text
max PM2.5 or PM10 over next 24h
or
AQI category over next 24h
```

Sparse-data strategy:

- train on public station time series from OpenAQ/CPCB-like sources
- interpolate station observations to nearby grid cells
- use meteorology and lag features as generalizable signals
- let local photo/sensor evidence adjust risk
- seed demo with realistic scenario data so it works without fragile live APIs

## 7. Municipal Action Layer

This is the civic-tech differentiator.

Route by cause:

```text
garbage fire -> solid waste department + fire/water-mist unit
construction dust -> building enforcement + water spraying
traffic smog trap -> traffic police + road dust control
industrial plume -> pollution control board field team
unknown smoke -> ward officer + nearest field inspector
```

Each alert includes:

```text
location
ward
evidence bundle
confidence
predicted AQI spike
affected schools/hospitals
recommended asset
SLA timer
before-reading baseline
```

Dispatch optimization:

```text
priority =
  0.35 * predicted_aqi_spike
+ 0.25 * exposed_population
+ 0.15 * confidence
+ 0.15 * proximity_to_sensitive_sites
+ 0.10 * repeat_hotspot_penalty
```

Hackathon version:

- greedy nearest eligible resource
- weighted priority score
- visual dispatch animation

Production version:

- OR-Tools assignment or vehicle routing
- asset capacity constraints
- traffic-aware travel time
- SLA priority

### Proof of Action

This is the headline feature.

Before dispatch:

```text
baseline_pm25 = median corrected PM2.5 in cell last 30 min
baseline_visual_haze = median photo/CCTV haze score
```

After intervention:

```text
post_pm25 = median corrected PM2.5 30-90 min after action
post_visual_haze = new citizen/CCTV haze score
```

Dashboard output:

```text
Action completed: 18:42
PM2.5 reduced: 212 -> 146 ug/m3
PM10 reduced: 384 -> 250 ug/m3
Confidence: medium
Citizen complaints stopped: yes
Reopen if rebound occurs within 3h
```

## 8. India-Specific Constraints

- Cheap Android first: compressed image upload, offline queue, GPS fallback, regional language notes.
- Offline-tolerant: store reports locally and sync when network returns.
- Low-cost sensors: PMS7003/SDS011 with humidity correction and drift detection.
- Languages: Hindi, Kannada, Marathi, Tamil, Telugu, Bengali labels.
- Existing integrations: CPCB, SAMEER-style AQI context, Swachhata-MoHUA complaint workflows, SAFAR, Smart City ICCC command centres.
- Privacy: blur faces/plates, public geohash precision, exact GPS only for municipal users.
- Explainability: every hotspot has an evidence card.

## 9. 48-Hour Hackathon Build Plan

### Build For Real

Frontend:

- React/Next.js if using a framework
- or static HTML/CSS/JS for fast demo
- map layers: pollution grid, citizen reports, sensors, predicted AQI spike cells, municipal assets, before/after proof

Backend:

- Spring Boot for civic workflow APIs:
  - reports
  - alerts
  - dispatch
  - audit log
- Python FastAPI for ML:
  - image scoring
  - hotspot scoring
  - AQI prediction
- Postgres + PostGIS
- Redis for alert state
- S3/GCS for images

ML:

- pretrained CLIP/YOLO/ResNet smoke/dust classifier if available
- otherwise deterministic demo classifier with transparent confidence fields
- XGBoost/LightGBM for 24-hour AQI risk
- inverse-distance weighted fusion for grid estimates

Deployment:

- fastest: Docker Compose
- cloud: GCP Cloud Run or AWS ECS
- Kubernetes only if infra is part of the judging criteria

### Mock Honestly

Mock these if time is short:

- live municipal asset GPS
- ICCC CCTV integration
- exact CPCB API access if blocked
- true Sentinel-5P processing
- spatiotemporal GNN

Do not mock the civic workflow. The dispatch and proof loop should work in the demo.

### Free Data / APIs

- OpenAQ API for air-quality JSON data.
- CPCB Central Control Room for official India AQI context.
- NASA FIRMS for MODIS/VIIRS active fire detections.
- Sentinel-5P/TROPOMI for NO2, SO2, CO, aerosol/cloud priors.
- Sentinel Hub / Copernicus Data Space for satellite access.
- ERA5 / Open-Meteo for weather, wind, humidity, rainfall.
- IMD APIs for official India weather if access is available.
- OpenStreetMap for roads, schools, hospitals, land-use proxies.
- Municipal open data for wards, dump yards, industrial areas if available.

### Timeline

Hour 0-6:

- choose demo city
- create grid schema
- load OSM/ward sample data
- build map UI

Hour 6-14:

- citizen report upload
- image scoring pipeline
- evidence card

Hour 14-22:

- sensor ingestion simulator
- public station data adapter
- FIRMS layer
- weather adapter

Hour 22-30:

- hotspot score
- confidence score
- Watch/Suspected/Confirmed state machine
- wind plume visualization

Hour 30-38:

- AQI forecast model or seeded forecast
- feature explanation
- spike window display

Hour 38-44:

- dispatch view
- resource assignment
- before/after proof

Hour 44-48:

- polish
- seed reliable demo scenario
- rehearse three-minute story

## 10. Three-Minute Demo Script

0:00-0:30

City AQI is acceptable at the official station, but residents near this dump are breathing smoke. VayuLens detects the hidden hotspot before city-level AQI moves.

0:30-1:10

Upload a citizen photo. The system extracts GPS/time, classifies garbage smoke, estimates haze, checks reporter trust, and marks the cell as Watch.

1:10-1:40

A nearby PMS7003 sensor spikes. FIRMS shows a thermal anomaly within 1 km. Wind points toward a school. The hotspot becomes Confirmed with high confidence.

1:40-2:15

Show the 24-hour forecast. AQI will peak around 7-9 pm because wind speed drops and PM is already rising.

2:15-2:45

Click Dispatch. The system assigns the nearest water-mist cannon and solid-waste crew with ETA and reason.

2:45-3:00

Record after-reading. PM2.5 falls, haze improves, SLA closes. This is not just a pollution map; it is accountable municipal response.

## 11. One-Line Pitch

VayuLens turns citizen photos, cheap sensors, satellite fire signals, and weather into an accountable neighbourhood pollution command system that detects hidden hotspots, predicts AQI spikes, dispatches crews, and proves the air improved.

## 12. Demo Wow Moment

Upload one smoke photo and watch the system draw a downwind plume, corroborate it with sensor + FIRMS + weather, predict the AQI spike time, and auto-dispatch a municipal asset with before/after proof.

## 13. Likely Judge Questions

### Can satellite data really detect street-level pollution?

No, not alone. Sentinel-5P and MODIS AOD are coarse priors. Street-level confidence comes from citizen photos, local sensors, wind-aware interpolation, and repeated corroboration.

### How do you prevent fake reports?

Reports never directly create confirmed hotspots. We use EXIF checks, perceptual hashing, user trust, image classification, geospatial plausibility, sensor corroboration, wind consistency, and source independence. One fake photo can create Watch, not Confirmed.

### Why would municipalities adopt this instead of another dashboard?

Because it closes the loop. It recommends the asset, routes the alert, tracks SLA, and proves whether PM and visual haze improved after action.

## 14. Sustainability

Municipal SaaS / Smart City ICCC module:

- per-city subscription for dashboard, prediction, and dispatch
- CSR-funded sensor kits for schools, clinics, RWAs, and bus depots
- integration with Swachhata-style complaints and ICCC workflows
- analytics reports for pollution-control boards and city commissioners
- tender angle: hyperlocal air-quality incident detection and response management platform
