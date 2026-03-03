import express from "express";
import { getSubByCategoryId } from "../controllers/subCategory.controller.js";

const router = express.Router();

router.get("/:catId", getSubByCategoryId);

export default router;