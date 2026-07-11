const Proposal = require("../models/Proposal");



exports.generateProposal = async (req, res) => {

    try {

        const {
            boardPaperId,
            proposalTitle,
            proposalType,
            language,
            sections
        } = req.body;

        const proposal = await Proposal.create({

            boardPaperId,

            proposalTitle,

            proposalType,

            language,

            sections,

            status: "Generated",

            generatedDate: new Date()

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

        if (!proposal) {

            return res.status(404).json({

                message: "Proposal not found."

            });

        }

        await proposal.destroy();

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