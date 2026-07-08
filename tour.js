(function initTour() {
  const steps = [
    {
      title: "Start With The Ward Map",
      body: "This is a real OpenStreetMap base layer for the neighbourhood. VayuLens adds pollution evidence, sensors, plume direction, and municipal assets on top.",
      target: ".map-panel",
    },
    {
      title: "Add Citizen Evidence",
      body: "A citizen or field worker submits a smoke/dust report. The system checks photo evidence, location, language note, duplicate risk, and reporter trust.",
      target: ".control-panel",
    },
    {
      title: "Confirm Only With Corroboration",
      body: "One report creates Watch only. Confirmed requires independent evidence: sensor spike, satellite/fire prior, and wind plausibility.",
      target: "#evidenceList",
    },
    {
      title: "Predict The Next 24 Hours",
      body: "The forecast shows likely AQI peak, spike window, exposed population, and drivers so teams can act before the worst exposure period.",
      target: ".forecast-panel",
    },
    {
      title: "Dispatch And Prove Impact",
      body: "The workflow assigns a mist cannon or cleanup crew, starts SLA tracking, and records before/after PM reduction as proof of action.",
      target: ".dispatch-panel",
    },
    {
      title: "Explore Enterprise Pages",
      body: "Use the top links for Ops, Analytics, Integrations, Admin, Research, and AI Copilot. These show the city-scale operating model.",
      target: ".submission-links",
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
        <div class="tour-topline">
          <span id="tourStep">Step 1 of ${steps.length}</span>
          <button class="tour-close" id="tourClose" type="button" aria-label="Close guided tour">×</button>
        </div>
        <h2 id="tourTitle"></h2>
        <p id="tourBody"></p>
        <div class="tour-progress" aria-hidden="true">
          <i id="tourProgressBar"></i>
        </div>
        <div class="button-row">
          <button class="secondary-button" id="tourBack" type="button">Back</button>
          <button class="primary-button" id="tourNext" type="button">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#tourClose").addEventListener("click", endTour);
    overlay.querySelector("#tourBack").addEventListener("click", () => {
      if (index === 0) endTour();
      else showStep(index - 1);
    });
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
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
    document.querySelector("#tourStep").textContent = `Step ${index + 1} of ${steps.length}`;
    document.querySelector("#tourTitle").textContent = step.title;
    document.querySelector("#tourBody").textContent = step.body;
    document.querySelector("#tourProgressBar").style.width = `${((index + 1) / steps.length) * 100}%`;
    document.querySelector("#tourBack").textContent = index === 0 ? "Close" : "Back";
    document.querySelector("#tourNext").textContent = index === steps.length - 1 ? "Finish" : "Next";
  }

  function startTour() {
    showStep(0);
    localStorage.setItem("vayulensTourSeen", "true");
  }

  function endTour() {
    clearFocus();
    if (overlay) overlay.classList.add("hidden");
  }

  window.VayuLensTour = { start: startTour };
  document.querySelector("#startTour")?.addEventListener("click", startTour);

  const launcher = document.createElement("button");
  launcher.className = "tour-launcher";
  launcher.type = "button";
  launcher.textContent = "Start guided tour";
  launcher.addEventListener("click", startTour);
  document.body.appendChild(launcher);
})();
