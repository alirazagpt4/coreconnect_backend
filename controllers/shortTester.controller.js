import { ShortTester, ShortTesterDetail } from '../models/associations.js';
import sequelize from "../config/db.js";

export const createShortTesters = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const ba_user_id = req.user.id;
        const { store_id, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items selected for report." });
        }

        // 1. Create Master Record
        const master = await ShortTester.create({
            store_id,
            ba_user_id,
            report_date: new Date()
        }, { transaction: t });

        // 2. Prepare Details Data (Fixed Logic)
        const detailsData = items.map(item => ({
            short_tester_id: master.id,
            item_id: item.item_id // Yahan 'item.item_id' use karein
        }));

        // 3. Bulk Insert
        await ShortTesterDetail.bulkCreate(detailsData, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Short testers reported successfully" });

    } catch (error) {
        await t.rollback();
        console.error("Short Tester Report Error:", error);
        res.status(500).json({ success: false, message: "Failed to report short testers: " + error.message });
    }
};