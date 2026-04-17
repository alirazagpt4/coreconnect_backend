import { Store, City, Region, User, Channel, Designation } from "../models/associations.js";
import { Op } from "sequelize";


// 1. Create New Store
export const createStore = async (req, res) => {
    const {
        store_name, area, city_id, region_id,
        ba_user_id, ba_user_id_2, ba_user_id_3,
        targets, poc, store_manager_name, channel_id, supervisor_id
    } = req.body;

    try {


        // Check for Duplicate: Name + Area + Channel
        const duplicateStore = await Store.findOne({
            where: {
                store_name: store_name.trim(),
                area: area.trim(),
                channel_id: channel_id
            }
        });

        if (duplicateStore) {
            
            return res.status(400).json({
                success: false,
                message: `Duplicate Entry: "${store_name}" is already registered in "${area}" for this channel.`
            });
        }


        if (!store_name || !city_id || !region_id) {
            return res.status(400).json({ message: "Store Name, City and Region are required!" });
        }

        // Logic Check: Same BA cannot be in multiple slots of the SAME store
        const bas = [ba_user_id, ba_user_id_2, ba_user_id_3].filter(id => id);
        const uniqueBAs = new Set(bas);
        if (bas.length !== uniqueBAs.size) {
            return res.status(400).json({ message: "Multiple BA slots are not assigned." });
        }

        // Availability Checks
        if (ba_user_id) {
            const busyBA1 = await checkBAAvailability(ba_user_id);
            if (busyBA1) return res.status(400).json({ message: `BA 1 is already in store "${busyBA1.store_name}".` });
        }
        if (ba_user_id_2) {
            const busyBA2 = await checkBAAvailability(ba_user_id_2);
            if (busyBA2) return res.status(400).json({ message: `BA 2 is already in store "${busyBA2.store_name}".` });
        }
        if (ba_user_id_3) {
            const busyBA3 = await checkBAAvailability(ba_user_id_3);
            if (busyBA3) return res.status(400).json({ message: `BA 3 is already in store "${busyBA3.store_name}".` });
        }

        const store = await Store.create({
            store_name, area, city_id, region_id,
            ba_user_id: ba_user_id || null,
            ba_user_id_2: ba_user_id_2 || null,
            ba_user_id_3: ba_user_id_3 || null, // Added
            targets, poc, store_manager_name, channel_id, supervisor_id
        });

        res.status(201).json({ message: "Store Created Successfully", store });
    } catch (err) {
        res.status(500).json({ message: "Error creating store", error: err.message });
    }
};

// 2. Get All Stores
export const getAllStores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : "";
        const offset = (page - 1) * limit;

        const searchQuery = `%${search}%`;

        const { count, rows } = await Store.findAndCountAll({
            distinct: true,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            // subQuery: false zaroori hai jab associations par filter lagana ho limit ke sath
            subQuery: false,
            where: search ? {
                [Op.or]: [
                    // Store Table Columns
                    { store_name: { [Op.like]: searchQuery } },
                    { area: { [Op.like]: searchQuery } },
                    // Associated Tables Columns (Using $ association.column $ syntax)
                    { '$city.name$': { [Op.like]: searchQuery } },
                    { '$channel.name$': { [Op.like]: searchQuery } },
                    { '$beauty_advisor.name$': { [Op.like]: searchQuery } },
                    { '$beauty_advisor.fullname$': { [Op.like]: searchQuery } },
                    { '$beauty_advisor_2.name$': { [Op.like]: searchQuery } },
                    { '$beauty_advisor_3.name$': { [Op.like]: searchQuery } },
                    { '$supervisor.name$': { [Op.like]: searchQuery } },
                    { '$supervisor.fullname$': { [Op.like]: searchQuery } },
                ]
            } : {},
            include: [
                { model: Channel, as: 'channel', attributes: ['name'], required: false },
                { model: City, as: 'city', attributes: ['name'], required: false },
                { model: Region, as: 'region', attributes: ['name'], required: false },
                { model: User, as: 'beauty_advisor', attributes: ['id', 'name', 'fullname'], required: false },
                { model: User, as: 'beauty_advisor_2', attributes: ['id', 'name', 'fullname'], required: false },
                { model: User, as: 'beauty_advisor_3', attributes: ['id', 'name', 'fullname'], required: false },
                { model: User, as: 'supervisor', attributes: ['id', 'name', 'fullname'], required: false }
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
        console.error("Search Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};



// / Helper to check if BA is already busy elsewhere (Updated for 3 BAs)
const checkBAAvailability = async (userId, currentStoreId = null) => {
    if (!userId) return null;

    const existingAssignment = await Store.findOne({
        where: {
            [Op.or]: [
                { ba_user_id: userId },
                { ba_user_id_2: userId },
                { ba_user_id_3: userId } // Added 3rd slot check
            ],
            ...(currentStoreId && { id: { [Op.ne]: currentStoreId } })
        }
    });
    return existingAssignment;
};


// 3. Update Store
export const updateStore = async (req, res) => {
    const { id } = req.params;
    const { ba_user_id, ba_user_id_2, ba_user_id_3 } = req.body;

    try {
        const store = await Store.findByPk(id);
        if (!store) return res.status(404).json({ message: "Store not found!" });

        // Duplicate Check in same store
        const bas = [ba_user_id, ba_user_id_2, ba_user_id_3].filter(id => id);
        if (bas.length !== new Set(bas).size) {
            return res.status(400).json({ message: "Store slots should not have dublicate bas !" });
        }

        // Availability Check for all 3
        if (ba_user_id) {
            const busy = await checkBAAvailability(ba_user_id, id);
            if (busy) return res.status(400).json({ message: `BA 1 is already in store "${busy.store_name}".` });
        }
        if (ba_user_id_2) {
            const busy = await checkBAAvailability(ba_user_id_2, id);
            if (busy) return res.status(400).json({ message: `BA 2 is already in store "${busy.store_name}".` });
        }
        if (ba_user_id_3) {
            const busy = await checkBAAvailability(ba_user_id_3, id);
            if (busy) return res.status(400).json({ message: `BA 3 is already in store "${busy.store_name}".` });
        }

        const dataToUpdate = {
            ...req.body,
            ba_user_id: ba_user_id || null,
            ba_user_id_2: ba_user_id_2 || null,
            ba_user_id_3: ba_user_id_3 || null, // Added
            supervisor_id: req.body.supervisor_id || null
        };

        await store.update(dataToUpdate);

        await store.reload({
            include: [
                { model: City, as: 'city', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                { model: User, as: 'beauty_advisor', attributes: ['id', 'name', 'fullname'] },
                { model: User, as: 'beauty_advisor_2', attributes: ['id', 'name', 'fullname'] },
                { model: User, as: 'beauty_advisor_3', attributes: ['id', 'name', 'fullname'] }, // Added
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