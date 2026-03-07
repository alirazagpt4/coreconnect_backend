import { Store, City, Region, User } from "../models/associations.js";
import { Op } from "sequelize";

// 1. Create New Store
export const createStore = async (req, res) => {
    const { store_name, area, city_id, region_id, ba_user_id, targets, poc, store_manager_name } = req.body;
    try {
        if (!store_name || !city_id || !region_id) {
            return res.status(400).json({ message: "Store Name, City and Region are required!" });
        }

        const store = await Store.create({
            store_name, area, city_id, region_id, ba_user_id, targets, poc, store_manager_name
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
                { model: City, as: 'city', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                { model: User, as: 'beauty_advisor', attributes: ['id', 'name', 'fullname'] }
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

// 3. Update Store
export const updateStore = async (req, res) => {
    const { id } = req.params;
    try {
        const store = await Store.findByPk(id);
        if (!store) return res.status(404).json({ message: "Store not found!" });

        await store.update(req.body);

        // Refresh data with associations for response
        await store.reload({
            include: [
                { model: City, as: 'city', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                { model: User, as: 'beauty_advisor', attributes: ['name', 'fullname'] }
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