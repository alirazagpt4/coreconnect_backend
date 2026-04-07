import { Store, City, Region, User, Channel, Designation } from "../models/associations.js";
import { Op } from "sequelize";

// 1. Create New Store
export const createStore = async (req, res) => {
    const { store_name, area, city_id, region_id, ba_user_id, ba_user_id_2, targets, poc, store_manager_name, channel_id, supervisor_id } = req.body;
    try {
        if (!store_name || !city_id || !region_id) {
            return res.status(400).json({ message: "Store Name, City  and Region are required!" });
        }

        if (ba_user_id && ba_user_id_2 && ba_user_id === ba_user_id_2) {
            return res.status(400).json({ message: "both BAs are same!" });
        }


        // --- ADDED VALIDATION FOR CREATE ---
        if (ba_user_id) {
            const busyBA1 = await checkBAAvailability(ba_user_id);
            if (busyBA1) return res.status(400).json({ message: `BA 1 is already in store "${busyBA1.store_name}".` });
        }
        if (ba_user_id_2) {
            const busyBA2 = await checkBAAvailability(ba_user_id_2);
            if (busyBA2) return res.status(400).json({ message: `BA 2 is already in store "${busyBA2.store_name}."` });
        }
        // ------------------------------------

        const store = await Store.create({
            store_name, area, city_id, region_id, ba_user_id: ba_user_id || null,
            ba_user_id_2: ba_user_id_2 || null, targets, poc, store_manager_name, channel_id, supervisor_id
        });

        res.status(201).json({ message: "Store Created Successfully", store });
    } catch (err) {
        res.status(500).json({ message: "Error creating store", error: err.message });
    }
};

// 2. Get All Stores with Pagination & Search
export const getAllStores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const { count, rows } = await Store.findAndCountAll({
            where: {
                store_name: { [Op.like]: `%${search}%` }
            },
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Channel, as: 'channel', attributes: ['name'] },
                { model: City, as: 'city', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                { model: User, as: 'beauty_advisor', attributes: ['id', 'name', 'fullname'] },
                { model: User, as: 'beauty_advisor_2', attributes: ['id', 'name', 'fullname'] },
                { model: User, as: 'supervisor', attributes: ['id', 'name', 'fullname'] }
            ]
        });

        res.status(200).json({
            success: true,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            stores: rows
        });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};


// Helper to check if BA is already busy elsewhere
const checkBAAvailability = async (userId, currentStoreId = null) => {
    if (!userId) return null; // Agar None hai toh skip

    const existingAssignment = await Store.findOne({
        where: {
            [Op.or]: [
                { ba_user_id: userId },
                { ba_user_id_2: userId }
            ],
            // Update ke waqt apne hi store ko check nahi karna
            ...(currentStoreId && { id: { [Op.ne]: currentStoreId } })
        }
    });

    return existingAssignment;
};

// 3. Update Store
export const updateStore = async (req, res) => {
    const { id } = req.params;

    // 1. Destructure values from body first!
    const { ba_user_id, ba_user_id_2 } = req.body;

    try {
        const store = await Store.findByPk(id);
        if (!store) return res.status(404).json({ message: "Store not found!" });

        // 2. Logic Check: Same BA in both slots
        if (ba_user_id && ba_user_id_2 && ba_user_id === ba_user_id_2) {
            return res.status(400).json({ message: "Primary aur Secondary BA same nahi ho sakte!" });
        }

        // 3. Helper Function Calls: Check if BAs are busy in OTHER stores
        if (ba_user_id) {
            const busyBA1 = await checkBAAvailability(ba_user_id, id);
            if (busyBA1) {
                return res.status(400).json({
                    message: `BA 1 is already in store "${busyBA1.store_name}".`
                });
            }
        }

        if (ba_user_id_2) {
            const busyBA2 = await checkBAAvailability(ba_user_id_2, id);
            if (busyBA2) {
                return res.status(400).json({
                    message: `BA 2 is already in store "${busyBA2.store_name}."`
                });
            }
        }

        // 4. Clean Data for Update (None/Remove Logic)
        const dataToUpdate = {
            ...req.body,
            // Agar empty string ya zero aye toh null set ho jaye
            ba_user_id: ba_user_id || null,
            ba_user_id_2: ba_user_id_2 || null,
            supervisor_id: req.body.supervisor_id || null
        };

        await store.update(dataToUpdate);

        // 5. Refresh data with all associations
        await store.reload({
            include: [
                { model: City, as: 'city', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                { model: User, as: 'beauty_advisor', attributes: ['id', 'name', 'fullname'] },
                { model: User, as: 'beauty_advisor_2', attributes: ['id', 'name', 'fullname'] },
                { model: User, as: 'supervisor', attributes: ['id', 'name', 'fullname'] }
            ]
        });

        res.status(200).json({ message: "Store Updated Successfully", store });
    } catch (err) {
        res.status(500).json({ message: "Update Error", error: err.message });
    }
};

// 4. Delete Store
export const deleteStore = async (req, res) => {
    const { id } = req.params;
    try {
        const store = await Store.findByPk(id);
        if (!store) return res.status(404).json({ message: "Store not found!" });

        await store.destroy();
        res.status(200).json({ message: "Store Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete Error", error: err.message });
    }
};



// store.controller.js
export const getSupervisorStores = async (req, res) => {
    try {
        const { supervisor_id } = req.params;

        console.log("DEBUG: Received Supervisor ID:", supervisor_id);

        const stores = await Store.findAll({
            where: { supervisor_id: supervisor_id, is_active: true },
            attributes: ['id', 'store_name', 'area'], // Light weight data for mobile
            order: [['store_name', 'ASC']]
        });

        res.status(200).json({ success: true, data: stores });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};