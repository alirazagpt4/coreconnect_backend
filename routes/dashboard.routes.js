import express from 'express';
import { getCategoryPerformance, getDashboardStats, getRegionWiseSales, getSalesTrend, getStoreWisePerformance } from '../controllers/dashboard.controller.js';
import { AuthenticateToken } from '../middlewares/auth.middleware.js'
const router = express.Router();

router.get('/stats', AuthenticateToken, getDashboardStats);

router.get('/sales-trend', AuthenticateToken, getSalesTrend);

router.get('/regionwise-sale', AuthenticateToken, getRegionWiseSales);

router.get('/categorywise-performance', AuthenticateToken, getCategoryPerformance);

router.get('/storewise-performance' , AuthenticateToken , getStoreWisePerformance);

export default router;