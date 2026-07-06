const state = {
  report: false,
  sensor: false,
  satellite: false,
  dispatched: false,
  completed: false,
  hindi: false,
  type: "garbage_fire",
  trustScore: 0.82,
  duplicateRisk: 0.03,
  exifConfidence: 0.94,
  smokeProbability: 0.91,
  correctedPm25: 74,
  fireDistanceMeters: 900,
  windConsistent: false,
  humidity: 64,
  windSpeedKmph: 8,
};

const copy = {
  en: {
    wardTitle: "Ward 42 · East Delhi demo grid",
    wardMeta: "100 m operational cells · wind-aware evidence fusion · mock ICCC feed",
    uploadTitle: "Smoke photo ready",
    uploadText: "EXIF ok · geohash 28.626,77.312 · Hindi note detected",
    submitReport: "Upload citizen report",
    sensorSpike: "Simulate sensor spike",
    satelliteFire: "Add FIRMS prior",
    dispatchAsset: "Dispatch resource",
    completeAction: "Record after-reading",
    runScenario: "Run dump-fire scenario",
  },
  hi: {
    wardTitle: "वार्ड 42 · पूर्वी दिल्ली डेमो ग्रिड",
    wardMeta: "100 m ऑपरेशनल सेल · हवा आधारित एविडेंस फ्यूजन · ICCC डेमो फीड",
    uploadTitle: "धुएं की फोटो तैयार",
    uploadText: "EXIF सही · geohash 28.626,77.312 · हिंदी नोट मिला",
    submitReport: "नागरिक रिपोर्ट अपलोड करें",
    sensorSpike: "सेंसर स्पाइक चलाएं",
    satelliteFire: "FIRMS संकेत जोड़ें",
    dispatchAsset: "संसाधन भेजें",
    completeAction: "बाद की रीडिंग दर्ज करें",
    runScenario: "डंप-फायर परिदृश्य चलाएं",
  },
};

const hotspotCells = [
  { x: 64, y: 28, level: "watch" },
  { x: 58, y: 39, level: "suspected" },
  { x: 51, y: 50, level: "confirmed" },
  { x: 44, y: 60, level: "suspected" },
  { x: 37, y: 70, level: "watch" },
];

const baselineForecast = [118, 122, 130, 136, 142, 151, 158, 162, 156, 148, 140, 134];
const spikeForecast = [132, 146, 164, 182, 206, 232, 247, 238, 214, 190, 171, 158];
const afterForecast = [126, 136, 148, 154, 162, 171, 178, 169, 156, 145, 136, 130];

const gridLayer = document.querySelector("#gridLayer");
const cityMap = document.querySelector("#cityMap");
const scoreRing = document.querySelector(".score-ring");
const forecastCanvas = document.querySelector("#forecastChart");
const ctx = forecastCanvas.getContext("2d");
let leafletRefs = null;

function initRealMap() {
  const mapEl = document.querySelector("#realMap");
  if (!mapEl || !window.L) return;

  const center = [28.6267, 77.3182];
  const map = L.map(mapEl, {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: false,
    dragging: true,
    doubleClickZoom: false,
  }).setView(center, 14);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const wardBounds = [
    [28.638, 77.295],
    [28.638, 77.342],
    [28.607, 77.342],
    [28.607, 77.295],
  ];
  L.polygon(wardBounds, {
    color: "#1c78a5",
    weight: 2,
    opacity: 0.58,
    fillColor: "#dff4f6",
    fillOpacity: 0.1,
  }).addTo(map);

  const hotspot = L.circle([28.6314, 77.3275], {
    radius: 650,
    color: "#c98519",
    fillColor: "#c98519",
    fillOpacity: 0.12,
    weight: 2,
    opacity: 0.7,
  }).addTo(map);

  const plume = L.polygon(
    [
      [28.632, 77.326],
      [28.626, 77.318],
      [28.620, 77.306],
      [28.616, 77.299],
      [28.623, 77.301],
      [28.629, 77.315],
    ],
    {
      color: "#c14d3f",
      weight: 1,
      opacity: 0,
      fillColor: "#c14d3f",
      fillOpacity: 0,
    },
  ).addTo(map);

  function divIcon(className, label) {
    return L.divIcon({
      className: `leaflet-op-marker ${className}`,
      html: label,
      iconSize: [76, 30],
      iconAnchor: [38, 15],
    });
  }

  const markers = {
    dump: L.marker([28.6314, 77.3275], { icon: divIcon("dump", "Dump edge") }).addTo(map),
    school: L.marker([28.6177, 77.312], { icon: divIcon("school", "School") }).addTo(map),
    clinic: L.marker([28.626, 77.304], { icon: divIcon("clinic", "Clinic") }).addTo(map),
    sensor: L.marker([28.6235, 77.318], { icon: divIcon("sensor", "PMS7003<br>PM2.5 74") }).addTo(map),
    mist: L.marker([28.6125, 77.3005], { icon: divIcon("asset", "MC-03") }).addTo(map),
    crew: L.marker([28.6332, 77.3008], { icon: divIcon("asset", "SW-12") }).addTo(map),
    report: L.marker([28.6308, 77.3268], { icon: divIcon("report", "Photo report") }),
  };

  leafletRefs = { map, hotspot, plume, markers };
}

function buildGrid() {
  gridLayer.innerHTML = "";
  const cols = 9;
  const rows = 6;
  const gap = 1.1;
  const cellW = 100 / cols - gap;
  const cellH = 100 / rows - gap;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const left = col * (100 / cols) + gap / 2;
      const top = row * (100 / rows) + gap / 2;
      cell.style.left = `${left}%`;
      cell.style.top = `${top}%`;
      cell.style.width = `${cellW}%`;
      cell.style.height = `${cellH}%`;
      cell.dataset.x = left.toFixed(1);
      cell.dataset.y = top.toFixed(1);
      gridLayer.appendChild(cell);
    }
  }
}

function nearestCell(targetX, targetY) {
  const cells = [...document.querySelectorAll(".cell")];
  return cells.reduce(
    (best, cell) => {
      const x = Number(cell.dataset.x);
      const y = Number(cell.dataset.y);
      const dist = Math.hypot(x - targetX, y - targetY);
      return dist < best.dist ? { cell, dist } : best;
    },
    { cell: null, dist: Number.POSITIVE_INFINITY },
  ).cell;
}

function setHotspotCells(stage) {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.className = "cell";
  });

  if (stage === "clear") return;

  const count = stage === "watch" ? 1 : stage === "suspected" ? 3 : 5;
  hotspotCells.slice(0, count).forEach((config, index) => {
    const cell = nearestCell(config.x, config.y);
    if (!cell) return;
    cell.classList.add(index === 0 && stage === "watch" ? "watch" : config.level);
    cell.classList.add("target");
  });
}

function calculateConfidence() {
  return window.PlumeGraphCore.calculateConfidence({
    ...state,
    correctedPm25: state.sensor ? 212 : state.correctedPm25,
    windConsistent: state.report && state.sensor,
  });
}

function currentStage() {
  return window.PlumeGraphCore.classifyStage({
    ...state,
    correctedPm25: state.sensor ? 212 : state.correctedPm25,
    windConsistent: state.report && state.sensor,
  });
}

function evidenceItems() {
  const items = [];
  items.push({
    active: state.report,
    text: state.report
      ? "Citizen photo: garbage smoke 91%, haze proxy 0.67, EXIF/location consistent"
      : "No citizen reports yet",
  });
  items.push({
    active: state.sensor,
    text: state.sensor
      ? "PMS7003 anomaly: corrected PM2.5 jumped from 74 to 212 ug/m3"
      : "Sensor baseline stable",
  });
  items.push({
    active: state.satellite,
    text: state.satellite
      ? "NASA FIRMS/VIIRS thermal prior within 900 m, age 42 minutes"
      : "No fire prior active",
  });
  items.push({
    active: state.report && state.sensor,
    text:
      state.report && state.sensor
        ? "Wind-consistent plume: report is upwind of sensor spike and school exposure zone"
        : "Awaiting cross-source corroboration",
  });
  return items;
}

function updateEvidence() {
  const confidence = calculateConfidence();
  const stage = currentStage();
  const stateLabel = {
    clear: "Clear",
    watch: "Watch",
    suspected: "Suspected",
    confirmed: "Confirmed",
    mitigated: "Mitigated",
  }[stage];

  document.querySelector("#confidenceScore").textContent = `${confidence}%`;
  document.querySelector("#hotspotState").textContent = stateLabel;
  document.querySelector("#hotspotState").style.color =
    stage === "confirmed" ? "var(--red)" : stage === "suspected" ? "#d76332" : "var(--muted)";
  scoreRing.style.background = `radial-gradient(circle at center, white 0 58%, transparent 59%), conic-gradient(${stage === "confirmed" ? "var(--red)" : stage === "suspected" ? "#d76332" : "var(--green)"} 0 ${confidence}%, #e2e8eb ${confidence}% 100%)`;

  const list = document.querySelector("#evidenceList");
  list.innerHTML = "";
  evidenceItems().forEach((item) => {
    const li = document.createElement("li");
    if (item.active) li.classList.add("active");
    li.innerHTML = `<span></span>${item.text}`;
    list.appendChild(li);
  });

  document.querySelector("#reportMarker").classList.toggle("hidden", !state.report);
  document.querySelector("#sensorA").classList.toggle("hot", state.sensor);
  document.querySelector("#sensorReading").textContent = state.sensor ? "PM2.5 212" : "PM2.5 74";
  document.querySelector("#plumeLayer").classList.toggle("active", stage === "confirmed" || stage === "mitigated");
  updateLeafletOverlays(stage);

  setHotspotCells(stage === "mitigated" ? "watch" : stage);
  updateForecast(stage);
  updateDispatch(stage);
}

function updateLeafletOverlays(stage) {
  if (!leafletRefs) return;
  const { hotspot, plume, markers, map } = leafletRefs;
  markers.sensor.setIcon(
    L.divIcon({
      className: `leaflet-op-marker sensor ${state.sensor ? "hot" : ""}`,
      html: `PMS7003<br>${state.sensor ? "PM2.5 212" : "PM2.5 74"}`,
      iconSize: [82, 36],
      iconAnchor: [41, 18],
    }),
  );

  if (state.report && !map.hasLayer(markers.report)) markers.report.addTo(map);
  if (!state.report && map.hasLayer(markers.report)) markers.report.removeFrom(map);

  const confirmed = stage === "confirmed" || stage === "mitigated";
  hotspot.setStyle({
    color: confirmed ? "#c14d3f" : stage === "suspected" ? "#d76332" : "#c98519",
    fillColor: confirmed ? "#c14d3f" : stage === "suspected" ? "#d76332" : "#c98519",
    fillOpacity: confirmed ? 0.22 : 0.12,
  });
  plume.setStyle({
    opacity: confirmed ? 0.62 : 0,
    fillOpacity: confirmed ? 0.2 : 0,
  });
}

function drawForecast(values, color) {
  const width = forecastCanvas.width;
  const height = forecastCanvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#fbfcfc";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d8e0e5";
  ctx.lineWidth = 1;
  ctx.font = "700 12px Inter, sans-serif";
  ctx.fillStyle = "#62717d";

  [100, 200, 300].forEach((mark) => {
    const y = height - 28 - (mark / 320) * (height - 52);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 18, y);
    ctx.stroke();
    ctx.fillText(`${mark}`, 9, y + 4);
  });

  const step = (width - 72) / (values.length - 1);
  const points = values.map((value, index) => ({
    x: 44 + index * step,
    y: height - 28 - (value / 320) * (height - 52),
    value,
  }));

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.lineTo(points[points.length - 1].x, height - 28);
  ctx.lineTo(points[0].x, height - 28);
  ctx.closePath();
  ctx.fillStyle = color === "#c94f45" ? "rgba(201, 79, 69, 0.12)" : "rgba(45, 138, 104, 0.12)";
  ctx.fill();

  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === 6 ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.fillStyle = "#172026";
  ctx.fillText("Now", 42, height - 9);
  ctx.fillText("+12h", points[6].x - 13, height - 9);
  ctx.fillText("+24h", width - 50, height - 9);
}

function updateForecast(stage) {
  let values = baselineForecast;
  let color = "#2d8a68";
  if (stage === "confirmed" || stage === "suspected") {
    values = spikeForecast;
    color = stage === "confirmed" ? "#c94f45" : "#d76332";
  }
  if (stage === "mitigated") {
    values = afterForecast;
    color = "#2d8a68";
  }

  const peak = Math.max(...values);
  drawForecast(values, color);
  document.querySelector("#peakBadge").textContent = `Peak AQI ${peak}`;
  document.querySelector("#driverOne").textContent =
    stage === "confirmed"
      ? "dump smoke + low wind + sensor spike"
      : stage === "mitigated"
        ? "residual PM + evening traffic"
        : "background PM + evening traffic";
  document.querySelector("#spikeWindow").textContent = stage === "confirmed" ? "19:00-21:00" : "20:00-22:00";
  document.querySelector("#exposedPop").textContent = stage === "confirmed" ? "8,400" : "2,100";
}

function updateDispatch(stage) {
  const recommendation = document.querySelector("#assetRecommendation");
  const reason = document.querySelector("#assetReason");
  const sla = document.querySelector("#slaBadge");
  const proof = document.querySelector("#proofReading");
  const proofText = document.querySelector("#proofText");

  if (stage === "confirmed") {
    recommendation.textContent = "MC-03 mist cannon + SW-12 crew";
    reason.textContent = "Nearest eligible units; downwind school exposure and dump-fire cause.";
    sla.textContent = state.dispatched ? "SLA running · ETA 14 min" : "Ready to dispatch";
    proof.textContent = "212 → pending";
    proofText.textContent = "Baseline locked from corrected sensor median before dispatch.";
    return;
  }

  if (stage === "mitigated") {
    recommendation.textContent = "Case closed with rebound watch";
    reason.textContent = "Keep cell on 3-hour watch in case smoke returns.";
    sla.textContent = "SLA closed · proof captured";
    proof.textContent = "212 → 146";
    proofText.textContent = "PM2.5 fell 31% and visual haze score improved from 0.67 to 0.34.";
    return;
  }

  if (stage === "suspected") {
    recommendation.textContent = "Ward inspector verification";
    reason.textContent = "Evidence is rising but needs one more independent signal.";
    sla.textContent = "Pre-alert";
    proof.textContent = state.sensor ? "212 → pending" : "74 → pending";
    proofText.textContent = "Intervention proof appears after confirmed dispatch.";
    return;
  }

  recommendation.textContent = "Stand by";
  reason.textContent = "Awaiting confirmed hotspot.";
  sla.textContent = "SLA not started";
  proof.textContent = "74 → pending";
  proofText.textContent = "Intervention proof appears after dispatch.";
}

function applyLanguage() {
  const lang = state.hindi ? copy.hi : copy.en;
  Object.entries(lang).forEach(([id, text]) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.textContent = text;
  });
}

function dispatchAsset() {
  if (currentStage() !== "confirmed") {
    state.sensor = true;
    state.satellite = true;
  }
  state.dispatched = true;
  document.querySelector("#assetMist").classList.add("dispatched");
  document.querySelector("#assetCrew").classList.add("dispatched");
  updateEvidence();
}

function completeAction() {
  state.report = true;
  state.sensor = true;
  state.satellite = true;
  state.dispatched = true;
  state.completed = true;
  updateEvidence();
}

function runScenario() {
  state.report = true;
  updateEvidence();
  window.setTimeout(() => {
    state.sensor = true;
    updateEvidence();
  }, 550);
  window.setTimeout(() => {
    state.satellite = true;
    updateEvidence();
  }, 1100);
  window.setTimeout(() => {
    dispatchAsset();
  }, 1650);
}

document.querySelector("#submitReport").addEventListener("click", () => {
  state.report = true;
  state.type = document.querySelector("#reportType").value;
  document.querySelector("#offlineBadge").textContent = "Offline queue: synced";
  updateEvidence();
});

document.querySelector("#sensorSpike").addEventListener("click", () => {
  state.sensor = true;
  updateEvidence();
});

document.querySelector("#satelliteFire").addEventListener("click", () => {
  state.satellite = true;
  updateEvidence();
});

document.querySelector("#dispatchAsset").addEventListener("click", dispatchAsset);
document.querySelector("#completeAction").addEventListener("click", completeAction);
document.querySelector("#runScenario").addEventListener("click", runScenario);
document.querySelector("#langToggle").addEventListener("click", () => {
  state.hindi = !state.hindi;
  applyLanguage();
});

initRealMap();
buildGrid();
updateEvidence();
