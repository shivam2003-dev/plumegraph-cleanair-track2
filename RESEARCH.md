# VayuLens Research Notes

## Design Principles

VayuLens is not a generic heatmap. It uses a multi-evidence design because the literature consistently shows that each individual signal has limits:

- Low-cost sensors are useful for dense and mobile coverage but need calibration, humidity correction, co-location, and drift management.
- Smartphone photos can estimate haze/PM-related visibility loss, but should be treated as soft evidence rather than regulatory truth.
- Satellite AOD/TROPOMI products are valuable priors for broader context and aerosol/NO2 patterns, not direct street-level monitors.
- Spatiotemporal graph models are promising for PM forecasting, but sparse hackathon/pilot data benefits from simpler explainable baselines first.

## Sources Checked

- Smartphone PM2.5 estimation from photos: `https://www.mdpi.com/2072-4292/14/11/2572`
- Participatory sensing using smartphone photos: `https://user.it.uu.se/~eding810/conferences/SmartCity15a.pdf`
- Low-cost mobile PM2.5 sensor calibration: `https://www.sciencedirect.com/science/article/pii/S2210670723002184`
- Low-cost sensor calibration approaches: `https://aaqr.org/articles/aaqr-21-03-oa-0073`
- MAIAC AOD for PM prediction context: `https://ceos.org/document_management/Meetings/Plenary/36/Documents/1.20_Aerosols-AQ_WhitePaper_1.0_9-nov-2022.pdf`
- Satellite PM2.5/PM10 estimation with Sentinel-5P and open remote-sensing data: `https://pmc.ncbi.nlm.nih.gov/articles/PMC10164030/`
- Spatiotemporal GNN PM2.5 forecasting: `https://www.mdpi.com/2813-4168/4/1/2`
- Dynamic spatiotemporal graph air-quality prediction: `https://www.sciencedirect.com/science/article/abs/pii/S0020025524009861`

## Product Consequence

The correct product architecture is an evidence graph and municipal proof loop:

```text
report + sensor + satellite/fire prior + wind plausibility -> confirmed hotspot -> dispatch -> before/after proof
```

This is why VayuLens shows confidence and provenance instead of pretending every source is equally reliable.
