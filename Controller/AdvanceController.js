import AdvanceModel from "../Model/AdvanceModel.js";

// 1. User applies for advance

export const applyForAdvance = async (req, res) => {
  try {
    const { teamSizeAtApplication, userComment } = req.body;
    const userId = req.user._id;

    // Validate team size
    if (teamSizeAtApplication <= 0) {
      return res.status(400).json({ message: "Invalid team size" });
    }

    // Determine team category
    let teamCategory = "";
    if (teamSizeAtApplication <= 20) teamCategory = "1-20";
    else if (teamSizeAtApplication <= 50) teamCategory = "21-50";
    else if (teamSizeAtApplication <= 100) teamCategory = "51-100";
    else teamCategory = "100+";

    // Create new advance request
    const newAdvance = new AdvanceModel({
      user: userId,
      teamSizeAtApplication,
      teamCategory,
      userComment,
    });

    await newAdvance.save();

    res.status(201).json({
      message: "Advance request submitted successfully",
      data: newAdvance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit advance request",
      error: error.message,
    });
  }
};

// 2. Get advance requests for current logged-in user
export const getUserAdvance = async (req, res) => {
  try {
    const userId = req.user._id;
    const advances = await AdvanceModel.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: advances,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get advance requests",
      error: error.message,
    });
  }
};

// 3. Admin get all advance requests
export const getAllAdvanceRequests = async (req, res) => {
  try {
    const allAdvances = await AdvanceModel.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: allAdvances,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch advance requests",
      error: error.message,
    });
  }
};

// 4. Admin update status and remarks
export const updateAdvanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedAdvance = await AdvanceModel.findByIdAndUpdate(
      id,
      { status, adminRemarks },
      { new: true }
    ).populate("user", "name email");

    if (!updatedAdvance) {
      return res.status(404).json({ message: "Advance request not found" });
    }

    res.status(200).json({
      message: "Advance request updated",
      data: updatedAdvance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update advance request",
      error: error.message,
    });
  }
};
