const Proposal = require("../models/Proposal");
const HistoryEntry = require("../models/HistoryEntry");
const BoardPaper = require("../models/BoardPaper");
const Tender = require("../models/tender");
const { generateProposalDraft } = require("../services/proposalAiService");



exports.generateProposal = async (req, res) => {

    try {

        const {
            boardPaperId,
            proposalTitle,
            proposalType,
            language,
            sections,
            selectedReportSections
        } = req.body;

        let resolvedBoardPaperId = boardPaperId;

        if (!resolvedBoardPaperId) {
            const latestBoardPaper = await BoardPaper.findOne({
                order: [["createdAt", "DESC"]]
            });

            resolvedBoardPaperId = latestBoardPaper?.id || null;
        }

        if (!resolvedBoardPaperId) {
            return res.status(400).json({
                message: "Unable to create proposal because no board paper is available."
            });
        }

        const boardPaper = await BoardPaper.findByPk(resolvedBoardPaperId);
        const tender = boardPaper?.tenderId ? await Tender.findByPk(boardPaper.tenderId) : null;
        const boardPaperPayload = boardPaper ? {
            ...(boardPaper.toJSON ? boardPaper.toJSON() : boardPaper),
            aiSummary: `The board paper titled \"${boardPaper.title}\" recommends ${boardPaper.finalRecommendation || 'proceeding with the approved action'}.`,
            aiRecommendation: boardPaper.finalRecommendation || "Proceed to Management Approval."
        } : null;
        const generatedDraft = generateProposalDraft({
            boardPaper: boardPaperPayload,
            tender: tender ? tender.toJSON ? tender.toJSON() : tender : null,
            selectedReportSections
        });

        const finalProposalTitle = proposalTitle || generatedDraft.proposalTitle;
        const finalProposalType = proposalType || generatedDraft.proposalType;
        const finalSections = { ...generatedDraft.sections };

        const proposal = await Proposal.create({

            boardPaperId: resolvedBoardPaperId,

            proposalTitle: finalProposalTitle,

            proposalType: finalProposalType,

            language,

            sections: finalSections,

            status: "Generated",

            generatedDate: new Date()

        });

        await HistoryEntry.create({
            type: "Proposal",
            title: finalProposalTitle || "Untitled Proposal",
            createdAt: proposal.generatedDate || new Date(),
            entryData: {
                proposalId: proposal.id,
                proposal: proposal.toJSON ? proposal.toJSON() : proposal
            }
        });

        res.status(201).json({

            message: "Proposal generated successfully.",

            proposal

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to generate proposal."

        });

    }

};



exports.getAllProposals = async (req, res) => {

    try {

        const proposals = await Proposal.findAll({

            order: [["generatedDate", "DESC"]]

        });

        res.json(proposals);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to retrieve proposal history."

        });

    }

};



exports.getHistoryEntries = async (req, res) => {

    try {

        const historyEntries = await HistoryEntry.findAll({
            order: [["createdAt", "DESC"]]
        });

        res.json(historyEntries);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to retrieve history entries."

        });

    }

};



exports.getProposalById = async (req, res) => {

    try {

        const proposal = await Proposal.findByPk(req.params.id);

        if (!proposal) {

            return res.status(404).json({

                message: "Proposal not found."

            });

        }

        res.json(proposal);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to retrieve proposal."

        });

    }

};



exports.updateProposal = async (req, res) => {

    try {

        const proposal = await Proposal.findByPk(req.params.id);

        if (!proposal) {

            return res.status(404).json({

                message: "Proposal not found."

            });

        }

        await proposal.update(req.body);

        res.json({

            message: "Proposal updated successfully.",

            proposal

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to update proposal."

        });

    }

};



exports.deleteProposal = async (req, res) => {

    try {

        const proposal = await Proposal.findByPk(req.params.id);
        const historyEntries = await HistoryEntry.findAll();
        const targetId = String(req.params.id);
        const matchingHistoryEntries = historyEntries.filter((entry) => {
            const entryData = entry?.entryData || {};
            const candidateIds = [
                entry.id,
                entryData.proposalId,
                entryData.proposal?.id
            ];

            return candidateIds.some((candidateId) => String(candidateId) === targetId);
        });

        if (!proposal && matchingHistoryEntries.length === 0) {
            return res.status(404).json({
                message: "Proposal not found"
            });
        }

        if (proposal) {
            await proposal.destroy();
        }

        if (matchingHistoryEntries.length > 0) {
            await HistoryEntry.destroy({
                where: {
                    id: matchingHistoryEntries.map((entry) => entry.id)
                }
            });
        }

        res.json({

            message: "Proposal deleted successfully."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to delete proposal."

        });

    }

};


exports.deleteHistoryEntry = async (req, res) => {
    try {
        const entryId = req.params.id;

        const historyEntry = await HistoryEntry.findByPk(entryId);

        if (!historyEntry) {
            return res.status(404).json({ message: "History entry not found." });
        }

        await HistoryEntry.destroy({ where: { id: historyEntry.id } });

        res.json({ message: "History entry deleted successfully." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to delete history entry." });
    }
};


exports.downloadPDF = async (req, res) => {

    try {

        const proposal = await Proposal.findByPk(req.params.id);

        if (!proposal) {

            return res.status(404).json({

                message: "Proposal not found."

            });

        }

        res.json({

            message: "PDF generation will be connected later.",

            proposal

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to generate PDF."

        });

    }

};



exports.downloadDOCX = async (req, res) => {

    try {

        const proposal = await Proposal.findByPk(req.params.id);

        if (!proposal) {

            return res.status(404).json({

                message: "Proposal not found."

            });

        }

        res.json({

            message: "DOCX generation will be connected later.",

            proposal

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Unable to generate DOCX."

        });

    }

};