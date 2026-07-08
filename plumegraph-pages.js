(function initPages() {
  const core = window.VayuLensCore;
  const scenario = {
    report: true,
    sensor: true,
    satellite: true,
    trustScore: 0.82,
    duplicateRisk: 0.03,
    exifConfidence: 0.94,
    smokeProbability: 0.91,
    correctedPm25: 212,
    fireDistanceMeters: 900,
    windConsistent: true,
    humidity: 64,
    windSpeedKmph: 8,
    type: "garbage_fire",
  };

  const assets = [
    { id: "MC-03", type: "mist_cannon", etaMinutes: 14, capacity: 0.92, base: "Anand Vihar depot" },
    { id: "SW-12", type: "solid_waste_crew", etaMinutes: 22, capacity: 0.84, base: "Ward sanitation yard" },
    { id: "WT-08", type: "water_tanker", etaMinutes: 18, capacity: 0.76, base: "PWD road unit" },
    { id: "IN-04", type: "inspector", etaMinutes: 12, capacity: 0.62, base: "Zone office" },
  ];

  function text(id, value) {
    const node = document.querySelector(`#${id}`);
    if (node) node.textContent = value;
  }

  function renderMetricSummary() {
    const stage = core.classifyStage(scenario);
    const confidence = core.calculateConfidence(scenario);
    const forecast = core.forecastAqi({
      baselineAqi: 132,
      pm25: 212,
      windSpeedKmph: 8,
      humidity: 64,
      smokeReports3h: 3,
      firePrior: 0.9,
      trafficIndex: 0.62,
      dumpProximity: 0.92,
    });
    const dispatch = core.recommendDispatch(
      {
        forecastPeakAqi: forecast.peakAqi,
        exposedPopulation: 8400,
        confidence: confidence / 100,
        sensitiveSites: 2,
        cause: "garbage_fire",
      },
      assets,
    );

    text("phaseStage", stage.toUpperCase());
    text("phaseConfidence", `${confidence}%`);
    text("phasePeak", `${forecast.peakAqi}`);
    text("phaseAsset", dispatch ? dispatch.id : "Pending");
  }

  function renderAiBundle() {
    const summary = core.summarizeIncident(scenario);
    text("aiTitle", summary.title);
    text("aiBrief", summary.municipalBrief);
    text("aiCitizenAlert", summary.citizenAlert);
    const list = document.querySelector("#aiChecklist");
    if (list) {
      list.innerHTML = "";
      summary.fieldChecklist.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
    }
  }

  function renderReportAnalysis() {
    const trust = core.scoreReportTrust({
      exifConfidence: 0.94,
      duplicateRisk: 0.03,
      reporterHistory: 0.78,
      gpsAccuracyMeters: 18,
      ageMinutes: 8,
      languageConfidence: 0.92,
    });
    text("reportTrust", `${Math.round(trust * 100)}%`);
    text("reportRisk", trust > 0.75 ? "Low fake-report risk" : "Needs validation");
    text("reportQueue", "1 synced report · Hindi note · GPS accurate to 18 m");
  }

  function renderForecastLab() {
    const cases = [
      { id: "forecastBase", baselineAqi: 132, pm25: 74, windSpeedKmph: 12, smokeReports3h: 0, firePrior: 0.1 },
      { id: "forecastHotspot", baselineAqi: 132, pm25: 212, windSpeedKmph: 8, smokeReports3h: 3, firePrior: 0.9 },
      { id: "forecastRain", baselineAqi: 132, pm25: 146, windSpeedKmph: 14, smokeReports3h: 1, firePrior: 0.2, rainExpected: true },
    ];
    cases.forEach((item) => {
      const result = core.forecastAqi({ humidity: 64, trafficIndex: 0.62, dumpProximity: 0.92, ...item });
      text(item.id, `${result.peakAqi} AQI · ${result.spikeWindow}`);
    });
  }

  function renderDispatchLab() {
    const dispatch = core.recommendDispatch(
      {
        forecastPeakAqi: 247,
        exposedPopulation: 8400,
        confidence: 0.96,
        sensitiveSites: 2,
        cause: "garbage_fire",
      },
      assets,
    );
    text("dispatchWinner", dispatch ? `${dispatch.id} · ${dispatch.etaMinutes} min ETA` : "No eligible asset");
    text("dispatchReason", dispatch ? `${dispatch.type.replaceAll("_", " ")} from ${dispatch.base}; assignment score ${dispatch.assignmentScore}` : "");
  }

  function initGoogleMap() {
    const mapEl = document.querySelector("#googleMap");
    if (!mapEl) return;
    const key = window.VAYULENS_GOOGLE_MAPS_KEY || sessionStorage.getItem("plumegraphGoogleMapsKey");
    const keyInput = document.querySelector("#mapsKeyInput");
    const keyButton = document.querySelector("#mapsKeyButton");

    if (keyInput && keyButton) {
      keyButton.addEventListener("click", () => {
        if (keyInput.value.trim()) {
          sessionStorage.setItem("plumegraphGoogleMapsKey", keyInput.value.trim());
          window.location.reload();
        }
      });
    }

    if (!key) {
      mapEl.innerHTML = `
        <div class="fallback-map">
          <strong>Map fallback active</strong>
          <span>Google Maps key is not bundled for security. Paste a restricted browser key here for local demo, or use the custom ward map.</span>
        </div>
      `;
      return;
    }

    window.initPlumeGoogleMap = function initPlumeGoogleMap() {
      const center = { lat: 28.626, lng: 77.312 };
      const map = new google.maps.Map(mapEl, {
        center,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      new google.maps.Marker({
        position: center,
        map,
        title: "Confirmed dump-fire hotspot",
      });
      new google.maps.Circle({
        strokeColor: "#c14d3f",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#c14d3f",
        fillOpacity: 0.18,
        map,
        center,
        radius: 650,
      });
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initPlumeGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  renderMetricSummary();
  renderAiBundle();
  renderReportAnalysis();
  renderForecastLab();
  renderDispatchLab();
  initGoogleMap();
})();
