import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ExpiryStockDetail = sequelize.define("ExpiryStockDetail", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    expiry_stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ExpiryStocks', key: 'id' },
        onDelete: 'CASCADE'
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ItemMasters', key: 'id' }
    },
    expiry_date: { // Calendar se jo date select hogi wo yahan save hogi
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    picture: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'ExpiryStockDetails'
});

export default ExpiryStockDetail;