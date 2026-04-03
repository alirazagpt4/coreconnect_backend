import { Interception } from '../models/associations.js';

export const createInterception = async (req, res) => {
    try {
        const { store_id, intercepted, converted, report_date } = req.body;
        const ba_user_id = req.user.id;

        const validatedStoreId = (store_id && store_id !== '') ? Number(store_id) : null;

        const newEntry = await Interception.create({
            report_date: report_date || new Date().toISOString().split('T')[0],
            intercepted,
            converted,
            ba_user_id,
            store_id:validatedStoreId
        });

        res.status(201).json({
            success: true,
            message: "Interceptions made successfully",
            data: newEntry
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};