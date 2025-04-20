import express from "express";

import { isAdmin, requireSignIn } from "../middleware/UserMiddleware.js";
import {
  createAccount,
  deleteAccount,
  getAllAccounts,
  updateAccount,
} from "../Controller/DepsoiteAccountController.js";

const router = express.Router();

router.post("/create-account", requireSignIn, isAdmin, createAccount);
router.get("/get-account", requireSignIn, getAllAccounts);
router.put("/update-account/:id", requireSignIn, isAdmin, updateAccount);
router.delete("/delete-account/:id", requireSignIn, isAdmin, deleteAccount);

export default router;
