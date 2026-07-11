// TODO: wire up the real ChatGPT (OpenAI) integration described in UC-B4 - no
// service in this codebase calls OPENAI_API_KEY yet. This stub stands in so the
// Processing Tender Form endpoints have a synchronous, deterministic extraction
// step to build and test against; it returns nulls, which the evaluator then
// fills in manually via PATCH /api/evaluations/:id/confirm-inputs.
async function extractTenderInputs({ tenderId, documentIds }) {
  return {
    main_offer_price: null,
    alternative_offer_price: null,
    technical_proposal_score_raw: null,
    document_ids: documentIds || []
  };
}

module.exports = { extractTenderInputs };
