import express from "express";
import { getChannelsForDropdown } from "../controllers/channel.controller.js";
const router = express.Router();

router.get("/getchannels" , getChannelsForDropdown);

export default router;