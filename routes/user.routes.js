import express from "express";
import { createUser, deleteUser, getAllUsers, getMyTeam, loginUser, updateUser, userProfile } from "../controllers/user.controller.js";
import { AuthenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-user", createUser);

router.post("/login", loginUser)

router.get("/", AuthenticateToken, getAllUsers)

router.get("/my-team", AuthenticateToken, getMyTeam)

router.get("/profile", AuthenticateToken, userProfile)

router.patch("/:id", AuthenticateToken, isAdmin, updateUser);

router.delete(":id", AuthenticateToken, isAdmin, deleteUser);




export default router;
