const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const RESPONSE_SCHEMA = {
    summary: "string, 2-4 sentence executive summary of the tender and the overall recommendation",
    financialAnalysis: "string, 2-3 sentences on price competitiveness against the contract budget and/or paid-up capital adequacy",
    riskAssessment: "string, 2-3 sentences on eligibility, compliance and delivery risk given the tender data",
    recommendation: "string, 1-2 sentence final recommendation for the board",
    confidenceText: "string, 1 sentence explaining why the confidence score is what it is, referencing the strongest and weakest factors",
    riskLevel: "one of: Low, Medium, High"
};

const SYSTEM_PROMPT = [
    "You are an AI assistant drafting board paper content for a facilities/estate management tender approval process.",
    "Write in a formal, concise business tone suitable for a management board paper.",
    "Base every claim strictly on the tender data provided in the user message - never invent figures, vendor history, or facts not present in that data.",
    "Use hyphens (-) instead of em dashes anywhere in your text.",
    "Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:",
    JSON.stringify(RESPONSE_SCHEMA),
    "riskLevel should be Low when the confidence score is 75 or above, Medium when it is 50-74, and High when it is below 50."
].join(" ");

const stripEmDashes = (text) => (typeof text === "string" ? text.replace(/—/g, "-").trim() : null);

function buildTenderContext(tender, confidence) {
    const contract = tender.contract || {};
    return {
        tender_ref_no: tender.tender_ref_no,
        vendor_name: tender.vendor_name,
        main_offer_price: tender.main_offer_price != null ? Number(tender.main_offer_price) : null,
        alternative_offer_price: tender.alternative_offer_price != null ? Number(tender.alternative_offer_price) : null,
        paid_up_capital: tender.paid_up_capital != null ? Number(tender.paid_up_capital) : null,
        bca_fm01_grade: tender.bca_fm01_grade,
        bizsafe_level: tender.bizsafe_level,
        eligibility_status: tender.eligibility_status,
        ai_eligibility_summary: tender.ai_eligibility_summary,
        non_debarment_declared: tender.non_debarment_declared,
        contract_category: contract.category ?? null,
        contract_budget_limit: contract.budgetLimit != null ? Number(contract.budgetLimit) : null,
        computed_confidence_score: confidence
    };
}

async function callOpenAi({ tender, confidence, title, purpose, apiKey }) {
    const context = buildTenderContext(tender, confidence);
    const userPrompt = `Board paper title: ${title}\nPurpose: ${purpose}\nTender data (JSON): ${JSON.stringify(context)}`;

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

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (parseError) {
        const err = new Error("OpenAI API returned a response that could not be parsed as JSON.");
        err.status = 502;
        throw err;
    }

    return {
        aiSummary: stripEmDashes(parsed.summary),
        aiFinancialAnalysis: stripEmDashes(parsed.financialAnalysis),
        aiRiskAssessment: stripEmDashes(parsed.riskAssessment),
        aiRecommendation: stripEmDashes(parsed.recommendation),
        aiConfidenceText: stripEmDashes(parsed.confidenceText),
        aiRiskLevel: ["Low", "Medium", "High"].includes(parsed.riskLevel) ? parsed.riskLevel : null
    };
}

const formatCurrency = (value) => (value != null ? `SGD ${Number(value).toLocaleString()}` : null);

// No OPENAI_API_KEY configured - draft the narrative from the tender's real
// data with plain string interpolation instead of an LLM call, so board paper
// generation still works (and still varies per tender) without any external
// API cost. Automatically upgrades to the real ChatGPT call above the moment
// a key is added, with no other code changes needed.
function buildDeterministicNarrative({ tender, confidence, title, purpose }) {
    const context = buildTenderContext(tender, confidence);
    const vendor = context.vendor_name || "the vendor";
    const tenderRef = context.tender_ref_no || "this tender";
    const price = context.main_offer_price;
    const budget = context.contract_budget_limit;
    const eligibility = context.eligibility_status || "pending";

    const positioning = confidence >= 75 ? "well-positioned" : confidence >= 50 ? "moderately positioned" : "weakly positioned";
    const aiSummary = `The board paper for ${tenderRef} (${title}) covers ${vendor}'s submission for ${(purpose || "review").toLowerCase()}. Based on an eligibility status of "${eligibility}" and a computed confidence score of ${confidence}%, this submission is ${positioning} for approval.`;

    let aiFinancialAnalysis;
    if (price != null && budget != null) {
        const withinBudget = price <= budget;
        const diffPct = budget > 0 ? Math.round((Math.abs(budget - price) / budget) * 100) : 0;
        aiFinancialAnalysis = withinBudget
            ? `The main offer price of ${formatCurrency(price)} is ${diffPct}% under the approved contract budget of ${formatCurrency(budget)}, indicating competitive pricing.`
            : `The main offer price of ${formatCurrency(price)} exceeds the approved contract budget of ${formatCurrency(budget)} by ${diffPct}%, which weakens the financial case for this submission.`;
    } else if (price != null) {
        aiFinancialAnalysis = `The main offer price is ${formatCurrency(price)}. No contract budget is on file for comparison, so pricing competitiveness could not be fully assessed.`;
    } else {
        aiFinancialAnalysis = "The main offer price is not yet available, so a financial competitiveness assessment could not be completed.";
    }

    const riskPoints = [];
    if (eligibility !== "eligible") {
        riskPoints.push(`eligibility status is currently "${eligibility}"`);
    }
    if (context.non_debarment_declared === false) {
        riskPoints.push("non-debarment has not been declared");
    }
    if (!context.bca_fm01_grade) {
        riskPoints.push("no BCA FM01 grade is on file");
    }
    if (!context.bizsafe_level || context.bizsafe_level === "None") {
        riskPoints.push("no bizSAFE level is on file");
    }
    const aiRiskAssessment = riskPoints.length > 0
        ? `Key risk factors identified for ${vendor}: ${riskPoints.join("; ")}. These should be resolved or accepted as conditions before approval.`
        : `No material eligibility or compliance risks were identified for ${vendor} based on the data on file.`;

    const aiRecommendation = confidence >= 75
        ? `Proceed to Management Approval for ${vendor}'s submission under ${tenderRef}.`
        : confidence >= 50
            ? `Proceed to Management Approval for ${vendor}'s submission under ${tenderRef}, subject to addressing the risk factors noted above.`
            : `Further review is recommended before proceeding with ${vendor}'s submission under ${tenderRef}, given the low confidence score.`;

    const aiConfidenceText = `The ${confidence}% confidence score reflects an eligibility status of "${eligibility}"${
        price != null && budget != null
            ? (price <= budget ? " and a competitively priced offer against the approved budget." : " and an offer priced above the approved budget.")
            : "."
    }`;

    const aiRiskLevel = confidence >= 75 ? "Low" : confidence >= 50 ? "Medium" : "High";

    return { aiSummary, aiFinancialAnalysis, aiRiskAssessment, aiRecommendation, aiConfidenceText, aiRiskLevel };
}

// Drafts the narrative sections of a board paper from the tender's actual
// data. Uses the real ChatGPT (OpenAI) API when OPENAI_API_KEY is configured;
// otherwise falls back to a deterministic, template-based narrative built
// from the same tender data, so board paper generation works with no
// external API cost until a key is added.
async function generateBoardPaperNarrative({ tender, confidence, title, purpose }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return buildDeterministicNarrative({ tender, confidence, title, purpose });
    }

    return callOpenAi({ tender, confidence, title, purpose, apiKey });
}

module.exports = { generateBoardPaperNarrative };
