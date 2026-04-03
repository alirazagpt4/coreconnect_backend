import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ExpiryStock = sequelize.define("ExpiryStock", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    store_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // ISKO TRUE KARO
        references: {
            model: 'Stores',
            key: 'id'
        },
        onDelete: 'SET NULL' // Agar store delete ho jaye toh report delete na ho
    },
    ba_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    report_date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'ExpiryStocks'
});

export default ExpiryStock;