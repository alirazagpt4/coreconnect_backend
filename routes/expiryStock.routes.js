import express from "express";
import { AuthenticateToken } from "../middlewares/auth.middleware.js";
import { createExpiryStock } from "../controllers/expiryStock.controller.js";
import upload from "../middlewares/multer.middleware.js";
const router = express.Router();

router.post('/create-expiry', AuthenticateToken, upload.array('picture', 10), createExpiryStock);

export default router;

