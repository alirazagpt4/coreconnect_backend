
import * as Models from '../models/associations.js';

export const toggleActiveStatus = async (req, res) => {
    try {
        const { modelName, id } = req.body;
        console.log("Searching for Model:", modelName, "with ID:", id);

        const TargetModel = Models[modelName];

        if (!TargetModel) {
            return res.status(400).json({
                success: false,
                debug_models: Object.keys(Models), // Yeh aapko bata dega backend ke pas kon kon se models hain
                message: `Model '${modelName}' nahi mila!`
            });
        }

        const record = await TargetModel.findByPk(id);

        if (!record) {
            // Yahan message change karein taake confirm ho ke NAYA code chal raha hai
            return res.status(404).json({
                success: false,
                message: `DATABASE ERROR: ${modelName} with ID ${id} nahi mila!`
            });
        }

        record.is_active = !record.is_active;
        await record.save();

        res.json({ success: true, is_active: record.is_active });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};