const express = require('express');
const router = express.Router();
const boardpaperController = require("../../../../my-project/backend/src/controllers/boardPaperController");

// Calista (Scope C): Board paper generation endpoints.
// See design/calista/api-documentation.md for the routes to add here.

router.post(
    "/",
    boardpaperController.generateBoardPaper
);

router.get(
    "/",
    boardpaperController.getAllBoardPapers
);

router.get(
    "/:id",
    boardpaperController.getBoardPaperById
);

router.put(
    "/:id",
    boardpaperController.updateBoardPaper
);

router.delete(
    "/:id",
    boardpaperController.deleteBoardPaper
);

router.get(
    "/pdf/:id",
    boardpaperController.downloadPDF
);

module.exports = router;
