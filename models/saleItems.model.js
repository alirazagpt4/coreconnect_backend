import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SaleItem = sequelize.define("SaleItem", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Sales', key: 'id' }
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ItemMasters', key: 'id' }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // Sale ke waqt ki net price yahan save hogi
    },
    subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'SaleItems',
    hooks: {
        beforeSave: (saleItem) => {
            // Subtotal khud calculate kar lega: Qty * Price
            const qty = parseInt(saleItem.quantity) || 0;
            const price = parseFloat(saleItem.price) || 0;
            saleItem.subtotal = qty * price;
        }
    }
});

export default SaleItem;