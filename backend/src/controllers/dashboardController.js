const dashboardService = require('../services/dashboardService');

const getKPIs = async (req, res) => {
  try {
    const { status, category, dateFrom, dateTo } = req.query;
    const kpis = await dashboardService.getKPIs({ status, category, dateFrom, dateTo });
    
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
    // Validation ensures these are clean and typed
    const { 
      status, category, dateFrom, dateTo, 
      page = 1, pageSize = 10, 
      sortBy = 'pqmScore', sortOrder = 'desc' 
    } = req.query;

    const result = await dashboardService.getRankings(
      { status, category, dateFrom, dateTo },
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
    const { tenderReferenceId, archiveReason } = req.body;
    const userId = req.user.id;

    const archive = await dashboardService.archiveScoringList(tenderReferenceId, archiveReason, userId);
    
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
