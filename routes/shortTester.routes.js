import express from "express";
import { AuthenticateToken } from "../middlewares/auth.middleware.js";
import { createShortTesters } from "../controllers/shortTester.controller.js";
const router = express.Router();

router.post("/create-testers" , AuthenticateToken , createShortTesters);

export default router;