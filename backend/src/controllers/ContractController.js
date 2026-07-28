const contractService = require('../services/ContractService');

exports.getAll = async (req, res) => {
  try {
    const contracts = await contractService.getAllContracts();
    res.json({ status: 'success', data: contracts });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    res.json({ status: 'success', data: contract });
  } catch (error) {
    res.status(404).json({ status: 'error', message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const contract = await contractService.createContract(req.body);
    res.status(201).json({ status: 'success', data: contract });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    res.json({ status: 'success', data: contract });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await contractService.deleteContract(req.params.id);
    res.json({ status: 'success', message: 'Contract deleted successfully' });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
