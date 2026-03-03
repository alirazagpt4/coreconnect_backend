import { Category } from "../models/associations.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'category_name'],
            order: [['category_name', 'ASC']]
        });
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: "Categories not found: " + err.message });
    }
};