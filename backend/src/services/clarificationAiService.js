// TODO: wire up the real ChatGPT (OpenAI) integration described in UC-D1/UC-D2 - no
// service in this codebase calls OPENAI_API_KEY yet (see aiExtractionService.js for the
// same situation on Scope B's side). These stubs return deterministic, template-based
// text so the detect-deviation and draft-message endpoints have a synchronous, testable
// step to build against. Swap the bodies of these two functions for real ChatGPT calls
// once that integration exists - the controller's try/catch around them already returns
// 502 Bad Gateway on failure, per the API doc.

function generateDeviationRationale({ deviationPercentage, tolerancePercentage, exceedsTolerance }) {
  if (exceedsTolerance) {
    return `Alternative offer is ${deviationPercentage}% below the main offer, exceeding the ${tolerancePercentage}% tolerance threshold.`;
  }
  return `Alternative offer is ${deviationPercentage}% below the main offer, within the ${tolerancePercentage}% tolerance threshold - no vendor follow-up required.`;
}

function formatSgd(amount) {
  return `S$${Number(amount).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateDraftMessage({ log, tender }) {
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

module.exports = { generateDeviationRationale, generateDraftMessage };
