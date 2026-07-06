const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../plumegraph-core.js");

test("single citizen report does not become confirmed", () => {
  const evidence = {
    report: true,
    sensor: false,
    satellite: false,
    trustScore: 0.82,
    duplicateRisk: 0.03,
    exifConfidence: 0.94,
    smokeProbability: 0.91,
  };
  assert.equal(core.classifyStage(evidence), core.STAGES.WATCH);
  assert.ok(core.calculateConfidence(evidence) < 75);
});

test("cross-source evidence confirms hotspot", () => {
  const evidence = {
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
  };
  assert.equal(core.classifyStage(evidence), core.STAGES.CONFIRMED);
  assert.ok(core.calculateConfidence(evidence) >= 90);
});

test("forecast increases under fire and low-wind evidence", () => {
  const normal = core.forecastAqi({
    baselineAqi: 132,
    pm25: 74,
    windSpeedKmph: 14,
    humidity: 52,
    smokeReports3h: 0,
    firePrior: 0,
    trafficIndex: 0.4,
    dumpProximity: 0.2,
  });
  const hotspot = core.forecastAqi({
    baselineAqi: 132,
    pm25: 212,
    windSpeedKmph: 8,
    humidity: 64,
    smokeReports3h: 3,
    firePrior: 0.9,
    trafficIndex: 0.62,
    dumpProximity: 0.92,
  });
  assert.ok(hotspot.peakAqi > normal.peakAqi);
  assert.equal(hotspot.spikeWindow, "19:00-21:00");
});

test("dispatch optimizer selects a strong eligible resource", () => {
  const asset = core.recommendDispatch(
    {
      forecastPeakAqi: 247,
      exposedPopulation: 8400,
      confidence: 0.96,
      sensitiveSites: 2,
      cause: "garbage_fire",
    },
    [
      { id: "IN-04", type: "inspector", etaMinutes: 8, capacity: 0.65 },
      { id: "MC-03", type: "mist_cannon", etaMinutes: 14, capacity: 0.92 },
      { id: "SW-12", type: "solid_waste_crew", etaMinutes: 22, capacity: 0.84 },
    ],
  );
  assert.equal(asset.id, "MC-03");
});

test("AI summary returns municipal brief and field checklist", () => {
  const summary = core.summarizeIncident({
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
    type: "garbage_fire",
  });
  assert.match(summary.municipalBrief, /Confirmed hotspot/);
  assert.ok(summary.fieldChecklist.length >= 4);
});

test("municipal alert routing is cause-specific for India city ops", () => {
  const route = core.routeMunicipalAlert({
    cause: "garbage_fire",
    ward: "Ward 42",
    confidence: 0.96,
    forecastPeakAqi: 247,
    sensitiveSites: 2,
  });
  assert.equal(route.primary, "Solid Waste Department");
  assert.equal(route.urgency, "high");
  assert.match(route.publicLabel, /SLA 30 min/);
});

test("sensor health flags drift and maintenance action", () => {
  const health = core.evaluateSensorHealth({
    uptimePct: 92,
    batteryPct: 44,
    driftScore: 0.31,
    lastSeenMinutes: 8,
  });
  assert.equal(health.status, "maintenance");
  assert.match(health.action, /calibration/);
});

test("ward priority escalates with exposed population and repeat hotspots", () => {
  const ward = core.computeWardPriority({
    confirmedHotspots: 3,
    exposedPopulation: 8400,
    schoolsClinics: 4,
    repeatHotspotDays: 5,
    avgAqi24h: 188,
  });
  assert.equal(ward.band, "critical");
  assert.ok(ward.priority >= 70);
});

test("enterprise readiness reports missing integrations", () => {
  const readiness = core.enterpriseReadiness({
    iccc: true,
    cpcb: true,
    swachhata: true,
    fcmSms: true,
    postgis: true,
    auditLogs: true,
    privacyBlur: true,
    offlineQueue: true,
    regionalLanguages: false,
  });
  assert.equal(readiness.status, "pilot-ready");
  assert.deepEqual(readiness.missing, ["regionalLanguages"]);
});

test("audit event creates durable municipal log line", () => {
  const audit = core.generateAuditEvent({
    actorRole: "ICCC Shift Lead",
    action: "CONFIRM_HOTSPOT",
    incidentId: "INC-W42-1029",
  });
  assert.match(audit.line, /ICCC Shift Lead/);
  assert.match(audit.retention, /7 years/);
});
