import DepositeModel from "../Model/DepositeModel.js";
import PlaneModel from "../Model/PlaneModel.js";
import UserModel from "../Model/UserModel.js";

// ✅ CREATE Deposit
export const createDeposit = async (req, res) => {
  try {
    // Get data from request body (including base64 image)
    const { planId, transactionId, image } = req.body;
    const userId = req.user._id;

    // Validation
    if (!image) {
      return res
        .status(400)
        .json({ message: "Payment proof image is required" });
    }
    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }
    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    // Validate base64 image
    if (!image.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    const plan = await PlaneModel.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const newDeposit = new DepositeModel({
      user: userId,
      plan: plan._id,
      transactionId,
      amount: plan.price,
      image, // Store base64 string directly
    });

    await newDeposit.save();
    res.status(201).json({
      message: "Deposit created successfully",
      deposit: newDeposit,
    });
  } catch (error) {
    console.error("Deposit creation error:", error);
    res.status(500).json({
      message: "Error creating deposit",
      error: error.message,
    });
  }
};
// 🔁 UPDATE Deposit Status (with referral commission logic)
export const updateDepositStatus = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { status } = req.body;

    const allowedStatus = ["pending", "active", "failed"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const deposit = await DepositeModel.findById(depositId)
      .populate("user", "referredBy")
      .populate("plan", "commissionRate price");

    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    // Update the status of the current deposit
    deposit.status = status;
    await deposit.save();

    // 🔥 If this deposit becomes ACTIVE, process referral commissions
    if (status === "active") {
      // 1. Fail all other deposits of this user
      await DepositeModel.updateMany(
        {
          _id: { $ne: depositId }, // exclude the current one
          user: deposit.user,
          status: { $in: ["pending", "active"] }, // active or pending ones
        },
        { $set: { status: "failed" } }
      );

      // 2. Process referral commissions (if applicable)
      if (deposit.user.referredBy) {
        await processReferralCommissions(deposit);
      }
    }

    res.status(200).json({
      message: `Deposit status updated to "${status}"`,
      deposit,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating deposit",
      error: error.message,
    });
  }
};

// Helper function to process referral commissions
const processReferralCommissions = async (deposit) => {
  try {
    // Get the FULL commission amount from the plan
    const planCommission = deposit.plan.commissionRate || 0; // Changed from commission to commissionRate

    // Define commission percentages for each level (100%, 80%, 70%, etc.)
    const levelPercentages = [100, 80, 70, 60, 50, 40, 30, 20];

    // Start with the direct referrer
    let currentReferralCode = deposit.user.referredBy;

    for (
      let level = 0;
      level < levelPercentages.length && currentReferralCode;
      level++
    ) {
      const referrer = await UserModel.findOne({
        referralCode: currentReferralCode,
      });

      if (!referrer) break;

      // Calculate commission for this level
      const levelPercentage = levelPercentages[level];
      const levelCommission = (planCommission * levelPercentage) / 100;

      // Round to 2 decimal places (for cents)
      const roundedCommission = Math.round(levelCommission * 100) / 100;

      // Only add commission if it's greater than 0
      if (roundedCommission > 0) {
        // Update referrer's earnings
        referrer.earnings += roundedCommission;
        referrer.TotalEarnings += roundedCommission;
        await referrer.save();

        console.log(
          `Level ${level + 1}: $${roundedCommission} paid to ${referrer._id}`
        );
      }

      // Move to the next referrer in the chain
      currentReferralCode = referrer.referredBy;
    }
  } catch (error) {
    console.error("Error in referral commission:", error);
    // Consider adding error handling that notifies admins
  }
};

// ❌ DELETE Deposit
export const deleteDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;

    const deleted = await DepositeModel.findByIdAndDelete(depositId);

    if (!deleted) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    res.status(200).json({ message: "Deposit deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting deposit", error: error.message });
  }
};

export const getAllDeposits = async (req, res) => {
  try {
    const deposits = await DepositeModel.find()
      .populate("user", "username email") // optional: get username/email
      .populate("plan", "Planename price"); // optional: get plan info

    res.status(200).json({ TotalDepsote: deposits.length, deposits });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching deposits", error: error.message });
  }
};

export const getUserDeposits = async (req, res) => {
  try {
    const userId = req.user._id;

    const deposits = await DepositeModel.find({ user: userId }).populate(
      "plan",
      "Planename price"
    );

    if (deposits.length === 0) {
      return res.status(200).json({
        message: "No deposits found for this user",
        deposits: [],
      });
    }

    res.status(200).json({
      message: "User deposits fetched successfully",
      deposits,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user deposits",
      error: error.message,
    });
  }
};
