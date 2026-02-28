import {Region} from "../models/associations.js";
export const getRegions = async (req, res) => {
    try {
        const data = await Region.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: "Regions fetch karne mein masla hua", error: err.message });
    }
};