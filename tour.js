(function initTour() {
  const steps = [
    {
      title: "Real Map Command Center",
      body: "This dashboard uses OpenStreetMap as the real neighbourhood base map. PlumeGraph overlays pollution cells, plume direction, sensors, and municipal assets.",
      target: ".map-panel",
    },
    {
      title: "Citizen Evidence",
      body: "Reports are scored for smoke/dust, haze, EXIF consistency, duplicate risk, and reporter trust before they influence a hotspot.",
      target: ".control-panel",
    },
    {
      title: "Evidence Graph",
      body: "One report can create Watch only. Confirmed requires independent evidence from sensor, satellite/fire prior, and wind plausibility.",
      target: "#evidenceList",
    },
    {
      title: "24-hour Forecast",
      body: "The forecast explains likely AQI spike timing and drivers so municipal teams can act before exposure peaks.",
      target: ".forecast-panel",
    },
    {
      title: "Dispatch + Proof",
      body: "The workflow does not stop at an alert. It assigns assets, tracks SLA, and records before/after PM reduction.",
      target: ".dispatch-panel",
    },
  ];

  let index = 0;
  let overlay;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "tour-overlay hidden";
    overlay.innerHTML = `
      <div class="tour-card" role="dialog" aria-live="polite">
        <span id="tourStep">1 / ${steps.length}</span>
        <h2 id="tourTitle"></h2>
        <p id="tourBody"></p>
        <div class="button-row">
          <button class="secondary-button" id="tourSkip" type="button">Skip</button>
          <button class="primary-button" id="tourNext" type="button">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#tourSkip").addEventListener("click", endTour);
    overlay.querySelector("#tourNext").addEventListener("click", () => {
      if (index >= steps.length - 1) endTour();
      else showStep(index + 1);
    });
    return overlay;
  }

  function clearFocus() {
    document.querySelectorAll(".tour-focus").forEach((node) => node.classList.remove("tour-focus"));
  }

  function showStep(nextIndex) {
    index = nextIndex;
    const step = steps[index];
    ensureOverlay().classList.remove("hidden");
    clearFocus();
    const target = document.querySelector(step.target);
    if (target) {
      target.classList.add("tour-focus");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    document.querySelector("#tourStep").textContent = `${index + 1} / ${steps.length}`;
    document.querySelector("#tourTitle").textContent = step.title;
    document.querySelector("#tourBody").textContent = step.body;
    document.querySelector("#tourNext").textContent = index === steps.length - 1 ? "Finish" : "Next";
  }

  function startTour() {
    showStep(0);
    localStorage.setItem("plumegraphTourSeen", "true");
  }

  function endTour() {
    clearFocus();
    if (overlay) overlay.classList.add("hidden");
  }

  window.PlumeGraphTour = { start: startTour };
  document.querySelector("#startTour")?.addEventListener("click", startTour);

  if (!localStorage.getItem("plumegraphTourSeen")) {
    window.setTimeout(startTour, 700);
  }
})();
