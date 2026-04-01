import express from 'express';
import { getDashboardStats, getRegionWiseSales, getSalesTrend } from '../controllers/dashboard.controller.js';
import { AuthenticateToken } from '../middlewares/auth.middleware.js'
const router = express.Router();

router.get('/stats', AuthenticateToken, getDashboardStats);

router.get('/sales-trend', AuthenticateToken, getSalesTrend);

router.get('/regionwise-sale' ,AuthenticateToken , getRegionWiseSales);

export default router;