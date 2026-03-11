import express from 'express';
const router = express.Router();
import { AuthenticateToken } from '../middlewares/auth.middleware.js';
import { createInterception } from '../controllers/interception.controller.js';

router.post("/add" , AuthenticateToken, createInterception);

export default router;