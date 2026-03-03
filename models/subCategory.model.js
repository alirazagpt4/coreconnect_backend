import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SubCategory = sequelize.define("SubCategory", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    subcategory_name: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            this.setDataValue('subcategory_name', value.trim());
        }
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Categories', // Parent table ka naam
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    timestamps: true,
    tableName: 'SubCategories'
});

export default SubCategory;