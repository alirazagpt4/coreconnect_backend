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
        allowNull: false,
        references: { model: 'Stores', key: 'id' }
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