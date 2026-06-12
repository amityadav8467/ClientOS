const express = require("express");
const router = express.Router();
const { getClients, createClient, getClientById, updateClient, deleteClient } = require("../controllers/clientController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect, adminOnly);
router.route("/").get(getClients).post(createClient);
router.route("/:id").get(getClientById).put(updateClient).delete(deleteClient);

module.exports = router;
