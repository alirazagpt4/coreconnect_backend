

import { SaleItem, Sale, ItemMaster, Category, SubCategory, Attendance, User, Store, City } from "../models/associations.js";
import { Op } from "sequelize";

export const getAttendanceReport = async (req, res) => {
    try {
        const { fromDate, toDate, city_id, store_id, status } = req.query;
        const host = "62.171.183.182";

        let whereClause = {};

        // 1. Date Range Filter (Cleaned up)
        if (fromDate && toDate) {
            whereClause.createdAt = {
                [Op.between]: [`${fromDate} 00:00:00`, `${toDate} 23:59:59`]
            };
        }

        // 2. Status Filter: Database ke 'status' column ko use karna zyada fast hai
        if (status === 'present' || status === 'absent') {
            whereClause.status = status;
        }

        const data = await Attendance.findAll({
            where: whereClause,
            include: [
                {
                    model: User, as: 'user',
                    attributes: ['fullname', 'name'],
                    where: city_id ? { city_id } : {},
                    include: [
                        { model: City, as: 'city', attributes: ['name'] },
                        {
                            model: Store,
                            as: 'assigned_stores',
                            attributes: ['store_name', 'area'],
                            where: store_id ? { id: store_id } : {},
                            required: store_id ? true : false
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']] // Latest attendance pehle dikhayein
        });

        // 3. Mapping Logic with Fixes
        const report = data.map(val => {
            const store = val.user?.assigned_stores?.[0] || {};
            console.log("store details of user ", store);

            // isLeave ko boolean ki tarah handle karna best hai
            const isOnLeave = val.isLeave === true || val.isLeave === 1 || val.status === 'absent';

            return {
                id: val.id,
                date: val.createdAt.toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }),
                time: val.mobile_time || 'N/A',
                city: val.user?.city?.name || 'N/A',
                area: store.area || 'General',
                storeID: store.id,
                storeName: store.store_name || 'Not Assigned',
                baName: val.user?.fullname || val.user?.name || 'Unknown',

                // Final Status logic
                attendance: isOnLeave ? 'Absent' : 'Present',

                // Image URL fix
                picture: val.image_uri ? `http://${host}${val.image_uri}` : null,

                // Google Maps Link (Correct format: q=lat,lng)
                location: val.latitude ? `https://www.google.com/maps?q=${val.latitude},${val.longitude}` : 'No GPS'
            };
        });

        res.json({
            success: true,
            count: report.length,
            data: report
        });

    } catch (err) {
        console.error("Report Error:", err);
        res.status(500).json({ success: false, message: "Server Error: " + err.message });
    }
};


export const getSalesReport = async (req, res) => {
    try {
        const { fromDate, toDate, city_id, store_id, ba_id, cat_id, subcat_id, item_id } = req.query;

        let saleWhere = {};
        let storeWhere = {};
        let itemWhere = {};

        if (fromDate && toDate) {
            saleWhere.sale_date = { [Op.between]: [`${fromDate} 00:00:00`, `${toDate} 23:59:59`] };
        }

        if (store_id) saleWhere.store_id = store_id;
        if (ba_id) saleWhere.ba_user_id = ba_id;
        if (city_id) storeWhere.city_id = city_id;

        if (cat_id) itemWhere.category_id = cat_id;
        if (subcat_id) itemWhere.subcategory_id = subcat_id;
        if (item_id) itemWhere.id = item_id;

        const data = await SaleItem.findAll({
            include: [
                {
                    // 🎯 Alias 'sale_header' jo aapki associations mein hai
                    model: Sale, as: 'sale_header',
                    where: saleWhere,
                    required: true,
                    include: [
                        {
                            model: Store, as: 'store',
                            where: storeWhere,
                            include: [{ model: City, as: 'city', attributes: ['name'] }]
                        },
                        {
                            // 🎯 Alias 'beauty_advisor' jo aapki associations mein hai
                            model: User, as: 'beauty_advisor',
                            attributes: ['fullname', 'name']
                        }
                    ]
                },
                {
                    // 🎯 Alias 'product' jo aapki associations mein hai
                    model: ItemMaster, as: 'product',
                    where: itemWhere,
                    required: true,
                    include: [
                        { model: Category, as: 'category', attributes: ['category_name'] },
                        { model: SubCategory, as: 'subcategory', attributes: ['subcategory_name'] }
                    ]
                }
            ],
            order: [[{ model: Sale, as: 'sale_header' }, 'sale_date', 'ASC']]
        });

        const report = data.map(val => {
            const sale = val.sale_header || {};
            const store = sale.store || {};
            const ba = sale.beauty_advisor || {};
            const product = val.product || {};
            const category = product.category || {};
            const subcategory = product.subcategory || {};

            return {
                date: sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: '2-digit'
                }) : 'N/A',
                city: store.city?.name || 'N/A',
                area: store.area || 'N/A',
                storeName: store.store_name || 'N/A',
                baName: ba.fullname || ba.name || 'N/A',
                cat: category.category_name || 'N/A',
                subCat: subcategory.subcategory_name || 'N/A',
                item: product.product_name || 'N/A',
                qty: val.quantity,
                amount: val.subtotal
            };
        });

        res.json({ success: true, count: report.length, data: report });

    } catch (err) {
        console.error("Sales Report Error:", err);
        res.status(500).json({ success: false, message: "Server Error: " + err.message });
    }
};