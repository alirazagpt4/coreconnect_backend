import { Interception } from '../models/associations.js';
import { Op } from 'sequelize';

export const createInterception = async (req, res) => {
    try {
        const { store_id, intercepted, converted, report_date } = req.body;
        const ba_user_id = req.user.id;

        const validatedStoreId = (store_id && store_id !== '') ? Number(store_id) : null;

        // --- IDEMPOTENCY CHECK: 60 Seconds Window ---
        const duplicateCheck = await Interception.findOne({
            where: {
                ba_user_id,
                store_id: validatedStoreId,
                // Pichle 60 seconds (60,000 milliseconds) ka check
                createdAt: {
                    [Op.gt]: new Date(Date.now() - 60000)
                }
            }
        });

        if (duplicateCheck) {
            return res.status(409).json({
                success: false,
                message: "Duplicate interception detected! Please wait 1 minute before submitting again."
            });
        }
        // --------------------------------------------

        const newEntry = await Interception.create({
            report_date: report_date || new Date().toISOString().split('T')[0],
            intercepted,
            converted,
            ba_user_id,
            store_id: validatedStoreId
        });

        res.status(201).json({
            success: true,
            message: "Interceptions made successfully",
            data: newEntry
        });

    } catch (error) {
        console.error("❌ Interception Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};