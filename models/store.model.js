import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Channel from "./channel.model.js";

const Store = sequelize.define("Store", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    store_name: { type: DataTypes.STRING, allowNull: false },
    area: {
        type: DataTypes.STRING,
        allowNull: true, // Ya false agar har store ka area lazmi chahiye
    },
    // Nayi Field: Channel Linking
    channel_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Channels',
            key: 'id'
        }
    },
    city_id: { type: DataTypes.INTEGER, allowNull: false },
    region_id: { type: DataTypes.INTEGER, allowNull: false },
    ba_user_id: { type: DataTypes.INTEGER, allowNull: true },
    ba_user_id_2: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    supervisor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    targets: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    poc: { type: DataTypes.STRING, allowNull: true },
    store_manager_name: { type: DataTypes.STRING, allowNull: true },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, { timestamps: true, tableName: 'Stores' });

export default Store;