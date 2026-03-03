import { SubCategory } from "../models/associations.js";

export const getSubByCategoryId = async (req, res) => {
    try {
        const { catId } = req.params; // Frontend se Category ID aaye gi
        const subCategories = await SubCategory.findAll({
            where: { category_id: catId },
            attributes: ['id', 'subcategory_name'],
            order: [['subcategory_name', 'ASC']]
        });
        res.status(200).json(subCategories);
    } catch (err) {
        res.status(500).json({ error: "Sub-Categories not found: " + err.message });
    }
};