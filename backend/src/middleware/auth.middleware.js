import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
dotenv.config();

const protectRoute = async (req, res, next) => {
  try {
    // get token
    const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token provided, access denied" });
    }

    // verify token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || typeof decoded.userId !== "string" || !/^[a-f\d]{24}$/i.test(decoded.userId)) {
      return res.status(401).json({ message: "Invalid token, access denied" });
    }
    // find user by id
    const user = await User.findById(decoded.userId).select("-password"); // give me the user without the password
    if (!user) {
      return res
        .status(401)
        .json({ message: "Token is valid but user not found, access denied" });
    }
    req.user = user; // attach the user object to the request
    next(); // proceed to the next middleware or route handler
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      return res.status(401).json({
        message: "Invalid or expired authentication token. Please log in again.",
      });
    }
    console.error("Error in protectRoute:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default protectRoute;
