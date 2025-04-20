import DepositeAccountModel from "../Model/DepositeAccountModel.js";

// Create
export const createAccount = async (req, res) => {
  try {
    const newAccount = new DepositeAccountModel(req.body);
    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All
export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await DepositeAccountModel.find();
    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Update
export const updateAccount = async (req, res) => {
  try {
    const updatedAccount = await DepositeAccountModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedAccount)
      return res.status(404).json({ message: "Account not found" });
    res.status(200).json(updatedAccount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete
export const deleteAccount = async (req, res) => {
  try {
    const deleted = await DepositeAccountModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Account not found" });
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
