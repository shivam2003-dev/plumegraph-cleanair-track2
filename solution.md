# VayuLens Solution

## Summary

VayuLens is a hyperlocal pollution intelligence and municipal response platform. It fuses citizen photos, low-cost PM sensors, CCTV visibility cues, satellite fire and aerosol signals, weather, traffic, and municipal asset data into a live 100-meter pollution surface that detects hotspots, predicts spikes, dispatches response, and verifies improvement.

Most air-quality tools show the problem. VayuLens closes the loop from evidence to action to proof.

## Submission Form Answers

### Explain Your Solution

VayuLens helps city command centres see pollution at street level instead of city-average AQI. Residents submit photos or videos of smoke, dust, garbage fires, and local plumes. Low-cost sensors, CCTV frames, Sentinel-5P, FIRMS fire data, and weather provide corroborating evidence. The system scores report trust, estimates haze severity, confirms hotspots only when independent signals agree, forecasts ward-level AQI spikes, recommends municipal dispatch, and closes tickets only when post-action readings or photos show measurable improvement.

### Technologies Used

The prototype is a static operational demo deployed on GCP/GKE behind Argo CD. The pilot architecture uses FastAPI/Python services, PostgreSQL/PostGIS, Redis, MQTT sensor ingestion, Google Earth Engine or Sentinel Hub, OpenAQ/IMD weather sources, vision models for smoke and haze scoring, gradient boosting for AQI spike forecasts, routing/assignment optimization for municipal assets, and WhatsApp/CCTV integrations. The live deployment uses Docker/Nginx, Artifact Registry, GKE, Argo CD, Certificate Manager, and Vercel DNS.

### Presentation Upload

Use the VayuLens Track 2 pitch deck. This file provides the written submission copy and technical evaluation mapping.

## Problem

Official AQI stations are sparse and report averages across large areas. They miss the street-level events that harm residents most directly: dump fires, construction dust, industrial plumes, traffic smog traps, and local burning near schools or hospitals.

VayuLens addresses:

- Hidden pollution hotspots between official stations.
- Unverified citizen complaints.
- Sensor drift and sparse sensor coverage.
- Satellite signals that are too coarse without ground truth.
- Municipal response that is not targeted or verified.

## Core User Flow

1. A resident sends a smoke or dust photo through WhatsApp.
2. The system extracts image severity, EXIF/location signals, and reporter trust.
3. Nearby sensor, CCTV, satellite, wind, and prior reports are checked.
4. The hotspot is classified as Watch, Suspected, Confirmed, or Mitigated.
5. A 24-hour spike forecast estimates likely ward impact.
6. The dispatch optimizer recommends the nearest suitable municipal resource.
7. After-action photos and sensor readings verify whether the intervention worked.
8. The ward accountability view updates with response time and impact.

## Main Features

- **Photo-as-sensor**: haze and smoke severity from ordinary citizen photos.
- **Evidence graph**: each source contributes confidence, decay, and provenance.
- **100-meter live map**: trust-weighted spatial fusion of citizen, sensor, CCTV, and satellite data.
- **Spike forecast**: 24-hour local AQI risk using weather, traffic, and evidence state.
- **Dispatch optimizer**: assigns mist cannons, sweeping crews, fire tenders, or enforcement.
- **Proof loop**: tickets close only when readings or images improve.
- **Ward accountability**: response-time and intervention-effectiveness reporting.

## AI And Data Pipeline

VayuLens uses AI and statistical models for evidence quality and action:

- Vision models classify smoke, dust, fire, and visibility degradation.
- Haze scoring converts citizen photos into calibrated severity signals.
- Trust scoring checks reporter history, GPS consistency, duplicates, and corroboration.
- Spatial fusion blends noisy evidence into a live pollution surface.
- Forecasting predicts local AQI spikes before they become citywide incidents.
- Dispatch logic chooses the fastest suitable response while tracking measured outcomes.

## Tools And Technology Fit

| Area | Tools | How VayuLens uses them |
| --- | --- | --- |
| Citizen intake | WhatsApp, web forms, media upload | Captures photo, video, voice, and location evidence from residents. |
| Vision | ViT/CNN smoke classifier, haze analysis | Converts visual evidence into severity with confidence bounds. |
| Sensors and satellites | SDS011/PM sensors, FIRMS, Sentinel-5P, OpenAQ | Corroborates reports and catches events no resident photographed. |
| Geospatial | PostGIS, kriging, ward grids | Builds 100-meter hotspot surfaces and ward summaries. |
| Forecasting | Gradient boosting, weather/traffic features | Predicts near-term local AQI spikes. |
| Deployment | Docker, GKE, Argo CD, Artifact Registry, Certificate Manager | Runs the live demo and supports merge-to-deploy automation. |

## Evaluation Criteria Mapping

| Evaluation parameter | VayuLens fit |
| --- | --- |
| Problem-Solution Fit | Targets the gap between city-average AQI and street-level pollution response. |
| AI/Technical Execution | AI verifies evidence, scores severity, forecasts spikes, and supports dispatch decisions. |
| Deployability and Scalability | Starts with phones, CCTV, satellites, and a small sensor net; can scale ward by ward. |
| Inclusivity and Accessibility | Citizens report through familiar channels without buying hardware. |
| Impact Potential | Helps cities reduce exposure and prove which interventions actually worked. |
| Presentation and Clarity | Demo follows one incident from photo to alert to dispatch to verified cleanup. |

## Deployment

Current live entry point:

- VayuLens: `https://vayulens.shivam2003.com/`

Production path:

- GitHub `main` push triggers CI/CD.
- GitHub Actions validates the app and builds a Docker image.
- The image is pushed to Artifact Registry.
- The workflow commits the image tag into `deploy/k8s/deployment.yaml`.
- Argo CD syncs the `vayulens-gcp` app into the shared LokSetu GKE cluster.

## Evaluation Path

1. Open the VayuLens dashboard.
2. Run the dump-fire scenario.
3. Watch report, sensor, satellite, and wind evidence combine.
4. Review the predicted ward AQI spike.
5. Approve the municipal dispatch recommendation.
6. Record the after-reading to close the proof loop.
7. Inspect evidence, forecast, dispatch, analytics, and research pages.

## Why It Matters

People breathe air at street level, not at the city-average monitor. VayuLens gives municipalities a practical way to detect local pollution, respond precisely, and prove the air improved.
