import express from "express";
import {
  createDeposit,
  deleteDeposit,
  getAllDeposits,
  getUserDeposits,
  updateDepositStatus,
} from "../Controller/DepositeController.js";
import { isAdmin, requireSignIn } from "../middleware/UserMiddleware.js";
const router = express.Router();

// Create Deposit
router.post("/create", requireSignIn, createDeposit);

// Update Deposit Status
router.put("/update/:depositId", requireSignIn, isAdmin, updateDepositStatus);

// Delete Deposit

router.delete("/delete/:depositId", requireSignIn, isAdmin, deleteDeposit);

router.get("/all-deposite", requireSignIn, isAdmin, getAllDeposits);
router.get("/my-deposite", requireSignIn, getUserDeposits);

export default router;
