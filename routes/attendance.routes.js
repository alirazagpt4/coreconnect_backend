import express from "express";
import { Upload } from "../middlewares/multer.middleware.js"
import { AuthenticateToken } from "../middlewares/auth.middleware.js";
import { startDay } from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/start-day" , AuthenticateToken , Upload.single('image'), startDay)

export default router;