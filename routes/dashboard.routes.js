import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { AuthenticateToken} from '../middlewares/auth.middleware.js'
const router = express.Router();

router.get('/stats', AuthenticateToken, getDashboardStats);

export default router;