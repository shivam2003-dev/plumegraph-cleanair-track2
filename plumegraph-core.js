(function initVayuLensCore(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.VayuLensCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildCore() {
  const STAGES = {
    CLEAR: "clear",
    WATCH: "watch",
    SUSPECTED: "suspected",
    CONFIRMED: "confirmed",
    MITIGATED: "mitigated",
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function calculateConfidence(evidence) {
    const source = {
      report: false,
      sensor: false,
      satellite: false,
      dispatched: false,
      completed: false,
      trustScore: 0.62,
      duplicateRisk: 0.04,
      exifConfidence: 0.9,
      smokeProbability: 0,
      correctedPm25: 74,
      fireDistanceMeters: null,
      windConsistent: false,
      ...evidence,
    };

    let score = 12;
    if (source.report) score += 14 + source.smokeProbability * 12 + source.exifConfidence * 6;
    if (source.sensor) score += source.correctedPm25 >= 180 ? 30 : 18;
    if (source.satellite) score += source.fireDistanceMeters !== null && source.fireDistanceMeters < 1200 ? 20 : 12;
    if (source.report && source.sensor) score += 8;
    if (source.sensor && source.satellite) score += 7;
    if (source.windConsistent) score += 8;
    score += (source.trustScore - 0.5) * 12;
    score -= source.duplicateRisk * 24;
    if (source.completed) score -= 18;
    return Math.round(clamp(score, 0, 96));
  }

  function classifyStage(evidence) {
    if (evidence.completed) return STAGES.MITIGATED;
    const confidence = calculateConfidence(evidence);
    const independentSources = [evidence.report, evidence.sensor, evidence.satellite].filter(Boolean).length;
    if (independentSources < 2) {
      return independentSources === 1 ? STAGES.WATCH : STAGES.CLEAR;
    }
    if (confidence >= 75 && independentSources >= 2) return STAGES.CONFIRMED;
    if (confidence >= 45 || independentSources >= 2) return STAGES.SUSPECTED;
    return STAGES.CLEAR;
  }

  function scoreReportTrust(report) {
    const source = {
      exifConfidence: 0.8,
      duplicateRisk: 0.05,
      reporterHistory: 0.6,
      gpsAccuracyMeters: 28,
      ageMinutes: 12,
      languageConfidence: 0.9,
      ...report,
    };

    const gpsScore = source.gpsAccuracyMeters <= 30 ? 1 : source.gpsAccuracyMeters <= 80 ? 0.72 : 0.42;
    const ageScore = source.ageMinutes <= 30 ? 1 : source.ageMinutes <= 180 ? 0.7 : 0.35;
    const raw =
      0.28 * source.exifConfidence +
      0.22 * (1 - source.duplicateRisk) +
      0.18 * source.reporterHistory +
      0.16 * gpsScore +
      0.1 * ageScore +
      0.06 * source.languageConfidence;
    return Number(clamp(raw, 0, 1).toFixed(2));
  }

  function forecastAqi(features) {
    const source = {
      baselineAqi: 132,
      pm25: 74,
      windSpeedKmph: 8,
      humidity: 62,
      smokeReports3h: 0,
      firePrior: 0,
      trafficIndex: 0.55,
      dumpProximity: 0.4,
      rainExpected: false,
      ...features,
    };

    const lowWindPenalty = source.windSpeedKmph < 6 ? 38 : source.windSpeedKmph < 10 ? 22 : 8;
    const humidityPenalty = source.humidity > 75 ? 18 : source.humidity > 60 ? 9 : 2;
    const reportPenalty = Math.min(42, source.smokeReports3h * 13);
    const firePenalty = source.firePrior * 36;
    const trafficPenalty = source.trafficIndex * 22;
    const dumpPenalty = source.dumpProximity * 18;
    const rainRelief = source.rainExpected ? 26 : 0;
    const pmPenalty = Math.max(0, (source.pm25 - 60) * 0.36);
    const peak = Math.round(
      source.baselineAqi +
        lowWindPenalty +
        humidityPenalty +
        reportPenalty +
        firePenalty +
        trafficPenalty +
        dumpPenalty +
        pmPenalty -
        rainRelief,
    );

    return {
      peakAqi: clamp(peak, 0, 500),
      spikeWindow: peak >= 220 ? "19:00-21:00" : peak >= 170 ? "20:00-22:00" : "No severe spike",
      topDrivers: [
        source.firePrior > 0.5 ? "active fire prior" : "regional background PM",
        source.windSpeedKmph < 10 ? "low wind dispersion" : "moderate dispersion",
        source.smokeReports3h > 0 ? "citizen smoke evidence" : "traffic and road dust",
      ],
    };
  }

  function recommendDispatch(hotspot, assets) {
    const source = {
      forecastPeakAqi: 180,
      exposedPopulation: 2100,
      confidence: 0.64,
      sensitiveSites: 1,
      cause: "unknown_smoke",
      lat: 28.626,
      lon: 77.312,
      ...hotspot,
    };

    const eligible = assets.filter((asset) => {
      if (source.cause === "garbage_fire") return ["mist_cannon", "solid_waste_crew", "water_tanker"].includes(asset.type);
      if (source.cause === "construction_dust") return ["mist_cannon", "inspector", "water_tanker"].includes(asset.type);
      if (source.cause === "traffic_smog") return ["traffic_unit", "mist_cannon", "sweeper"].includes(asset.type);
      return true;
    });

    const scored = eligible.map((asset) => {
      const travelScore = Math.max(0, 1 - asset.etaMinutes / 60);
      const capacityScore = asset.capacity || 0.65;
      const priority =
        0.35 * (source.forecastPeakAqi / 300) +
        0.25 * Math.min(1, source.exposedPopulation / 10000) +
        0.15 * source.confidence +
        0.15 * Math.min(1, source.sensitiveSites / 4) +
        0.1 * travelScore;
      return {
        ...asset,
        assignmentScore: Number((priority * 0.75 + capacityScore * 0.25).toFixed(3)),
      };
    });

    return scored.sort((a, b) => b.assignmentScore - a.assignmentScore || a.etaMinutes - b.etaMinutes)[0] || null;
  }

  function summarizeIncident(evidence) {
    const confidence = calculateConfidence(evidence);
    const stage = classifyStage(evidence);
    const forecast = forecastAqi({
      baselineAqi: 132,
      pm25: evidence.correctedPm25 || 74,
      windSpeedKmph: evidence.windSpeedKmph || 8,
      humidity: evidence.humidity || 64,
      smokeReports3h: evidence.report ? 1 : 0,
      firePrior: evidence.satellite ? 0.9 : 0,
      trafficIndex: 0.62,
      dumpProximity: evidence.type === "garbage_fire" ? 0.92 : 0.45,
    });

    return {
      title: stage === STAGES.CONFIRMED ? "Confirmed dump-fire pollution hotspot" : "Pollution evidence under review",
      stage,
      confidence,
      forecast,
      municipalBrief:
        stage === STAGES.CONFIRMED
          ? `Confirmed hotspot with ${confidence}% confidence. Forecast peak AQI ${forecast.peakAqi} during ${forecast.spikeWindow}. Dispatch mist cannon and solid-waste crew; lock before-reading now.`
          : `Current confidence is ${confidence}%. Keep cell under watch and request one more independent evidence source before dispatch.`,
      citizenAlert:
        stage === STAGES.CONFIRMED
          ? `Air-quality alert: smoke hotspot confirmed nearby. Avoid outdoor activity for the next 2 hours. Municipal response is being dispatched.`
          : `Pollution report received. Municipal team is validating sensor and satellite evidence.`,
      fieldChecklist: [
        "Confirm source location and access route",
        "Capture before PM2.5/PM10 reading",
        "Deploy misting or cleanup response",
        "Capture after-reading 30-90 minutes later",
        "Reopen case if PM rebounds within 3 hours",
      ],
    };
  }

  function routeMunicipalAlert(hotspot) {
    const source = {
      cause: "unknown_smoke",
      ward: "Ward 42",
      confidence: 0.72,
      forecastPeakAqi: 180,
      sensitiveSites: 0,
      ...hotspot,
    };

    const routeByCause = {
      garbage_fire: {
        primary: "Solid Waste Department",
        secondary: "Water-mist / Fire Response Unit",
        slaMinutes: 30,
        escalation: "Zonal Sanitation Officer",
      },
      construction_dust: {
        primary: "Building Enforcement Cell",
        secondary: "PWD Road Dust Team",
        slaMinutes: 45,
        escalation: "Assistant Commissioner",
      },
      traffic_smog: {
        primary: "Traffic Police",
        secondary: "Road Sweeping Unit",
        slaMinutes: 40,
        escalation: "ICCC Shift Lead",
      },
      industrial_plume: {
        primary: "State Pollution Control Board Field Team",
        secondary: "District Magistrate Control Room",
        slaMinutes: 60,
        escalation: "Regional Pollution Officer",
      },
      unknown_smoke: {
        primary: "Ward Field Inspector",
        secondary: "ICCC Verification Desk",
        slaMinutes: 35,
        escalation: "Ward Officer",
      },
    };

    const route = routeByCause[source.cause] || routeByCause.unknown_smoke;
    const urgency =
      source.forecastPeakAqi >= 240 || source.sensitiveSites >= 2 || source.confidence >= 0.9 ? "high" : "normal";

    return {
      ...route,
      ward: source.ward,
      urgency,
      publicLabel: `${route.primary} · ${urgency.toUpperCase()} · SLA ${route.slaMinutes} min`,
    };
  }

  function evaluateSensorHealth(sensor) {
    const source = {
      uptimePct: 98,
      batteryPct: 76,
      driftScore: 0.08,
      lastSeenMinutes: 6,
      humidityBias: 0.12,
      ...sensor,
    };

    let score = 100;
    if (source.uptimePct < 95) score -= 14;
    if (source.batteryPct < 25) score -= 18;
    if (source.driftScore > 0.2) score -= 28;
    if (source.lastSeenMinutes > 30) score -= 26;
    if (source.humidityBias > 0.25) score -= 12;
    score = Math.round(clamp(score, 0, 100));

    return {
      score,
      status: score >= 85 ? "healthy" : score >= 65 ? "watch" : "maintenance",
      action:
        score >= 85
          ? "No action needed"
          : source.driftScore > 0.2
            ? "Schedule CPCB co-location calibration"
            : source.batteryPct < 25
              ? "Replace battery during next ward round"
              : "Field inspection required",
    };
  }

  function computeWardPriority(ward) {
    const source = {
      confirmedHotspots: 0,
      exposedPopulation: 0,
      schoolsClinics: 0,
      repeatHotspotDays: 0,
      avgAqi24h: 120,
      ...ward,
    };
    const score =
      source.confirmedHotspots * 18 +
      Math.min(28, source.exposedPopulation / 450) +
      source.schoolsClinics * 4 +
      source.repeatHotspotDays * 3 +
      Math.max(0, (source.avgAqi24h - 100) / 5);
    const priority = Math.round(clamp(score, 0, 100));
    return {
      priority,
      band: priority >= 70 ? "critical" : priority >= 42 ? "priority" : "stable",
    };
  }

  function enterpriseReadiness(config) {
    const source = {
      iccc: false,
      cpcb: false,
      swachhata: false,
      fcmSms: false,
      postgis: false,
      auditLogs: false,
      privacyBlur: false,
      offlineQueue: false,
      regionalLanguages: false,
      ...config,
    };
    const checks = Object.values(source).filter(Boolean).length;
    const total = Object.keys(source).length;
    const score = Math.round((checks / total) * 100);
    return {
      score,
      status: score >= 85 ? "pilot-ready" : score >= 60 ? "implementation-ready" : "prototype",
      missing: Object.entries(source)
        .filter(([, value]) => !value)
        .map(([key]) => key),
    };
  }

  function generateAuditEvent(event) {
    const source = {
      actorRole: "Ward Officer",
      action: "DISPATCH_RESOURCE",
      incidentId: "INC-W42-1029",
      evidenceHash: "ev_7c2a91",
      timestamp: "2026-07-07T14:20:00+05:30",
      ...event,
    };

    return {
      id: `${source.incidentId}-${source.action}-${source.timestamp}`.replace(/[^A-Z0-9-]/gi, "").slice(0, 64),
      line: `${source.timestamp} · ${source.actorRole} · ${source.action} · ${source.incidentId} · evidence ${source.evidenceHash}`,
      retention: "7 years municipal audit retention",
    };
  }

  return {
    STAGES,
    calculateConfidence,
    classifyStage,
    scoreReportTrust,
    forecastAqi,
    recommendDispatch,
    summarizeIncident,
    routeMunicipalAlert,
    evaluateSensorHealth,
    computeWardPriority,
    enterpriseReadiness,
    generateAuditEvent,
  };
});
