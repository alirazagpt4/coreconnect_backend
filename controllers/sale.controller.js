import { Sale, SaleItem } from "../models/associations.js"; // Sirf Models yahan se
import sequelize from "../config/db.js"; // Connection instance yahan se

export const createSale = async (req, res) => {
    // Transaction direct connection se start ho rahi hai
    const t = await sequelize.transaction();
    const ba_user_id = req.user.id;

    try {
        const { store_id , total_amount, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "list is empty!" });
        }

        // 1. Sale Master Entry
        const sale = await Sale.create({
            store_id,
            ba_user_id:ba_user_id,
            total_amount
        }, { transaction: t });

        // 2. Sale Items prepare karna
        const saleItemsPayload = items.map((item) => ({
            sale_id: sale.id,
            item_id: item.item_id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
        }));

        // 3. Bulk Insert
        await SaleItem.bulkCreate(saleItemsPayload, { transaction: t });

        // Sab set hai toh commit
        await t.commit();

        res.status(201).json({
            success: true,
            message: "Sale created successfully!",
            data: sale
        });

    } catch (error) {
        // Masla hua toh rollback
        await t.rollback();
        console.error("Sale Error:", error);
        res.status(500).json({
            success: false,
            message: "Sale fail ho gayi",
            error: error.message
        });
    }
};