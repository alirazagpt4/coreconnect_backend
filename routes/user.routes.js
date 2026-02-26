import express from "express";
import { createUser, loginUser, userProfile } from "../controllers/user.controller.js";
import { AuthenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-user", createUser);

router.post("/login", loginUser)

router.get("/profile", AuthenticateToken, userProfile)



export default router;
