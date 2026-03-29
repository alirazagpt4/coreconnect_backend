import { ExpiryStock, ExpiryStockDetail } from '../models/associations.js';
import sequelize from "../config/db.js";

export const createExpiryStock = async (req, res) => {
    console.log("Body:", req.body); // Check karein kya aa raha hai
    console.log("File:", req.file);
    const t = await sequelize.transaction();
    try {
        const ba_user_id = req.user.id;

        // 1. Multipart form-data handle karna
        // Jab hum images bhejte hain, toh body aksar string ban jati hai
        let { store_id, items } = req.body;
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

        if (!parsedItems || parsedItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "No items provided" });
        }

        // 2. Create Master Record
        const master = await ExpiryStock.create({
            store_id,
            ba_user_id,
            report_date: new Date()
        }, { transaction: t });

        // 3. Prepare Details with Quantity and Pictures
        const detailsData = parsedItems.map((item, index) => {
            return {
                expiry_stock_id: master.id,
                item_id: item.item_id,
                expiry_date: item.expiry_date,
                quantity: item.quantity || 1, // Naya column
                // Agar Multer use kar rahe hain toh req.files mein images hongi
                picture: req.files && req.files[index] ? req.files[index].path : null
            };
        });

        // 4. Bulk Insert Details
        await ExpiryStockDetail.bulkCreate(detailsData, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, message: "Expiry reported successfully with images" });

    } catch (error) {
        await t.rollback();
        console.error("Expiry Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};