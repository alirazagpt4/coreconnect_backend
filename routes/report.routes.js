import express from 'express';
import { getAttendanceReport, getSalesReport, generateSaleExecutiveReport, getAttendanceReportMobile, getSalesReportMobile, getShortItemsReport, interceptionReport, getSalesSummaryByBrand, getExpiryReport, getShortTestersReport } from "../controllers/report.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js"
const router = express.Router();

router.get("/attendance-report", AuthenticateToken, getAttendanceReport);
router.get('/sales-report', AuthenticateToken, getSalesReport);
router.get('/sales-summary-report', AuthenticateToken, getSalesSummaryByBrand);
router.get('/sale-executive-report', AuthenticateToken, generateSaleExecutiveReport);
router.get('/sale-executive-attendance', AuthenticateToken, getAttendanceReportMobile)
router.get('/sale-executive-sale', AuthenticateToken, getSalesReportMobile);
router.get('/shortitems-report', AuthenticateToken, getShortItemsReport);
router.get('/interception-report', AuthenticateToken, interceptionReport);
router.get('/expiry-report', AuthenticateToken, getExpiryReport);
router.get('/tester-report', AuthenticateToken, getShortTestersReport);

export default router;
