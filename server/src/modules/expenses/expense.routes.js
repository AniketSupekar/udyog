import express from "express";
import { getExpenses, createExpense, deleteExpense, getExpenseSummary } from "./expense.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/",         getExpenses);
router.post("/",        createExpense);
router.get("/summary",  getExpenseSummary);
router.delete("/:id",   deleteExpense);

export default router;