import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ShortItemDetail = sequelize.define("ShortItemDetail", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    short_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ShortItems', key: 'id' },
        onDelete: 'CASCADE'
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ItemMasters', key: 'id' }
    }
}, {
    timestamps: true,
    tableName: 'ShortItemDetails'
});

export default ShortItemDetail;