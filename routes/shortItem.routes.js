import express from "express";
import { createShortItemsReport } from "../controllers/shortItem.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-short-items" , AuthenticateToken , createShortItemsReport);

export default router;