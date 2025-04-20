import express from "express";
import { isAdmin, requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  createPlane,
  deletePlane,
  getPlaneById,
  getPlanes,
  updatePlane,
} from "../Controller/PlaneController.js";

const router = express.Router();

// Base Route: /api/planes

router.post("/create-plane", requireSignIn, isAdmin, createPlane);
router.get("/get-plane", requireSignIn, getPlanes);
router.get("/get-plane/:id", requireSignIn, getPlaneById);
router.put("/update-plane/:id", requireSignIn, isAdmin, updatePlane);
router.delete("/delete-plane/:id", requireSignIn, isAdmin, deletePlane);

export default router;
