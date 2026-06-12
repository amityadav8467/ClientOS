const express = require("express");
const router = express.Router();
const {
  generateProposal, getProposals, getProposalById, updateProposalStatus, deleteProposal
} = require("../controllers/proposalController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect, adminOnly);
router.post("/generate", generateProposal);
router.get("/", getProposals);
router.get("/:id", getProposalById);
router.put("/:id/status", updateProposalStatus);
router.delete("/:id", deleteProposal);

module.exports = router;
