import { Op, fn, col, literal } from 'sequelize';
import sequelize from "../config/db.js";

import moment from 'moment';
import {
    Sale, SaleItem, Attendance, Interception, User, Store, Category, SubCategory, ItemMaster, Region, City, ShortItem, ShortItemDetail, ExpiryStock, ExpiryStockDetail
} from '../models/associations.js'; // Ensure path is correct

export const getDashboardStats = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let start, end;

        // 1. DATE LOGIC (Handled with Moment.js)
        if (range === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();

            if (moment(start).isAfter(end)) {
                return res.status(400).json({ success: false, message: "Start date cannot be after end date." });
            }
        } else {
            const ranges = {
                yesterday: () => ({ s: moment().subtract(1, 'days').startOf('day'), e: moment().subtract(1, 'days').endOf('day') }),
                this_week: () => ({ s: moment().startOf('week'), e: moment().endOf('day') }),
                this_month: () => ({ s: moment().startOf('month'), e: moment().endOf('day') }),
                default: () => ({ s: moment().startOf('day'), e: moment().endOf('day') })
            };
            const selected = (ranges[range] || ranges.default)();
            start = selected.s.toDate();
            end = selected.e.toDate();
        }

        const whereClause = { createdAt: { [Op.between]: [start, end] } };
        // Interception uses report_date (DATEONLY)
        const interceptionWhere = {
            report_date: {
                [Op.between]: [moment(start).format('YYYY-MM-DD'), moment(end).format('YYYY-MM-DD')]
            }
        };

        // 2. PARALLEL AGGREGATION ($O(1) Bottleneck)
        const [salesData, itemsData, attendanceCount, interceptionData, activeStoreCount] = await Promise.all([
            // KPI: Total Revenue & Order Count
            Sale.findOne({
                attributes: [
                    [fn('SUM', col('total_amount')), 'revenue'],
                    [fn('COUNT', col('id')), 'orderCount']
                ],
                where: whereClause,
                raw: true
            }),
            // KPI: Items Sold (Sum of quantity in SaleItems)
            SaleItem.findOne({
                attributes: [[fn('SUM', col('quantity')), 'totalQty']],
                include: [{
                    model: Sale,
                    as: 'sale_header', // As per your association
                    where: whereClause,
                    attributes: []
                }],
                raw: true
            }),
            // KPI: Present BAs (Distinct check-ins)
            Attendance.count({
                distinct: true,
                col: 'user_id',
                where: { ...whereClause, isLeave: false }
            }),
            // KPI: Conversions (Interception efficiency)
            Interception.findOne({
                attributes: [
                    [fn('SUM', col('intercepted')), 'sumInter'],
                    [fn('SUM', col('converted')), 'sumConv']
                ],
                where: interceptionWhere,
                raw: true
            }),
            // KPI: Active Stores (Unique stores with at least one sale)
            Sale.count({
                distinct: true,
                col: 'store_id',
                where: whereClause
            })
        ]);

        // 3. FINAL CALCULATIONS
        const totalInter = parseInt(interceptionData?.sumInter) || 0;
        const totalConv = parseInt(interceptionData?.sumConv) || 0;
        const conversionRate = totalInter > 0 ? ((totalConv / totalInter) * 100).toFixed(1) : 0;

        // RESPONSE OBJECT
        res.status(200).json({
            success: true,
            data: {
                totalRevenue: parseFloat(salesData?.revenue) || 0,
                itemsSold: parseInt(itemsData?.totalQty) || 0,
                conversions: `${conversionRate}%`,
                presentBAs: attendanceCount,
                activeStores: activeStoreCount,
                totalOrders: salesData?.orderCount || 0
            }
        });

    } catch (error) {
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};


export const getSalesTrend = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;

        // PHASE 1: Date Logic (Fundamental Truth: DB needs exact timestamps)
        let start = moment().startOf('month').toDate();
        let end = moment().toDate();

        if (range === 'this_week') start = moment().startOf('week').toDate();
        if (range === 'yesterday') {
            start = moment().subtract(1, 'days').startOf('day').toDate();
            end = moment().subtract(1, 'days').endOf('day').toDate();
        }
        if (range === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();
        }

        // PHASE 2: Database Extraction (The Source)
        // Hum SaleItem se start kar rahe hain kyunki har item ki apni category hai
        const trendData = await SaleItem.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('sale_header.createdAt')), 'saleDate'],
                [sequelize.fn('SUM', sequelize.col('SaleItem.subtotal')), 'revenue']
            ],
            include: [
                {
                    model: Sale,
                    as: 'sale_header',
                    attributes: [], // Sirf filter ke liye date chahiye
                    where: { createdAt: { [Op.between]: [start, end] } }
                },
                {
                    model: ItemMaster,
                    as: 'product',
                    attributes: [],
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['category_name'] // Database column name
                    }]
                }
            ],
            group: [
                sequelize.fn('DATE', sequelize.col('sale_header.createdAt')),
                'product->category.id'
            ],
            raw: true,
            order: [[sequelize.fn('DATE', sequelize.col('sale_header.createdAt')), 'ASC']]
        });

        // PHASE 3: Data Transformation (The Pivot)
        // DB se aane wale flat data ko Recharts format mein convert karna
        const chartMap = {};
        const categoriesSet = new Set();

        trendData.forEach(item => {
            const dateStr = moment(item.saleDate).format('MMM DD');
            const category = item['product.category.category_name'] || 'Other';
            const revenue = parseFloat(item.revenue || 0);

            if (!chartMap[dateStr]) {
                chartMap[dateStr] = { date: dateStr };
            }
            chartMap[dateStr][category] = revenue;
            categoriesSet.add(category);
        });

        // PHASE 4: Gap Filling (Data Integrity)
        // Har date par check karna ke 5 main categories (Amrij, Rivaj etc.) maujood hain ya nahi
        const finalChartData = Object.values(chartMap).map(entry => {
            categoriesSet.forEach(cat => {
                if (!entry[cat]) entry[cat] = 0; // Missing category ko 0 set karo
            });
            return entry;
        });

        res.json({
            success: true,
            data: finalChartData,
            categories: Array.from(categoriesSet)
        });

    } catch (error) {
        console.error("Sales Trend API Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export const getRegionWiseSales = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let start, end;

        // Date Logic (Standard)
        if (range === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();
        } else if (range === 'yesterday') {
            start = moment().subtract(1, 'days').startOf('day').toDate();
            end = moment().subtract(1, 'days').endOf('day').toDate();
        } else if (range === 'this_week') {
            start = moment(moment().startOf('week')).toDate();
            end = moment().endOf('day').toDate();
        } else {
            start = moment().startOf('month').toDate();
            end = moment().endOf('day').toDate();
        }

        const data = await Sale.findAll({
            attributes: [
                // Yahan 'store->region.name' ya sirf 'store.region.name' ka masla ho sakta hai
                // Hum literal use karenge taake SQL direct column uthaye
                [sequelize.col('store.region.name'), 'regionName'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue']
            ],
            include: [{
                model: Store,
                as: 'store',
                attributes: [],
                required: true,
                include: [{
                    model: Region,
                    as: 'region',
                    attributes: [],
                    required: true
                }]
            }],
            where: {
                sale_date: { [Op.between]: [start, end] }
            },
            group: ['store.region.id', 'store.region.name'],
            subQuery: false, // Aggregate functions ke liye ye zaroori hai
            raw: true
        });

        const formattedData = data.map(item => ({
            region: item.regionName || 'Unknown',
            revenue: parseFloat(item.totalRevenue || 0)
        }));

        res.status(200).json({ success: true, data: formattedData });

    } catch (error) {
        console.error("Region Sales Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};




export const getCategoryPerformance = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let start, end;

        // --- Standard Date Logic ---
        if (range === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();
        } else if (range === 'yesterday') {
            start = moment().subtract(1, 'days').startOf('day').toDate();
            end = moment().subtract(1, 'days').endOf('day').toDate();
        } else if (range === 'this_week') {
            start = moment().startOf('week').toDate();
            end = moment().endOf('day').toDate();
        } else if (range === 'today') { // Added Today for quick check
            start = moment().startOf('day').toDate();
            end = moment().endOf('day').toDate();
        } else {
            // Default: This Month
            start = moment().startOf('month').toDate();
            end = moment().endOf('day').toDate();
        }

        // --- Aggregation Query ---
        const performanceData = await SaleItem.findAll({
            attributes: [
                [fn('SUM', col('SaleItem.quantity')), 'total_units'],
                [fn('SUM', col('SaleItem.subtotal')), 'total_revenue'],
            ],
            include: [
                {
                    // 1. Link to Sale Master for Date Filtering
                    model: Sale,
                    as: 'sale_header',
                    attributes: [],
                    where: {
                        sale_date: { [Op.between]: [start, end] } // 👈 Filter yahan apply hoga
                    }
                },
                {
                    // 2. Link to Product and Category for Grouping
                    model: ItemMaster,
                    as: 'product',
                    attributes: [],
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name']
                    }]
                }
            ],
            // Grouping: ItemMaster ki category_id aur Category table ki primary key par
            group: ['product.category_id', 'product->category.id'],
            raw: true,
            nest: true,
            subQuery: false // Important for Aggregations
        });

        // --- Totals and Formatting ---
        const grandTotalUnits = performanceData.reduce((acc, curr) => acc + parseInt(curr.total_units || 0), 0);
        const grandTotalRevenue = performanceData.reduce((acc, curr) => acc + parseFloat(curr.total_revenue || 0), 0);

        const formattedData = performanceData.map(row => {
            const units = parseInt(row.total_units || 0);
            return {
                name: row.product?.category?.category_name || 'Others',
                units: units,
                revenue: parseFloat(row.total_revenue || 0),
                percentage: grandTotalUnits > 0 ? ((units / grandTotalUnits) * 100).toFixed(1) : 0
            };
        });

        formattedData.sort((a, b) => b.units - a.units);

        res.status(200).json({
            success: true,
            meta: { range, start, end }, // Debugging ke liye range wapis bhejna acha hota hai
            summary: {
                totalRevenue: grandTotalRevenue,
                totalUnits: grandTotalUnits
            },
            data: formattedData
        });

    } catch (err) {
        console.error("Dashboard KPI Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getStoreWisePerformance = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let start, end;

        // --- 1. Standard Date Logic (Identical to Category Performance) ---
        if (range === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();
        } else if (range === 'yesterday') {
            start = moment().subtract(1, 'days').startOf('day').toDate();
            end = moment().subtract(1, 'days').endOf('day').toDate();
        } else if (range === 'this_week') {
            start = moment().startOf('week').toDate();
            end = moment().endOf('day').toDate();
        } else if (range === 'today') {
            start = moment().startOf('day').toDate();
            end = moment().endOf('day').toDate();
        } else {
            // Default: This Month
            start = moment().startOf('month').toDate();
            end = moment().endOf('day').toDate();
        }

        // --- 2. Aggregation Query using Sub-queries (Literals) ---
        // Hum sub-queries isliye use kar rahe hain taake Sales aur Interceptions 
        // ka data aapas mein multiply (Cartesian Product) na ho.
        const performanceData = await Store.findAll({
            attributes: [
                'id',
                'store_name',
                'area',
                // Revenue Aggregation
                [
                    literal(`(
                        SELECT COALESCE(SUM(total_amount), 0)
                        FROM Sales AS s
                        WHERE s.store_id = Store.id
                        AND s.sale_date BETWEEN '${moment(start).format('YYYY-MM-DD HH:mm:ss')}' 
                        AND '${moment(end).format('YYYY-MM-DD HH:mm:ss')}'
                    )`),
                    'total_revenue'
                ],
                // Items Sold Aggregation
                [
                    literal(`(
                        SELECT COALESCE(SUM(si.quantity), 0)
                        FROM SaleItems AS si
                        JOIN Sales AS s ON si.sale_id = s.id
                        WHERE s.store_id = Store.id
                        AND s.sale_date BETWEEN '${moment(start).format('YYYY-MM-DD HH:mm:ss')}' 
                        AND '${moment(end).format('YYYY-MM-DD HH:mm:ss')}'
                    )`),
                    'total_items'
                ],
                // Interceptions Aggregation
                [
                    literal(`(
                        SELECT COALESCE(SUM(intercepted), 0)
                        FROM interceptions AS i
                        WHERE i.store_id = Store.id
                        AND i.report_date BETWEEN '${moment(start).format('YYYY-MM-DD')}' 
                        AND '${moment(end).format('YYYY-MM-DD')}'
                    )`),
                    'total_intercepted'
                ],
                // Converted Aggregation (For Ratio Calculation)
                [
                    literal(`(
                        SELECT COALESCE(SUM(converted), 0)
                        FROM interceptions AS i
                        WHERE i.store_id = Store.id
                        AND i.report_date BETWEEN '${moment(start).format('YYYY-MM-DD')}' 
                        AND '${moment(end).format('YYYY-MM-DD')}'
                    )`),
                    'total_converted'
                ]
            ],
            where: { is_active: true },
            order: [[literal('total_revenue'), 'DESC']],
            limit: 5,
            raw: true
        });

        // --- 3. Formatting & Summary Calculation ---
        let summaryRevenue = 0;
        let summaryItems = 0;

        const formattedData = performanceData.map(row => {
            const revenue = Math.round(parseFloat(row.total_revenue || 0));
            const items = parseInt(row.total_items || 0);
            const intercepted = parseInt(row.total_intercepted || 0);
            const converted = parseInt(row.total_converted || 0);

            summaryRevenue += revenue;
            summaryItems += items;

            return {
                store_name: row.store_name,
                area: row.area || 'N/A',
                revenue: revenue,
                items: items,
                interceptions: intercepted,
                // Conversion % calculate on the fly
                conv_rate: intercepted > 0 ? ((converted / intercepted) * 100).toFixed(1) : "0.0"
            };
        });

        // --- 4. Final Response ---
        res.status(200).json({
            success: true,
            meta: { range, start, end },
            summary: {
                totalRevenue: summaryRevenue,
                totalItems: summaryItems
            },
            data: formattedData
        });

    } catch (err) {
        console.error("Store Performance Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};




export const getShortItemsWidgetData = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let start, end;

        // 1. Date Logic
        if (range === 'custom' && startDate && endDate) {
            start = moment(startDate).startOf('day').toDate();
            end = moment(endDate).endOf('day').toDate();
        } else if (range === 'today') {
            start = moment().startOf('day').toDate();
            end = moment().endOf('day').toDate();
        } else if (range === 'this_week') {
            start = moment().startOf('week').toDate();
            end = moment().endOf('day').toDate();
        } else {
            start = moment().startOf('month').toDate();
            end = moment().endOf('day').toDate();
        }

        // 2. Single Source of Truth Query
        // We fetch the data ONCE. 
        const data = await ShortItemDetail.findAll({
            attributes: [
                'id',
                'item_id', // Ensure this matches your FK to ItemMaster
                [sequelize.col('itemInfo->category.category_name'), 'category_name'],
                [sequelize.col('short_item_header->store.store_name'), 'store_name'],
                [sequelize.col('short_item_header->store.area'), 'area'],
                [sequelize.col('short_item_header->beauty_advisor.fullname'), 'ba_name']
            ],
            include: [
                {
                    model: ItemMaster,
                    as: 'itemInfo',
                    attributes: ['product_name'],
                    include: [{ model: Category, as: 'category', attributes: [] }]
                },
                {
                    model: ShortItem,
                    as: 'short_item_header',
                    attributes: ['report_date'],
                    where: { report_date: { [Op.between]: [start, end] } },
                    required: true,
                    include: [
                        { model: Store, as: 'store', attributes: [] },
                        { model: User, as: 'beauty_advisor', attributes: [] }
                    ]
                }
            ],
            raw: true,
            nest: true
        });

        // 3. Efficiency: Calculate metrics in-memory from the result set
        // This saves 2 extra database round-trips.
        const totalRequests = data.length;

        // Use a Set to get UNIQUE item_ids
        const uniqueSKUsCount = new Set(data.map(item => item.item_id)).size;

        res.status(200).json({
            success: true,
            summary: {
                totalRequests,     // Total rows found
                uniqueSKUs: uniqueSKUsCount // Number of distinct products
            },
            data
        });

    } catch (error) {
        console.error("Short Items Widget Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};