import express from "express";
import { createStore, getAllStores, updateStore, deleteStore, getSupervisorStores } from "../controllers/store.controller.js";
import { AuthenticateToken, isAdmin } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create-store", AuthenticateToken,  createStore);
router.get("/", AuthenticateToken, getAllStores);
router.get("/supervisor/:supervisor_id", AuthenticateToken, getSupervisorStores);
router.patch("/:id", AuthenticateToken, updateStore);
router.delete("/:id", AuthenticateToken, isAdmin, deleteStore);

export default router;