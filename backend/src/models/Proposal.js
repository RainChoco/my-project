const { DataTypes } = require("sequelize");

const sequelize = require("../config/database");

const Proposal = sequelize.define(

    "Proposal",

    {

        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        boardPaperId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        proposalTitle: {
            type: DataTypes.STRING,
            allowNull: false
        },

        proposalType: {
            type: DataTypes.STRING,
            allowNull: false
        },

        language: {
            type: DataTypes.STRING,
            defaultValue: "English"
        },

        sections: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        executiveSummary: {
            type: DataTypes.TEXT
        },

        objectives: {
            type: DataTypes.TEXT
        },

        proposedSolution: {
            type: DataTypes.TEXT
        },

        implementationPlan: {
            type: DataTypes.TEXT
        },

        timeline: {
            type: DataTypes.TEXT
        },

        financialProposal: {
            type: DataTypes.TEXT
        },

        benefits: {
            type: DataTypes.TEXT
        },

        conclusion: {
            type: DataTypes.TEXT
        },

        aiConfidence: {
            type: DataTypes.INTEGER,
            defaultValue: 95
        },

        status: {
            type: DataTypes.STRING,
            defaultValue: "Generated"
        },

        generatedDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }

    },

    {

        tableName: "proposals",

        timestamps: true

    }

);

module.exports = Proposal;