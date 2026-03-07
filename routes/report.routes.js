import express from 'express';
import { getAttendanceReport, getSalesReport , generateSaleExecutiveReport} from "../controllers/report.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js"
const router = express.Router();

router.get("/attendance-report", AuthenticateToken, getAttendanceReport);
router.get('/sales-report', AuthenticateToken, getSalesReport);
router.get('/sale-executive-report', AuthenticateToken, generateSaleExecutiveReport);

export default router;
