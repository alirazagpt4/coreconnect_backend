import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Store = sequelize.define("Store", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    store_name: { type: DataTypes.STRING, allowNull: false },
    area: {
        type: DataTypes.STRING,
        allowNull: true, // Ya false agar har store ka area lazmi chahiye
    },
    city_id: { type: DataTypes.INTEGER, allowNull: false },
    region_id: { type: DataTypes.INTEGER, allowNull: false },
    ba_user_id: { type: DataTypes.INTEGER, allowNull: true },
    targets: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    poc: { type: DataTypes.STRING, allowNull: true },
    store_manager_name: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true, tableName: 'Stores' });

export default Store;