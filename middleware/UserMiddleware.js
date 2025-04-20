import JWT from "jsonwebtoken";
import UserModel from "../Model/UserModel.js";

export const requireSignIn = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <token>"
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "No token provided",
      });
    }

    const decode = JWT.verify(token, process.env.JWT_SECRET); // Verify only the token part
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};
export const isAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (user.role !== "admin") {
      return res.status(401).send({
        success: false,
        message: "Unauthorization Access",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Error in Admin middleLayer",
      error,
    });
  }
};
