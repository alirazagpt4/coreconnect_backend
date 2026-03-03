import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ItemMaster = sequelize.define("ItemMaster", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    item_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Aik code do items ka nahi ho sakta
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Categories', key: 'id' }
    },
    subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'SubCategories', key: 'id' }
    },
    retail_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00 // Percentage (%) mein value deni hai
    },
    price_after_discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'ItemMasters',
    hooks: {
        // Calculation Logic: Save hone se pehle khud hi chalay ga
        beforeSave: (item) => {
            const retail = parseFloat(item.retail_price) || 0;
            const disc = parseFloat(item.discount) || 0;
            // Formula: Price - (Price * Discount / 100)
            item.price_after_discount = retail - (retail * (disc / 100));
        }
    }
});

export default ItemMaster;