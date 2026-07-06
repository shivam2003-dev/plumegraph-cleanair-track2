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

## Hackathon Positioning

This is not just another pollution heatmap. It is an accountable municipal response layer: detect hidden hotspots, predict near-term AQI spikes, dispatch the right resource, and prove the air improved.
