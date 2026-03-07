import express from 'express';
import { getAttendanceReport, getSalesReport } from "../controllers/report.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js"
const router = express.Router();

router.get("/attendance-report", AuthenticateToken, getAttendanceReport);
router.get('/sales-report', AuthenticateToken, getSalesReport);

export default router;
