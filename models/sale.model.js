import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Sale = sequelize.define("Sale", {
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
    total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    sale_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'Sales'
});

export default Sale;