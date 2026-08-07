const HistoryEntry = require("../models/HistoryEntry");
const BoardPaper = require("../models/BoardPaper");
const Proposal = require("../models/Proposal");

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

// Deletes a history entry AND the underlying Board Paper/Proposal it points
// to, so removing an item from History also removes it everywhere it's
// referenced (e.g. the Proposal Generator's "Select Board Paper" dropdown).
exports.deleteHistoryEntry = async (req, res) => {
    try {
        const historyEntry = await HistoryEntry.findByPk(req.params.id);

        if (!historyEntry) {
            return res.status(404).json({
                message: "History entry not found."
            });
        }

        const entryData = historyEntry.entryData || {};

        if (historyEntry.type === "Board Paper") {
            const boardPaperId = entryData.boardPaperId ?? entryData.report?.id;
            if (boardPaperId) {
                await BoardPaper.destroy({ where: { id: boardPaperId } });
            }
        } else if (historyEntry.type === "Proposal") {
            const proposalId = entryData.proposalId ?? entryData.proposal?.id;
            if (proposalId) {
                await Proposal.destroy({ where: { id: proposalId } });
            }
        }

        await historyEntry.destroy();

        res.json({
            message: "History entry deleted successfully."
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to delete history entry."
        });
    }
};
