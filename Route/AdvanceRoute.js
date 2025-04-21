import express from "express";
import { isAdmin, requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  applyForAdvance,
  getAllAdvanceRequests,
  getUserAdvance,
  updateAdvanceStatus,
} from "../Controller/AdvanceController.js";

const router = express.Router();

router.post("/apply", requireSignIn, applyForAdvance);
router.get("/my-advance", requireSignIn, getUserAdvance);
router.get("/admin/all", requireSignIn, isAdmin, getAllAdvanceRequests);
router.put("/admin/update/:id", requireSignIn, isAdmin, updateAdvanceStatus);

export default router;
