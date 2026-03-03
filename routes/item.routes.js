import express from "express";
import { AuthenticateToken, isAdmin } from "../middlewares/auth.middleware.js";
import { createItem, deleteItem, getAllItems, getItemsBySubCategory, updateItem } from "../controllers/item.controller.js";
const router = express.Router();

router.post("/create-item", AuthenticateToken, isAdmin, createItem);

router.get("/", AuthenticateToken, getAllItems);

router.get("/:subcategory_id", getItemsBySubCategory)

router.patch("/:id", AuthenticateToken, isAdmin, updateItem);

router.delete("/:id", AuthenticateToken, isAdmin, deleteItem);

export default router;