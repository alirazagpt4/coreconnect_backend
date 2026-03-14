import express from "express";
import { createStore, getAllStores, updateStore, deleteStore } from "../controllers/store.controller.js";
import { AuthenticateToken, isAdmin } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create-store", AuthenticateToken, isAdmin, createStore);
router.get("/", AuthenticateToken, getAllStores);
router.patch("/:id", AuthenticateToken, isAdmin, updateStore);
router.delete("/:id", AuthenticateToken, isAdmin, deleteStore);

export default router;