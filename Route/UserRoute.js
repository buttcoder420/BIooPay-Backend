import express from "express";
import { isAdmin, requireSignIn } from "./../middleware/UserMiddleware.js";
import {
  deleteUser,
  getAllUsers,
  getLoggedInUserDetails,
  getLoggedInUserProfile,
  getNetworkByEmail,
  getReferralDetailsTree,
  loginUser,
  registerUser,
  sendVerificationCode,
  updateUser,
  updateUserPassword,
  updateUserProfile,
  verifyEmail,
} from "../Controller/UserController.js";

const router = express.Router();

//Registration route
router.post("/register", registerUser);

//Login Route
router.post("/login", loginUser);

// Step 1: Send Verification Code
router.post("/register/send-code", sendVerificationCode);

router.post("/verify-email", verifyEmail);

// protected user route
//protected user route
router.get("/auth-user", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

//protected user route
router.get(
  "/auth-admin",

  requireSignIn,
  isAdmin,
  (req, res) => {
    res.status(200).send({ ok: true });
  }
);

router.get("/user/profile", requireSignIn, getLoggedInUserDetails);

router.get("/get-all-user", requireSignIn, isAdmin, getAllUsers);
router.delete("/delete-users/:userId", requireSignIn, isAdmin, deleteUser);
router.put("/update-users/:userId", requireSignIn, isAdmin, updateUser);

router.get("/referral-tree", requireSignIn, getReferralDetailsTree);

router.post(
  "/get-refefral-tree-email",
  requireSignIn,
  isAdmin,
  getNetworkByEmail
);

// Get logged-in user profile
router.get("/me", requireSignIn, getLoggedInUserProfile);

// Update profile
router.put("/update", requireSignIn, updateUserProfile);

// Change password
router.put("/change-password", requireSignIn, updateUserPassword);

export default router;
