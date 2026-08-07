const DEFAULT_REPORT_SECTIONS = [
  'Executive Summary',
  'Tender Overview',
  'Vendor Recommendation',
  'Financial Analysis',
  'Risk Assessment',
  'AI Recommendation',
  'Conclusion'
];

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }

  const normalizedValue = Number(value);

  if (Number.isFinite(normalizedValue)) {
    return `SGD ${normalizedValue.toLocaleString('en-SG')}`;
  }

  return String(value);
}

function stripLeadingHeading(text) {
  if (!text || typeof text !== 'string') return text;

  const KNOWN_TITLES = [
    'Executive Summary',
    'Tender Overview',
    'Vendor Recommendation',
    'Financial Analysis',
    'Risk Assessment',
    'AI Recommendation',
    'Conclusion'
  ];

  const firstLine = text.split(/\n/)[0].trim();
  const mdMatch = firstLine.match(/^#{1,6}\s*(.*)$/);
  let candidate = mdMatch ? mdMatch[1].trim() : firstLine;

  for (const t of KNOWN_TITLES) {
    if (candidate.toLowerCase().startsWith((t + ' ').toLowerCase())) {
      return candidate.slice(t.length).trim();
    }
    if (candidate.toLowerCase() === t.toLowerCase()) {
      return text.split(/\n/).slice(1).join('\n').trim();
    }
  }

  return text.replace(/^\s*#{1,6}\s*[^\n]*\n+/m, '').trim();
}

function sanitizeText(value, fallback) {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue || ['true', 'false'].includes(trimmedValue.toLowerCase())) {
      return fallback;
    }

    return trimmedValue;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

function buildExecutiveSummary({ summary, score, confidence, tenderName }) {
  const normalizedSummary = sanitizeText(summary, `The board paper recommends proceeding with ${tenderName || 'the selected tender'} based on the latest evaluation findings.`);
  const evaluationNote = `The award is supported by an overall evaluation score of ${score} and ${confidence}% confidence.`;

  if (
    normalizedSummary.includes('evaluation score') ||
    normalizedSummary.includes('confidence') ||
    normalizedSummary.includes('award')
  ) {
    return normalizedSummary;
  }

  return `${normalizedSummary} ${evaluationNote}`;
}

function buildReportContent({ boardPaper, tender, selectedReportSections = [] }) {
  const boardPaperTitle = sanitizeText(boardPaper?.title, 'Board Paper');
  const tenderName = boardPaperTitle.replace(/ Board Paper$/i, '');
  const purpose = sanitizeText(boardPaper?.purpose, 'Recommendation');
  const vendorName = sanitizeText(tender?.vendor_name || tender?.vendor, 'the selected vendor');
  const rawSummary = stripLeadingHeading(boardPaper?.aiSummary || boardPaper?.executiveSummary);
  const aiSummary = buildExecutiveSummary({
    summary: rawSummary,
    score: boardPaper?.score || '90 / 100',
    confidence: boardPaper?.confidence || 90,
    tenderName
  });

  const aiRecommendation = sanitizeText(stripLeadingHeading(boardPaper?.aiRecommendation || boardPaper?.finalRecommendation), `Proceed to management approval for ${vendorName}.`);
  const financialAnalysis = sanitizeText(stripLeadingHeading(boardPaper?.aiFinancialAnalysis || boardPaper?.financialAnalysis), 'The board paper highlights that the submitted quotation remains competitive and aligned with the approved budget.');
  const riskAssessment = sanitizeText(stripLeadingHeading(boardPaper?.aiRiskAssessment || boardPaper?.riskAssessment), 'The board paper identifies manageable delivery risk with standard follow-up controls.');
  const confidence = boardPaper?.confidence || 90;
  const score = boardPaper?.score || '90 / 100';
  const contractValue = tender?.main_offer_price || boardPaper?.contractValue || 'Not available';
  const contractDuration = tender?.contract_duration || boardPaper?.contractDuration || 'Not available';
  const evaluationScore = sanitizeText(boardPaper?.score || score, 'Not available');
  const selectedSections = (selectedReportSections && selectedReportSections.length > 0)
    ? selectedReportSections
    : DEFAULT_REPORT_SECTIONS;

  const contentSections = [];

  if (selectedSections.includes('Executive Summary')) {
    contentSections.push(`### Executive Summary\n\n${aiSummary}`);
  }

  if (selectedSections.includes('Tender Overview')) {
    contentSections.push(`### Tender Overview\n\n- Tender: ${tenderName}\n- Vendor: ${vendorName}\n- Contract Value: ${formatCurrency(contractValue)}\n- Contract Duration: ${contractDuration}\n- Evaluation Score: ${evaluationScore}`);
  }

  if (selectedSections.includes('Vendor Recommendation')) {
    contentSections.push(`### Vendor Recommendation\n\n${vendorName} is recommended for contract award because the evaluation outcome supports its suitability for ${purpose.toLowerCase()} and delivery of ${tenderName}.`);
  }

  if (selectedSections.includes('Financial Analysis')) {
    contentSections.push(`### Financial Analysis\n\n${financialAnalysis}`);
  }

  if (selectedSections.includes('Risk Assessment')) {
    contentSections.push(`### Risk Assessment\n\n${riskAssessment}`);
  }

  if (selectedSections.includes('AI Recommendation')) {
    contentSections.push(`### AI Recommendation\n\n${aiRecommendation}`);
  }

  if (selectedSections.includes('Conclusion')) {
    contentSections.push(`### Conclusion\n\nProceed with the award of ${tenderName} to ${vendorName}, with ${confidence}% confidence and an evaluation score of ${score}.`);
  }

  return contentSections.join('\n\n');
}

function generateProposalDraft({ boardPaper, tender, selectedReportSections = [] }) {
  const boardPaperTitle = boardPaper?.title || 'Board Paper';
  const purpose = boardPaper?.purpose || 'Recommendation';

  const proposalTitle = `${boardPaperTitle.replace(/ Board Paper$/i, '')} Proposal`;
  const proposalType = `${purpose} for Award`;
  const content = buildReportContent({ boardPaper, tender, selectedReportSections });

  return {
    proposalTitle,
    proposalType,
    sections: {
      content,
      selectedReportSections: selectedReportSections && selectedReportSections.length > 0
        ? selectedReportSections
        : DEFAULT_REPORT_SECTIONS
    }
  };
}

module.exports = {
  generateProposalDraft
};
