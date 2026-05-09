import { ShortItem, ShortItemDetail } from "../models/associations.js";
import sequelize from "../config/db.js";
import { Op } from 'sequelize';

export const createShortItemsReport = async (req, res) => {
    const t = await sequelize.transaction();
    const ba_user_id = req.user.id;

    try {
        const { store_id, items } = req.body;

        if (!items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: "Short items ki list khali hai!" });
        }

        // --- IDEMPOTENCY GUARD: 60 Seconds Window ---
        // Check if this BA has reported short items for this store in the last minute
        const isDuplicate = await ShortItem.findOne({
            where: {
                ba_user_id: ba_user_id,
                store_id: store_id,
                createdAt: {
                    [Op.gt]: new Date(Date.now() - 60000) // 1 minute window
                }
            },
            transaction: t
        });

        if (isDuplicate) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                message: "A report for this store was already submitted 1 minute ago. Duplicate entry blocked."
            });
        }
        // --------------------------------------------

        // 1. ShortItem Master Entry (Header)
        const shortItemMaster = await ShortItem.create({
            store_id,
            ba_user_id: ba_user_id,
            report_date: new Date()
        }, { transaction: t });

        // 2. Short Item Details prepare karna
        const shortItemsPayload = items.map((item) => ({
            short_item_id: shortItemMaster.id,
            item_id: item.item_id,
            quantity: item.quantity
        }));

        // 3. Bulk Insert in Details Table
        await ShortItemDetail.bulkCreate(shortItemsPayload, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            message: "Short items report submitted successfully!",
            data: shortItemMaster
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ Short Item Error:", error);
        res.status(500).json({
            success: false,
            message: "Report submit karne mein masla aya",
            error: error.message
        });
    }
};