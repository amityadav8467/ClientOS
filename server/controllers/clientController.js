const Client = require("../models/Client");

const getClients = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = { assignedAdmin: req.user._id };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, assignedAdmin: req.user._id });
    res.status(201).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, createClient, getClientById, updateClient, deleteClient };
