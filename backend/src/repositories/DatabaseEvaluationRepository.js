const { Tender, Evaluation, Contract } = require('../models');
const { Op } = require('sequelize');

class DatabaseEvaluationRepository {
  /**
   * Build the shared include options for Tender->Evaluation LEFT JOIN.
   * Using Tender as the primary model ensures tenders without evaluations
   * still appear (LEFT JOIN semantics via required:false).
   */
  _tenderInclude() {
    return [
      {
        model: Evaluation,
        as: 'evaluations',
        required: false,   // ← LEFT JOIN: include tenders with NO evaluation
        limit: 1,
        order: [['pqm_score', 'DESC']]
      }
    ];
  }

  /**
   * Map a Tender row (with optional evaluations[]) → dashboard ranking shape.
   */
  _mapTenderToRankingRow(tender) {
    // Grab the best evaluation if any exist
    const ev = tender.evaluations && tender.evaluations.length > 0
      ? tender.evaluations[0]
      : null;

    return {
      tenderId: tender.id,
      tenderRefNo: tender.tender_ref_no || null,
      supplierName: tender.vendor_name || 'Unknown',
      category: tender.category || 'Uncategorized',
      pqmScore: ev && ev.pqm_score != null ? parseFloat(ev.pqm_score) : null,
      priceScore: ev && ev.price_score != null ? parseFloat(ev.price_score) : null,
      qualityScore: ev && ev.quality_score != null ? parseFloat(ev.quality_score) : null,
      riskLevel: ev ? (ev.risk_level || 'low') : null,
      evaluationStatus: ev ? ev.status : null,
      status: tender.status || null,
      contractId: tender.contractId || null,
      submissionDate: tender.submission_date || null
    };
  }

  /**
   * Get all tender rankings (with or without evaluations).
   */
  async getAllRankings() {
    const tenders = await Tender.findAll({
      include: this._tenderInclude(),
      order: [['created_at', 'DESC']]
    });
    return tenders.map(t => this._mapTenderToRankingRow(t));
  }

  /**
   * Get tender rankings for a specific contract (LEFT JOIN evaluations).
   * Returns ALL tenders for the contract, even those without evaluations.
   */
  async getRankingsForContract(contractId) {
    const tenders = await Tender.findAll({
      where: { contractId },
      include: this._tenderInclude(),
      order: [['created_at', 'DESC']]
    });
    return tenders.map(t => this._mapTenderToRankingRow(t));
  }

  /**
   * Get rankings for a specific tender ID.
   */
  async getRankingsForTender(tenderId) {
    const tenders = await Tender.findAll({
      where: { id: tenderId },
      include: this._tenderInclude()
    });
    return tenders.map(t => this._mapTenderToRankingRow(t));
  }
}

module.exports = new DatabaseEvaluationRepository();
