import JWT from "jsonwebtoken";
import crypto from "crypto";
import { ComparePassword, HashPassword } from "../Helper/UserHelper.js";
import nodemailer from "nodemailer";
import UserModel from "../Model/UserModel.js";
import DepositeModel from "../Model/DepositeModel.js";
// Persistent storage for verification data
const verificationStore = new Map();
// Case-insensitive referral code finder
const findReferrer = async (code) => {
  if (!code) return null;
  return await UserModel.findOne({
    referralCode: { $regex: new RegExp(`^${code}$`, "i") },
  });
};
const verificationCache = new Map();
// Function to generate a unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

const generateReferralLink = (referralCode) => {
  const baseUrl = "http://https://bioopay.netlify.app/"; // Replace with your actual base URL
  return `${baseUrl}/register?referralCode=${referralCode}`;
};

// ------------ Generate Verification Code ------------
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ------------ Send Verification Email ------------
const sendVerificationEmail = async (toEmail, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Verify your account" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Verification Code",
    html: `
      <div style="font-family:sans-serif;">
        <h2>Verify your email</h2>
        <p>Use the following code to complete your registration:</p>
        <h3 style="color:blue;">${code}</h3>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ------------ Send Verification Email ------------
export const sendVerificationCode = async (req, res) => {
  const { userName, email, password, referralCode } = req.body;

  if (!userName || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const existingUser = await UserModel.findOne({
    $or: [{ email }, { userName }],
  });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const verificationCode = generateVerificationCode();

  verificationStore.set(email, {
    userName,
    email,
    password: await HashPassword(password),
    referralCode,
    code: verificationCode,
    isVerified: false,
  });

  await sendVerificationEmail(email, verificationCode);

  return res
    .status(200)
    .json({ success: true, message: "Verification code sent" });
};

// ---------------- REGISTER -------------------

export const registerUser = async (req, res) => {
  const { userName, email, password, referralCode } = req.body;

  const userData = verificationStore.get(email);
  if (!userData || !userData.isVerified) {
    return res.status(400).json({ message: "Please verify email first" });
  }

  const referrer = userData.referralCode
    ? await UserModel.findOne({ referralCode: userData.referralCode })
    : null;

  // Generate referral code and link
  const userReferralCode = generateReferralCode();
  const userReferralLink = generateReferralLink(userReferralCode);

  const newUser = new UserModel({
    userName: userData.userName,
    email: userData.email,
    password: userData.password,
    referralCode: userReferralCode,
    referralLink: userReferralLink, // Add this line to store the link
    referredBy: referrer?.referralCode || null,
    isVerified: true,
  });

  await newUser.save();

  if (referrer) {
    referrer.totelreffered += 1;
    await referrer.save();
  }

  verificationStore.delete(email);

  return res
    .status(201)
    .json({ success: true, message: "User registered successfully" });
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  const userData = verificationStore.get(email);
  if (!userData || userData.code !== code) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  userData.isVerified = true;
  verificationStore.set(email, userData);

  return res.status(200).json({ success: true, message: "Email verified" });
};
// ---------------- LOGIN -------------------

export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 1. Validate Input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required",
      });
    }

    // 2. Find User
    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { userName: identifier }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Check Email Verification
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // 4. Verify Password
    const isMatch = await ComparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.accountStatus === "suspended" || user.accountStatus === "banned") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.accountStatus}. Please contact support.`,
      });
    }

    // 5. Generate JWT Token
    const token = JWT.sign(
      {
        _id: user._id,
        role: user.role, // Include role in token if needed for authorization
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token will expire in 7 days
    );

    // 6. Update Last Login
    user.lastLoginAt = new Date();
    await user.save();

    // 7. Send Response (Exclude sensitive data)
    const userData = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
      token, // JWT token
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ---------------- LOGIN HELPER -------------------
const checkUserLastLogin = async (user) => {
  const now = new Date();
  const last = user.lastLoginAt || now;
  const days = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  if (days > 5) {
    console.log(`User ${user.userName} last logged in ${days} days ago.`);
  }
  return { success: true, daysSinceLastLogin: days };
};

// ---------------- Get All User -------------------
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password -verificationCode");

    const usersWithReferralStats = await Promise.all(
      users.map(async (user) => {
        const referredUsers = await UserModel.find({
          referredBy: user.referralCode,
        });

        return {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          TotalEarnings: user.TotalEarnings,
          earnings: user.earnings,
          accountStatus: user.accountStatus,
          referralCode: user.referralCode,
          referralLink: user.referralLink,
          referredBy: user.referredBy,
          totalReferred: referredUsers.length,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      TotalUser: users.length,
      users: usersWithReferralStats,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// ---------------- Delete User -------------------
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// ---------------- update User -------------------
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Avoid updating password like this - only from separate route
    if (updates.password) {
      updates.password = await HashPassword(updates.password, 10);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password -verificationCode");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// ---------------- Get Logged In User Profile -------------------
export const getLoggedInUserDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId).select(
      "-password -verificationCode"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const totalReferred = await UserModel.countDocuments({
      referredBy: user.referralCode,
    });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        earnings: user.earnings,
        totalEarnings: user.TotalEarnings,
        referralCode: user.referralCode,
        referralLink: user.referralLink,
        totalReferred: totalReferred,
        accountStatus: user.accountStatus,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Get Logged In User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ---------------- User Referral -------------------

// Recursive function to build referral tree
const buildReferralTree = async (referralCode) => {
  const referredUsers = await UserModel.find({ referredBy: referralCode });

  const results = await Promise.all(
    referredUsers.map(async (user) => {
      const deposit = await DepositeModel.findOne({ user: user._id }).populate(
        "plan"
      );

      // Check if the deposit status is active and if the user has a plan
      const isActive = deposit?.status === "active";
      const planName = deposit?.plan
        ? deposit.plan.Planename
        : "No plan active"; // Show plan name if active, otherwise "No plan active"

      // Recursively build the tree for referred users
      const children = await buildReferralTree(user.referralCode);

      return {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        referralLink: user.referralLink,
        isActive,
        planName, // Include the plan name (or 'No plan active')
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        children, // next level referrals
      };
    })
  );

  return results;
};

// Controller
export const getReferralDetailsTree = async (req, res) => {
  try {
    const loginUserId = req.user._id; // assume user injected by auth middleware
    const loginUser = await UserModel.findById(loginUserId);
    if (!loginUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Get full referral tree
    const referralTree = await buildReferralTree(loginUser.referralCode);

    // Count active/inactive
    let totalReferrals = 0;
    let activeReferrals = 0;
    let inactiveReferrals = 0;

    const countRefs = (nodes) => {
      for (let node of nodes) {
        totalReferrals++;
        node.isActive ? activeReferrals++ : inactiveReferrals++;
      }
    };

    countRefs(referralTree);

    res.status(200).json({
      success: true,
      totalReferrals,
      activeReferrals,
      inactiveReferrals,
      tree: referralTree,
    });
  } catch (error) {
    console.error("Referral Tree Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Helper function to build referral tree
// const buildReferralTree = async (referralCode, depth = 0, maxDepth = 10) => {
//   if (depth >= maxDepth) return [];

//   const referredUsers = await UserModel.find({ referredBy: referralCode });

//   return Promise.all(
//     referredUsers.map(async (user) => {
//       const deposit = await DepositeModel.findOne({ user: user._id });
//       return {
//         userName: user.userName,
//         email: user.email,
//         referralCode: user.referralCode,
//         level: depth + 1,
//         isActive: deposit?.status === "active",
//         children: await buildReferralTree(
//           user.referralCode,
//           depth + 1,
//           maxDepth
//         ),
//       };
//     })
//   );
// };

// Controller to get referral network by email
export const getNetworkByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const referralTree = await buildReferralTree(user.referralCode);

    res.status(200).json({
      success: true,
      user: {
        email: user.email,
        userName: user.userName,
        referralCode: user.referralCode,
      },
      referralTree,
    });
  } catch (error) {
    console.error("Email search error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET logged-in user profile
export const getLoggedInUserProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "-password -verificationCode"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// UPDATE logged-in user profile
export const updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Ensure password isn't updated here

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
      }
    ).select("-password -verificationCode");

    res
      .status(200)
      .json({ success: true, message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// CHANGE password
export const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const user = await UserModel.findById(req.user._id);
    const isMatch = await ComparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect current password" });
    }

    user.password = await HashPassword(newPassword);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
