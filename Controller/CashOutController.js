import CashOutModel from "../Model/CashOutModel.js";
import DepositeModel from "../Model/DepositeModel.js";
import UserModel from "../Model/UserModel.js";

// 1. Create Cashout
export const createCashout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, accountType, accountNumber, remarks } = req.body;

    // Check if user has active package
    const activePackage = await DepositeModel.findOne({
      user: userId,
      status: "active",
    });
    if (!activePackage) {
      return res.status(400).json({ message: "Please activate a plan first." });
    }

    // Get user data
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Validate amount
    if (amount < 1) {
      return res.status(400).json({ message: "Minimum withdrawal is $1." });
    }

    if (amount > user.earnings) {
      return res
        .status(400)
        .json({ message: "Insufficient earnings for withdrawal." });
    }

    // Deduct from user's earnings
    user.earnings -= amount;
    await user.save();

    // Create cashout request
    const cashout = new CashOutModel({
      user: userId,
      amount,
      accountType,
      accountNumber,
      remarks,
    });

    await cashout.save();
    res
      .status(201)
      .json({ message: "Cashout request submitted successfully.", cashout });
  } catch (error) {
    console.error("Cashout Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// 2. Get all cashouts (admin only)
// In your controller
export const getAllCashouts = async (req, res) => {
  try {
    const cashouts = await CashOutModel.find()
      .sort({ createdAt: -1 })
      .populate("user", "email totalReferred");

    // Wrap the array in an object with cashouts property
    res.status(200).json({ cashouts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cashouts." });
  }
};
// 3. Get my cashouts (logged-in user)
export const getMyCashouts = async (req, res) => {
  try {
    const cashouts = await CashOutModel.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(cashouts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your cashouts." });
  }
};

// 4. Admin update status (approve/reject)
export const updateCashoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const cashout = await CashOutModel.findById(id);
    if (!cashout) {
      return res.status(404).json({ message: "Cashout not found." });
    }

    cashout.status = status;
    if (remarks) cashout.remarks = remarks;
    await cashout.save();

    res
      .status(200)
      .json({ message: `Cashout ${status} successfully.`, cashout });
  } catch (error) {
    res.status(500).json({ message: "Failed to update cashout status." });
  }
};
