const dashboardService = require('../services/dashboardService');

const getKPIs = async (req, res) => {
  try {
    // B8: contractId filter added
    const { status, category, dateFrom, dateTo, contractId } = req.query;
    const kpis = await dashboardService.getKPIs({ status, category, dateFrom, dateTo, contractId });

    res.json({
      status: 'success',
      data: kpis
    });
  } catch (error) {
    // SECURITY: Avoid leaking internal error details
    console.error('Error in getKPIs:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const getRankings = async (req, res) => {
  try {
    // B8: contractId filter added
    const {
      status, category, dateFrom, dateTo, contractId,
      page = 1, pageSize = 10,
      sortBy = 'pqmScore', sortOrder = 'desc'
    } = req.query;

    const result = await dashboardService.getRankings(
      { status, category, dateFrom, dateTo, contractId },
      { page: parseInt(page), pageSize: parseInt(pageSize) },
      { sortBy, sortOrder }
    );

    res.json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getRankings:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

const archiveRankings = async (req, res) => {
  try {
    // B7: Accept contractId (new) and tenderReferenceId (legacy)
    const { contractId, tenderReferenceId, archiveReason } = req.body;
    const referenceId = contractId || tenderReferenceId;

    if (!referenceId) {
      return res.status(400).json({ status: 'error', message: 'contractId is required' });
    }

    // B9: Use real userId from JWT (auth middleware sets req.user)
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const archive = await dashboardService.archiveScoringList(referenceId, archiveReason, userId);

    res.status(201).json({
      status: 'success',
      message: 'Scoring list archived successfully',
      data: {
        archiveId: archive.id,
        version: archive.archive_version
      }
    });
  } catch (error) {
    console.error('Error in archiveRankings:', error);
    const status = error.status || 500;
    // Only return the error message for known application errors (400, 404), mask 500s.
    const message = status < 500 ? error.message : 'Internal Server Error';
    res.status(status).json({ status: 'error', message });
  }
};

module.exports = {
  getKPIs,
  getRankings,
  archiveRankings
};
