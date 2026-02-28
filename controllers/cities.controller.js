import { User, City, Region, Designation } from "../models/associations.js";

// 1. Get All Cities (id and name only)
export const getCities = async (req, res) => {
    try {
        const data = await City.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']] // Alphabetical order mein behtar lagta hai
        });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: "Cities fetch karne mein masla hua", error: err.message });
    }
};