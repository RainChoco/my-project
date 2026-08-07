const { DataTypes } = require("sequelize");

const sequelize = require("../config/database");

const HistoryEntry = sequelize.define(
    "HistoryEntry",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        type: {
            type: DataTypes.STRING,
            allowNull: false
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        entryData: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    },
    {
        tableName: "history_entries",
        timestamps: false
    }
);

module.exports = HistoryEntry;
