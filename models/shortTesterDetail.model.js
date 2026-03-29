import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ShortTesterDetail = sequelize.define("ShortTesterDetail", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    short_tester_id: { // Linked to ShortTester
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ShortTesters', key: 'id' },
        onDelete: 'CASCADE'
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ItemMasters', key: 'id' }
    }
}, {
    timestamps: true,
    tableName: 'ShortTesterDetails'
});

export default ShortTesterDetail;