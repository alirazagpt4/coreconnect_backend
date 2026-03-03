import express from "express";
import {AuthenticateToken} from "../middlewares/auth.middleware.js"
import { createSale } from "../controllers/sale.controller.js";

const router = express.Router();

router.post("/create-sale" , AuthenticateToken , createSale)

export default router;