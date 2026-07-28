const tenderRepository = require('../repositories/TenderRepository');
const evaluationRepository = require('../repositories/EvaluationRepository');
const { ScoringArchive, sequelize } = require('../models');

class DashboardService {

  /**
   * Get KPI metrics for the dashboard header cards.
   * Supports filters: status, category, dateFrom, dateTo, contractId
   */
  async getKPIs(filters) {
    const tenders = await tenderRepository.findAll(filters);

    const totalTenders = tenders.length;

    // Derive KPIs from real data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubmissions = tenders.filter(t => {
      const date = t.submission_date ? new Date(t.submission_date) : null;
      return date && date >= thirtyDaysAgo;
    }).length;

    // If we have evaluations for these tenders, compute real averages
    let averagePQM = 0;
    let highRiskTenders = 0;

    if (totalTenders > 0) {
      const rankings = await evaluationRepository.getAllRankings();
      const relevant = filters.contractId
        ? rankings.filter(r => r.contractId === filters.contractId)
        : rankings;

      if (relevant.length > 0) {
        const totalPQM = relevant.reduce((sum, r) => sum + (r.pqmScore || 0), 0);
        averagePQM = parseFloat((totalPQM / relevant.length).toFixed(2));
        highRiskTenders = relevant.filter(r => r.riskLevel === 'high').length;
      }
    }

    return {
      totalTenders,
      averagePQM,
      highRiskTenders,
      recentSubmissions
    };
  }

  /**
   * Get paginated, sorted rankings.
   * Supports filters: status, category, dateFrom, dateTo, contractId
   */
  async getRankings(filters, pagination, sorting) {
    let rankings;
    if (filters.contractId) {
      rankings = await evaluationRepository.getRankingsForContract(filters.contractId);
    } else {
      rankings = await evaluationRepository.getAllRankings();
    }

    // Assign rank based on initial PQM score sort (which is descending from DB)
    rankings.forEach((r, index) => {
      r.rank = index + 1;
    });

    // Apply additional filters
    if (filters.status) rankings = rankings.filter(r => r.status === filters.status);
    if (filters.category) rankings = rankings.filter(r => r.category === filters.category);

    // Sorting
    const { sortBy, sortOrder } = sorting;
    if (sortBy && rankings.length > 0) {
      rankings.sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.min(100, Math.max(1, pagination.pageSize || 10));
    const totalRecords = rankings.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const paginatedData = rankings.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedData,
      pagination: { page, pageSize, totalRecords, totalPages }
    };
  }

  /**
   * Archive final rankings for a contract opportunity.
   * Accepts contractId (preferred) or tenderReferenceId (legacy).
   */
  async archiveScoringList(contractId, archiveReason, userId) {
    // Support both contractId and tenderReferenceId (backward compat)
    const referenceId = contractId;

    if (!referenceId) {
      const err = new Error('contractId is required');
      err.status = 400;
      throw err;
    }

    // Try to get rankings by contractId first, fall back to tender lookup
    let rankingSnapshot = await evaluationRepository.getRankingsForContract(referenceId);

    if (!rankingSnapshot || rankingSnapshot.length === 0) {
      // Fallback: treat referenceId as a tender reference and look up directly
      const tenderRankings = await evaluationRepository.getRankingsForTender(referenceId);
      if (!tenderRankings || tenderRankings.length === 0) {
        const err = new Error('No evaluation rankings found for this contract');
        err.status = 400;
        throw err;
      }
      rankingSnapshot = tenderRankings;
    }

    // SECURITY: Use transaction to ensure atomicity
    const result = await sequelize.transaction(async (t) => {
      const previousArchive = await ScoringArchive.findOne({
        where: { tender_reference_id: referenceId },
        order: [['archive_version', 'DESC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      const nextVersion = previousArchive ? previousArchive.archive_version + 1 : 1;

      const archive = await ScoringArchive.create({
        tender_reference_id: referenceId,
        archive_version: nextVersion,
        archive_reason: archiveReason,
        ranking_snapshot: rankingSnapshot,
        archived_by: userId
      }, { transaction: t });

      return archive;
    });

    return result;
  }
}

module.exports = new DashboardService();
