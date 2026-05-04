// src/modules/clients/client.routes.js
import express from "express";
import { getClients, searchClients, createClient, getClientById, updateClient, deleteClient } from "./client.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", protect, searchClients); // must be before /:id
router.get("/", protect, getClients);
router.post("/", protect, createClient);
router.get("/:id", protect, getClientById);
router.patch("/:id", protect, updateClient);
router.delete("/:id", protect, deleteClient);

export default router;