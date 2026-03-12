import { Op } from "sequelize"; // Search logic ke liye
import { ItemMaster, Category, SubCategory } from "../models/associations.js";

// --- 1. CREATE ITEM ---
export const createItem = async (req, res) => {
    try {
        const { item_code, product_name, category_id, subcategory_id, retail_price, discount } = req.body;

        const existingItem = await ItemMaster.findOne({ where: { item_code } });
        if (existingItem) return res.status(400).json({ error: "Item Code already exists!" });

        const newItem = await ItemMaster.create({
            item_code, product_name, category_id, subcategory_id, retail_price, discount
        });
        res.status(201).json(newItem);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- 2. GET ALL ITEMS (With Search & Pagination) ---
export const getAllItems = async (req, res) => {
    try {
        let { page, limit, search, category_id, subcategory_id, item_id } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        // Base where object
        let whereCondition = {};

        // 1. Search Filter (Product Name ya Item Code par)
        if (search) {
            whereCondition[Op.or] = [
                { product_name: { [Op.like]: `%${search}%` } },
                { item_code: { [Op.like]: `%${search}%` } }
            ];
        }

        // 2. Category Filter
        if (category_id) {
            whereCondition.category_id = category_id;
        }

        // 3. SubCategory Filter
        if (subcategory_id) {
            whereCondition.subcategory_id = subcategory_id;
        }

        // 4. Specific Item Filter (Table ki primary 'id' column)
        if (item_id) {
            whereCondition.id = item_id;
        }

        const { count, rows } = await ItemMaster.findAndCountAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
            include: [
                { model: Category, as: 'category', attributes: ['category_name'] },
                { model: SubCategory, as: 'subcategory', attributes: ['subcategory_name'] }
            ],
            order: [['id', 'ASC']] // Image ke mutabiq ID wise sorting sahi rahegi
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            items: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// --- 3.ITEM BY SUB CAT ---
export const getItemsBySubCategory = async (req, res) => {
    try {
        const { subcategory_id } = req.params;
        const items = await ItemMaster.findAll({
            where: { subcategory_id },
            attributes: ['id', 'product_name', 'item_code', 'retail_price', 'discount', 'price_after_discount'] // Price zaroori hai frontend ke liye
        });
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 4. UPDATE ITEM ---
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ItemMaster.findByPk(id);

        if (!item) return res.status(404).json({ error: "Item not found!" });

        // Update karein (Hook automatically Price calculate kar lega)
        await item.update(req.body);

        res.status(200).json({ message: "Item updated successfully!", item });
    } catch (err) { res.status(500).json({ error: err.message }); }
};



// --- 5. DELETE ITEM ---
export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ItemMaster.findByPk(id);

        if (!item) {
            return res.status(404).json({ error: "Bawa ji, ye item pehle hi gayab hai!" });
        }

        await item.destroy();
        res.status(200).json({ message: "Item successfully delete ho gaya!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
