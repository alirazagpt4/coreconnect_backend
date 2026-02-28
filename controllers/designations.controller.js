import {Designation} from "../models/associations.js"
export const getDesignations = async (req, res) => {
    try {
        const data = await Designation.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: "Designations fetch karne mein masla hua", error: err.message });
    }
};