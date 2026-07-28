const { Evaluation, Tender } = require('../models');

class DatabaseEvaluationRepository {
  /**
   * Get all evaluations with their associated tender, ordered by rank.
   */
  async getAllRankings() {
    const evaluations = await Evaluation.findAll({
      include: [{ model: Tender, as: 'tender' }],
      order: [['pqm_score', 'DESC']]
    });

    return evaluations.map(ev => this._mapToRankingRow(ev));
  }

  /**
   * Get evaluations for a specific tender.
   */
  async getRankingsForTender(tenderId) {
    const evaluations = await Evaluation.findAll({
      where: { tender_id: tenderId },
      include: [{ model: Tender, as: 'tender' }],
      order: [['pqm_score', 'DESC']]
    });

    return evaluations.map(ev => this._mapToRankingRow(ev));
  }

  /**
   * Get all evaluations filtered by contractId (via the Tender FK).
   */
  async getRankingsForContract(contractId) {
    const evaluations = await Evaluation.findAll({
      include: [{ model: Tender, as: 'tender', where: { contractId }, required: true }],
      order: [['pqm_score', 'DESC']]
    });

    return evaluations.map(ev => this._mapToRankingRow(ev));
  }

  /**
   * Map Evaluation DB row → dashboard ranking shape.
   * Field aliases: vendor_name → supplierName, pqm_score → pqmScore, risk_level → riskLevel
   */
  _mapToRankingRow(ev) {
    const tender = ev.tender || {};
    return {
      id: ev.id,
      tenderId: ev.tender_id,
      tenderRefNo: tender.tender_ref_no || null,
      supplierName: tender.vendor_name || 'Unknown',
      pqmScore: parseFloat(ev.pqm_score) || 0,
      priceScore: parseFloat(ev.price_score) || 0,
      qualityScore: parseFloat(ev.quality_score) || 0,
      riskLevel: ev.risk_level || 'low',
      status: tender.status || null,
      contractId: tender.contractId || null,
      remarks: ev.remarks || ''
    };
  }
}

module.exports = new DatabaseEvaluationRepository();
