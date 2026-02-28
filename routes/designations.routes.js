import express from "express";
import { getDesignations } from "../controllers/designations.controller.js";
const router = express.Router();

router.get("/", getDesignations)

export default router;