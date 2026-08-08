const express = require("express");
const router = express.Router();
const proposalController = require("../controllers/proposalController");
const { authenticate, authorise } = require('../middlewares/auth');

// Calista (Scope C): proposal generation endpoints.
// Restricted to report_preparer/management/ma_staff, matching routeConfig.jsx's
// /proposal-report route guard.
const proposalRoles = authorise('report_preparer', 'management', 'ma_staff');

router.post(
    "/generate",
    authenticate, proposalRoles,
    proposalController.generateProposal
);

router.get(
    "/",
    authenticate, proposalRoles,
    proposalController.getAllProposals
);

router.get(
    "/:id",
    authenticate, proposalRoles,
    proposalController.getProposalById
);

router.put(
    "/:id",
    authenticate, proposalRoles,
    proposalController.updateProposal
);

router.delete(
    "/:id",
    authenticate, proposalRoles,
    proposalController.deleteProposal
);

router.get(
    "/pdf/:id",
    authenticate, proposalRoles,
    proposalController.downloadPDF
);

router.get(
    "/docx/:id",
    authenticate, proposalRoles,
    proposalController.downloadDOCX
);

module.exports = router;