import { ShortTester, ShortTesterDetail } from '../models/associations.js';
import sequelize from "../config/db.js";
import { Op } from 'sequelize';

export const createShortTesters = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const ba_user_id = req.user.id;
        const { store_id, items } = req.body;

        if (!items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "No items selected for report." });
        }

        // --- IDEMPOTENCY GUARD: 60 Seconds Window ---
        // Check if this user already reported short testers for this store in the last minute
        const duplicateCheck = await ShortTester.findOne({
            where: {
                ba_user_id,
                store_id,
                createdAt: {
                    [Op.gt]: new Date(Date.now() - 60000) // 1 minute window
                }
            },
            transaction: t
        });

        if (duplicateCheck) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                message: "Duplicate report detected. Please wait 60 seconds before resubmitting."
            });
        }
        // --------------------------------------------

        // 1. Create Master Record
        const master = await ShortTester.create({
            store_id,
            ba_user_id,
            report_date: new Date()
        }, { transaction: t });

        // 2. Prepare Details Data
        const detailsData = items.map(item => ({
            short_tester_id: master.id,
            item_id: item.item_id
        }));

        // 3. Bulk Insert
        await ShortTesterDetail.bulkCreate(detailsData, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Short testers reported successfully" });

    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ Short Tester Report Error:", error);
        res.status(500).json({ success: false, message: "Failed to report: " + error.message });
    }
};