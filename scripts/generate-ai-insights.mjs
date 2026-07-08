import fs from "node:fs/promises";

const fallback = {
  generatedBy: "deterministic-fallback",
  generatedAt: new Date().toISOString(),
  model: "local",
  title: "Confirmed dump-fire pollution hotspot",
  municipalBrief:
    "Confirmed hotspot with 96% confidence. Forecast peak AQI 247 during 19:00-21:00. Dispatch mist cannon and solid-waste crew; lock before-reading now.",
  citizenAlert:
    "Air-quality alert: smoke hotspot confirmed nearby. Avoid outdoor activity for the next 2 hours. Municipal response is being dispatched.",
  fieldChecklist: [
    "Confirm source location and access route",
    "Capture before PM2.5/PM10 reading",
    "Deploy misting or cleanup response",
    "Capture after-reading 30-90 minutes later",
    "Reopen case if PM rebounds within 3 hours",
  ],
  dataProvenance: [
    "OpenStreetMap base layer",
    "Deterministic incident scenario for repeatable judging",
    "AI provider unavailable or secret not configured",
  ],
};

const prompt = `Return only valid JSON for a municipal air-quality incident response assistant in India.
Incident:
- Location: Ward 42, East Delhi demo area
- Evidence: citizen smoke photo, corrected PM2.5 212 ug/m3, NASA FIRMS-like fire prior within 900 m, wind NE to SW toward school/clinic exposure zone
- Confidence: 96%
- Forecast: AQI peak 247 during 19:00-21:00
- Recommended resources: water-mist cannon MC-03 and solid-waste crew SW-12

JSON schema:
{
  "title": string,
  "municipalBrief": string,
  "citizenAlert": string,
  "fieldChecklist": string[],
  "commissionerSummary": string,
  "riskRegister": string[],
  "dataProvenance": string[]
}

Requirements:
- Mention that OpenStreetMap is the live base map.
- Do not claim CPCB/NASA live ingestion is active unless saying it is integration-ready.
- Keep tone suitable for an Indian municipal command centre.
- No markdown.`;

async function main() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    await fs.writeFile("ai-insights.json", `${JSON.stringify(fallback, null, 2)}\n`);
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://shivam2003-dev.github.io/plumegraph-cleanair-track2/",
        "X-OpenRouter-Title": "VayuLens CleanAir Enterprise Demo",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert municipal air-quality incident-response analyst for Indian cities. Return concise, operational, valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP ${response.status}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    await fs.writeFile(
      "ai-insights.json",
      `${JSON.stringify(
        {
          generatedBy: "openrouter",
          generatedAt: new Date().toISOString(),
          model: payload.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          ...parsed,
        },
        null,
        2,
      )}\n`,
    );
  } catch (error) {
    await fs.writeFile(
      "ai-insights.json",
      `${JSON.stringify({ ...fallback, error: String(error.message || error) }, null, 2)}\n`,
    );
  }
}

await main();
