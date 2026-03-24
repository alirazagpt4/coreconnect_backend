import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Channel = sequelize.define("Channel", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Taake "Al-Fatah" do baar add na ho sake
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'Channels'
});

export default Channel;