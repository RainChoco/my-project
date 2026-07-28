const contractRepo = require('../repositories/ContractRepository');
const { v4: uuidv4 } = require('uuid');

class ContractService {
  async getAllContracts() {
    return await contractRepo.findAll();
  }

  async getContractById(id) {
    const contract = await contractRepo.findById(id);
    if (!contract) throw new Error('Contract not found');
    return contract;
  }

  async createContract(data) {
    // Basic validation
    if (new Date(data.openingDate) >= new Date(data.closingDate)) {
      throw new Error('Opening date must be before closing date');
    }
    
    // Generate a unique, collision-free CTR- ID using a UUID fragment
    const id = `CTR-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    return await contractRepo.create({ ...data, id });
  }

  async updateContract(id, data) {
    if (data.openingDate && data.closingDate && new Date(data.openingDate) >= new Date(data.closingDate)) {
      throw new Error('Opening date must be before closing date');
    }
    const updated = await contractRepo.update(id, data);
    if (!updated) throw new Error('Contract not found');
    return updated;
  }

  async deleteContract(id) {
    const deleted = await contractRepo.softDelete(id);
    if (!deleted) throw new Error('Contract not found');
    return deleted;
  }
}

module.exports = new ContractService();
