const BoardPaper = require("../models/BoardPaper");
const HistoryEntry = require("../models/HistoryEntry");
const { calculateBoardPaperConfidence } = require("../services/confidenceService");
const { generateBoardPaperNarrative } = require("../services/aiBoardPaperService");

exports.generateBoardPaper = async (req, res) => {
    try {
        const {
            tenderId,
            title,
            purpose,
            preparedBy
        } = req.body;

        if (!tenderId) {
            return res.status(400).json({
                message: "Tender is required."
            });
        }

        const { confidence, tender } = await calculateBoardPaperConfidence(tenderId);
        const narrative = await generateBoardPaperNarrative({ tender, confidence, title, purpose });

        const boardPaper = await BoardPaper.create({
            tenderId,
            title,
            purpose,
            language: "English",
            executiveSummary: true,
            background: true,
            scopeOfWork: true,
            financialAnalysis: true,
            riskAssessment: true,
            recommendation: true,
            confidence,
            score: `${confidence} / 100`,
            finalRecommendation: narrative.aiRecommendation || "Proceed to Management Approval.",
            aiSummary: narrative.aiSummary,
            aiFinancialAnalysis: narrative.aiFinancialAnalysis,
            aiRiskAssessment: narrative.aiRiskAssessment,
            aiRecommendation: narrative.aiRecommendation,
            aiConfidenceText: narrative.aiConfidenceText,
            aiRiskLevel: narrative.aiRiskLevel,
            preparedBy,
            generatedBy: "EM Services AI Platform",
            status: "Generated"
        });

        await HistoryEntry.create({
            type: "Board Paper",
            title: boardPaper.title || "Untitled Board Paper",
            createdAt: boardPaper.createdAt || new Date(),
            entryData: {
                boardPaperId: boardPaper.id,
                report: {
                    ...(boardPaper.toJSON ? boardPaper.toJSON() : boardPaper),
                    tenderLabel: tender.tender_ref_no
                }
            }
        });

        return res.status(201).json({
            message: "Board Paper generated successfully.",
            report: boardPaper
        });
    }
    catch (error) {
        console.error('BoardPaper generate error:', error);
        res.status(error.status || 500).json({
            message: error.message || "Unable to generate board paper."
        });
    }
};





exports.getAllBoardPapers = async (req, res) => {

    try {

        const reports = await BoardPaper.findAll({

            order: [

                ["createdAt", "DESC"]

            ]

        });


        res.json(reports);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to retrieve board papers."

        });

    }

};





exports.getBoardPaperById = async (req, res) => {

    try {

        const report = await BoardPaper.findByPk(

            req.params.id

        );


        if (!report) {

            return res.status(404).json({

                message: "Board Paper not found."

            });

        }


        res.json(report);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to retrieve board paper."

        });

    }

};





exports.updateBoardPaper = async (req, res) => {

    try {

        const report = await BoardPaper.findByPk(

            req.params.id

        );


        if (!report) {

            return res.status(404).json({

                message: "Board Paper not found."

            });

        }


        await report.update(req.body);


        res.json({

            message: "Board Paper updated successfully.",

            report

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to update board paper."

        });

    }

};





exports.deleteBoardPaper = async (req, res) => {

    try {

        const report = await BoardPaper.findByPk(

            req.params.id

        );


        if (!report) {

            return res.status(404).json({

                message: "Board Paper not found."

            });

        }


        await report.destroy();


        res.json({

            message: "Board Paper deleted successfully."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to delete board paper."

        });

    }

};





exports.downloadPDF = async (req, res) => {

    try {

        const report = await BoardPaper.findByPk(

            req.params.id

        );


        if (!report) {

            return res.status(404).json({

                message: "Board Paper not found."

            });

        }



        res.json({

            message: "PDF generation coming soon."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to generate PDF."

        });

    }

};  