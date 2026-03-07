import { Sequelize } from 'sequelize'; // Ye import zaroori hai
import { User, City, Region, Designation } from "../models/associations.js";

// 1. Get All Cities (Unique by Name)
export const getCities = async (req, res) => {
    try {
        const data = await City.findAll({
            // Hum Group By use kar rahe hain taake duplicate Names khatam ho jayein
            attributes: [
                [Sequelize.fn('MIN', Sequelize.col('id')), 'id'], // Pehli ID uthayega
                'name'
            ],
            group: ['name'], // Name ki bunyaad par grouping karega
            order: [['name', 'ASC']]
        });

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            message: "Cities fetch issue ",
            error: err.message
        });
    }
};