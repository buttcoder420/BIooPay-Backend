import express from "express";

import { isAdmin, requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  createCashout,
  getAllCashouts,
  getMyCashouts,
  updateCashoutStatus,
} from "../Controller/CashOutController.js";

const router = express.Router();

// User creates cashout
router.post("/create", requireSignIn, createCashout);

// User gets own cashouts
router.get("/my", requireSignIn, getMyCashouts);

// Admin gets all cashouts
router.get("/admin/all", requireSignIn, isAdmin, getAllCashouts);

// Admin updates status
router.put("/admin/update/:id", requireSignIn, isAdmin, updateCashoutStatus);

export default router;
