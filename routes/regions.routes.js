import express from "express";
import { getRegions } from "../controllers/regions.controller.js";

const router = express.Router();

router.get("/" , getRegions);

export default router;