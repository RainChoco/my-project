const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BoardPaper = sequelize.define(
    "BoardPaper",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        tenderId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        purpose: {
            type: DataTypes.ENUM(
                "Information Only",
                "Approval Required",
                "Recommendation"
            ),
            allowNull: false
        },

        language: {
            type: DataTypes.STRING,
            defaultValue: "English"
        },

        executiveSummary: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        background: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        scopeOfWork: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        financialAnalysis: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        riskAssessment: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        recommendation: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        uploadedDocument: {
            type: DataTypes.STRING,
            allowNull: true
        },

        confidence: {
            type: DataTypes.INTEGER,
            defaultValue: 94
        },

        score: {
            type: DataTypes.STRING,
            defaultValue: "91 / 100"
        },

        finalRecommendation: {
            type: DataTypes.TEXT,
            defaultValue:
                "Proceed to Management Approval."
        },

        preparedBy: {
            type: DataTypes.STRING,
            defaultValue: "AI Summary Tool"
        },

        generatedBy: {
            type: DataTypes.STRING,
            defaultValue: "EM Services AI Platform"
        },

        status: {
            type: DataTypes.ENUM(
                "Draft",
                "Generated",
                "Approved",
                "Rejected"
            ),
            defaultValue: "Generated"
        }
    },
    {
        tableName: "board_papers",

        timestamps: true
    }
);

module.exports = BoardPaper;