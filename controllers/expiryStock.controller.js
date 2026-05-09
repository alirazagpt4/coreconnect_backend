import { ExpiryStock, ExpiryStockDetail } from '../models/associations.js';
import sequelize from "../config/db.js";
import { Op } from 'sequelize';

export const createExpiryStock = async (req, res) => {
    // 1. Database Transaction Start
    const t = await sequelize.transaction();

    try {
        const ba_user_id = req.user.id;
        let { store_id, items } = req.body;
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

        if (!parsedItems || parsedItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "No items provided" });
        }

        const validatedStoreId = (store_id && store_id !== '') ? Number(store_id) : null;

        // --- IDEMPOTENCY CHECK: 60 Seconds Guard ---
        // Hum check kar rahe hain ke kya is BA ne is Store ke liye pichle 1 min mein report submit ki hai
        const duplicateCheck = await ExpiryStock.findOne({
            where: {
                ba_user_id: Number(ba_user_id),
                store_id: validatedStoreId,
                createdAt: {
                    [Op.gt]: new Date(Date.now() - 60000) // 60 Seconds window
                }
            },
            transaction: t // Transaction ke andar check karna behtar hai
        });

        if (duplicateCheck) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                message: "Duplicate report detected! Please wait 60 seconds before submitting expiry again for this store."
            });
        }
        // -------------------------------------------

        // 2. Create Master Record
        const master = await ExpiryStock.create({
            store_id: validatedStoreId,
            ba_user_id: Number(ba_user_id),
            report_date: new Date()
        }, { transaction: t });

        // 3. Prepare Details with Quantity and Pictures
        const detailsData = parsedItems.map((item, index) => {
            return {
                expiry_stock_id: master.id,
                item_id: item.item_id,
                expiry_date: item.expiry_date,
                quantity: item.quantity || 1,
                picture: req.files && req.files[index] ? `/uploads/${req.files[index].filename}` : null
            };
        });

        // 4. Bulk Insert Details
        await ExpiryStockDetail.bulkCreate(detailsData, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Expiry reported successfully" });

    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ Expiry Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};