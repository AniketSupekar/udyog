// src/modules/products/product.routes.js
import express from "express";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./product.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getProducts);
router.post("/", protect, createProduct);
router.patch("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;