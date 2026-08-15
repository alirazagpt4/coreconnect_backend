import express from "express";
import {AuthenticateToken} from "../middlewares/auth.middleware.js"
import { createSale, createSaleWithIdempotency } from "../controllers/sale.controller.js";

const router = express.Router();

router.post("/create-sale" , AuthenticateToken , createSale)

router.post("/create-sale-v2" , AuthenticateToken , createSaleWithIdempotency)

export default router;