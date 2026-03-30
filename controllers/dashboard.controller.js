import { Op, fn, col } from 'sequelize';
import moment from 'moment';
import { 
    Sale, SaleItem, Attendance, Interception, User, Store 
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