import { Op, fn, col } from 'sequelize';
import sequelize from "../config/db.js";

import moment from 'moment';
import {
    Sale, SaleItem, Attendance, Interception, User, Store, Category, SubCategory, ItemMaster
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