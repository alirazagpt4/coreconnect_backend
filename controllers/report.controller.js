

import { SaleItem, Sale, ItemMaster, Category, SubCategory, Attendance, User, Store, City, ShortItem, ShortItemDetail, Interception } from "../models/associations.js";
import { Op } from "sequelize";

export const getAttendanceReport = async (req, res) => {
    try {
        const { fromDate, toDate, city_id, store_id, status, ba_id } = req.query;
        const host = "62.171.183.182";

        let whereClause = {};
        if (fromDate && toDate) {
            whereClause.createdAt = {
                [Op.between]: [`${fromDate} 00:00:00`, `${toDate} 23:59:59`]
            };
        }
        if (ba_id && ba_id !== "") {
            whereClause.user_id = ba_id;
        }
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
            order: [['createdAt', 'DESC']]
        });

        // --- Summary Calculation (Naya Logic) ---
        let totalCount = data.length;
        let presentCount = 0;
        let absentCount = 0;

        const report = data.map(val => {
            const store = val.user?.assigned_stores?.[0] || {};
            const isOnLeave = val.isLeave === true || val.isLeave === 1 || val.status === 'absent';

            // Counts update karein
            if (isOnLeave) { absentCount++; }
            else { presentCount++; }

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
                attendance: isOnLeave ? 'Absent' : 'Present',
                picture: val.image_uri ? `http://${host}${val.image_uri}` : null,
                location: val.latitude ? `http://maps.google.com/?q=${val.latitude},${val.longitude}` : 'No GPS'
            };
        });

        // Percentages nikalna (Divide by zero check ke saath)
        const presentPer = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;
        const absentPer = totalCount > 0 ? ((absentCount / totalCount) * 100).toFixed(1) : 0;

        // Final Response mein summary add kar di
        res.json({
            success: true,
            summary: {
                total: totalCount,
                present: presentCount,
                absent: absentCount,
                presentPercentage: `${presentPer}%`,
                absentPercentage: `${absentPer}%`
            },
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
                    model: Sale, as: 'sale_header', where: saleWhere, required: true,
                    include: [
                        { model: Store, as: 'store', where: storeWhere, include: [{ model: City, as: 'city' }] },
                        { model: User, as: 'beauty_advisor', attributes: ['fullname'] }
                    ]
                },
                {
                    model: ItemMaster, as: 'product', where: itemWhere, required: true,
                    include: [{ model: Category, as: 'category' }, { model: SubCategory, as: 'subcategory' }]
                }
            ],
            order: [[{ model: Sale, as: 'sale_header' }, 'id', 'DESC']]
        });

        // 1. Grouping by Transaction
        const groupedData = {};
        let grandQty = 0;
        let grandAmount = 0;

        data.forEach(item => {
            const sId = item.sale_header.id;

            if (!groupedData[sId]) {
                groupedData[sId] = {
                    saleId: sId,
                    date: new Date(item.sale_header.sale_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
                    store: item.sale_header.store?.store_name || 'N/A',
                    city: item.sale_header.store?.city?.name || 'N/A',
                    baName: item.sale_header.beauty_advisor?.fullname || 'N/A',
                    items: [],
                    subTotalQty: 0,
                    subTotalAmount: 0
                };
            }

            const q = Number(item.quantity) || 0;
            const a = Number(item.subtotal) || 0;

            groupedData[sId].items.push({
                cat: item.product?.category?.category_name,
                subCat: item.product?.subcategory?.subcategory_name,
                itemName: item.product?.product_name,
                rp: item.price,
                qty: q,
                value: a
            });

            // Update Sub-totals for this transaction
            groupedData[sId].subTotalQty += q;
            groupedData[sId].subTotalAmount += a;

            // Update Grand totals for the whole report
            grandQty += q;
            grandAmount += a;
        });

        // 1. Pehle values nikaalein
        const finalTransactions = Object.values(groupedData);

        // 2. Phir unhein manually sort karein (Sale ID ke mutabiq DESC)
        finalTransactions.sort((a, b) => b.saleId - a.saleId);

        res.json({
            success: true,
            summary: {
                totalTransactions: finalTransactions.length, // Count of distinct sales
                grandTotalQty: grandQty,
                grandTotalAmount: grandAmount.toFixed(2)
            },
            data: finalTransactions
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const generateSaleExecutiveReport = async (req, res) => {
    try {
        const { fromDate, toDate, ba_id } = req.query;
        const loggedInUserId = req.user.id; // Token se aayi hui ID

        // 1. Hierarchy Logic
        // Agar query mein ba_id di hai toh wo, warna loggedInUserId
        let targetUserIds = [];

        if (ba_id) {
            targetUserIds = [ba_id];
        } else {
            // Check subordinates (Hierarchy)
            const subordinates = await User.findAll({
                where: { reportTo: loggedInUserId },
                attributes: ['id']
            });

            if (subordinates.length > 0) {
                targetUserIds = subordinates.map(s => s.id);
            } else {
                targetUserIds = [loggedInUserId];
            }
        }

        // 2. Common Where Clause
        const dateFilter = {};
        if (fromDate && toDate) {
            dateFilter[Op.between] = [`${fromDate} 00:00:00`, `${toDate} 23:59:59`];
        }

        // 3. Fetch Attendance
        const attendances = await Attendance.findAll({
            where: {
                user_id: { [Op.in]: targetUserIds },
                createdAt: dateFilter
            },
            include: [{ model: User, as: 'user', attributes: ['fullname', 'name'] }],
            order: [['createdAt', 'ASC']]
        });

        // 4. Fetch Sales with Items
        const sales = await Sale.findAll({
            where: {
                ba_user_id: { [Op.in]: targetUserIds },
                sale_date: dateFilter
            },
            include: [
                {
                    model: SaleItem, as: 'items',
                    include: [{ model: ItemMaster, as: 'product', attributes: ['product_name'] }]
                },
                { model: Store, as: 'store', attributes: ['store_name'] }
            ],
            order: [['sale_date', 'ASC']]
        });

        // 5. Data Merging Logic (Group by Date)
        const combinedReport = {};

        // Attendance ko Map mein dalein
        attendances.forEach(att => {
            const dateKey = new Date(att.createdAt).toLocaleDateString('en-GB');
            if (!combinedReport[dateKey]) combinedReport[dateKey] = { date: dateKey, attendance: null, sales: [] };

            combinedReport[dateKey].attendance = {
                time: att.mobile_time || 'N/A',
                status: att.status === 'present' ? 'Present' : (att.isLeave ? 'On Leave' : 'Absent'),
                baName: att.user?.fullname || att.user?.name
            };
        });

        // Sales ko Map mein merge karein
        sales.forEach(sale => {
            const dateKey = new Date(sale.sale_date).toLocaleDateString('en-GB');
            if (!combinedReport[dateKey]) combinedReport[dateKey] = { date: dateKey, attendance: null, sales: [] };

            const items = sale.items.map(item => ({
                product: item.product?.product_name || 'Unknown',
                qty: item.quantity,
                total: item.subtotal
            }));

            combinedReport[dateKey].sales.push({
                store: sale.store?.store_name || 'N/A',
                items: items,
                saleTotal: sale.total_amount
            });
        });

        // Object ko Array mein convert karein mobile UI ke liye
        const finalData = Object.values(combinedReport).sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            totalDays: finalData.length,
            data: finalData
        });

    } catch (err) {
        console.error("Executive Report Error:", err);
        res.status(500).json({ success: false, message: "Report generation failed: " + err.message });
    }
};


export const getAttendanceReportMobile = async (req, res) => {
    try {
        const { fromDate, toDate, ba_id, status } = req.query;
        const loggedInUserId = req.user.id;

        // 1. Hierarchy Logic (Same as Executive)
        let targetUserIds = [];
        if (ba_id) {
            targetUserIds = [ba_id];
        } else {
            const subordinates = await User.findAll({
                where: { reportTo: loggedInUserId },
                attributes: ['id']
            });
            targetUserIds = subordinates.length > 0 ? subordinates.map(s => s.id) : [loggedInUserId];
        }

        // 2. Filters
        let whereClause = {
            user_id: { [Op.in]: targetUserIds }
        };

        if (fromDate && toDate) {
            whereClause.createdAt = { [Op.between]: [`${fromDate} 00:00:00`, `${toDate} 23:59:59`] };
        }

        // Status Filter: present, absent, or leave
        if (status) {
            whereClause.status = status;
        }

        const data = await Attendance.findAll({
            where: whereClause,
            include: [
                {
                    model: User, as: 'user',
                    attributes: ['fullname', 'name'],
                    include: [{ model: Store, as: 'assigned_stores', attributes: ['store_name'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const report = data.map(val => ({
            id: val.id,
            date: new Date(val.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: val.mobile_time || 'N/A',
            baName: val.user?.fullname || val.user?.name || 'Unknown',
            storeName: val.user?.assigned_stores?.[0]?.store_name || 'Not Assigned',
            status: val.status.charAt(0).toUpperCase() + val.status.slice(1), // Capitalize
            image: val.image_uri ? `http://62.171.183.182${val.image_uri}` : null
        }));

        res.json({ success: true, count: report.length, data: report });

    } catch (err) {
        res.status(500).json({ success: false, message: "Attendance Report Error: " + err.message });
    }
};



export const getSalesReportMobile = async (req, res) => {
    try {
        const { fromDate, toDate, ba_id } = req.query;
        const loggedInUserId = req.user.id;

        // 1. Hierarchy Logic
        let targetUserIds = [];
        if (ba_id) {
            targetUserIds = [ba_id];
        } else {
            const subordinates = await User.findAll({
                where: { reportTo: loggedInUserId },
                attributes: ['id']
            });
            targetUserIds = subordinates.length > 0 ? subordinates.map(s => s.id) : [loggedInUserId];
        }

        // 2. Sale Header Filters
        let saleWhere = {
            ba_user_id: { [Op.in]: targetUserIds }
        };

        if (fromDate && toDate) {
            saleWhere.sale_date = { [Op.between]: [`${fromDate} 00:00:00`, `${toDate} 23:59:59`] };
        }

        // 3. Query SaleItem directly for detailed view
        const data = await SaleItem.findAll({
            include: [
                {
                    model: Sale, as: 'sale_header',
                    where: saleWhere,
                    required: true,
                    include: [
                        { model: Store, as: 'store', attributes: ['store_name'] },
                        { model: User, as: 'beauty_advisor', attributes: ['fullname', 'name'] }
                    ]
                },
                { model: ItemMaster, as: 'product', attributes: ['product_name'] }
            ],
            order: [[{ model: Sale, as: 'sale_header' }, 'sale_date', 'DESC']]
        });

        const report = data.map(val => ({
            id: val.id,
            date: new Date(val.sale_header.sale_date).toLocaleDateString('en-GB'),
            baName: val.sale_header.beauty_advisor?.fullname || val.sale_header.beauty_advisor?.name,
            storeName: val.sale_header.store?.store_name,
            product: val.product?.product_name,
            qty: val.quantity,
            price: val.price,
            subtotal: val.subtotal
        }));

        res.json({ success: true, count: report.length, data: report });

    } catch (err) {
        res.status(500).json({ success: false, message: "Sales Report Error: " + err.message });
    }
};


export const getShortItemsReport = async (req, res) => {
    try {
        const { store_id, ba_user_id, fromDate, toDate, category_id, subcategory_id, city_id, item_id } = req.query;

        let whereClause = {};
        if (store_id) whereClause.store_id = store_id;
        if (ba_user_id) whereClause.ba_user_id = ba_user_id;
        if (fromDate && toDate) {
            whereClause.report_date = { [Op.between]: [fromDate, toDate] };
        }

        let storeWhere = {};
        if (city_id) storeWhere.city_id = city_id;

        // Item level filters (ID filter yahan add kiya hai)
        let itemWhere = {};
        if (item_id) itemWhere.id = item_id;
        if (category_id) itemWhere.category_id = category_id;
        if (subcategory_id) itemWhere.subcategory_id = subcategory_id;

        const reports = await ShortItem.findAll({
            where: whereClause,
            include: [
                {
                    model: Store,
                    as: 'store',
                    where: storeWhere,
                    attributes: ['store_name', 'area'],
                    include: [{ model: City, as: 'city', attributes: ['name'] }]
                },
                { model: User, as: 'beauty_advisor', attributes: ['fullname'] },
                {
                    model: ShortItemDetail,
                    as: 'details',
                    // Agar item, category ya subcategory filter hai toh required true hoga
                    required: (category_id || subcategory_id || item_id) ? true : false,
                    include: [{
                        model: ItemMaster,
                        as: 'itemInfo',
                        where: Object.keys(itemWhere).length > 0 ? itemWhere : null,
                        attributes: ['product_name'],
                        include: [
                            { model: Category, as: 'category', attributes: ['category_name'] },
                            { model: SubCategory, as: 'subcategory', attributes: ['subcategory_name'] }
                        ]
                    }]
                }
            ],
            order: [['report_date', 'DESC']]
        });

        const formattedData = [];
        reports.forEach(r => {
            r.details.forEach(d => {
                formattedData.push({
                    id: r.id,
                    date: r.report_date,
                    cityName: r.store?.city?.name || 'N/A',
                    areaName: r.store?.area || 'N/A',
                    storeName: r.store?.store_name || 'N/A',
                    baName: r.beauty_advisor?.fullname || 'N/A',
                    categoryName: d.itemInfo?.category?.category_name || 'N/A',
                    subCategoryName: d.itemInfo?.subcategory?.subcategory_name || 'N/A',
                    itemName: d.itemInfo?.product_name || 'N/A'
                });
            });
        });

        res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const interceptionReport = async (req, res) => {
    try {
        // Front-end se city_id aur store_id bhi query params mein aayenge
        const { fromDate, toDate, ba_user_id, city_id, store_id } = req.query;

        if (!fromDate || !toDate) {
            return res.status(400).json({ error: "Date range is required." });
        }

        // 1. Base Filter (Interception Table)
        const whereClause = {
            report_date: { [Op.between]: [fromDate, toDate] }
        };

        if (ba_user_id) whereClause.ba_user_id = ba_user_id;

        // Agar Direct Store ID aayi hai toh isi table par filter lag jayega
        if (store_id) whereClause.store_id = store_id;

        // 2. Execution with Nested Joins
        const reports = await Interception.findAll({
            where: whereClause,
            attributes: ['report_date', 'intercepted', 'converted', 'ratio'],
            include: [
                {
                    model: Store,
                    as: 'store',
                    attributes: ['store_name'],
                    // Agar city_id filter lagana hai toh humein Store ke andar filter karna hoga
                    where: city_id ? { city_id: city_id } : {},
                    required: true, // Yeh 'INNER JOIN' banayega, taake sirf wahi records aayein jo city match karein
                    include: [
                        {
                            model: City, // Agar city name bhi display karwana hai front-end par
                            as: 'city',
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'beauty_advisor',
                    attributes: ['name'],
                }
            ],
            order: [['report_date', 'DESC']]
        });

        const summary = reports.reduce((acc, curr) => {
            acc.totalInterceptions += (Number(curr.intercepted) || 0);
            acc.totalConversions += (Number(curr.converted) || 0);
            return acc;
        }, { totalInterceptions: 0, totalConversions: 0 });

        // Overall Ratio calculate karo (Avoid division by zero!)
        summary.overallRatio = summary.totalInterceptions > 0
            ? ((summary.totalConversions / summary.totalInterceptions) * 100).toFixed(2)
            : "0.00";

        return res.status(200).json({
            success: true,
            count: reports.length,
            summary: summary,
            data: reports
        });

    } catch (error) {
        console.error("Report Error:", error);
        return res.status(500).json({ error: "Internal Server Error." });
    }
};