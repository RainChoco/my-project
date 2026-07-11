const express = require("express");
const router = express.Router();
const proposalController = require("../controllers/proposalController");

// Calista (Scope C): proposal generation endpoints.

router.post(
    "/generate",
    proposalController.generateProposal
);

router.get(
    "/",
    proposalController.getAllProposals
);

router.get(
    "/:id",
    proposalController.getProposalById
);

router.put(
    "/:id",
    proposalController.updateProposal
);

router.delete(
    "/:id",
    proposalController.deleteProposal
);

router.get(
    "/pdf/:id",
    proposalController.downloadPDF
);

router.get(
    "/docx/:id",
    proposalController.downloadDOCX
);

module.exports = router;