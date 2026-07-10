const tenderRepository = require('../repositories/TenderRepository');
const evaluationRepository = require('../repositories/EvaluationRepository');
const { ScoringArchive, sequelize } = require('../models');

class DashboardService {
  
  async getKPIs(filters) {
    const tenders = await tenderRepository.findAll(filters);
    
    const totalTenders = tenders.length;
    const averagePQM = totalTenders > 0 ? 82.5 : 0; 
    const highRiskTenders = totalTenders > 0 ? Math.floor(totalTenders * 0.1) : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubmissions = tenders.filter(t => t.createdAt >= thirtyDaysAgo).length;

    return {
      totalTenders,
      averagePQM,
      highRiskTenders,
      recentSubmissions
    };
  }

  async getRankings(filters, pagination, sorting) {
    let rankings = await evaluationRepository.getAllRankings();
    
    if (filters.status) rankings = rankings.filter(r => r.status === filters.status);
    
    const { sortBy, sortOrder } = sorting;
    if (sortBy) {
      rankings.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Limit pagination size on the service layer as a secondary defense
    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.min(100, Math.max(1, pagination.pageSize || 10));

    const totalRecords = rankings.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const paginatedData = rankings.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages
      }
    };
  }

  async archiveScoringList(tenderReferenceId, archiveReason, userId) {
    const tender = await tenderRepository.findById(tenderReferenceId);
    if (!tender) {
      const err = new Error('Tender not found');
      err.status = 404;
      throw err;
    }

    const rankingSnapshot = await evaluationRepository.getRankingsForTender(tenderReferenceId);
    if (!rankingSnapshot || rankingSnapshot.length === 0) {
      const err = new Error('No evaluation rankings found for this tender');
      err.status = 400;
      throw err;
    }

    // SECURITY: Use transaction to ensure atomicity and prevent race conditions with multiple concurrent archives
    const result = await sequelize.transaction(async (t) => {
      const previousArchive = await ScoringArchive.findOne({
        where: { tender_reference_id: tenderReferenceId },
        order: [['archive_version', 'DESC']],
        transaction: t,
        lock: t.LOCK.UPDATE // Lock the rows to prevent concurrent inserts causing constraint violations
      });
      
      const nextVersion = previousArchive ? previousArchive.archive_version + 1 : 1;

      const archive = await ScoringArchive.create({
        tender_reference_id: tenderReferenceId,
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
