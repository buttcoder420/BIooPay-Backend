import PlaneModel from "../Model/PlaneModel.js";

// ✅ Create Plane
export const createPlane = async (req, res) => {
  try {
    const { Planename, price, commissionRate } = req.body;

    const newPlane = new PlaneModel({ Planename, price, commissionRate });
    await newPlane.save();

    res.status(201).json({
      success: true,
      message: "Plane created successfully",
      data: newPlane,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create plane",
      error: error.message,
    });
  }
};

// ✅ Get All Planes
export const getPlanes = async (req, res) => {
  try {
    const planes = await PlaneModel.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, TotalPlane: planes.length, data: planes });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch planes",
      error: error.message,
    });
  }
};

// ✅ Get Single Plane
export const getPlaneById = async (req, res) => {
  try {
    const plane = await PlaneModel.findById(req.params.id);
    if (!plane) {
      return res
        .status(404)
        .json({ success: false, message: "Plane not found" });
    }
    res.status(200).json({ success: true, data: plane });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching plane",
      error: error.message,
    });
  }
};

// ✅ Update Plane
export const updatePlane = async (req, res) => {
  try {
    const updatedPlane = await PlaneModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPlane) {
      return res
        .status(404)
        .json({ success: false, message: "Plane not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Plane updated", data: updatedPlane });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update plane",
      error: error.message,
    });
  }
};

// ✅ Delete Plane
export const deletePlane = async (req, res) => {
  try {
    const deletedPlane = await PlaneModel.findByIdAndDelete(req.params.id);
    if (!deletedPlane) {
      return res
        .status(404)
        .json({ success: false, message: "Plane not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Plane deleted", data: deletedPlane });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete plane",
      error: error.message,
    });
  }
};
