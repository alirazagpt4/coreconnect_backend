import { Sale, SaleItem } from "../models/associations.js";
import sequelize from "../config/db.js";
import { Op } from "sequelize"; // 1. Lazmi import karein

export const createSale = async (req, res) => {
    // Transaction handle bahar rakhein taake catch block ko access mile
    const t = await sequelize.transaction();
    const ba_user_id = req.user.id;

    try {
        const { store_id, total_amount, items } = req.body;

        // Validation Check
        if (!items || items.length === 0) {
            await t.rollback(); // Hamesha rollback pehle
            return res.status(400).json({ message: "Item list cannot be empty!" });
        }

        // 2. DUPLICATION CHECK (The 60-Second Window)
        // Check if the same BA recently submitted the exact same sale amount
        const recentSale = await Sale.findOne({
            where: {
                ba_user_id,
                store_id,
                total_amount,
                createdAt: {
                    [Op.gt]: new Date(new Date() - 60 * 1000) // Last 60 seconds
                }
            }
        });

        if (recentSale) {
            await t.rollback();
            // 409 Conflict: Jab duplicate request aati hai
            return res.status(409).json({
                success: false,
                message: "Duplicate sale detected. Please wait a minute before submitting again."
            });
        }

        // 3. Sale Master Entry
        const sale = await Sale.create({
            store_id,
            ba_user_id,
            total_amount
        }, { transaction: t });

        // 4. Payload Preparation (Logic isolation)
        const saleItemsPayload = items.map((item) => ({
            sale_id: sale.id,
            item_id: item.item_id,
            quantity: item.quantity,
            price: item.price,
            subtotal: parseFloat(item.quantity) * parseFloat(item.price)
        }));

        // 5. Bulk Insert
        await SaleItem.bulkCreate(saleItemsPayload, { transaction: t });

        // Final Commit
        await t.commit();

        return res.status(201).json({
            success: true,
            message: "Sale created successfully!",
            data: sale
        });

    } catch (error) {
        // Safe Rollback: Check karein ke transaction active hai ya nahi
        if (t) await t.rollback();

        console.error("CRITICAL SALE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during sale processing.",
            error: error.message
        });
    }
};


// --- v2: Idempotency-key based duplicate protection ---
// Client generates idempotency_key once per "Submit Sale" tap (e.g. a UUID) and
// resends the SAME key on retry (network timeout, app crash, etc). Unlike the
// 60-second/amount heuristic in createSale, this can't false-positive on two
// legitimately different sales, and the DB unique constraint (not just the
// findOne check below) makes it safe against two requests racing in at once.
export const createSaleWithIdempotency = async (req, res) => {
    const t = await sequelize.transaction();
    const ba_user_id = req.user.id;

    try {
        const { store_id, total_amount, items, idempotency_key } = req.body;

        if (!idempotency_key) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "idempotency_key is required" });
        }

        if (!items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Item list cannot be empty!" });
        }

        // 1. Replay check: has this exact submission already been processed?
        const existingSale = await Sale.findOne({
            where: { idempotency_key },
            include: [{ model: SaleItem, as: 'items' }]
        });

        if (existingSale) {
            await t.rollback();
            return res.status(200).json({
                success: true,
                message: "Sale already processed (replayed request).",
                data: existingSale
            });
        }

        // 2. Sale Master Entry
        let sale;
        try {
            sale = await Sale.create({
                store_id,
                ba_user_id,
                total_amount,
                idempotency_key
            }, { transaction: t });
        } catch (err) {
            // Race: another request with the same key committed between our findOne
            // above and this insert. The unique constraint catches it here instead
            // of letting a duplicate through — return the record that won the race.
            if (err.name === 'SequelizeUniqueConstraintError') {
                await t.rollback();
                const winningSale = await Sale.findOne({
                    where: { idempotency_key },
                    include: [{ model: SaleItem, as: 'items' }]
                });
                return res.status(200).json({
                    success: true,
                    message: "Sale already processed (replayed request).",
                    data: winningSale
                });
            }
            throw err;
        }

        // 3. Payload Preparation
        const saleItemsPayload = items.map((item) => ({
            sale_id: sale.id,
            item_id: item.item_id,
            quantity: item.quantity,
            price: item.price,
            subtotal: parseFloat(item.quantity) * parseFloat(item.price)
        }));

        // 4. Bulk Insert
        await SaleItem.bulkCreate(saleItemsPayload, { transaction: t });

        await t.commit();

        return res.status(201).json({
            success: true,
            message: "Sale created successfully!",
            data: sale
        });

    } catch (error) {
        if (t) await t.rollback();

        console.error("CRITICAL SALE ERROR (v2):", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during sale processing.",
            error: error.message
        });
    }
};