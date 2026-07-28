const { Contract } = require('../models');

class ContractRepository {
  async findAll() {
    return await Contract.findAll({ where: { isDeleted: false }, order: [['createdAt', 'DESC']] });
  }

  async findById(id) {
    return await Contract.findOne({ where: { id, isDeleted: false } });
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
