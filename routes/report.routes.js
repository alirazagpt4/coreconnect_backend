import express from 'express';
import { getAttendanceReport, getSalesReport, generateSaleExecutiveReport, getAttendanceReportMobile, getSalesReportMobile, getShortItemsReport, interceptionReport } from "../controllers/report.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js"
const router = express.Router();

router.get("/attendance-report", AuthenticateToken, getAttendanceReport);
router.get('/sales-report', AuthenticateToken, getSalesReport);
router.get('/sale-executive-report', AuthenticateToken, generateSaleExecutiveReport);
router.get('/sale-executive-attendance', AuthenticateToken, getAttendanceReportMobile)
router.get('/sale-executive-sale', AuthenticateToken, getSalesReportMobile);
router.get('/shortitems-report', AuthenticateToken, getShortItemsReport);
router.get('/interception-report', AuthenticateToken, interceptionReport);

export default router;
