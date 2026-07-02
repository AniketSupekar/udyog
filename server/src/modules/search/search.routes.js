// src/modules/search/search.routes.js
import express from "express";
import { globalSearch } from "./search.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/", globalSearch);

export default router;