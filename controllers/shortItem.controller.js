import { ShortItem, ShortItemDetail } from "../models/associations.js"; 
import sequelize from "../config/db.js"; 

export const createShortItemsReport = async (req, res) => {
    // Transaction start kar rahe hain
    const t = await sequelize.transaction();
    const ba_user_id = req.user.id; // Login user ki ID

    try {
        const { store_id, items } = req.body;

        // Validation: List khali nahi honi chahiye
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Short items ki list khali hai!" });
        }

        // 1. ShortItem Master Entry (Header)
        const shortItemMaster = await ShortItem.create({
            store_id,
            ba_user_id: ba_user_id,
            report_date: new Date() // Aaj ki date
        }, { transaction: t });

        // 2. Short Item Details prepare karna
        // Ismein quantity aur price nahi hai, sirf item_id hai
        const shortItemsPayload = items.map((item) => ({
            short_item_id: shortItemMaster.id,
            item_id: item.item_id,
            quantity:item.quantity
        }));

        // 3. Bulk Insert in Details Table
        await ShortItemDetail.bulkCreate(shortItemsPayload, { transaction: t });

        // Sab set hai toh commit kar do
        await t.commit();

        res.status(201).json({
            success: true,
            message: "Short items report submitted successfully!",
            data: shortItemMaster
        });

    } catch (error) {
        // Agar kahin bhi error aye toh rollback (database purani halat mein wapas)
        await t.rollback();
        console.error("Short Item Error:", error);
        res.status(500).json({
            success: false,
            message: "Report submit karne mein masla aya",
            error: error.message
        });
    }
};