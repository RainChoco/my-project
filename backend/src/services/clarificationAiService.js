// Real ChatGPT (OpenAI) integration for UC-D1/UC-D2, following the same pattern as
// aiBoardPaperService.js: call the real API when OPENAI_API_KEY is configured, else
// fall back to the deterministic, template-based text below so both endpoints still
// work (and still vary per tender) with no external API cost until a key is added.

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const stripEmDashes = (text) => (typeof text === "string" ? text.replace(/—/g, "-").trim() : text);

async function callOpenAi({ systemPrompt, userPrompt, apiKey }) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const err = new Error(`OpenAI API request failed (${response.status}): ${errorBody}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("OpenAI API returned an empty response.");
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(content);
  } catch (parseError) {
    const err = new Error("OpenAI API returned a response that could not be parsed as JSON.");
    err.status = 502;
    throw err;
  }
}

function buildDeterministicDeviationRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance }) {
  if (exceedsTolerance) {
    return `Alternative offer is ${deviationPercentage}% below the main offer, exceeding the ${tolerancePercentage}% tolerance threshold.`;
  }
  return `Alternative offer is ${deviationPercentage}% below the main offer, within the ${tolerancePercentage}% tolerance threshold - no vendor follow-up required.`;
}

// UC-D1: explains why a pricing deviation was (or wasn't) flagged for follow-up.
async function generateDeviationRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildDeterministicDeviationRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance });
  }

  const systemPrompt = [
    "You are drafting a one-sentence internal rationale for a procurement clarification log,",
    "explaining a vendor's pricing deviation between their main and alternative tender offers.",
    "Base every claim strictly on the numbers given - never invent figures.",
    "Use hyphens (-) instead of em dashes.",
    "Respond with ONLY a JSON object (no markdown fences, no commentary): { \"rationale\": \"string, 1-2 sentences\" }."
  ].join(" ");
  const userPrompt = `Deviation: ${deviationPercentage}%. Tolerance threshold: ${tolerancePercentage}%. Exceeds tolerance: ${exceedsTolerance}.`;

  const parsed = await callOpenAi({ systemPrompt, userPrompt, apiKey });
  return stripEmDashes(parsed.rationale) || buildDeterministicDeviationRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance });
}

function formatSgd(amount) {
  return `S$${Number(amount).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildDeterministicDraftMessage({ log, tender }) {
  if (log.log_type === 'job_adjustment_notification') {
    return {
      subject: `Confirmation of Adjusted Terms - ${tender.tender_ref_no}`,
      body: `Dear ${tender.vendor_name}, further to your clarification response, we confirm acceptance of the adjustment terms discussed. Please treat this as written confirmation of the revised terms.`
    };
  }

  return {
    subject: `Clarification Request - ${tender.tender_ref_no} Pricing Deviation`,
    body:
      `Dear ${tender.vendor_name}, we note that your alternative offer of ${formatSgd(log.alternative_offer_price_snapshot)} ` +
      `is ${log.deviation_percentage}% below your main offer of ${formatSgd(log.main_offer_price_snapshot)}. ` +
      'Kindly confirm or justify this deviation within 5 business days.'
  };
}

// UC-D2: drafts the actual clarification/confirmation email sent to the vendor.
async function generateDraftMessage({ log, tender }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildDeterministicDraftMessage({ log, tender });
  }

  const isJobAdjustment = log.log_type === 'job_adjustment_notification';
  const systemPrompt = [
    "You are drafting a formal vendor-facing email for a Town Council procurement clarification workflow.",
    "Write in a formal, courteous business tone. Base every claim strictly on the data provided - never invent",
    "figures, dates, or facts not present in that data. Use hyphens (-) instead of em dashes.",
    "Respond with ONLY a JSON object (no markdown fences, no commentary): { \"subject\": \"string\", \"body\": \"string\" }."
  ].join(" ");
  const userPrompt = isJobAdjustment
    ? `Email type: confirmation of adjusted contract terms following a resolved clarification. Tender: ${tender.tender_ref_no}, Vendor: ${tender.vendor_name}.`
    : `Email type: pricing deviation clarification request. Tender: ${tender.tender_ref_no}, Vendor: ${tender.vendor_name}. ` +
      `Main offer: ${formatSgd(log.main_offer_price_snapshot)}. Alternative offer: ${formatSgd(log.alternative_offer_price_snapshot)}. ` +
      `Deviation: ${log.deviation_percentage}%. Ask the vendor to confirm or justify the deviation within 5 business days.`;

  const parsed = await callOpenAi({ systemPrompt, userPrompt, apiKey });
  if (!parsed.subject || !parsed.body) {
    return buildDeterministicDraftMessage({ log, tender });
  }
  return { subject: stripEmDashes(parsed.subject), body: stripEmDashes(parsed.body) };
}

module.exports = { generateDeviationRationale, generateDraftMessage };
