import Expense from "../../models/Expense.js";
import { invalidateExpenseCache } from "../../utils/cacheManager.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess, sendCreated } from "../../utils/ApiResponse.js";

const VALID_CATEGORIES = ["RENT", "SALARIES", "UTILITIES", "TRANSPORT", "SUPPLIES", "MARKETING", "EQUIPMENT", "OTHER"];

/* ─── GET /api/v1/expenses ───────────────────────────────────────────── */
export const getExpenses = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { month, category, page = 1, limit = 20 } = req.query;

  const query = { businessId };

  if (month) {
    const [year, m] = month.split("-").map(Number);
    query.date = {
      $gte: new Date(year, m - 1, 1),
      $lte: new Date(year, m, 0, 23, 59, 59, 999),
    };
  }

  if (category && VALID_CATEGORIES.includes(category)) {
    query.category = category;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [expenses, total] = await Promise.all([
    Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Expense.countDocuments(query),
  ]);

  sendSuccess(res, {
    expenses,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

/* ─── POST /api/v1/expenses ──────────────────────────────────────────── */
export const createExpense = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { title, amount, category = "OTHER", date, notes } = req.body;

  if (!title?.trim()) throw ApiError.badRequest("Title is required");
  if (amount == null || amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");
  if (!VALID_CATEGORIES.includes(category)) throw ApiError.badRequest("Invalid category");

  const expense = await Expense.create({
    businessId,
    title: title.trim(),
    amount: Math.round(Number(amount) * 100) / 100,
    category,
    date: date ? new Date(date) : new Date(),
    notes: notes?.trim() || null,
  });

  await invalidateExpenseCache(businessId);
  sendCreated(res, expense, "Expense added");
});

/* ─── DELETE /api/v1/expenses/:id ────────────────────────────────────── */
export const deleteExpense = asyncHandler(async (req, res) => {
  const { businessId } = req.user;

  const expense = await Expense.findOneAndDelete({ _id: req.params.id, businessId });
  if (!expense) throw ApiError.notFound("Expense not found");

  await invalidateExpenseCache(businessId);
  sendSuccess(res, null, "Expense deleted");
});

/* ─── GET /api/v1/expenses/summary ──────────────────────────────────── */
export const getExpenseSummary = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { month } = req.query;

  let start, end;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    start = new Date(year, m - 1, 1);
    end = new Date(year, m, 0, 23, 59, 59, 999);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const [byCategory, total] = await Promise.all([
    Expense.aggregate([
      { $match: { businessId: req.user.businessId, date: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: { businessId: req.user.businessId, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  sendSuccess(res, {
    byCategory: byCategory.map(c => ({ category: c._id, total: c.total, count: c.count })),
    total: total[0]?.total || 0,
    month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  });
});