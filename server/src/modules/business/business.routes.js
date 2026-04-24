// src/modules/business/business.routes.js
import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { getBusinessProfile, updateBusinessProfile } from "./business.controller.js";

const router = express.Router();

router.get("/profile", protect, getBusinessProfile);
router.patch("/profile", protect, updateBusinessProfile);

export default router;