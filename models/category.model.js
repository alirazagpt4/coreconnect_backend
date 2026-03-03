import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Category = sequelize.define("Category", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    category_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Taake "Skin Care" do baar register na ho sakay
        validate: {
            notEmpty: true
        }
    }
}, {
    timestamps: true,
    tableName: 'Categories'
});

export default Category;