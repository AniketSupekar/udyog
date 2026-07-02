import express from "express";
import {
  getClients, searchClients, createClient,
  getClientById, updateClient, deleteClient,
  getClientLedger,
} from "./client.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search",      protect, searchClients);
router.get("/",            protect, getClients);
router.post("/",           protect, createClient);
router.get("/:id",         protect, getClientById);
router.get("/:id/ledger",  protect, getClientLedger);
router.patch("/:id",       protect, updateClient);
router.delete("/:id",      protect, deleteClient);

export default router;