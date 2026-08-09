// Real ChatGPT (OpenAI) integration for UC-D1/UC-D2, following the same pattern as
// aiBoardPaperService.js: calls OpenAI when OPENAI_API_KEY is configured, otherwise
// falls back to deterministic, template-based text built from the same data, so both
// endpoints keep working (and stay testable) with no external API cost until a key
// is added. Automatically upgrades to the real ChatGPT call the moment a key is set -
// no other code changes needed.

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const stripEmDashes = (text) => (typeof text === 'string' ? text.replace(/—/g, '-').trim() : text);

async function callOpenAi({ systemPrompt, userPrompt, apiKey }) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const err = new Error(`OpenAI API request failed (${response.status}): ${errorBody}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error('OpenAI API returned an empty response.');
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(content);
  } catch (parseError) {
    const err = new Error('OpenAI API returned a response that could not be parsed as JSON.');
    err.status = 502;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Pricing Deviation Rationale (UC-D1)
// ---------------------------------------------------------------------------

const DEVIATION_SYSTEM_PROMPT = [
  'You are an AI assistant reviewing a tender pricing deviation found during tender evaluation.',
  'You are given the deviation percentage between a tender\'s main and alternative offer prices,',
  'and the tolerance threshold percentage for that tender.',
  'Decide whether the deviation exceeds the tolerance threshold (true if the deviation percentage is',
  'strictly greater than the tolerance percentage, false otherwise), then write ONE concise sentence',
  'stating the deviation and whether it requires vendor follow-up.',
  'Base your decision and sentence strictly on the numbers provided - never invent figures.',
  'Use hyphens (-) instead of em dashes.',
  'Respond with ONLY a JSON object (no markdown fences, no commentary) of the shape:',
  '{ "exceeds_tolerance": boolean, "rationale": "string" }'
].join(' ');

function buildDeterministicRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance }) {
  if (exceedsTolerance) {
    return `Alternative offer is ${deviationPercentage}% below the main offer, exceeding the ${tolerancePercentage}% tolerance threshold.`;
  }
  return `Alternative offer is ${deviationPercentage}% below the main offer, within the ${tolerancePercentage}% tolerance threshold - no vendor follow-up required.`;
}

function buildDeterministicAssessment({ deviationPercentage, tolerancePercentage }) {
  const exceedsTolerance = deviationPercentage > tolerancePercentage;
  return { exceedsTolerance, rationale: buildDeterministicRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance }) };
}

// Uses ChatGPT to compare the deviation against the tolerance threshold and explain the
// result, per UC-D1's "compares via ChatGPT" design. Falls back to a plain percentage
// comparison (no external call) when no API key is configured, or if ChatGPT's response
// is malformed - the deterministic path is a stand-in, not a permanent duplicate check.
async function assessDeviation({ deviationPercentage, tolerancePercentage }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildDeterministicAssessment({ deviationPercentage, tolerancePercentage });
  }

  const userPrompt = `Deviation percentage: ${deviationPercentage}%\nTolerance threshold: ${tolerancePercentage}%`;
  const parsed = await callOpenAi({ systemPrompt: DEVIATION_SYSTEM_PROMPT, userPrompt, apiKey });
  if (typeof parsed.exceeds_tolerance !== 'boolean' || !parsed.rationale) {
    return buildDeterministicAssessment({ deviationPercentage, tolerancePercentage });
  }
  return { exceedsTolerance: parsed.exceeds_tolerance, rationale: stripEmDashes(parsed.rationale) };
}

// ---------------------------------------------------------------------------
// Clarification Draft Message (UC-D2)
// ---------------------------------------------------------------------------

const DRAFT_SYSTEM_PROMPT = [
  'You are an AI assistant drafting an official clarification request from a facilities/estate management',
  'organisation to a tender vendor, for a management staff member to review and send.',
  'Write in a formal, courteous business tone. Base every claim strictly on the data provided in the user',
  'message - never invent figures, dates, or facts not present in that data.',
  'Use hyphens (-) instead of em dashes anywhere in your text.',
  'Respond with ONLY a JSON object (no markdown fences, no commentary) of the shape:',
  '{ "subject": "string, a short email subject line", "body": "string, the full message body" }'
].join(' ');

function formatSgd(amount) {
  return `S$${Number(amount).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildDeterministicDraft({ log, tender }) {
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

function buildDraftUserPrompt({ log, tender }) {
  if (log.log_type === 'job_adjustment_notification') {
    return (
      'Message type: confirmation of adjusted job terms, following a vendor clarification response.\n' +
      `Vendor name: ${tender.vendor_name}\nTender reference: ${tender.tender_ref_no}`
    );
  }

  return (
    'Message type: pricing deviation clarification request.\n' +
    `Vendor name: ${tender.vendor_name}\nTender reference: ${tender.tender_ref_no}\n` +
    `Main offer price: ${formatSgd(log.main_offer_price_snapshot)}\n` +
    `Alternative offer price: ${formatSgd(log.alternative_offer_price_snapshot)}\n` +
    `Deviation percentage: ${log.deviation_percentage}%\n` +
    'Ask the vendor to confirm or justify the deviation within 5 business days.'
  );
}

async function generateDraftMessage({ log, tender }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildDeterministicDraft({ log, tender });
  }

  const userPrompt = buildDraftUserPrompt({ log, tender });
  const parsed = await callOpenAi({ systemPrompt: DRAFT_SYSTEM_PROMPT, userPrompt, apiKey });
  const subject = stripEmDashes(parsed.subject);
  const body = stripEmDashes(parsed.body);
  if (!subject || !body) {
    return buildDeterministicDraft({ log, tender });
  }
  return { subject, body };
}

module.exports = { assessDeviation, generateDraftMessage };
