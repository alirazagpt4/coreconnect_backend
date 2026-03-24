import { Channel } from '../models/associations.js'; // Apne path ke mutabiq check karein

export const getChannelsForDropdown = async (req, res) => {
    try {
        // Lead Engineer Tip: Sirf zaroori attributes mangwaein (Memory Optimization)
        const channels = await Channel.findAll({
            where: { is_active: true },
            attributes: ['id', 'name'],
            order: [['name', 'ASC']] // Alphabetical order for better UI/UX
        });

        if (!channels || channels.length === 0) {
            return res.status(404).json({ message: "No active channels found" });
        }

        return res.status(200).json(channels);
    } catch (error) {
        console.error("Dropdown Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};