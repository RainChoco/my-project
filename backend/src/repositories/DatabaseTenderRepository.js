const { Tender, Contract } = require('../models');
const { Op } = require('sequelize');

class DatabaseTenderRepository {
  /**
   * Find all tenders matching optional filters.
   * Supports: status, category, dateFrom, dateTo, contractId
   */
  async findAll({ status, category, dateFrom, dateTo, contractId } = {}) {
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (contractId) where.contractId = contractId;

    if (dateFrom || dateTo) {
      where.submission_date = {};
      if (dateFrom) where.submission_date[Op.gte] = new Date(dateFrom);
      if (dateTo) where.submission_date[Op.lte] = new Date(dateTo);
    }

    return Tender.findAll({ where, include: [{ model: Contract, as: 'contract' }] });
  }

  /**
   * Find a single tender by primary key.
   */
  async findById(id) {
    return Tender.findByPk(id, { include: [{ model: Contract, as: 'contract' }] });
  }

  /**
   * Find tenders belonging to a specific contract.
   */
  async findByContractId(contractId) {
    return Tender.findAll({ where: { contractId } });
  }
}

module.exports = new DatabaseTenderRepository();
