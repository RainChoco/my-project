const { Contract, Tender, Evaluation } = require('../models');

class ContractRepository {
  async findAll() {
    return await Contract.findAll({ where: { isDeleted: false }, order: [['createdAt', 'DESC']] });
  }

  async findById(id) {
    return await Contract.findOne({
      where: { id, isDeleted: false },
      include: [{
        model: Tender,
        as: 'tenders',
        attributes: ['id', 'tender_ref_no', 'vendor_name', 'submission_date', 'status', 'eligibility_status', 'contractId'],
        include: [{
          model: Evaluation,
          as: 'evaluations',
          attributes: ['id', 'pqm_score', 'price_score', 'quality_score', 'risk_level', 'status'],
          limit: 1,
          order: [['created_at', 'DESC']]
        }]
      }]
    });
  }

  async create(data) {
    return await Contract.create(data);
  }

  async update(id, data) {
    const contract = await this.findById(id);
    if (!contract) return null;
    return await contract.update(data);
  }

  async softDelete(id) {
    const contract = await this.findById(id);
    if (!contract) return null;
    return await contract.update({ isDeleted: true });
  }
}

module.exports = new ContractRepository();
