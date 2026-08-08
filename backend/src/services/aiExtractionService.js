// Implements UC-A6 steps 1-2 (design/zheng-hong/use-cases.md): sends a tender's
// uploaded documents to ChatGPT to extract paid_up_capital, bca_fm01_license_no,
// bca_fm01_grade, and non_debarment_declared, ahead of the deterministic
// comparison already implemented in tenderController.js's triggerEligibilityCheck.

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const RESPONSE_SCHEMA = {
  paid_up_capital: "number or null - the vendor's declared paid-up capital in SGD, no currency symbol or commas",
  bca_fm01_license_no: "string or null - the BCA FM01 license number exactly as printed",
  bca_fm01_grade: "one of L1, L2, L3, L4, L5, L6, or null",
  non_debarment_declared: "boolean or null - true only if the document contains an explicit non-debarment declaration/statement",
  notes: "object mapping any of the above field names to a short reason it could not be determined, omitted entirely if all fields were found"
};

const SYSTEM_PROMPT = [
  "You are extracting specific fields from a submitted tender document image for a facilities/estate management procurement system.",
  "Only report a value if it is actually present in the document - never guess, estimate, or infer a plausible-sounding value.",
  "If a field is not present or not legible, set it to null and add a one-sentence reason under `notes`.",
  "Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:",
  JSON.stringify(RESPONSE_SCHEMA)
].join(" ");

const IMAGE_FORMATS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

// The chat completions API can only genuinely read image content (via image_url
// parts) - it cannot fetch and parse a PDF/DOCX/XLSX from a URL. Documents in
// those formats are deliberately excluded here rather than described to the
// model by filename/URL alone, which would just invite it to guess.
function selectReadableDocuments(documents) {
  return (documents || []).filter(
    (doc) => doc.resource_type === "image" || IMAGE_FORMATS.has((doc.format || "").toLowerCase())
  );
}

async function callOpenAi({ tender, readableDocuments, apiKey }) {
  const content = [
    {
      type: "text",
      text: `Tender reference: ${tender.tender_ref_no}. Vendor: ${tender.vendor_name}. Extract the required fields from the attached document image(s).`
    },
    ...readableDocuments.map((doc) => ({ type: "image_url", image_url: { url: doc.file_url } }))
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content }
      ],
      response_format: { type: "json_object" },
      temperature: 0
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const err = new Error(`OpenAI API request failed (${response.status}): ${errorBody}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const messageContent = data.choices?.[0]?.message?.content;
  if (!messageContent) {
    const err = new Error("OpenAI API returned an empty response.");
    err.status = 502;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(messageContent);
  } catch (parseError) {
    const err = new Error("OpenAI API returned a response that could not be parsed as JSON.");
    err.status = 502;
    throw err;
  }

  const VALID_GRADES = ["L1", "L2", "L3", "L4", "L5", "L6"];
  return {
    paid_up_capital: typeof parsed.paid_up_capital === "number" ? parsed.paid_up_capital : null,
    bca_fm01_license_no: typeof parsed.bca_fm01_license_no === "string" ? parsed.bca_fm01_license_no : null,
    bca_fm01_grade: VALID_GRADES.includes(parsed.bca_fm01_grade) ? parsed.bca_fm01_grade : null,
    non_debarment_declared: typeof parsed.non_debarment_declared === "boolean" ? parsed.non_debarment_declared : null,
    notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {}
  };
}

// Extracts eligibility fields from a tender's uploaded documents. Returns an
// object of { fields, notes } where `fields` contains ONLY the keys the AI (or,
// with no documents/key, nobody) could actually determine - callers should merge
// these onto the tender rather than overwrite with nulls, so a field set earlier
// via PATCH /api/tenders/:id is never clobbered by a failed/partial extraction.
async function extractTenderEligibilityFields({ tender, documents }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const readableDocuments = selectReadableDocuments(documents);

  if (!apiKey) {
    // No OpenAI key configured - nothing to extract. Matches this project's
    // established pattern (see aiBoardPaperService.js) of degrading gracefully
    // with no external API cost rather than failing, but - unlike that service -
    // there's no honest deterministic substitute for reading a document, so this
    // step is simply skipped and the tender's existing fields are used as-is.
    return { fields: {}, notes: {}, skipped: 'no_api_key' };
  }

  if (readableDocuments.length === 0) {
    // No image-format document to read. PDF/DOCX/XLSX text extraction isn't
    // wired up in this codebase - reporting nulls here (rather than guessing
    // from filenames) matches UC-A6's "AI cannot extract a value" edge case.
    const unsupportedFormats = [...new Set((documents || []).map((d) => d.format || d.resource_type))];
    return {
      fields: {},
      notes: {
        _all: `No image-format document available to read - automated extraction currently only supports PNG/JPG uploads, not ${unsupportedFormats.join(', ') || 'the uploaded format'}.`
      },
      skipped: 'no_readable_documents'
    };
  }

  const result = await callOpenAi({ tender, readableDocuments, apiKey });
  const { notes, ...extractedFields } = result;
  const fields = Object.fromEntries(
    Object.entries(extractedFields).filter(([, value]) => value !== null)
  );
  return { fields, notes };
}

module.exports = { extractTenderEligibilityFields };
