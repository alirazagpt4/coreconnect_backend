import express from 'express';
import { getAttendanceReport, getSalesReport, generateSaleExecutiveReport, getAttendanceReportMobile, getSalesReportMobile } from "../controllers/report.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js"
const router = express.Router();

router.get("/attendance-report", AuthenticateToken, getAttendanceReport);
router.get('/sales-report', AuthenticateToken, getSalesReport);
router.get('/sale-executive-report', AuthenticateToken, generateSaleExecutiveReport);
router.get('/sale-executive-attendance', AuthenticateToken, getAttendanceReportMobile)
router.get('/sale-executive-sale', AuthenticateToken, getSalesReportMobile)

export default router;
