import express from "express";
import  upload  from "../middlewares/multer.middleware.js"
import { AuthenticateToken } from "../middlewares/auth.middleware.js";
import { startDay } from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/start-day", AuthenticateToken, upload.single('image'), startDay)

export default router;