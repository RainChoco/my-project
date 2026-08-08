const express = require('express');
const router = express.Router();
const boardpaperController = require("../controllers/boardPaperController");
const { authenticate, authorise } = require('../middlewares/auth');
// Calista (Scope C): Board paper generation endpoints.
// See design/calista/api-documentation.md for the routes to add here.
// Restricted to report_preparer/management/ma_staff, matching routeConfig.jsx's
// /board-papers route guard - this scope has no finer-grained per-action split.
const boardPaperRoles = authorise('report_preparer', 'management', 'ma_staff');

router.post(
    "/generate",
    authenticate, boardPaperRoles,
    boardpaperController.generateBoardPaper
);

router.get(
    "/",
    authenticate, boardPaperRoles,
    boardpaperController.getAllBoardPapers
);

router.get(
    "/:id",
    authenticate, boardPaperRoles,
    boardpaperController.getBoardPaperById
);

router.put(
    "/:id",
    authenticate, boardPaperRoles,
    boardpaperController.updateBoardPaper
);

router.delete(
    "/:id",
    authenticate, boardPaperRoles,
    boardpaperController.deleteBoardPaper
);

router.get(
    "/pdf/:id",
    authenticate, boardPaperRoles,
    boardpaperController.downloadPDF
);

module.exports = router;
