(function initEnterprisePages() {
  const core = window.VayuLensCore;
  if (!core) return;

  function set(id, value) {
    const node = document.querySelector(`#${id}`);
    if (node) node.textContent = value;
  }

  function renderOps() {
    const wards = [
      { id: "Ward 42", confirmedHotspots: 3, exposedPopulation: 8400, schoolsClinics: 4, repeatHotspotDays: 5, avgAqi24h: 188 },
      { id: "Ward 18", confirmedHotspots: 1, exposedPopulation: 3200, schoolsClinics: 1, repeatHotspotDays: 2, avgAqi24h: 154 },
      { id: "Ward 07", confirmedHotspots: 0, exposedPopulation: 900, schoolsClinics: 1, repeatHotspotDays: 0, avgAqi24h: 118 },
    ];
    const list = document.querySelector("#wardPriorityList");
    if (list) {
      list.innerHTML = "";
      wards.forEach((ward) => {
        const priority = core.computeWardPriority(ward);
        const li = document.createElement("li");
        li.innerHTML = `<strong>${ward.id}</strong><span>${priority.band.toUpperCase()} · ${priority.priority}/100 · ${ward.exposedPopulation.toLocaleString("en-IN")} exposed</span>`;
        list.appendChild(li);
      });
    }
  }

  function renderIntegrations() {
    const readiness = core.enterpriseReadiness({
      iccc: true,
      cpcb: false,
      swachhata: true,
      fcmSms: true,
      postgis: true,
      auditLogs: true,
      privacyBlur: true,
      offlineQueue: true,
      regionalLanguages: true,
    });
    set("readinessScore", `${readiness.score}%`);
    set("readinessStatus", readiness.status);
    set("missingIntegrations", readiness.missing.length ? readiness.missing.join(", ") : "None");
  }

  function renderAdmin() {
    const sensors = [
      { id: "PMS-042", uptimePct: 99, batteryPct: 78, driftScore: 0.06, lastSeenMinutes: 4 },
      { id: "PMS-088", uptimePct: 92, batteryPct: 44, driftScore: 0.31, lastSeenMinutes: 8 },
      { id: "SDS-014", uptimePct: 96, batteryPct: 19, driftScore: 0.11, lastSeenMinutes: 16 },
    ];
    const list = document.querySelector("#sensorFleetList");
    if (list) {
      list.innerHTML = "";
      sensors.forEach((sensor) => {
        const health = core.evaluateSensorHealth(sensor);
        const li = document.createElement("li");
        li.innerHTML = `<strong>${sensor.id}</strong><span>${health.status.toUpperCase()} · ${health.score}/100 · ${health.action}</span>`;
        list.appendChild(li);
      });
    }
  }

  function renderAnalytics() {
    const audit = core.generateAuditEvent({
      actorRole: "ICCC Shift Lead",
      action: "CONFIRM_HOTSPOT",
      incidentId: "INC-W42-1029",
      evidenceHash: "ev_real_osm_ai_ci",
    });
    set("auditLine", audit.line);
    set("auditRetention", audit.retention);
  }

  async function renderAiInsights() {
    try {
      const response = await fetch("ai-insights.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      set("aiTitle", data.title);
      set("aiBrief", data.municipalBrief);
      set("aiCitizenAlert", data.citizenAlert);
      set("aiProvider", `${data.generatedBy} · ${data.model}`);
      const list = document.querySelector("#aiChecklist");
      if (list && Array.isArray(data.fieldChecklist)) {
        list.innerHTML = "";
        data.fieldChecklist.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        });
      }
    } catch {
      // plumegraph-pages.js already renders deterministic local fallback.
    }
  }

  renderOps();
  renderIntegrations();
  renderAdmin();
  renderAnalytics();
  renderAiInsights();
})();
