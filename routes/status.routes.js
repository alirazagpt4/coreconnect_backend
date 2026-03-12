import express from "express";
import { toggleActiveStatus } from "../controllers/status.controller.js"
import {AuthenticateToken} from "../middlewares/auth.middleware.js"
const router = express.Router();

router.patch('/toggle-status', AuthenticateToken, toggleActiveStatus);

export default router;

